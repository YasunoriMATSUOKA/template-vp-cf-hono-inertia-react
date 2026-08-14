#!/usr/bin/env bash
# Stop hook: Claude が turn を終えるたびに、vp check / vp test /
# Storybook test / Playwright e2e が全 pass することを確認。
# 失敗があれば JSON `decision:block` を出力 + exit 2 で asyncRewake が
# Claude を起こす。pnpm wrapper は経由せず node_modules/.bin を直接呼び、
# verify-deps drift の影響を受けない。
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
cd "$ROOT" || exit 0

# asyncRewake: true で並走しないよう flock で直列化する。先行 hook が走って
# いる間は exit 0 で黙ってスキップし、次の turn の Stop hook で再度検証
# する (Stop hook は毎ターン発火するので検証の網に穴は空かない)。
LOCKFILE="/tmp/claude-stop-verify-${ROOT//\//_}.lock"
exec 200>"$LOCKFILE"
if ! flock -n 200; then
  exit 0
fi

# プロジェクトの runtime プロセス (workerd / esbuild service / vp dev /
# storybook dispatcher) を pgrep + cmdline pattern で一掃する関数。
# vp dev の MainThread を kill しただけでは workerd 子プロセスが残るため、
# 明示的に sweep する必要がある。editor の oxfmt/oxlint LSP や tinypool は
# pattern に当たらないので殺されない (editor 機能は維持)。
sweep_project_runtime() {
  local pid cmd
  for pid in $(pgrep -f "${ROOT}/node_modules/" 2>/dev/null); do
    [ "$pid" = "$$" ] && continue
    cmd=$(tr '\0' ' ' < /proc/"$pid"/cmdline 2>/dev/null) || continue
    case "$cmd" in
      *workerd*|*esbuild*--service*|*vite-plus-core*cli.js\ dev*|*storybook*dispatcher*)
        kill -KILL "$pid" 2>/dev/null
        ;;
    esac
  done
}

# vp dev は setsid で新 session に隔離し、kill -- -PGID で workerd 子も含めて
# まとめて殺す。trap 漏れに備えて sweep を最後に呼ぶ。
VP_PID=""
cleanup() {
  [ -n "$VP_PID" ] || { sweep_project_runtime; return; }
  kill -TERM -- "-$VP_PID" 2>/dev/null
  sleep 2
  kill -KILL -- "-$VP_PID" 2>/dev/null
  wait "$VP_PID" 2>/dev/null
  sweep_project_runtime
}
trap cleanup EXIT

# 前回 hook が timeout / SIGKILL で cleanup できなかった残骸 (orphan
# workerd / vp dev) を起動前に一掃。これが無いと「並走で生き残った前回
# の vp dev」が 5173 を握ったまま今回が 5174 に fallback する事故が起きる。
sweep_project_runtime

# 出力を tail で truncate して Claude の context を圧迫しない
trunc() { tail -n 200; }

# サーバが立ち上がるのを待つ (引数: URL, タイムアウト秒数)
wait_for() {
  local url="$1" deadline=$(( $(date +%s) + ${2:-60} ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    curl -sf "$url" >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

failures=()

# === 1. vp check ===
if ! out=$(./node_modules/.bin/vp check 2>&1); then
  failures+=("=== vp check failed ===
$(printf '%s' "$out" | trunc)")
fi

# === 2. vp test (Vitest single run) ===
if ! out=$(./node_modules/.bin/vp test --run 2>&1); then
  failures+=("=== vp test failed ===
$(printf '%s' "$out" | trunc)")
fi

# === 3. Storybook stories (Vitest browser mode) ===
# `pnpm test-storybook` = `vitest run --project storybook`。Vitest が portable-story を
# 直接 render するので、旧 @storybook/test-runner のような storybook dev サーバの起動も
# `node_modules/.bin/test-storybook` (もう存在しない bin) も不要。
if ! out=$(./node_modules/.bin/vitest run --project storybook 2>&1); then
  failures+=("=== test-storybook failed ===
$(printf '%s' "$out" | trunc)")
fi

# === 4. Playwright e2e ===
# playwright.config.ts の webServer は `pnpm dev` で pnpm 経由になるので、
# 先に vp dev を spawn し reuseExistingServer 経由で再利用させる。
setsid ./node_modules/.bin/vp dev > /tmp/claude-vp-dev.log 2>&1 < /dev/null &
VP_PID=$!
if wait_for http://localhost:5173 60; then
  if ! out=$(./node_modules/.bin/playwright test 2>&1); then
    failures+=("=== playwright e2e failed ===
$(printf '%s' "$out" | trunc)")
  fi
else
  failures+=("=== vp dev server did not come up within 60s ===
$(tail -n 50 /tmp/claude-vp-dev.log 2>&1)")
fi
kill -TERM -- "-$VP_PID" 2>/dev/null
sleep 1
kill -KILL -- "-$VP_PID" 2>/dev/null
wait "$VP_PID" 2>/dev/null
VP_PID=""

# === Report ===
if [ "${#failures[@]}" -eq 0 ]; then
  exit 0
fi

reason="完了前の検証で失敗が出ました。下記をすべて pass するまで修正してください。

"
for f in "${failures[@]}"; do
  reason+="$f

"
done

jq -n --arg r "$reason" '{decision: "block", reason: $r}'
exit 2

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

# 子プロセスを必ず始末する
SB_PID=""
VP_PID=""
cleanup() {
  [ -n "$SB_PID" ] && kill "$SB_PID" 2>/dev/null && wait "$SB_PID" 2>/dev/null
  [ -n "$VP_PID" ] && kill "$VP_PID" 2>/dev/null && wait "$VP_PID" 2>/dev/null
}
trap cleanup EXIT

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

# === 3. Storybook test-runner ===
./node_modules/.bin/storybook dev -p 6006 --ci --no-open > /tmp/claude-sb-dev.log 2>&1 &
SB_PID=$!
if wait_for http://localhost:6006 90; then
  if ! out=$(./node_modules/.bin/test-storybook 2>&1); then
    failures+=("=== test-storybook failed ===
$(printf '%s' "$out" | trunc)")
  fi
else
  failures+=("=== storybook server did not come up within 90s ===
$(tail -n 50 /tmp/claude-sb-dev.log 2>&1)")
fi
kill "$SB_PID" 2>/dev/null
wait "$SB_PID" 2>/dev/null
SB_PID=""

# === 4. Playwright e2e ===
# playwright.config.ts の webServer は `pnpm dev` で pnpm 経由になるので、
# 先に vp dev を spawn し reuseExistingServer 経由で再利用させる。
./node_modules/.bin/vp dev > /tmp/claude-vp-dev.log 2>&1 &
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
kill "$VP_PID" 2>/dev/null
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

#!/usr/bin/env bash
# PostToolUse hook: 編集後の TS/JS ファイルに対し `vp check` を実行し、
# 失敗時は decision:block JSON を出力して Claude に自律修復させる。
set -u

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

output=$(vp check 2>&1)
status=$?

if [ "$status" -eq 0 ]; then
  exit 0
fi

jq -n --arg reason "vp check failed (exit $status). 出力:
$output

このファイル ($file) の編集による check 失敗の可能性が高い。出力中の format / lint / type エラーを順に解消してから次の操作に進む。" '{decision: "block", reason: $reason}'
exit 0

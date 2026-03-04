#!/bin/bash
set -euo pipefail

# PreToolUse hook: git commit 前に typecheck + lint を自動実行
# エラーがあればコミットをブロックする

cd "$CLAUDE_PROJECT_DIR"

echo "--- コミット前検証: typecheck + lint ---"

# TypeScript型チェック
if ! npx tsc --noEmit 2>&1; then
  echo ""
  echo "BLOCKED: TypeScript型エラーがあります。修正してから再度コミットしてください。"
  exit 2
fi

# ESLint
if ! npx next lint 2>&1; then
  echo ""
  echo "BLOCKED: ESLintエラーがあります。修正してから再度コミットしてください。"
  exit 2
fi

echo "--- 検証OK ---"
exit 0

#!/bin/bash
set -euo pipefail

# PostToolUse hook: ファイル編集後に対象ファイルの lint fix を自動実行
# Edit / Write ツール使用後にトリガーされる

cd "$CLAUDE_PROJECT_DIR"

# ツール入力JSONからファイルパスを取得
FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# .ts/.tsx/.js/.jsx ファイルのみ対象
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    # プロジェクト内のファイルのみ対象
    if [[ "$FILE_PATH" == "$CLAUDE_PROJECT_DIR"* ]] || [[ "$FILE_PATH" == src/* ]]; then
      npx next lint --fix --file "${FILE_PATH#$CLAUDE_PROJECT_DIR/}" 2>/dev/null || true
    fi
    ;;
esac

exit 0

#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install Node.js dependencies (uses cache on subsequent runs)
npm install

# Prisma client generation (postinstall handles this, but ensure it's done)
npx prisma generate

# === 開発コンテキストサマリーを自動生成 ===
# 新セッション開始時にgitから現状を復元し、即座に開発継続できるようにする
SUMMARY_FILE="$CLAUDE_PROJECT_DIR/.claude/dev-context.md"

{
  echo "# 開発コンテキスト（自動生成: $(date '+%Y-%m-%d %H:%M')）"
  echo ""

  # --- ブランチ情報 ---
  echo "## ブランチ"
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
  echo "- 現在: \`${CURRENT_BRANCH}\`"
  # origin/main を基準にする（ローカルmainが古い場合に対応）
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    BASE_REF="origin/main"
  elif git rev-parse --verify main >/dev/null 2>&1; then
    BASE_REF="main"
  else
    BASE_REF=""
  fi
  if [ -n "$BASE_REF" ]; then
    echo "- ベース: \`${BASE_REF}\`"
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "detached" ]; then
      AHEAD=$(git rev-list --count "${BASE_REF}..HEAD" 2>/dev/null || echo "?")
      BEHIND=$(git rev-list --count "HEAD..${BASE_REF}" 2>/dev/null || echo "?")
      echo "- ${BASE_REF}に対して: ${AHEAD}コミット先行 / ${BEHIND}コミット後方"
    fi
  fi
  echo ""

  # --- 未コミットの変更 ---
  echo "## 未コミットの変更"
  STAGED=$(git diff --cached --stat 2>/dev/null)
  UNSTAGED=$(git diff --stat 2>/dev/null)
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | head -20)
  if [ -z "$STAGED" ] && [ -z "$UNSTAGED" ] && [ -z "$UNTRACKED" ]; then
    echo "なし（ワーキングツリーはクリーン）"
  else
    if [ -n "$STAGED" ]; then
      echo "### ステージ済み"
      echo '```'
      echo "$STAGED"
      echo '```'
    fi
    if [ -n "$UNSTAGED" ]; then
      echo "### 未ステージ"
      echo '```'
      echo "$UNSTAGED"
      echo '```'
    fi
    if [ -n "$UNTRACKED" ]; then
      echo "### 未追跡ファイル"
      echo '```'
      echo "$UNTRACKED"
      echo '```'
    fi
  fi
  echo ""

  # --- コード品質サマリー ---
  echo "## コード品質"

  # TypeScriptエラー数
  TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
  if [ "$TS_ERRORS" -gt 0 ] 2>/dev/null; then
    echo "- TypeScript: **${TS_ERRORS}件のエラー** (要修正)"
  else
    echo "- TypeScript: エラーなし"
  fi

  # ESLint警告/エラー数
  LINT_OUTPUT=$(npx next lint 2>&1 || true)
  LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "Error:" || true)
  LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c "Warning:" || true)
  if [ "$LINT_ERRORS" -gt 0 ] 2>/dev/null; then
    echo "- ESLint: **${LINT_ERRORS}件のエラー**, ${LINT_WARNINGS}件の警告"
  elif [ "$LINT_WARNINGS" -gt 0 ] 2>/dev/null; then
    echo "- ESLint: ${LINT_WARNINGS}件の警告"
  else
    echo "- ESLint: 問題なし"
  fi

  # Prismaクライアント状態
  if [ -d "node_modules/.prisma/client" ]; then
    PRISMA_GENERATED=$(date -r "node_modules/.prisma/client" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "不明")
    echo "- Prisma Client: 生成済み (${PRISMA_GENERATED})"
  else
    echo "- Prisma Client: **未生成** (npx prisma generate を実行してください)"
  fi
  echo ""

  # --- 直近のコミット履歴（10件）---
  echo "## 直近コミット（10件）"
  echo '```'
  git log --oneline -10 2>/dev/null || echo "(取得失敗)"
  echo '```'
  echo ""

  # --- mainとの差分サマリー（feature branchの場合）---
  if [ -n "$BASE_REF" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "detached" ]; then
    echo "## ${BASE_REF}からの変更ファイル"
    echo '```'
    git diff --stat "${BASE_REF}...HEAD" 2>/dev/null | tail -20 || echo "(差分取得失敗)"
    echo '```'
    echo ""
  fi

} > "$SUMMARY_FILE" 2>/dev/null || true

echo "dev-context.md generated"

#!/usr/bin/env bash
# Pulls teammates' changes before every prompt to Claude and tells the model which shared
# files changed, so it re-reads them from disk instead of working from a stale copy.
# Fetches at most once every 60 seconds so it doesn't slow down every prompt.
set -u

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

STAMP="$(git rev-parse --git-dir)/.last-team-fetch"
NOW=$(date +%s)
LAST=$(cat "$STAMP" 2>/dev/null || echo 0)
[ $((NOW - LAST)) -lt 60 ] && exit 0
echo "$NOW" > "$STAMP"

git fetch -q origin main 2>/dev/null || exit 0

BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
[ "$BEHIND" = "0" ] && exit 0

CHANGED=$(git diff --name-only HEAD origin/main 2>/dev/null)

if ! git pull --rebase --autostash -q 2>/dev/null; then
  echo "[team] $BEHIND new commit(s) arrived, but the rebase failed — conflict."
  echo "[team] Tell the human to resolve it: git status, then git rebase --continue."
  exit 0
fi

echo "[team] Pulled $BEHIND commit(s) from teammates. Changed files:"
echo "$CHANGED" | sed 's/^/  /'

KEY=$(echo "$CHANGED" | grep -E '^(CLAUDE|PLAN|TEAM|README)\.md$|^docs/|^src/types\.ts$|^supabase/' || true)
if [ -n "$KEY" ]; then
  echo ""
  echo "[team] IMPORTANT: shared files changed. Your copy in context is stale."
  echo "[team] Re-read them from disk BEFORE doing anything:"
  echo "$KEY" | sed 's/^/  - /'
fi

#!/usr/bin/env bash
# Тянет свежие изменения команды перед каждым запросом к Claude и говорит модели,
# какие общие файлы обновились, чтобы она перечитала их с диска, а не работала по памяти.
# Fetch не чаще раза в 60 секунд, чтобы не тормозить каждый промпт.
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
  echo "[team] Пришло $BEHIND коммит(ов), но rebase не прошёл — конфликт."
  echo "[team] Скажи человеку разрулить вручную: git status, затем git rebase --continue."
  exit 0
fi

echo "[team] Подтянуто $BEHIND коммит(ов) от команды. Изменились файлы:"
echo "$CHANGED" | sed 's/^/  /'

KEY=$(echo "$CHANGED" | grep -E '^(CLAUDE|PLAN|TEAM|README)\.md$|^docs/|^src/types\.ts$|^supabase/' || true)
if [ -n "$KEY" ]; then
  echo ""
  echo "[team] ВНИМАНИЕ: обновились общие файлы. Твоя копия в контексте устарела."
  echo "[team] Перечитай их с диска ПЕРЕД тем, как что-то делать:"
  echo "$KEY" | sed 's/^/  - /'
fi

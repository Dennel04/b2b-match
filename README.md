# B2B Match

Сводим проблему компании с решением другой компании. Без холодных рассылок.
Приватные проблемы, слепой матчинг, двойное согласие, брифинг к встрече.

Хакатон 18–19 сентября 2026. План — `PLAN.md`, исследование рынка и ответы жюри — `docs/RESEARCH.md`,
зоны ответственности — `TEAM.md`, правила для Claude Code — `CLAUDE.md`.

## Старт (5 минут)

```bash
git clone https://github.com/Dennel04/b2b-match.git
cd b2b-match
npm install
cp .env.example .env.local   # заполнить ключи, взять у бэкендера
npm run dev
```

## Supabase

1. Создать проект на supabase.com.
2. SQL Editor → выполнить `supabase/migrations/0001_init.sql`.
3. Ключи из Settings → API положить в `.env.local`.

## Сид-данные

```bash
npm run seed   # 18 компаний с профилями и проблемами, генерирует Claude
```

Нужен `SEED_OWNER_ID` в `.env.local` — id любого зарегистрированного пользователя.

## Как работаем вдвоём-втроём

У каждого своя сессия Claude Code, общий контекст живёт в гите.
`git pull --rebase` подтягивается автоматически на старте сессии (хук в `.claude/settings.json`).
Детали — в `CLAUDE.md`, раздел «Как мы работаем параллельно».

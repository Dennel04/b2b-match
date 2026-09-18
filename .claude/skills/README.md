# Skills для дизайна и фронтенда

Лежат в `.claude/skills/`. Claude Code подхватывает их автоматически, если файлы закоммичены в репозиторий (другу: скопируйте папку `.claude/` в общий репо целиком).

| Скилл | Откуда | Зачем | Как вызвать |
|---|---|---|---|
| `b2b-match-ui` | написан под проект | Правила приватности в UI, статусы матчей, состояния загрузки AI, тон текстов, зона папок фронтенда | Срабатывает сам при работе над `src/app` / `src/components`. Явно: `/b2b-match-ui` |
| `frontend-design` | [anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design/skills/frontend-design) (официальный) | Не даёт получить шаблонный «AI-дизайн»: план палитры/шрифтов/лейаута, самокритика | Автоматически при просьбе сверстать экран. Явно: `/frontend-design` |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Аудит готового кода по 100+ правилам доступности и UX. **Тянет правила из интернета при запуске** | `/web-design-guidelines src/app/matches` |
| `react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | 70 правил производительности React / Next.js | Автоматически при написании компонентов и загрузки данных |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | База стилей, палитр, шрифтовых пар, UX-правил. Помогает выбрать палитру и шрифты | Автоматически. **Нужен Python 3** |

## Что сделать перед использованием

1. **Python для `ui-ux-pro-max`.** На этой машине Python не установлен (есть только заглушка Microsoft Store). Поставьте с python.org или `winget install Python.Python.3.12`, иначе скилл работает без поисковых скриптов, только по тексту SKILL.md. Остальные скиллы Python не требуют.
2. **Язык интерфейса.** В `b2b-match-ui` по умолчанию английский. Если решите иначе, поменяйте раздел «Copy».
3. **Интернет на сцене.** `web-design-guidelines` при запуске скачивает правила с GitHub. Запускайте аудит заранее, не на демо.

## Рекомендуемый порядок работы над экраном

1. «Сверстай экран матчей по `b2b-match-ui`» (сработает `frontend-design`: сначала план, потом код)
2. Фейковые данные типа из `src/types.ts` → потом подключение Server Actions
3. `/web-design-guidelines <файлы экрана>` → исправить замечания
4. Мёрж маленьким куском

## Безопасность

Сторонние скиллы могут содержать инструкции для Claude и скрипты. Перед установкой прочитаны `SKILL.md` всех скиллов и проверены скрипты `ui-ux-pro-max` (нет сетевых вызовов и запуска процессов; папка `tests/` удалена). Обновляя скиллы вручную, проверяйте их так же.

Единственная правка чужого кода: в `ui-ux-pro-max/SKILL.md` путь к скрипту `${CLAUDE_PLUGIN_ROOT}/.claude/skills/...` заменён на `.claude/skills/...` (переменная существует только у плагинов). Скрипты запускаются из корня проекта.

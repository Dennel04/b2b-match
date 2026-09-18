# /lab — design exploration, not product code

Seven versions of the **main dashboard**, each built by following one third-party design skill.
They exist so the team can pick a visual direction. Nothing in the product imports from here.

Open `/lab` in the dev server (`npm run dev`). A switcher at the bottom of every page flips
between variants. Every variant renders the same fake data from `_data.ts`, so the only
difference is the design.

| Route | Skill it follows | Direction |
|---|---|---|
| `/lab/f` | `high-end-visual-design` ([taste-skill](https://github.com/leonxlnx/taste-skill)) | **The pick so far.** Soft structuralism: double-bezel cards, pill buttons, floating nav |
| `/lab/h` | `emil-design-eng` ([emilkowalski/skills](https://github.com/emilkowalski/skills)) | Quiet look, interaction craft: hold-to-confirm, sliding tabs, expanding rows, toast |
| `/lab/i` | `liquid-glass` ([Armitanemati](https://github.com/Armitanemati/liquid-glass-claude-skill)) | Glass only on floating chrome, solid content cards, project teal accent |
| `/lab/j` | `apple-design` ([s1gmamale1](https://github.com/s1gmamale1/apple-design-skills)) | iOS Settings restraint: light, one blue, inset grouped lists |
| `/lab/k` | `awwwards` ([tponscr-debug](https://github.com/tponscr-debug/claude-skill-awwwards)) | Giant fluid type, marquee, broken-grid ledger, scroll reveals |
| `/lab/l` | `claude-design` ([jiji262](https://github.com/jiji262/claude-design-skill)) | Dieter Rams / Braun: dials, spec tables, one functional orange |
| `/lab/m` | `gpt-taste` ([taste-skill](https://github.com/leonxlnx/taste-skill)) | Cinematic dark, gapless bento, stacking cards, scrubbed text |

Each `page.tsx` starts with a comment listing which rules of its skill were applied.
The skills themselves were read, not installed: they are **not** in `.claude/skills/`.

## Rules for anyone (human or Claude) working near this folder

- **Do not import from `src/app/lab/` into real pages.** `_data.ts` is fake. Real pages get data
  from `src/actions/` and types from `src/types.ts`.
- **Do not fix or refactor lab pages.** They are throwaway references. When a direction is
  chosen, rebuild it properly in `src/app/` and `src/components/`, then delete this folder.
- **Borrow ideas, not code.** Tokens, spacing, radii and component shapes are the useful part.
- Motion lives in `lab.css` (keyframes prefixed `lab-`). None of it is global.
- K and M use CSS scroll-driven animations instead of GSAP (no new dependencies). They
  animate in Chrome and Edge only; other browsers show the content without motion.
- M loads placeholder photos from picsum.photos, so it needs the network.

## Known deviations from product rules

These are design mockups, so some product rules are relaxed. A real screen must not copy them:

- Seller names (Rebase OÜ, Tollwise) are shown before both sides consented. In the product,
  identities are revealed only after both say yes (see `drafts/design/README.md`).
- The buyer's own problem text is shown because the viewer owns it. It must never render on
  another company's page.

## For teammates

- **Page structure from Claude Design** (`drafts/design/`): use `/lab/f` as the visual language
  and the Claude Design output as the layout. The lab says how things look; the drafts say
  what goes where.
- **Restructuring the codebase**: `src/app/lab/` is self-contained and safe to move or delete.
  It depends only on `src/types.ts` (read-only) and `next/font/google`.

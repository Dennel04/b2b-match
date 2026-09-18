# Design drafts

Output from Claude Design, dropped in as-is. Not wired to anything — open the HTML directly in
a browser, it is self-contained and works offline.

| File | What it is |
|---|---|
| `problem-page.html` | The buyer's problem screen. First direction Claude Design produced from the idea-only prompt in `docs/LOVABLE_PROMPT.md`. |

These are references for the real implementation, not code to import: the markup is built at
runtime by a bundled runtime, so it cannot be copied into components directly. Read it for the
decisions, rebuild it in `src/`.

Observed so far: Instrument Sans as the single family, cool slate ink (#16323A) on a light
ground with cool grey rules (#DDE3E7). No cream-and-terracotta, no near-black-and-acid — it
avoided the usual generated-design tells on its own.

# Prior Art Research

## Similar Projects

- **Markdoc (Stripe)** — Closest philosophy. Extends markdown declaratively, deliberately omits loops/variables. Still requires developer setup for custom tags.
- **MDX** — JSX in markdown. Too complex for non-technical users.
- **Djot** — Clean-sheet markdown redesign by CommonMark creator. Generic containers, attributes on any element. Document format, not website format.
- **Bear Blog** — Proves radical simplicity works for blogs. ~2.7KB pages. No layout.
- **Blot.im** — Folder → website. Auto-embeds from URLs. Still fundamentally a blog engine.
- **Code Hike** — Identifies "the curse of markdown" — the sparse area just beyond markdown's limits is vitally important.

## Key Risks / Issues

1. **Semantic HTML output** — Must emit nav, article, aside, figure, etc. for accessibility/SEO.
2. **Visual editor needed** — Non-technical users won't write raw markdown. Plan for this from day one.
3. **`:::` is the emerging standard** for fenced containers (Pandoc, R Markdown, CommonMark proposal). Our `===` diverges.
4. **Auto-layout is unsolved** — No prior art for content-driven layout inference. We're in new territory.
5. **Fragmentation** — 41+ markdown flavors exist. We're #42.
6. **The richness/effort tradeoff** — Too little = can't express ideas, too much = coding. Narrow sweet spot.

## Syntax Ideas From Others

- Pandoc `:::` fenced divs with attributes
- Blot.im auto-embeds (bare URL on own line → rich embed)
- Djot attributes on any element: `{.class #id key=value}`
- CommonMark generic directives proposal: `:` inline, `::` leaf, `:::` container

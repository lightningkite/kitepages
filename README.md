# Supermarkdown

A content-driven web format where you describe *what* you want to show and the renderer figures out the layout. No HTML, no CSS, no breakpoints. Just content in, website out.

## Why

### The website problem is unsolved for most people

Making a website in 2026 still requires choosing between:

1. **Website builders** (Squarespace, Wix) — point-and-click, but every element is manually positioned. Moving a text block means dragging it, resizing it, checking it on mobile, adjusting again. The result is a layout, not a document — you can't read the source, copy it, diff it, or generate it programmatically.

2. **Code** (HTML/CSS/JS, React, etc.) — total control, but the barrier is a programming career. Even experienced developers spend hours fighting flexbox, media queries, and cross-browser rendering for a simple marketing page.

3. **Markdown-based tools** (Jekyll, Hugo, etc.) — great for blogs, but they stop at text. The moment you need columns, a hero image, a pricing table, or a contact form, you're back to writing HTML templates and CSS.

None of these let a non-technical person create a polished, multi-section marketing site by just writing down what they want to say.

### AI changed the equation — almost

LLMs can generate websites. But what they produce is HTML/CSS — a pile of `<div>`s, inline styles, and class names that:

- **No human can maintain.** Ask an AI to make a restaurant site and you get 400 lines of markup. The restaurant owner can't update their hours without risking the layout.
- **No AI can reliably edit.** Ask an AI to change the hero image in an existing HTML page and it may break the grid, duplicate a section, or lose responsive behavior. HTML is a fragile target for generation *and* modification.
- **Can't be themed.** Changing the brand color means finding every `#3d6b42` in a stylesheet. Changing fonts means updating multiple `font-family` declarations and hoping nothing breaks.

The problem isn't generation — it's the **format**. HTML was designed for browsers to render, not for humans or AI to author and maintain.

### Supermarkdown is a format designed for both humans and AI

Supermarkdown is a Markdown superset (`.md`) where:

- **Content implies layout.** You write a heading, a paragraph, and three images. The renderer knows that's a hero section with a gallery. You write two matching lists under subheadings. The renderer puts them in columns. You never specify `display: grid` or `@media (max-width: 768px)`.

- **The source is readable.** A restaurant owner can open their `.md` file, find `- Bruschetta ... $8`, change it to `$9`, and save. No risk of breaking layout. No hunting through nested `<div>`s.

- **AI can generate *and* maintain it.** An LLM can produce a complete site in a few hundred lines of plain text — and a different LLM (or the same one, months later) can make targeted edits without understanding a layout engine. The format is small, semantic, and unambiguous.

- **Theming is separate from content.** One `theme.yaml` controls colors, fonts, and style across every page. Rebrand the entire site by changing a few values. The renderer handles contrast, spacing, and responsiveness.

- **Responsive by default.** There are no breakpoints. The renderer adapts because it understands the content's *intent* — parallel sections become columns on wide screens and stack on narrow ones. The author tests on zero screen sizes.

### The value proposition, concretely

| Scenario | Without Supermarkdown | With Supermarkdown |
|---|---|---|
| Small business needs a website | Pay a developer or wrestle with a builder | Describe your business in a text file |
| AI generates a marketing site | 400+ lines of HTML/CSS that nobody can maintain | 60 lines of `.md` that anyone can read and edit |
| Client wants to change their hours | Call the developer or risk breaking the template | Edit one line of text |
| Rebrand (new colors, new fonts) | Touch dozens of CSS rules | Change 4 values in `theme.yaml` |
| Add a new page | Clone a template, rewire navigation, match styling | Create a new `.md` file; header/footer are automatic |

## What it looks like

A complete restaurant page:

```
---
title: Giuseppe's Italian Restaurant
description: Authentic Italian cuisine in downtown Portland since 1985
---

::: carousel
::: bg restaurant.jpg
# Giuseppe's Italian Restaurant
Authentic cuisine in downtown Portland. Family owned since 1985.
:::
:::

## Our Menu

|||
### Appetizers
- Bruschetta ... $8
- Calamari Fritti ... $12
---
### Entrees
- Margherita Pizza ... $14
- Linguine alle Vongole ... $18
|||

## Hours & Location

|||
### Hours
Monday–Friday: 11am–10pm
Saturday: 10am–11pm
---
### Find Us
123 Main Street
Portland, OR 97201
|||

## Reservations

::: form
Name*: {text}
Email*: {email}
Date*: {date}
Party size*: {1 / 2 / 3-4 / 5-6 / 7+}

[Reserve a Table](POST /reservations)
:::
```

That's the entire page. The renderer produces a responsive site with a hero carousel, columnar menu, contact info, and a working reservation form — styled by `theme.yaml`.

## Project structure

```
supermarkdown/
├── src/
│   ├── parser.mjs       Parser (string → AST, works in Node + browser)
│   ├── renderer.mjs     Renderer (AST + theme → HTML, works in Node + browser)
│   ├── smd.css          All styles
│   ├── browser.mjs      Client-side runtime (SPA nav, animations, editor)
│   └── compile.mjs      Node.js CLI — compiles .md sites to static HTML
├── sites/               Example sites
│   ├── giuseppe/        Restaurant (multi-page)
│   ├── nonprofit/       Land trust
│   ├── portfolio/       Designer portfolio
│   ├── salon/           Hair salon
│   ├── supermarkdown/   This project's own site (meta!)
│   └── wedding/         Wedding site
├── prototype/           Browser-based renderer shell
├── test/                Parser, renderer, and compiler tests
├── design/              Design specs and principles
├── docs/                Compiled GitHub Pages site
└── scripts/             Screenshot generation tooling
```

## Getting started

**Compile a site to static HTML:**

```bash
node src/compile.mjs sites/giuseppe/ --out build/
```

**Or use the live browser renderer:**

Open `prototype/renderer.html?file=sites/giuseppe/index.md&theme=sites/giuseppe/theme.yaml`

**Run tests:**

```bash
npm test
```

## Status

Working prototype with a modular architecture. The parser and renderer are pure functions usable from both Node.js (static compilation) and the browser (dynamic rendering). Handles heroes, columns, carousels, background sections, testimonials, forms, cards, record blocks, multi-page navigation, page transitions, scroll animations, and theming. Six complete example sites across different verticals.

## Roadmap

### Phase 1 — Markdown Compatibility Foundation ✅

Breaking changes to align with standard Markdown.

- [x] Rewrite the parser — fenced-block stack (nested `:::`), context-aware `---`, `| ` prefix columns, pluggable fenced block handlers (`::: carousel`, `::: form`, `::: card`, `::: quote`, alerts). Also added: code blocks, ordered lists, record blocks (`:: name`), expandable sections (`>| summary`), `> ` prefix blockquotes.
- [x] Switch from `.smd` to `.md` extension
- [x] Replace custom YAML parser with a standard library — `js-yaml` for the compiler; built-in simple YAML parser for browser runtime (handles frontmatter and theme files)
- [x] Switch `theme.json` to `theme.yaml`
- [x] Allow raw HTML passthrough — block-level HTML tags pass through to output as-is
- [x] Rework form syntax — `{text}`, `{email}`, `{paragraph}`, `{date}`, `{number}`, `{file}`, `{checkbox}`, `{option1 / option2}` delimiters
- [x] Fix inline formatting — `++large++` replaces `__large__`. `_text_` remains underline. Added inline code spans.
- [x] Rework column syntax — `|||` opens and closes, `---` separates columns inside. `| ` prefix columns for short content.
- [x] Rework carousel syntax — `::: carousel` with `---` to separate slides. Nested `:::` support.
- [x] Borrow `>>>` as block-quote-without-prefix (Discord-style)
- [x] Heading anchors — generate `id` from heading text (e.g. `## Our Menu` → `id="our-menu"`) for deep linking

### Phase 2 — Inline & Text Features ✅

New inline syntax borrowed from GFM/extended Markdown, plus Supermarkdown originals.

- [x] `~~strikethrough~~` (GFM)
- [x] Autolinks — bare URLs become clickable (GFM)
- [x] Task lists — `- [ ]` (todo), `- [x]` (done), `- [-]` (partial/indeterminate)
- [x] `^superscript^`, `~subscript~` (Pandoc)
- [x] `==highlighted text==` (markdown-it-mark)
- [x] Smart typography — curly quotes, `--` → em dash, `word...` → ellipsis, `(c)` → ©, `(tm)` → ™
- [x] Icon support — `:name:` emoji shortcodes (~80 common names); Tabler Icons SVG integration planned as enhancement

### Phase 3 — Rich Content

Block-level features for more expressive sites.

- [ ] Standard Markdown tables — `| col | col |` syntax
- [ ] GFM alert syntax as alias — `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]` alongside `::: note`/`::: warning`
- [ ] External embeds — YouTube, Google Maps, iframes (syntax TBD)
- [ ] Image sizing control
- [ ] Math formulas — `\( inline \)` and `\[ block \]` (LaTeX delimiters, not `$`); lazy-load KaTeX
- [ ] Syntax highlighting in code blocks — lazy-load Prism or Shiki
- [ ] Directive syntax — `{:toc}` for table of contents, `{:nav}` for auto-generated navigation. Extensible.
- [ ] Side navigation layout — persistent sidebar nav as an alternative to top nav

### Phase 4 — Production Readiness

SEO, accessibility, and compiler improvements for real-world deployment.

- [ ] Open Graph / social sharing meta tags from frontmatter
- [ ] Accessibility pass — ARIA on carousels/forms, landmark roles, skip-nav, alt text enforcement
- [ ] Sitemap.xml generation
- [ ] Link/image validation at compile time
- [ ] Draft pages — `draft: true` in frontmatter excludes from compilation
- [ ] 404.md convention — compile to `404.html` for hosting platforms
- [ ] Print stylesheet — `@media print` rules for menus, event details, flyers

### Phase 5 — Tooling

Developer and end-user experience.

- [ ] Full site editor (press `E`) — replace the single-file textarea with a proper editor:
  - File tree sidebar for all `.md` files, `theme.yaml`, `header.md`, `footer.md`
  - Syntax highlighting, line numbers, undo/redo, find/replace
  - Live preview as you type
  - Lazy-loaded to keep initial page size small
  - Disableable (compile flag to strip from production builds)
  - Always editable with live preview; saves to disk when dev server is available, warns when it isn't

### Ongoing

- [ ] Document layout heuristics in detail (column detection, gallery inference, CTA detection, dot-leader lists, section alternation)
- [ ] Build the supermarkdown project site (`sites/supermarkdown/`)
- [ ] More site variety — continuously expand the range of styles, layouts, and industries supported

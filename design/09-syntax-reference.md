# Kite Pages Syntax Reference (Planned)

This documents the full planned syntax — current features and TODO items merged into one reference. Items marked **(new)** are not yet implemented.

## Inline Formatting

| Syntax | Result | Origin |
|---|---|---|
| `**bold**` | **bold** | CommonMark |
| `*italic*` | *italic* | CommonMark |
| `***bold italic***` | ***bold italic*** | CommonMark |
| `_underline_` | underline | Kite Pages (diverges from CommonMark italic — see Conflicts) |
| `++large text++` | large/stat callout | Kite Pages **(new — replaces `__text__`)** |
| `~~strikethrough~~` | ~~strikethrough~~ | GFM **(new)** |
| `==highlighted==` | highlighted/marked text | markdown-it-mark **(new)** |
| `^superscript^` | superscript | Pandoc **(new)** |
| `~subscript~` | subscript | Pandoc **(new)** |
| `` `code` `` | inline code | CommonMark |
| `[text](url)` | link | CommonMark |
| `![alt](url)` | image | CommonMark |
| `★★★★★` | star rating display | Kite Pages |
| `\( math \)` | inline math (KaTeX) | LaTeX **(new)** |
| `:name:` | icon (SVG) or emoji fallback | Kite Pages **(new)** — Tabler Icons first, then emoji shortcodes, then literal. Theme controls filled vs outline. |
| Bare URLs | autolinked | GFM **(new)** |
| Smart typography | curly quotes, em dash (`--`), ellipsis (`...`), (c), (tm) | SmartyPants **(new)** |

## Headings

```
# H1 — Page hero (large, prominent, potentially full-screen)
## H2 — Section divider (visual boundary, alternating backgrounds)
### H3 — Subsection (groups within a section, column headers)
#### H4 — Label (inline subheading, no structural weight)
##### H5
###### H6
```

Headings auto-generate `id` attributes from their text for deep linking **(new)**.
Example: `## Our Menu` → `id="our-menu"`.

## Block Elements

### Paragraphs

Plain text separated by blank lines. Line breaks within a paragraph produce `<br>`.

### Lists

Standard unordered and ordered lists:

```
- Unordered item
- Another item

1. Ordered item
2. Another item
```

**Dot-leader lists** — a list item with `...` between name and value:

```
- Bruschetta ... $8
- Calamari ... $12
```

Renders as two-column layout with right-aligned value and dotted leader.

**Task lists (new):**

```
- [ ] Todo
- [x] Done
- [-] Partial / indeterminate
```

### Blockquotes

Standard prefix syntax:

```
> Single line quote
> Continues here
```

**Block quote without prefix (new):**

```
>>>
Everything after this marker is quoted
until the next blank line or block boundary.
No need to prefix every line.
>>>
```

**GFM alerts (new)** — alias for `::: note` / `::: warning` etc.:

```
> [!NOTE]
> This is a note.

> [!WARNING]
> This is a warning.

> [!TIP]
> This is a tip.
```

### Code Blocks

````
```
Plain code block
```

```javascript
Syntax highlighted (new — lazy-loads Prism or Shiki)
```
````

### Horizontal Rule

```
---
```

Also used as a separator inside fenced columns (`|||`) and carousels (`::: carousel`). Meaning is context-dependent — see Fenced Blocks below.

### Tables (new)

Standard Markdown / GFM table syntax:

```
| Name | Price | Notes |
|------|-------|-------|
| Bruschetta | $8 | Seasonal |
| Calamari | $12 | |
```

### Images

```
![Alt text](image.jpg)
```

Consecutive images at the same level auto-detect as a gallery:
- 1 image: full width
- 2 images: side by side
- 3 images: triptych
- 4+ images: responsive grid

Image sizing control is TBD **(new)**.

### Math (new)

Inline: `\( E = mc^2 \)`

Block:

```
\[
\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n
\]
```

Uses LaTeX delimiters (not `$` which collides with prices). KaTeX lazy-loaded when formulas are present.

## Fenced Blocks (`::: type` ... `:::`)

`::: type` opens a fenced block, bare `:::` closes it. Blocks nest — the parser uses a stack, so the first bare `:::` closes the innermost open block.

### Background Sections

```
::: bg image.jpg
# Heading
Overlay text on the image.
:::
```

### Cards

```
::: card
### Title
Description
:::
```

### Quotes / Testimonials

```
::: quote
★★★★★
The best experience we've ever had.
— **Maria S.**
:::
```

### Alerts / Admonitions

```
::: warning
Important information here.
:::
```

Types: `warning`, `info`, `success`, `error`, `note`, `tip`.

### Carousels (new syntax)

```
::: carousel
::: bg slide1.jpg
# Slide One
:::
---
::: bg slide2.jpg
# Slide Two
:::
:::
```

`---` separates slides inside the carousel. Replaces the old `>>>` delimiter syntax.

### Forms

```
::: form
Name*: {text}
Email*: {email}
Phone: {text}

Service*: {Haircut / Color / Treatment}
Date: {date}
Notes: {paragraph}

[Book Appointment](POST /book)
:::
```

**Field types (new `{}` syntax — replaces `<>`):**
- `{text}` — single-line text input
- `{email}` — email with validation
- `{paragraph}` — multi-line text
- `{number}` — numeric input
- `{date}` — date picker
- `{file}` — file upload
- `{checkbox}` — boolean toggle
- `{option1 / option2 / option3}` — select/dropdown

`*` after label = required. Blank lines create visual field groups.

Buttons: `[Label](METHOD /url)` — METHOD is POST, DELETE, etc.

Submission/action story TBD.

### Expandable Sections

```
>| How do I return an item?
   You have 30 days to return any item.
   Just bring your receipt to the store.
```

`>|` starts a collapsible block. First line is the summary, indented lines are hidden content.

## Columns

Two syntaxes depending on content length:

### Fenced columns (for longer content)

```
|||
### Column 1
Lots of content here...
---
### Column 2
More content here...
|||
```

`|||` opens and closes. `---` separates columns inside.

### Prefix columns (for short content)

```
| ### Feature 1
| Short description

| ### Feature 2
| Short description

| ### Feature 3
| Short description
```

`| ` prefix on each line (like `> ` for blockquotes). Adjacent `| ` blocks become columns.

Bare `|` on its own line continues the same column (allows blank lines within a column):

```
| ### Feature 1
| First paragraph
|
| Second paragraph still in column 1

| ### Feature 2
| This is column 2
```

## Record Blocks

```
:: Pizza
   Price: $14
   Our famous thin crust margherita

:: Calamari
   Price: $12
   Lightly fried with marinara sauce
```

`::` starts a record. Indented `Key: value` lines are fields. Plain indented text is the body. Renderer adapts presentation: table on wide screens, cards on narrow.

## Directives (new)

Inline commands the renderer executes:

```
{:toc}       — Insert table of contents (generated from headings)
{:nav}       — Auto-generate navigation from page list
```

Extensible for future directives. Distinguished from form fields by the `:` prefix.

## Frontmatter

```
---
title: Page Title
description: For search engines
image: preview.jpg
draft: true
---
```

YAML frontmatter at the top of the document. Fields:
- `title` — browser tab, search results, og:title
- `description` — SEO meta, og:description
- `image` — social sharing preview, og:image
- `draft` — exclude from compilation **(new)**

## Site Structure

```
mysite/
├── index.md              Home page
├── about.md              Additional pages
├── header.md             Navigation bar (all pages)
├── footer.md             Footer (all pages)
├── theme.yaml            Colors, fonts, style
├── 404.md                Custom 404 page (new)
└── images/               Static assets
```

`.md` extension.
`theme.yaml` **(new — replaces `theme.json`)**.

## Raw HTML Passthrough (new)

HTML tags pass through to output as-is, per standard Markdown behavior:

```
This has a <span style="color: red">red word</span> in it.

<div class="custom-widget">
  Arbitrary HTML for edge cases.
</div>
```

## CTA Detection (heuristic)

A paragraph containing only links renders as a button row:

```
[Get Started](signup.md) [Learn More](guide.md)
```

First link becomes primary CTA, subsequent links become secondary.

---

# Conflict Analysis

## Internal Conflicts

### `---` is overloaded
- **Frontmatter delimiter** — only at document start, between `---` pairs
- **Horizontal rule** — standalone in body text
- **Column separator** — only inside `|||` fences
- **Carousel slide separator** — only inside `::: carousel`

**Verdict:** Unambiguous — each meaning is determined by context (document position or enclosing fence).

### `| ` prefix columns vs `| col | col |` tables
- Tables have `|` on **both** sides of each cell plus a `|---|---|` separator row
- Columns have `| ` only on the **left** side

**Verdict:** Parser can distinguish by checking if the line ends with `|` and is followed by a separator row.

### `{text}` form fields vs `{:toc}` directives
- Form fields: `{type}` — plain name
- Directives: `{:name}` — colon prefix

**Verdict:** Unambiguous — `:` prefix distinguishes directives.

### `::` records vs `:::` fenced sections
- Records: `:: Name` (two colons)
- Fenced sections: `::: type` (three colons)

**Verdict:** Unambiguous — colon count distinguishes them.

### `~subscript~` vs `~~strikethrough~~`
- Single `~` for subscript
- Double `~~` for strikethrough

**Verdict:** Unambiguous — parser matches longest delimiter first.

### `...` dot-leaders vs `...` smart typography
- Dot-leader: `- Item ... $8` (spaces around `...`)
- Smart typography: `something...` → `something…` (no space before `...`)

**Verdict:** No conflict. Ellipsis conversion only applies when `...` is directly after a word (no preceding space). Spaces around `...` trigger dot-leader rendering instead.

### `:name:` icons vs emoji shortcodes
- Both use `:name:` syntax
- Some names overlap (`:heart:`, `:star:`, `:warning:`, `:sun:`, etc.)

**Verdict:** Fallback chain — icon set first, emoji shortcode second, literal text if no match. `:home:` → SVG icon; `:tada:` → 🎉 emoji (no icon match); `:nonsense:` → literal. If someone wants the emoji over the icon, they type the Unicode character directly.

## Divergences from Standard Markdown

### `_underline_` vs `_italic_`
Standard Markdown: `_text_` = italic (same as `*text*`).
Kite Pages: `_text_` = underline.

**Accepted divergence.** Both are emphasis — semantically near-equivalent. `*italic*` still works for italic. Files render slightly differently in other Markdown tools (italic instead of underline) but meaning is preserved.

### `>>>` block quote
Standard Markdown: `>>>` = triple-nested blockquote (deeply nested `>`).
Kite Pages: `>>>` = block-level quote without prefix (Discord-style).

**Minor divergence.** Triple-nested blockquotes are extremely rare in practice. The Discord convention is more useful.

## Implementation Notes

### Inline formatting precedence
Delimiters must nest properly — no crossing. `**bold _underline_**` is valid nesting. `_underline **bold_ text**` is crossing and should not match (render as literal characters). Code backticks take highest precedence (nothing parsed inside). Process delimiters left to right, match closing to most recent unmatched opener of the same type.

### `| ` column boundaries
Each contiguous group of `| `-prefixed lines is one column. A blank line between `| ` groups starts a new column. A bare `|` on its own line continues the same column (allows blank lines within). A single `| ` group with no adjacent sibling is a column of one — effectively a styled block.

### `>>>` block quote
Opens and closes like triple-backtick code fences. Content between `>>>` pairs is a block quote. No `>` prefix needed on interior lines.

### Smart typography exclusions
Do not convert inside: code blocks, inline code, URLs, frontmatter, raw HTML tags, form field definitions.

### Fenced block handler interface
`::: type` blocks support pluggable content handlers. Two forms:

**Simple** — single function `(content: string) => string`. Receives raw content between fences, returns HTML. Works for self-contained blocks like `::: form`.

**Split** — object with `parse(lines: string[]) => object` and `render(block: object, theme: object) => string`. Matches the parser/renderer architecture. Use when the AST node needs to be inspectable or rendered differently per context.

If no handler is registered for a type, contents are parsed with the standard recursive block parser (default).

### YAML library
Use `js-yaml` for both frontmatter and `theme.yaml` parsing.

### Testing strategy
Rewrite tests and example sites alongside the parser rewrite. All example sites must compile and render correctly.

## Full Compatibility with Standard Markdown

The following are fully compatible — a Kite Pages file renders correctly (if less richly) in any CommonMark/GFM renderer:

- Headings, paragraphs, bold, italic, links, images, lists, code, blockquotes, horizontal rules, tables, fenced code blocks, raw HTML, autolinks, strikethrough, task lists

Kite Pages extensions degrade gracefully — column fences (`|||`), fenced sections (`:::`), record blocks (`::`), directives (`{:toc}`), and form fields (`{text}`) appear as plain text in a standard renderer.

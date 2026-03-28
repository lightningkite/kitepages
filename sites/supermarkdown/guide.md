---
title: Guide — Supermarkdown
description: Complete reference for every Supermarkdown feature with live examples
---

# Guide

{:toc}

## Text Formatting

Supermarkdown supports all standard Markdown inline formatting plus several extensions.

| Syntax | Result | Type |
|--------|--------|------|
| `**bold**` | **bold** | CommonMark |
| `*italic*` | *italic* | CommonMark |
| `_underline_` | _underline_ | Supermarkdown |
| `~~strikethrough~~` | ~~strikethrough~~ | GFM |
| `==highlight==` | ==highlight== | markdown-it-mark |
| `++large text++` | ++large++ | Supermarkdown |
| `^superscript^` | x^2^ | Pandoc |
| `~subscript~` | H~2~O | Pandoc |

Inline code: wrap in backticks. Links: `[text](url)`. Images: `![alt](url)`.

Smart typography converts `--` to em dashes, `...` after words to ellipsis, and `(c)` to (c).

## Headings

```
# H1 — Page hero (large, centered)
## H2 — Section (creates visual boundary)
### H3 — Subsection (column headers)
#### H4 — Label
```

Headings auto-generate anchor IDs from their text. `## Our Menu` becomes `id="our-menu"` for deep linking.

## Lists

### Bullet Lists

- First item
- Second item
- Third item

### Numbered Lists

1. Step one
2. Step two
3. Step three

### Task Lists

- [x] Parser rewrite
- [x] Inline formatting
- [x] Tables and alerts
- [ ] More site variety

### Dot-Leader Lists

For pricing and menus:

- Bruschetta ... $8
- Calamari ... $12
- Margherita Pizza ... $14

## Columns

### Fenced Columns

Use `|||` to open, `---` to separate, `|||` to close:

|||

### Column One
First column content here.

---

### Column Two
Second column content here.

---

### Column Three
Third column content here.

|||

### Prefix Columns

Use `| ` prefix on each line (like `> ` for blockquotes):

| ### Feature A
| Short description of the first feature.

| ### Feature B
| Short description of the second feature.

| ### Feature C
| Short description of the third feature.

## Tables

Standard Markdown table syntax with alignment:

| Feature | Status | Phase |
|:--------|:------:|------:|
| Parser rewrite | Done | 1 |
| Inline formatting | Done | 2 |
| Tables | Done | 3 |
| Math formulas | Done | 3 |

## Blockquotes

### Prefix Style

> This is a standard blockquote.
> It can span multiple lines.

### Fenced Style

>>>
This is a fenced block quote.
No prefix needed on each line.
Useful for longer quotations.
>>>

### GFM Alerts

> [!NOTE]
> This is a note alert using GFM syntax.

> [!WARNING]
> This is a warning. Be careful with this feature.

> [!TIP]
> Tips provide helpful suggestions for better usage.

## Cards

::: card
### Card Title
Cards are great for feature grids and content blocks. They get automatic padding, border radius, and shadow based on the theme.
:::

## Testimonials

::: quote
★★★★★
This format changed how we think about web content. Our whole team can edit the site now.
— **Sarah K., Marketing Director**
:::

## Alerts

::: warning
Always test your site on mobile before deploying.
:::

::: info
Supermarkdown files are standard Markdown. They render (less richly) in any Markdown viewer.
:::

## Forms

::: form
Name*: {text}
Email*: {email}

Service*: {Haircut / Color / Treatment}
Date: {date}
Notes: {paragraph}

[Book Appointment](POST /book)
:::

## Code Blocks

Fenced code blocks with language annotation:

```javascript
// Compile a Supermarkdown site
import { parse } from './parser.mjs';
import { render } from './renderer.mjs';

const doc = parse(source);
const html = render(doc, theme);
```

```yaml
# theme.yaml — controls the entire look
colors:
  primary: "#2d5a27"
  accent: "#e8a435"
fonts:
  heading: Playfair Display
  body: Inter
```

## Background Sections

Use `::: bg image.jpg` to create sections with image backgrounds and text overlay. Great for heroes and banners.

## Carousels

Use `::: carousel` with `---` between slides. Each slide is typically a `::: bg` section. Auto-plays every 5 seconds with prev/next buttons.

## Expandable Sections

>| How do I get started?
   Create a folder with an index.md and theme.yaml file.
   Run the compiler and deploy the output.

>| Can I use this for a blog?
   Yes. Each .md file becomes a page.
   Add a header.md for consistent navigation.

## Record Blocks

:: Margherita Pizza
   Price: $14
   Our classic thin-crust pizza with fresh mozzarella and basil.

:: Tiramisu
   Price: $9
   Traditional Italian dessert with espresso-soaked ladyfingers.

## Emoji Shortcodes

Use `:name:` for emoji: :heart: :rocket: :check: :star: :fire:

## Site Structure

```
mysite/
  index.md          Home page
  about.md          Additional pages
  header.md         Navigation (all pages)
  footer.md         Footer (all pages)
  theme.yaml        Colors, fonts, style
  404.md            Custom 404 page
```

## Theming

One file controls everything:

```yaml
mode: light
nav: transparent
sections: alternating
cards: elevated
animation: subtle
colors:
  primary: "#1a3a1a"
  accent: "#c9a84c"
fonts:
  heading: Playfair Display
  body: Source Sans 3
radius: 12
```

Nav styles: `transparent`, `solid`, `minimal`, `centered`, `side`.
Section styles: `alternating`, `bold`, `clean`.
Card styles: `elevated`, `bordered`, `flat`, `glass`.

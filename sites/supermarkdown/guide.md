---
title: Guide — Supermarkdown
description: Everything you need to build a site with Supermarkdown
---

# Guide

Everything you need to build a site with Supermarkdown.

## Quick Start

Create a folder with these files:

|||

### index.md

```
---
title: My Site
description: A short description
---

::: bg hero.jpg
# Welcome
We make great things happen.
:::

## About Us
We're a small team with big ideas.

## Contact
::: form
Name*: {text}
Email*: {email}
Message: {paragraph}
[Send](POST /contact)
:::
```

---

### theme.yaml

```
colors:
  primary: "#2d5a27"
  accent: "#e8a435"
  background: "#faf9f6"
  text: "#2d2d2d"

fonts:
  heading: Playfair Display
  body: Source Sans 3

mode: light
```

|||

Then compile:

```
node src/compile.mjs mysite/ --out build/
```

Or view live in the browser via `renderer.html?file=mysite/index.md&theme=mysite/theme.yaml`.

## Site Structure

|||

### Required
- `index.md` — your home page

---

### Recommended
- `header.md` — navigation bar (all pages)
- `footer.md` — footer (all pages)
- `theme.yaml` — colors, fonts, style

---

### Optional
- Additional `.md` pages
- An `images/` folder for assets

|||

## Page Format

Every page has optional frontmatter and content.

```
---
title: Page Title
description: For search engines
image: preview.jpg
---

Content starts here.
```

Frontmatter fields: `title` (browser tab, search results), `description` (SEO), `image` (social sharing preview).

## Text Formatting

|||

### Syntax

```
**bold**
*italic*
***bold italic***
++large text++
_underline_
[link](url)
★★★★★
```

---

### Result

**bold**, *italic*, ***bold italic***

++42++ — large text for stats

_underline_ for emphasis

[Links](https://example.com) are clickable

★★★★★ — styled star ratings

|||

## Headings

Headings control page structure. Each level has a specific role.

- `#` — Page hero. Large, prominent, potentially full-screen.
- `##` — Section divider. Creates a visual boundary with spacing. Sections get alternating backgrounds.
- `###` — Subsection. Groups within a section, commonly used as column headers.
- `####` — Label. Inline subheading, no structural weight.

Headings auto-generate anchor IDs from their text for deep linking. Example: `## Our Menu` generates `id="our-menu"`, linkable as `page.md#our-menu`.

## Columns

Two syntaxes depending on content length.

### Fenced Columns

For longer content, use `|||` to open and close, with `---` to separate columns:

```
|||
### Column 1
Content here
---
### Column 2
Content here
|||
```

`|||` opens the column block, `---` separates columns, `|||` closes it. On narrow screens, columns stack automatically.

### Prefix Columns

For short content, use `| ` prefix on each line (like `> ` for blockquotes):

```
| ### Feature 1
| Short description

| ### Feature 2
| Short description

| ### Feature 3
| Short description
```

Adjacent `| ` blocks become columns. A bare `|` on its own line continues the same column (allows blank lines within).

## Lists and Pricing

Standard unordered and ordered lists work as expected:

```
- Unordered item
- Another item

1. Ordered item
2. Another item
```

Add `...` between an item and its price for dot-leader formatting:

```
- Bruschetta ... $8
- Calamari Fritti ... $12
- Caprese Salad ... $10
```

Renders with automatic spacing and a dotted leader between name and price.

## Background Sections

Full-bleed sections with a background image and overlaid text:

```
::: bg https://example.com/photo.jpg
# Heading
Subtitle text overlaid on the image.
:::
```

Use for hero banners, section dividers, and carousel slides.

## Carousels

Use `::: carousel` with `---` between slides:

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

Auto-advances every 5 seconds. Pauses after manual interaction. Shows navigation dots and prev/next buttons.

## Blockquotes

Standard prefix syntax:

```
> Single line quote
> Continues here
```

Fenced block quote without prefix:

```
>>>
Everything after this marker is quoted
until the closing marker.
No need to prefix every line.
>>>
```

## Testimonials

Use `::: quote` for testimonial blocks:

```
::: quote
★★★★★
The best experience we've ever had.
— **Maria S.**
:::
```

Multiple quotes placed consecutively form a testimonial row.

## Cards

Use `::: card` inside columns for styled content blocks:

```
|||
::: card
### Project Title
Description of the project.
:::
---
::: card
### Another Project
Description here.
:::
|||
```

Cards are styled by the theme's `cards` setting: `elevated`, `bordered`, `flat`, or `glass`.

## Forms

Wrap fields in a `::: form` block:

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

Field types: `{text}`, `{email}`, `{paragraph}`, `{number}`, `{date}`, `{file}`, `{checkbox}`, `{Option1 / Option2 / Option3}`.

Mark required fields with `*` after the label. Blank lines create visual field groups.

## Code Blocks

Fenced code blocks with optional syntax highlighting:

````
```
Plain code block
```

```javascript
const x = 42;
```
````

## Alerts

```
::: warning
Important information here.
:::
```

Types: `warning`, `info`, `success`, `error`, `note`, `tip`.

## Expandable Sections

```
>| How do I return an item?
   You have 30 days to return any item.
   Just bring your receipt to the store.
```

`>|` starts a collapsible block. First line is the summary, indented lines are hidden content.

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

## Raw HTML

HTML tags pass through to output as-is, per standard Markdown behavior:

```
This has a <span style="color: red">red word</span> in it.
```

Use for edge cases where Supermarkdown syntax doesn't cover your need.

## Navigation

`header.md` becomes the nav bar on every page:

```
# Site Name
- [Home](index.md)
- [About](about.md)
- [Contact](index.md#contact)
```

`footer.md` becomes the footer on every page. Both support links to pages and heading anchors.

## Theme Configuration

|||

### Colors

- `primary` — main brand color
- `accent` — secondary highlight
- `background` — page background
- `surface` — card/panel background
- `text` — body text color
- `textMuted` — secondary text
- `border` — divider color

---

### Layout

- `radius` — border radius (0–20)
- `mode` — `light` or `dark`
- `nav` — `transparent`, `minimal`, `solid`
- `sections` — `alternating`, `clean`, `bold`
- `cards` — `elevated`, `bordered`, `flat`
- `footer` — `minimal`, `centered`, `columns`
- `spacing` — `compact`, `normal`, `spacious`
- `animation` — `subtle`, `expressive`, `none`

|||

### Recommended Font Pairings

- Classic ... Playfair Display + Source Sans 3
- Modern ... Inter + Inter
- Warm ... Lora + Nunito
- Bold ... Montserrat + Open Sans
- Elegant ... Cormorant Garamond + Proza Libre
- Clean ... DM Sans + DM Sans
- Editorial ... Fraunces + Commissioner

## Compiling to Static HTML

```
node src/compile.mjs sites/mysite/ --out build/
```

Produces self-contained `.html` files with all CSS inlined, Google Fonts loaded, navigation baked in, and `.md` links rewritten to `.html`. Ready to deploy anywhere — GitHub Pages, Netlify, S3, or any static host.

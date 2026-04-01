---
title: Guide — Kite Pages
description: Complete reference for every Kite Pages feature with live examples
---

# Guide

{:toc}

## Text Formatting

Kite Pages supports all standard Markdown inline formatting plus several extensions.

| Syntax | Result | Type |
|--------|--------|------|
| Syntax | Result | Type |
|--------|--------|------|
| `**bold**` | **bold** | CommonMark |
| `*italic*` | *italic* | CommonMark |
| `_underline_` | _underline_ | Kite Pages |
| `~~strikethrough~~` | ~~strikethrough~~ | GFM |
| `==highlight==` | ==highlight== | markdown-it-mark |
| `++large text++` | ++large++ | Kite Pages |
| `^superscript^` | x^2^ | Pandoc |
| `~subscript~` | H~2~O | Pandoc |
| `[[Key]]` | [[Ctrl]] | Kite Pages |

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

Cards inside columns are automatically centered -- headings, text, and images all center-align for balanced grid layouts. Images inside column cards use `object-fit: contain` so logos and icons display without cropping.

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
Kite Pages files are standard Markdown. They render (less richly) in any Markdown viewer.
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
// Compile a Kite Pages site
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

## Keyboard Shortcuts

Use double square brackets to render styled keyboard keys:

Press [[⌘]] + [[K]] to open the launcher.

Use [[Ctrl]] + [[Shift]] + [[P]] for the command palette.

```
Press [[⌘]] + [[K]] to open the launcher.
Use [[Ctrl]] + [[Shift]] + [[P]] for the command palette.
```

## Tabs

Group content into switchable tabs. Each tab is a `::: tab Name` block inside `::: tabs`, separated by `---`:

::: tabs
::: tab Markdown
```
## Hello World
This is **Kite Pages**.
```
:::
---
::: tab HTML Output
```html
<section class="kp-section">
  <h2>Hello World</h2>
  <p>This is <strong>Kite Pages</strong>.</p>
</section>
```
:::
---
::: tab Theme
```yaml
colors:
  primary: "#3d6b42"
  accent: "#c9a84c"
fonts:
  heading: Playfair Display
  body: Inter
```
:::
:::

```
::: tabs
::: tab Monthly
### $12/mo
Features list...
:::
---
::: tab Annual
### $8/mo (save 33%)
Features list...
:::
:::
```

## Featured Columns

Add `{featured}` to a heading inside columns to highlight that column as the recommended option. Useful for pricing tables:

|||
### Basic
- 5 projects
- 1 GB storage
- Email support

[Get Started](#)
---
### Pro {featured}
- Unlimited projects
- 100 GB storage
- Priority support
- Custom domain

++$12/mo++

[Start Free Trial](#)
---
### Enterprise
- Everything in Pro
- SSO & SAML
- Dedicated support
- Custom SLA

[Contact Sales](#)
|||

```
|||
### Basic
- 5 projects
- Email support

[Get Started](#)
---
### Pro {featured}
- Unlimited projects
- Priority support

++$12/mo++

[Start Free Trial](#)
---
### Enterprise
- Everything in Pro
- Dedicated support

[Contact Sales](#)
|||
```

## Stats Bar

When every column starts with a `++stat++` heading, the columns auto-detect as a stats bar with large centered numbers:

|||
### ++25,000++
Active users worldwide
---
### ++99.9%++
Uptime guarantee
---
### ++4.9/5++
Average rating
|||

```
|||
### ++25,000++
Active users worldwide
---
### ++99.9%++
Uptime guarantee
---
### ++4.9/5++
Average rating
|||
```

## Image Presentation

Add attributes to images for special display treatments:

### Showcase

`![](app.png){showcase}` -- large shadow and rounded corners, ideal for product screenshots. Capped at 70% viewport height so it never overwhelms the page.

### Browser Frame

`![](app.png){frame}` -- wraps the image in a browser window chrome with title bar dots.

### Phone Frame

`![](app.png){phone}` -- wraps the image in a mobile device frame.

### Avatar

`![](photo.jpg){avatar}` -- 64px circular image with accent-colored border. Works both as a standalone block image and inline next to text, ideal for testimonial attributions:

```
::: quote
Great experience working with this team.

![Name](photo.jpg){avatar} -- **Name**, Title
:::
```

```
![Dashboard](dashboard.png){showcase}
![Web App](webapp.png){frame}
![Mobile](mobile.png){phone}
![Team Member](photo.jpg){avatar}
```

### Image Sizing

Use `=WIDTHxHEIGHT` to constrain image dimensions. Width and height are applied as `max-width` and `max-height`, so the image scales down but never stretches beyond its natural size:

```
![Logo](logo.png =200x)        -- max 200px wide, height auto
![Banner](hero.jpg =x400)       -- max 400px tall, width auto
![Thumb](pic.jpg =300x200)      -- max 300px wide, max 200px tall
```

Sizing combines with attributes: `![App](app.png =800x){showcase}`

### Inline Images

Images can appear inline within paragraphs. Useful for small icons or avatar photos next to text:

```
![avatar](photo.jpg){avatar} -- **Name**, Company
```

## Video Backgrounds

Use a video file instead of an image in `::: bg` for a video background. The video will autoplay, loop, and be muted:

```
::: bg hero.mp4
# Welcome to Our Platform
The future of content creation.
:::
```

Supports `.mp4`, `.webm`, `.ogg`, and `.mov` files.

## Heading Attributes

Any heading can have attributes in curly braces at the end:

```
### Pro Plan {featured}
## Dashboard {bg=#e8f0fe}
```

Attributes are key=value pairs or bare flags separated by spaces. Currently supported: `{featured}` on column headings.

## Footer Columns

Use `|||` columns inside `footer.md` for a multi-column footer with section headers:

```
# Brand Name

|||
### Product
- [Features](#)
- [Pricing](#)
---
### Company
- [About](#)
- [Blog](#)
---
### Legal
- [Terms](#)
- [Privacy](#)
|||

(c) 2025 Brand Name
```

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

### Nav Logo

Use an image in the header H1 to display a logo instead of text in the navigation bar:

```
# ![Brand Name](logo.svg)

- [Features](features.md)
- [Pricing](pricing.md)
```

The logo image is automatically constrained to 32px height and displayed without border radius.

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

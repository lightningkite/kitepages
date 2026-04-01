---
title: Kite Pages — Content In, Website Out
description: A Markdown superset that turns plain text into polished, responsive websites. No HTML, no CSS, no breakpoints.
---

# Kite Pages

Write content. Get a website. No HTML, no CSS, no breakpoints.

[Read the Guide](guide.md) — [See Examples](examples.md)

## The Problem

Making a website still means choosing between bad options.

|||

::: card
### Website Builders
Drag-and-drop every element. Resize. Check mobile. Adjust. The result is a layout, not a document.
:::

---

::: card
### Writing Code
Total control, but the barrier is a programming career. Hours fighting flexbox and media queries for a simple page.
:::

---

::: card
### Markdown Tools
Great for blogs, but they stop at text. Need columns, a hero image, or a contact form? Back to HTML templates.
:::

|||

## The Solution

What if you just described your site -- and the layout figured itself out?

|||

### Content Implies Layout
Write two lists under subheadings. The renderer puts them in columns on wide screens and stacks them on mobile. You never specify `display: grid`.

---

### Readable Source
A restaurant owner can find `- Bruschetta ... $8`, change it to `$9`, and save. No risk of breaking layout.

---

### AI-Native Format
An LLM can produce a complete site in 60 lines of plain text -- and another LLM can edit it months later without understanding a layout engine.

|||

## Feature Highlights

> [!TIP]
> Every feature below is built into Kite Pages. No plugins, no configuration.

|||

::: card
### Responsive Columns
Fenced `|||` columns or `| ` prefix columns. Auto-stack on mobile.
:::

---

::: card
### Carousels
`::: carousel` with `---` between slides. Auto-play, prev/next, dot indicators.
:::

---

::: card
### Forms
`::: form` with `{text}`, `{email}`, `{date}`, `{select}` fields. Validation built in.
:::

---

::: card
### Tables
Standard Markdown `| col | col |` syntax with alignment support.
:::

|||

|||

::: card
### Theming
One `theme.yaml` controls colors, fonts, spacing, and style site-wide.
:::

---

::: card
### Syntax Highlighting
Fenced code blocks with language annotation. Theme-aware colors.
:::

---

::: card
### Math Formulas
LaTeX math with `\( inline \)` and `\[ block \]`. KaTeX rendering.
:::

---

::: card
### Smart Typography
Curly quotes, em dashes, ellipsis, (c), (tm) -- all automatic.
:::

|||

|||

::: card
### Tabs
`::: tabs` with named `::: tab` children. Monthly/Annual pricing toggles, code/preview switches.
:::

---

::: card
### Keyboard Shortcuts
`[[⌘]] + [[K]]` renders as styled key caps. Perfect for developer tools and documentation.
:::

---

::: card
### Featured Columns
Mark a pricing column with `{featured}` for a highlighted "Recommended" badge and visual emphasis.
:::

---

::: card
### Stats Bar
Columns with `++stat++` headings auto-detect as large, centered metrics. No extra markup needed.
:::

|||

|||

::: card
### Image Showcase
`{showcase}`, `{frame}`, and `{phone}` attributes wrap images in shadows, browser chrome, or device frames.
:::

---

::: card
### Video Backgrounds
`::: bg hero.mp4` creates full-bleed video backgrounds -- autoplay, muted, looping.
:::

---

::: card
### Footer Columns
Use `|||` columns in `footer.md` for proper multi-column footers with section headers.
:::

---

::: card
### Testimonial Carousels
Wrap `::: quote` blocks in `::: carousel` for a rotating testimonial slider with navigation.
:::

|||

## What It Looks Like

|||

### The Source

```
## Our Menu

|||
### Appetizers
- Bruschetta ... $8
- Calamari ... $12
---
### Entrees
- Pizza ... $14
- Linguine ... $18
|||

::: form
Name*: {text}
Email*: {email}
[Reserve](POST /book)
:::
```

---

### What You Get

Columns with dot-leader pricing. A styled reservation form. Responsive layout. Themed to your brand. All from readable text.

- [x] No HTML
- [x] No CSS
- [x] No breakpoints
- [x] No JavaScript
- [ ] No limits

|||

## Before and After

| Scenario | Without | With Kite Pages |
|----------|---------|-------------------|
| Small business needs a site | Pay a developer | Describe it in a text file |
| AI generates a site | 400+ lines of HTML | 60 lines of .md |
| Client changes hours | Call the developer | Edit one line |
| Rebrand the site | Touch dozens of CSS rules | Change 4 values in theme.yaml |
| Add a new page | Clone a template | Create a new .md file |

## Get Started

|||

### 1. Create Your Files

Write `index.md`, `header.md`, `footer.md`, and `theme.yaml` in a folder.

---

### 2. Add a Theme

Set colors, fonts, and style in one YAML file.

---

### 3. Compile

Run `node src/compile.mjs your-site/ --out build/` and deploy anywhere.

|||

[Read the Guide](guide.md) — [See Examples](examples.md)

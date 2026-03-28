---
title: Supermarkdown — Content In, Website Out
description: A content-driven web format where you write what you want to show and the renderer figures out the layout. No HTML, no CSS, no breakpoints.
---

# Supermarkdown

Write content. Get a website. No HTML, no CSS, no breakpoints.

## The Problem

Making a website still means choosing between bad options.

|||

::: card
### Website Builders
Drag and drop every element. Resize it. Check mobile. Adjust again. The result is a layout, not a document — you can't read it, diff it, or generate it.
:::

---

::: card
### Writing Code
Total control, but the barrier is a programming career. Even experienced developers spend hours fighting flexbox and media queries for a simple marketing page.
:::

---

::: card
### Markdown Tools
Great for blogs, but they stop at text. Need columns, a hero image, or a contact form? You're back to writing HTML templates.
:::

|||

## The Idea

What if you just described your site — and the layout figured itself out?

|||

### Content Implies Layout
Write two matching lists under subheadings. The renderer puts them in columns on wide screens and stacks them on mobile. You never specify `display: grid` or `@media (max-width: 768px)`.

---

### Readable Source
A restaurant owner can open their `.md` file, find `- Bruschetta ... $8`, change it to `$9`, and save. No risk of breaking layout.

---

### AI-Native Format
An LLM can produce a complete site in a few hundred lines of plain text — and another LLM can make targeted edits without understanding a layout engine.

|||

## What It Looks Like

A full restaurant page in Supermarkdown:

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

## Reservations

::: form
Name*: {text}
Email*: {email}
Date*: {date}

[Reserve](POST /book)
:::
```

---

### What You Get

Columns with dot-leader pricing. A styled reservation form with validation. Responsive layout. Themed to your brand. All from 20 lines of readable text.

No `<div>`. No `class="flex justify-between"`. No `@media` queries. Just content.

|||

## How It Works

|||

### Write .md Files
One file per page. Standard markdown plus a few extensions for columns, forms, and sections.

---

### Add a Theme
One `theme.yaml` controls colors, fonts, and style site-wide. Rebrand by changing a few values.

---

### Compile or Serve
Use the renderer in the browser for live editing, or compile to static HTML for production hosting.

|||

## Key Features

|||

::: card
### Responsive by Default
No breakpoints. The renderer adapts because it understands the content's intent, not just its pixels.
:::

---

::: card
### Theming Separated from Content
Colors, fonts, corner radius, section styles — all in one YAML file. Change the theme without touching a single page.
:::

---

::: card
### Multi-Page Navigation
Add `header.md` and `footer.md` to get consistent navigation across every page, with smooth animated transitions.
:::

---

::: card
### Built-In Components
Carousels, forms, testimonials, cards, galleries, price menus, background sections, alerts — all from simple text syntax.
:::

|||

## Before & After

|||

### Without Supermarkdown

- Small business needs a site ... Pay a developer
- AI generates a marketing site ... 400+ lines of HTML nobody can maintain
- Client changes their hours ... Call the developer
- Rebrand the site ... Touch dozens of CSS rules
- Add a new page ... Clone a template and rewire navigation

---

### With Supermarkdown

- Small business needs a site ... Describe it in a text file
- AI generates a marketing site ... 60 lines anyone can read and edit
- Client changes their hours ... Edit one line
- Rebrand the site ... Change 4 values in theme.yaml
- Add a new page ... Create a new .md file

|||

[Read the Guide](guide.md) — [See Examples](examples.md)

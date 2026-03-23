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

Supermarkdown (`.smd`) is a format where:

- **Content implies layout.** You write a heading, a paragraph, and three images. The renderer knows that's a hero section with a gallery. You write two matching lists under subheadings. The renderer puts them in columns. You never specify `display: grid` or `@media (max-width: 768px)`.

- **The source is readable.** A restaurant owner can open their `.smd` file, find `- Bruschetta ... $8`, change it to `$9`, and save. No risk of breaking layout. No hunting through nested `<div>`s.

- **AI can generate *and* maintain it.** An LLM can produce a complete site in a few hundred lines of plain text — and a different LLM (or the same one, months later) can make targeted edits without understanding a layout engine. The format is small, semantic, and unambiguous.

- **Theming is separate from content.** One `theme.json` controls colors, fonts, and style across every page. Rebrand the entire site by changing a few values. The renderer handles contrast, spacing, and responsiveness.

- **Responsive by default.** There are no breakpoints. The renderer adapts because it understands the content's *intent* — parallel sections become columns on wide screens and stack on narrow ones. The author tests on zero screen sizes.

### The value proposition, concretely

| Scenario | Without Supermarkdown | With Supermarkdown |
|---|---|---|
| Small business needs a website | Pay a developer or wrestle with a builder | Describe your business in a text file |
| AI generates a marketing site | 400+ lines of HTML/CSS that nobody can maintain | 60 lines of `.smd` that anyone can read and edit |
| Client wants to change their hours | Call the developer or risk breaking the template | Edit one line of text |
| Rebrand (new colors, new fonts) | Touch dozens of CSS rules | Change 4 values in `theme.json` |
| Add a new page | Clone a template, rewire navigation, match styling | Create a new `.smd` file; header/footer are automatic |

## What it looks like

A complete restaurant page:

```
---
title: Giuseppe's Italian Restaurant
description: Authentic Italian cuisine in downtown Portland since 1985
---

>>>
::: bg restaurant.jpg
# Giuseppe's Italian Restaurant
Authentic cuisine in downtown Portland. Family owned since 1985.
:::
>>>

## Our Menu

|||>

### Appetizers
- Bruschetta ... $8
- Calamari Fritti ... $12

|||

### Entrees
- Margherita Pizza ... $14
- Linguine alle Vongole ... $18

|||<

## Hours & Location

|||>

### Hours
Monday–Friday: 11am–10pm
Saturday: 10am–11pm

|||

### Find Us
123 Main Street
Portland, OR 97201

|||<

## Reservations

::: form
Name*: <text>
Email*: <email>
Date*: <date>
Party size*: <1 / 2 / 3-4 / 5-6 / 7+>

[Reserve a Table](POST /reservations)
:::
```

That's the entire page. The renderer produces a responsive site with a hero carousel, columnar menu, contact info, and a working reservation form — styled by `theme.json`.

## Project structure

```
supermarkdown/
├── design/          Design specs and principles
├── prototype/       Renderer (HTML + JS) and example files
├── sites/           Complete example sites
│   ├── giuseppe/    Restaurant (multi-page)
│   ├── nonprofit/   Land trust
│   ├── portfolio/   Designer portfolio
│   ├── salon/       Hair salon
│   └── wedding/     Wedding site
├── scripts/         Screenshot generation tooling
├── screenshots/     Rendered screenshots at multiple viewport sizes
└── docs/            User-facing documentation
```

## Getting started

See [docs/guide.md](docs/guide.md) for the complete guide to building a site with Supermarkdown.

## Status

Supermarkdown is a working prototype. The renderer handles heroes, columns, carousels, background sections, testimonials, forms, cards, record blocks, navigation, page transitions, scroll animations, and theming. Five complete example sites demonstrate the format across different verticals.

# Supermarkdown: The Complete Guide

Supermarkdown (`.smd`) is a content-driven web design format. You write what you want to show — the renderer figures out the layout. No HTML, no CSS, no breakpoints. Just content.

This guide covers everything you need to build a site.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [How It Works](#how-it-works)
3. [Site Structure](#site-structure)
4. [Page Anatomy](#page-anatomy)
5. [Text & Formatting](#text--formatting)
6. [Headings & Sections](#headings--sections)
7. [Images & Galleries](#images--galleries)
8. [Columns](#columns)
9. [Lists & Price Menus](#lists--price-menus)
10. [Background Sections](#background-sections)
11. [Carousels](#carousels)
12. [Testimonials & Quotes](#testimonials--quotes)
13. [Cards](#cards)
14. [Record Blocks](#record-blocks)
15. [Forms](#forms)
16. [Alerts & Admonitions](#alerts--admonitions)
17. [Expandable Sections](#expandable-sections)
18. [Navigation (Header & Footer)](#navigation-header--footer)
19. [Links & Buttons](#links--buttons)
20. [Theme Configuration](#theme-configuration)
21. [Examples by Site Type](#examples-by-site-type)
22. [Tips & Best Practices](#tips--best-practices)

---

## Quick Start

Create a folder for your site with three files:

```
mysite/
├── index.smd       ← your home page
├── header.smd      ← navigation bar (shared across pages)
├── footer.smd      ← footer (shared across pages)
└── theme.json      ← colors, fonts, style
```

**index.smd:**

```
---
title: My Site
description: A short description for search engines
---

::: bg https://example.com/hero.jpg
# Welcome to My Site
We make great things happen.
:::

## About Us

We're a small team with big ideas.

## Contact

::: form
Name*: <text>
Email*: <email>
Message: <paragraph>

[Send](POST /contact)
:::
```

**header.smd:**

```
# My Site

- [Home](index.smd)
- [About](about.smd)
- [Contact](index.smd#section-2)
```

**footer.smd:**

```
# My Site

- [Home](index.smd)
- [About](about.smd)

hello@mysite.com
(555) 123-4567
```

**theme.json:**

```json
{
  "colors": {
    "primary": "#2d5a27",
    "accent": "#e8a435",
    "background": "#faf9f6",
    "surface": "#ffffff",
    "text": "#2d2d2d"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Source Sans 3"
  },
  "radius": 10,
  "mode": "light"
}
```

Open in a browser via the renderer:

```
renderer.html?file=mysite/index.smd&theme=mysite/theme.json
```

That's it. You have a responsive, styled website.

---

## How It Works

Supermarkdown follows one core principle: **content implies layout**.

You describe *what* you want to show. The renderer determines *where* it goes based on the structure of your content, the viewer's screen size, and a set of smart layout rules.

For example:
- Three images in a row? That's a gallery.
- Two sections with matching structure? Those become side-by-side columns on wide screens.
- A heading followed by a big image? That's a hero banner.
- A short address and phone number? Pack them compactly.

You never write CSS or choose between flex and grid. The renderer does that for you.

---

## Site Structure

A Supermarkdown site is a folder of `.smd` files plus one `theme.json`.

```
mysite/
├── index.smd          ← home page (required)
├── about.smd          ← additional pages
├── menu.smd
├── contact.smd
├── header.smd         ← persistent navigation (optional but recommended)
├── footer.smd         ← persistent footer (optional but recommended)
├── theme.json         ← visual theme (optional, uses defaults)
└── images/            ← any static assets
    ├── logo.png
    └── team.jpg
```

- Each `.smd` file is one page.
- `header.smd` and `footer.smd` are special — they appear on every page automatically.
- `theme.json` controls colors, fonts, and style options site-wide.
- Images can be local paths or full URLs.

---

## Page Anatomy

Every `.smd` page has two parts: an optional **frontmatter** block and the **content**.

```
---
title: Page Title
description: A sentence for search engines and social sharing
image: preview-image.jpg
---

Content goes here.
```

### Frontmatter

The `---` fenced block at the top is YAML metadata:

| Field         | Purpose                                         |
|---------------|--------------------------------------------------|
| `title`       | Page title (appears in browser tab, search results) |
| `description` | Short description for SEO and social media previews |
| `image`       | Preview image for social sharing (og:image)       |

Frontmatter is optional. If omitted, the renderer uses the first `#` heading as the title.

---

## Text & Formatting

Supermarkdown uses standard Markdown formatting:

```
Regular text becomes a paragraph.

**Bold text** for emphasis.

*Italic text* for softer emphasis.

***Bold italic*** for strong emphasis.

__Large text__ for callout numbers or stats.

_Underlined text_ for subtle highlighting.

[Link text](https://example.com) for hyperlinks.
```

**Rendered as:**
- `**bold**` → **bold**
- `*italic*` → *italic*
- `***bold italic***` → ***bold italic***
- `__large text__` → displayed larger (great for statistics like `__12,847__`)
- `_underline_` → underlined text
- `[text](url)` → clickable link

### Paragraphs

Blank lines separate paragraphs. Single line breaks within a paragraph are treated as soft breaks.

---

## Headings & Sections

Headings define the structure of your page. The renderer uses heading level to determine layout:

```
# Page Title                  ← Level 1: hero/page-level section
## Section                    ← Level 2: major content section
### Subsection                ← Level 3: group within a section
#### Label                    ← Level 4: inline subheading
```

### How headings affect layout

| Level | Role | Visual treatment |
|-------|------|------------------|
| `#`   | Page hero | Large, prominent, potentially full-screen |
| `##`  | Section divider | Creates a visual boundary with spacing; sections get alternating backgrounds |
| `###` | Subsection | Groups within a section; candidates for column layout |
| `####`| Inline label | No structural weight, just a styled subheading |

Each `##` heading starts a new visual section. If your theme uses alternating section backgrounds, every other `##` section gets a tinted background.

### Anchor links

You can link to specific sections by number: `index.smd#section-2` links to the second `##` section on the page.

---

## Images & Galleries

Images use standard Markdown syntax:

```
![Alt text](image-url.jpg)
```

### Automatic gallery behavior

The renderer detects consecutive images and creates a gallery:

```
![Photo one](one.jpg)
![Photo two](two.jpg)
![Photo three](three.jpg)
```

Layout depends on count:
- **1 image** → full width
- **2 images** → side by side
- **3 images** → triptych or 1 large + 2 small
- **4+ images** → responsive grid

On narrow screens, galleries collapse to stacked or carousel.

Images always use lazy loading for performance.

---

## Columns

Use the column fence `|||>` ... `|||` ... `|||<` to explicitly group content side-by-side:

```
|||>

### Column 1
Content here

|||

### Column 2
Content here

|||

### Column 3
Content here

|||<
```

- `|||>` opens the column group
- `|||` separates columns
- `|||<` closes the column group

On wide screens, columns sit side by side. On narrow screens, they stack vertically. You don't need to worry about responsiveness — it happens automatically.

### When to use columns

Columns are perfect for:
- Comparing categories (menu sections, service tiers)
- Side-by-side info blocks (hours + location + parking)
- Card grids (team members, projects, campaigns)
- Wine lists, feature comparisons, any parallel content

### Example: Hours & Location

```
|||>

### Hours
Monday–Friday: 11am–10pm
Saturday: 10am–11pm
Sunday: 10am–9pm

|||

### Location
123 Main Street
Portland, OR 97201
(503) 555-0142

|||

### Parking
Free street parking available.
Lot behind the building.

|||<
```

---

## Lists & Price Menus

Standard lists:

```
- Item one
- Item two
- Item three
```

### Dot leader lists (menus, pricing)

Use `...` between an item and its price to create a dot-leader layout:

```
- Bruschetta ... $8
- Calamari Fritti ... $12
- Caprese Salad ... $10
```

The renderer automatically spaces the item name and price with a dotted leader line between them — perfect for restaurant menus, service pricing, or any item-price pair.

### Star ratings

Use Unicode stars for ratings:

```
★★★★★
★★★★☆
★★★☆☆
```

These get styled automatically and are commonly used in testimonials.

---

## Background Sections

Create a full-bleed section with a background image and overlaid text:

```
::: bg https://example.com/hero-photo.jpg
# Big Heading
Subtitle text overlaid on the image.
:::
```

- `::: bg <image-url>` opens the section
- `:::` closes it
- Text inside is rendered on top of the image with proper contrast

Background sections are commonly used for:
- Hero banners at the top of a page
- Section dividers with dramatic imagery
- Carousel slides (see [Carousels](#carousels))

---

## Carousels

`>>>` separates carousel slides. Content between dividers is one slide.

```
>>>
::: bg hero1.jpg
# Welcome
Subtitle for slide one.
:::
>>>
::: bg hero2.jpg
# Fresh Ingredients
Subtitle for slide two.
:::
>>>
::: bg hero3.jpg
# The Patio
Subtitle for slide three.
:::
>>>
```

Carousels:
- Auto-advance every 5 seconds
- Pause for 10 seconds after a manual click
- Show dot indicators and prev/next buttons
- Can contain any content, not just background sections

---

## Testimonials & Quotes

Use `::: quote` for testimonial/quote blocks:

```
::: quote
★★★★★
The best Italian food outside of Italy. The osso buco melts in your mouth.
— **Maria S.**
:::
```

Multiple quotes placed consecutively create a testimonial row or carousel depending on screen size.

Pattern for a testimonial:
1. Star rating (optional)
2. Quote text
3. Attribution with `—` dash and **bold name**

---

## Cards

Use `::: card` inside columns for card-style content blocks:

```
|||>

::: card
### Project Title
2024
Description of the project and what you did.
:::

|||

::: card
### Another Project
2023
Description of this project.
:::

|||<
```

Cards get styled with the theme's card style (`elevated`, `bordered`, or `flat`) and work great for:
- Team member profiles
- Project portfolios
- Campaign or initiative summaries
- Event schedules

---

## Record Blocks

For structured data (like a product catalog or directory), use record blocks:

```
:: Pizza Margherita
   Price: $14
   Our famous thin crust with San Marzano tomatoes and fresh mozzarella.

:: Calamari Fritti
   Price: $12
   Lightly fried with lemon aioli and marinara sauce.
```

- `::` starts each record
- `Key: value` lines are named fields
- Plain indented text is the description

The renderer automatically picks the best presentation:
- **Wide screen + many records with uniform fields** → table
- **Narrow screen or rich content** → cards
- **Very short records** → compact list

---

## Forms

Wrap form fields in a `::: form` block:

```
::: form
Name*: <text>
Email*: <email>
Phone: <text>

Preferred date*: <date>
Party size*: <1 / 2 / 3-4 / 5-6 / 7+>

Dietary needs: <None / Vegetarian / Vegan / Gluten-free / Other>
Special requests: <paragraph>

[Submit](POST /reservations)
:::
```

### Field types

| Syntax | Renders as |
|--------|-----------|
| `<text>` | Single-line text input |
| `<email>` | Email input with validation |
| `<paragraph>` | Multi-line textarea |
| `<number>` | Numeric input |
| `<date>` | Date picker |
| `<file>` | File upload |
| `<checkbox>` | Boolean toggle |
| `<option1 / option2 / option3>` | Dropdown or radio selection |

### Required fields

Add `*` after the label to mark a field as required:

```
Name*: <text>     ← required
Phone: <text>     ← optional
```

### Field grouping

Blank lines within a form create visual groups. Fields in the same group may render side-by-side on wide screens:

```
::: form
First name*: <text>
Last name*: <text>

Email*: <email>

[Submit](POST /signup)
:::
```

Here, "First name" and "Last name" are grouped together and may render in a row.

### Form submission

The button at the bottom determines how the form submits:

```
[Send](POST /contact)           ← POST to /contact
[Delete](DELETE /item/123)      ← DELETE request
```

---

## Alerts & Admonitions

Use fenced sections with a type keyword:

```
::: warning
Don't forget your receipt for returns!
:::

::: info
Free shipping on orders over $50.
:::

::: success
Your reservation has been confirmed.
:::

::: error
Payment could not be processed.
:::
```

These render as styled callout boxes with appropriate colors.

---

## Expandable Sections

For FAQ-style collapsible content:

```
>| How do I return an item?
   You have 30 days to return any item.
   Just bring your receipt to the store.

>| What are your hours?
   Monday–Friday: 9am–6pm
   Saturday: 10am–4pm
   Sunday: Closed
```

- `>|` starts a collapsible block
- The first line is the visible summary/question
- Indented lines are the hidden content revealed on click

---

## Navigation (Header & Footer)

### header.smd

The header appears at the top of every page as a navigation bar.

```
# Site Name

- [Home](index.smd)
- [Menu](menu.smd)
- [About](about.smd)
- [Contact](index.smd#section-3)
```

The `#` heading becomes the site name/logo. List items become nav links. On narrow screens, the nav collapses into a mobile menu.

### footer.smd

The footer appears at the bottom of every page.

```
# Site Name

- [Home](index.smd)
- [Menu](menu.smd)
- [About](about.smd)

123 Main Street, Portland, OR 97201
(503) 555-0142
info@example.com
```

The heading, links, and plain text are arranged according to the theme's `footer` setting (`minimal`, `centered`, or `columns`).

### Page transitions

When a visitor clicks an `.smd` link, the page transitions smoothly without a full reload. The browser's back/forward buttons work normally.

---

## Links & Buttons

### Standard links

```
[Link text](https://example.com)
[Another page](about.smd)
[Section link](index.smd#section-2)
```

### Links as call-to-action buttons

Links placed alone on a line (not in a paragraph) render as styled buttons:

```
[View Full Menu](menu.smd)
```

Multiple links on one line create a button row:

```
[About Us](about.smd) — [View Full Menu](menu.smd)
```

### HTTP method links (for forms)

```
[Send](POST /contact)
[Delete](DELETE /item/123)
```

---

## Theme Configuration

The `theme.json` file controls the visual identity of your entire site.

### Full example

```json
{
  "colors": {
    "primary": "#1a3a1a",
    "primaryDark": "#0d2b0d",
    "primaryLight": "#d4e8d4",
    "accent": "#c9a84c",
    "background": "#f7f5f0",
    "surface": "#ffffff",
    "surfaceWarm": "#efe9de",
    "text": "#2a2a25",
    "textMuted": "#6b6b60",
    "border": "#e0ddd4",
    "borderLight": "#edebe4"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Source Sans 3"
  },
  "radius": 12,
  "radiusLg": 20,
  "mode": "light",
  "nav": "transparent",
  "sections": "alternating",
  "cards": "elevated",
  "animation": "expressive",
  "footer": "centered",
  "spacing": "spacious"
}
```

### Colors

| Key | Purpose | Tip |
|-----|---------|-----|
| `primary` | Main brand color (nav, buttons, accents) | Pick your strongest brand color |
| `primaryDark` | Darker variant (hover states, nav background) | Usually 1-2 shades darker than primary |
| `primaryLight` | Lighter variant (highlights, badges) | A tint of the primary |
| `accent` | Secondary highlight color (links, decorations) | Should contrast with primary |
| `background` | Page background | Usually near-white or near-black |
| `surface` | Card/panel background | White for light mode, dark gray for dark |
| `surfaceWarm` | Alternating section background | A warm-tinted variant of surface |
| `text` | Body text color | Must contrast with background (WCAG AA) |
| `textMuted` | Secondary text (captions, timestamps) | Lighter/darker than text |
| `border` | Borders and dividers | Subtle, near background color |
| `borderLight` | Lighter border variant | Even more subtle |

The renderer **enforces WCAG AA contrast**. If your color choices don't have enough contrast, the renderer adjusts automatically.

### Fonts

```json
"fonts": {
  "heading": "Playfair Display",
  "body": "Source Sans 3"
}
```

Fonts are loaded from Google Fonts automatically. You don't need to import anything.

#### Recommended font pairings

| Style | Heading | Body |
|-------|---------|------|
| Classic | Playfair Display | Source Sans 3 |
| Modern | Inter | Inter |
| Warm | Lora | Nunito |
| Bold | Montserrat | Open Sans |
| Elegant | Cormorant Garamond | Proza Libre |
| Clean | DM Sans | DM Sans |
| Editorial | Fraunces | Commissioner |

### Layout options

| Key | Values | Effect |
|-----|--------|--------|
| `radius` | `0`–`20+` | Border radius for small elements (buttons, inputs). 0 = sharp, 20 = very round |
| `radiusLg` | `0`–`20+` | Border radius for larger elements (cards, images) |
| `mode` | `"light"`, `"dark"` | Color mode |
| `nav` | `"transparent"`, `"minimal"`, `"solid"` | Navigation bar style |
| `sections` | `"alternating"`, `"clean"`, `"bold"` | Section background pattern |
| `cards` | `"elevated"`, `"bordered"`, `"flat"` | Card styling (shadows, borders, or none) |
| `animation` | `"subtle"`, `"expressive"`, `"none"` | Scroll-in animation intensity |
| `footer` | `"minimal"`, `"centered"`, `"columns"` | Footer layout |
| `spacing` | `"compact"`, `"normal"`, `"spacious"` | Section padding |

### What you DON'T control

The renderer handles these automatically based on content:
- Font sizes and weights
- Element spacing and margins
- Shadow depth
- Layout behavior and breakpoints
- Animation timing

This is intentional — it means your site always looks balanced and professional.

### Minimal theme

You don't need to specify every option. A minimal theme works fine:

```json
{
  "colors": {
    "primary": "#2d5a27",
    "accent": "#e8a435",
    "background": "#faf9f6",
    "text": "#2d2d2d"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Source Sans 3"
  },
  "mode": "light"
}
```

The renderer fills in sensible defaults for everything else.

---

## Examples by Site Type

### Restaurant

Key patterns: hero carousel, menu columns with pricing, testimonials, hours/location, reservation form.

```
---
title: Giuseppe's Italian Restaurant
description: Authentic Italian cuisine in downtown Portland since 1985
---

>>>
::: bg https://example.com/restaurant.jpg
# Giuseppe's Italian Restaurant
Authentic Italian cuisine in downtown Portland. Family owned since 1985.
:::
>>>
::: bg https://example.com/interior.jpg
# A Warm Welcome Awaits
Our dining room seats 80 guests in an intimate, candlelit atmosphere.
:::
>>>

## Our Menu

|||>

### Appetizers
- Bruschetta ... $8
- Calamari Fritti ... $12
- Caprese Salad ... $10

|||

### Entrees
- Margherita Pizza ... $14
- Linguine alle Vongole ... $18
- Osso Buco ... $24

|||

### Desserts
- Tiramisu ... $9
- Panna Cotta ... $8
- Cannoli ... $7

|||<

[View Full Menu](menu.smd)

## What Our Guests Say

::: quote
★★★★★
The best Italian food outside of Italy.
— **Maria S.**
:::

::: quote
★★★★☆
Great atmosphere and exceptional wine list.
— **James R.**
:::

## Hours & Location

|||>

### Hours
Monday–Friday: 11am–10pm
Saturday: 10am–11pm
Sunday: 10am–9pm

|||

### Find Us
123 Main Street
Portland, OR 97201
(503) 555-0142

|||<

## Make a Reservation

::: form
Name*: <text>
Email*: <email>
Date*: <date>
Party size*: <1 / 2 / 3-4 / 5-6 / 7+>
Special requests: <paragraph>

[Reserve a Table](POST /reservations)
:::
```

### Portfolio

Key patterns: name/title hero, project cards in columns, experience timeline, contact links.

```
---
title: Sarah Chen — UX Designer
description: Product designer crafting thoughtful digital experiences
---

# Sarah Chen

Product designer crafting thoughtful digital experiences.
Currently at Figma. Previously Stripe, Airbnb.

## Selected Work

|||>

::: card
### Figma Community Hub
2024
Redesigned the community browsing experience, increasing engagement by 34%.
:::

|||

::: card
### Stripe Checkout Flow
2023
Simplified merchant onboarding from 12 steps to 4. Reduced drop-off by 28%.
:::

|||<

## About

I'm a product designer who believes great software should feel obvious
in hindsight. I focus on reducing complexity without reducing capability.

## Experience

|||>

### Figma
Senior Product Designer
2023–Present

|||

### Stripe
Product Designer
2021–2023

|||<

## Get In Touch

[Email me](mailto:sarah@example.com) — [LinkedIn](https://linkedin.com)
```

### Wedding

Key patterns: hero with date/location, story section, event details in columns, schedule cards, RSVP form.

```
---
title: Emma & James — October 18, 2026
description: We're getting married! Join us in Napa Valley.
---

>>>
::: bg https://example.com/couple.jpg
# Emma & James
October 18, 2026 — Napa Valley, California
:::
>>>

## Our Story

We met at a coffee shop in San Francisco in 2019...

## The Details

|||>

### Ceremony
4:00 PM
Vineyard Terrace at Meadowood
900 Meadowood Lane, St. Helena, CA

|||

### Reception
5:30 PM — 11:00 PM
The Great Hall at Meadowood
Dinner, dancing, and far too many toasts.

|||<

## RSVP

::: form
Name*: <text>
Email*: <email>
Attending*: <Joyfully accepts / Regretfully declines>
Number of guests*: <1 / 2>
Dietary restrictions: <None / Vegetarian / Vegan / Gluten-free / Other>
Song request: <text>

[Send RSVP](POST /rsvp)
:::
```

### Nonprofit

Key patterns: hero carousel, impact stats with large numbers, campaign cards, volunteer/donate CTAs, newsletter form.

```
---
title: River Valley Land Trust
description: Protecting natural spaces since 1987
---

>>>
::: bg https://example.com/forest.jpg
# Protecting Wild Places
The Columbia River Valley's natural heritage, preserved for generations.
:::
>>>

## Our Impact

|||>

### Acres Preserved
__12,847__
acres of forests, wetlands, and meadows permanently protected.

|||

### Species Sheltered
__340+__
native species call our preserves home.

|||

### Community
__5,200+__
members and volunteers supporting conservation.

|||<

## Get Involved

|||>

### Volunteer
Trail maintenance, wildlife monitoring, and guided hikes.
[See opportunities](/volunteer)

|||

### Donate
Every dollar protects wild places. Gifts are tax-deductible.
[Make a gift](/donate)

|||<

## Stay Connected

::: form
Email*: <email>

[Subscribe to Newsletter](POST /subscribe)
:::
```

### Salon / Service Business

Key patterns: hero, service pricing columns, team cards, testimonials, location info, booking form.

```
---
title: Bloom Studio — Hair & Beauty
description: A modern salon in the heart of Austin
---

>>>
::: bg https://example.com/salon.jpg
# Bloom Studio
Where beauty meets intention. Book your transformation today.
:::
>>>

## Services

|||>

### Cuts & Styling
- Women's Haircut ... $75
- Men's Haircut ... $45
- Blowout & Style ... $55

|||

### Color
- Single Process Color ... $120
- Balayage / Highlights ... $200
- Color Correction ... $250+

|||<

## Meet the Team

|||>

::: card
### Mia Torres
Owner & Lead Stylist
15 years of experience. Specializes in balayage and lived-in color.
:::

|||

::: card
### Jade Kim
Senior Stylist
Expert in precision cuts and textured hair.
:::

|||<

## Book an Appointment

::: form
Name*: <text>
Phone*: <text>
Service*: <Haircut / Color / Balayage / Treatment / Other>
Preferred date: <date>
Notes: <paragraph>

[Request Appointment](POST /book)
:::
```

---

## Tips & Best Practices

### Content structure

- **Start with a hero.** Every page benefits from a strong opening — use a `:::bg` section or a `#` heading with a subtitle.
- **Use `##` for major sections.** Each `##` gets its own visual section with spacing and (optionally) alternating backgrounds.
- **Use `###` within columns.** Give each column a `###` heading to label it.
- **Keep it concise.** Supermarkdown is designed for content-first sites, not long-form articles. Short, clear text renders best.

### Columns

- **2-4 columns works best.** The renderer handles any number, but 2-3 is ideal for readability.
- **Matching structure looks best.** Columns with similar content (all have a heading + list, or all have a heading + paragraph) produce the cleanest layout.
- **Don't over-column.** If content doesn't naturally group in parallel, just let it flow as normal sections.

### Images

- **Use high-quality images** for background sections. They'll be displayed full-width.
- **Provide alt text** — it's good for accessibility and helps search engines.
- **Prefer URLs** for images hosted elsewhere. For local images, place them in your site folder.

### Themes

- **Start with a recommended font pairing.** They're tested and balanced.
- **Pick one strong primary color** and one accent. Don't overcomplicate the palette.
- **Use `"light"` mode** unless your brand specifically calls for dark.
- **`"alternating"` sections** add visual rhythm without effort.

### Forms

- **Mark required fields with `*`** — users see which fields matter.
- **Group related fields** with blank lines (name + email together, then date + size together).
- **Keep forms short.** Every extra field reduces completions.

### Navigation

- **Keep header links to 3-5 items.** More than that gets crowded on mobile.
- **Put the most important page link first.**
- **Use section anchors** (`page.smd#section-2`) to link directly to a section within a page.
- **Footer can have more links** — it's less space-constrained than the header.

### Multi-page sites

- **Every page gets the same header and footer** automatically.
- **Links between pages use `.smd` extensions**: `[About](about.smd)`.
- **Page transitions are animated** — visitors stay in the experience without full page reloads.
- **Each page needs its own frontmatter** with a title and description for SEO.

---

## Syntax Reference (Cheat Sheet)

```
FRONTMATTER
---
title: Page Title
description: SEO description
image: preview.jpg
---

HEADINGS
# Hero / Page Title
## Section
### Subsection
#### Label

TEXT
**bold**  *italic*  ***bold italic***
__large text__  _underline_
[link](url)

IMAGES
![alt](image.jpg)

COLUMNS
|||>
Column 1
|||
Column 2
|||<

BACKGROUND SECTION
::: bg image.jpg
# Heading
Subtitle
:::

CAROUSEL
>>>
Slide 1 content
>>>
Slide 2 content
>>>

QUOTE / TESTIMONIAL
::: quote
★★★★★
Quote text
— **Author**
:::

CARD
::: card
### Title
Content
:::

ALERTS
::: warning / info / success / error
Message
:::

RECORD BLOCKS
:: Item Name
   Field: value
   Description text

FORM
::: form
Label*: <text>
Label: <email>
Label: <paragraph>
Label: <option1 / option2>
Label: <checkbox>
Label: <date>
Label: <number>
Label: <file>

[Button](POST /endpoint)
:::

EXPANDABLE
>| Question text
   Hidden answer text

PRICE LISTS
- Item name ... $price

STAR RATINGS
★★★★★
★★★★☆

LINKS / BUTTONS
[Text](url)
[Text](page.smd)
[Text](page.smd#section-2)
[Text](POST /endpoint)
```

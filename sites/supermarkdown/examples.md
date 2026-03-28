---
title: Examples — Supermarkdown
description: See what you can build with Supermarkdown across different industries
---

# Examples

Real sites built with Supermarkdown, each from a single folder of text files.

## Restaurant

A multi-page site with hero carousel, menu pricing, testimonials, and a reservation form.

|||

### Source (index.md)

```
::: carousel
::: bg restaurant.jpg
# Giuseppe's
Authentic Italian since 1985.
:::
:::

## Menu
|||
### Appetizers
- Bruschetta ... $8
- Calamari ... $12
---
### Entrees
- Pizza ... $14
- Linguine ... $18
|||

## What Guests Say
::: quote
★★★★★
The best Italian outside of Italy.
— **Maria S.**
:::
```

---

### What You Get

A responsive site with:
- Auto-rotating hero carousel with prev/next controls
- Three-column menu with dot-leader pricing
- Styled testimonial cards with star ratings
- Alternating section backgrounds
- Reservation form with date picker and party size

Theme: forest green + warm gold, Playfair Display headings.

3 pages, 1 theme file, 0 lines of CSS.

|||

## Portfolio

A designer's personal site with project cards, experience timeline, and contact links.

|||

### Source

```
# Sarah Chen

Product designer. Currently at Figma.
Previously Stripe, Airbnb.

## Selected Work
|||
::: card
### Figma Community Hub
2024
Increased engagement by 34%.
:::
---
::: card
### Stripe Checkout Flow
2023
Reduced drop-off by 28%.
:::
|||

## Experience
|||
### Figma
Senior Designer, 2023–Present
---
### Stripe
Designer, 2021–2023
|||
```

---

### What You Get

- Clean hero with name and subtitle
- Project cards in a responsive grid
- Experience timeline as compact columns
- Contact links styled as CTA buttons
- Bold, minimal design with orange accent

1 page. 80 lines. Reads like a resume, renders like a portfolio.

|||

## Nonprofit

A land trust site with impact statistics, campaign cards, and newsletter signup.

|||

### Source

```
## Our Impact
|||
### Acres Preserved
++12,847++
acres permanently protected.
---
### Species Sheltered
++340+++
native species call our
preserves home.
|||

## Current Campaigns
|||
::: card
### Eagle Creek Corridor
Goal: $2.4M
640 acres connecting two
existing preserves.
:::
---
::: card
### Wetland Restoration
Goal: $800K
Restoring 120 acres of
degraded wetland.
:::
|||
```

---

### What You Get

- Hero carousel with nature imagery
- Large stat callouts using `++bold++` syntax
- Campaign cards with goals and descriptions
- Volunteer / Donate / Events columns
- Newsletter signup form
- Nature-inspired color palette

All the patterns a nonprofit needs, from plain text.

|||

## Wedding

An event site with schedule, accommodations, registry, and RSVP form.

|||

### Source

```
# Emma & James
October 18, 2026 — Napa Valley

## The Details
|||
### Ceremony
4:00 PM
Vineyard Terrace at Meadowood
---
### Reception
5:30 PM — 11:00 PM
Dinner, dancing, and toasts.
|||

## RSVP
::: form
Name*: {text}
Attending*: {Accepts / Declines}
Dietary: {None / Vegetarian / Vegan}
Song request: {text}
[Send RSVP](POST /rsvp)
:::
```

---

### What You Get

- Romantic hero with couple's photo
- Event schedule as cards
- Accommodation details with booking links
- Registry section with outbound links
- RSVP form with dietary preferences dropdown
- Elegant serif typography

A complete wedding site that the couple can edit themselves.

|||

## Salon

A service business with pricing, team profiles, testimonials, and online booking.

|||

### Source

```
## Services
|||
### Cuts & Styling
- Women's Haircut ... $75
- Men's Haircut ... $45
- Blowout & Style ... $55
---
### Color
- Single Process ... $120
- Balayage ... $200
- Color Correction ... $250+
|||

## Meet the Team
|||
::: card
### Mia Torres
Owner & Lead Stylist
15 years of experience.
:::
---
::: card
### Jade Kim
Senior Stylist
Expert in precision cuts.
:::
|||
```

---

### What You Get

- Service pricing in clean columns
- Team member cards with bios
- Client testimonials with 5-star ratings
- Location, hours, and parking info
- Appointment booking form with stylist selection
- Pastel color scheme

Everything a service business needs, editable by the business owner.

|||

## SaaS Product

A developer tool landing page with dark theme, pricing tabs, keyboard shortcuts, stats bar, testimonial carousel, and multi-column footer.

|||

### Source

```
# Your shortcut to everything

A powerful productivity launcher.

[Download](dl.md) — [Extensions](#ext)

## Features

|||
::: card
### :search: App Launcher
Launch apps instantly with
a few keystrokes.
:::
---
::: card
### :gear: System Commands
Control your Mac without
touching the mouse.
:::
|||

## AI

Select text, hit [[⌘]] + [[⇧]]
+ [[Space]], run an AI command.

## Stats

|||
### ++25,000++
Active users
---
### ++50ms++
Response time
---
### ++99.9%++
Uptime
|||

## Pricing
::: tabs
::: tab Monthly
|||
### Free
- Basic features
[Download](#)
---
### Pro {featured}
- AI commands
- Cloud sync
++$12/mo++
[Start Trial](#)
:::
---
::: tab Annual
|||
### Free
- Basic features
[Download](#)
---
### Pro {featured}
- AI commands
- Cloud sync
++$8/mo++
[Start Trial](#)
:::
:::

## Testimonials
::: carousel
::: quote
Game changer for productivity.
— **Alex R.**
:::
---
::: quote
Best tool I've ever used.
— **Sam K.**
:::
:::
```

---

### What You Get

- Dark mode with coral accent via `mode: dark` in theme.yaml
- Keyboard shortcuts rendered as styled key caps
- Stats bar auto-detected from `++stat++` columns
- Tabbed pricing with Monthly/Annual toggle
- Featured "Recommended" column highlight
- Testimonial carousel with prev/next navigation
- Multi-column footer with section headers
- Emoji icons in card headings

All the patterns of a modern SaaS landing page, from a single markdown file.

|||

[Read the Guide](guide.md) — [Back to Home](index.md)

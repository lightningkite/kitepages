---
title: Examples — Kite Pages
description: See what you can build with Kite Pages across different industries
---

# Examples

Real sites built with Kite Pages, each from a single folder of text files.

## Restaurant

A multi-page site with hero carousel, menu pricing, testimonials, and a reservation form.

[View Live Demo](demos/giuseppe/)

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

[View Live Demo](demos/portfolio/)

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

[View Live Demo](demos/nonprofit/)

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

[View Live Demo](demos/wedding/)

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

[View Live Demo](demos/salon/)

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

## Software Agency

A multi-page agency site with dark theme, team photos, client logos, project case studies, stats bar, and testimonials with avatars.

[View Live Demo](demos/lightningkite/)

|||

### Source (index.md)

```
# We Build Strikingly Good Software

Native mobile apps, web platforms, and
IoT solutions -- built by a team that
treats software development as an art.

[Let's Talk](contact.md) -- [See Our Work](work.md)

## Web and Mobile Development Done Right

|||
::: card
### Expertise
![Expertise](reason-expertise.png =120x)
Proficient across iOS, Android, web,
and embedded systems.
:::
---
::: card
### Communication
![Communication](reason-communication.png =120x)
Radical transparency isn't a buzzword.
:::
|||

## By the Numbers
|||
### ++31++
Programming Languages
---
### ++115++
Mobile Projects
---
### ++204++
Web Projects
|||

## What Our Clients Say
::: quote
Integrity is paramount with Lightning Kite.
They are a real hidden gem.
![Steve](steve.jpg){avatar} -- **Steve**
:::
```

---

### What You Get

- Dark teal theme with golden yellow accent
- Multi-page site (home, services, work, team, contact)
- Team member grid with real photos
- Client logo bar
- Project case studies with descriptions
- Stats bar auto-detected from `++stat++` columns
- Testimonials with avatar images
- Bold display font (Bebas Neue) headings

8 pages, real imagery, agency-ready from markdown.

|||

## Electrician

A multi-page service business site with dark theme, background hero image, project portfolio, contact form, and emergency service info.

[View Live Demo](demos/electrician/)

|||

### Source (index.md)

```
::: bg building-photo.jpg
# Commercial Electrical Contractors
  You Can Count On

Licensed, insured, and built on 20 years
of keeping Denver businesses running.

[Get a Free Estimate](contact.md)
[Our Services](services.md)
:::

## What We Do
|||
::: card
### Commercial Wiring
![Panel](panel.jpg =120x)
New construction and office buildouts.
:::
---
::: card
### Electrical Upgrades
![Upgrade](upgrade.jpg =120x)
Panel upgrades and code compliance.
:::
|||

## By the Numbers
|||
### ++20++
Years in Business
---
### ++500++
Projects Completed
---
### ++98%++
On-Time Completion
|||
```

---

### What You Get

- Dark theme with orange/gold accents
- Full-bleed hero with background image overlay
- Service cards with images
- Stats bar with large highlighted numbers
- Client testimonials with star ratings
- Multi-page site (home, services, projects, about, contact)
- Contact form with project type and budget selects
- Emergency service contact info
- Column footer with phone, address, and links

6 pages covering everything a trade business needs.

|||

## SaaS Product

A developer tool landing page with dark theme, pricing tabs, keyboard shortcuts, stats bar, testimonial carousel, and multi-column footer.

[View Raycast Demo](demos/raycast/) — [View Linear Demo](demos/linear/) — [View Lemon Squeezy Demo](demos/lemonsqueezy/)

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

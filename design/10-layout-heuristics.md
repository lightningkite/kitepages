# Layout Heuristics

How the renderer decides what to display and how to lay it out, based purely on content structure.

## Section Detection

**Rule:** `## Heading` creates a section boundary. Everything between two `##` headings (or between `##` and end of document) is one section.

**Alternation:** Sections alternate between default and alt styling (`smd-section-alt`). Theme controls the visual treatment:
- `alternating` — warm background on alt sections
- `bold` — primary color background on alt sections
- `clean` — no alternation

**Section IDs:** Generated from heading text via slugification: `## Our Menu` → `id="our-menu"`. Used for deep linking and nav anchor links.

## Hero Detection

**Rule:** The first `# H1` heading becomes a hero section. If followed immediately by a paragraph, that paragraph becomes the hero subtitle.

**Visual treatment:** Centered text, large heading, muted subtitle. Animation class applied unless `animation: none`.

## CTA Detection

**Rule:** A paragraph containing *only* markdown links (and optional separators like `—`, `-`, `|`, `,`) renders as a button row instead of a text paragraph.

**Examples:**
```
[Get Started](signup.md) [Learn More](guide.md)
[About Us](about.md) — [View Full Menu](menu.md)
```

**First link = primary CTA** (filled button), **subsequent = secondary** (outlined).

## Gallery Inference

**Rule:** Consecutive `![image]()` blocks at the same level are collected into a gallery grid.

**Grid layout by count:**
- 1 image → full width
- 2 images → 2 columns
- 3 images → 3 columns (triptych)
- 4+ images → 2-column responsive grid

## Dot-Leader Lists

**Rule:** A list item containing ` ... ` (space, three+ dots, space) renders as a two-column layout with the text before dots on the left and the text after on the right, connected by a dotted leader.

**Example:**
```
- Bruschetta ... $8
- Calamari ... $12
```

Renders as a menu-style pricing layout.

## Column Detection

Two syntaxes, same visual result:

### Fenced columns (`|||`)
`|||` opens, `---` separates, `|||` closes. Content between separators is recursively parsed as independent columns. Best for longer content.

### Prefix columns (`| `)
`| ` prefix on each line (like `> ` for blockquotes). Blank lines between `| ` groups start new columns. Best for short content like feature grids.

**Grid:** Columns use `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` — automatically responsive without breakpoints.

## Carousel Detection

**Rule:** `::: carousel` block with `---` separating slides. Each slide is recursively parsed. Slides are typically `::: bg` sections with overlay text.

**Auto-play:** Advances every 5 seconds. Pauses for 10 seconds after manual interaction.

## Embed Detection

**Rule:** A standalone paragraph containing only a URL matching a known embed pattern renders as a responsive iframe instead of a link.

**Supported patterns:**
- YouTube: `youtube.com/watch?v=ID` or `youtu.be/ID`
- Vimeo: `vimeo.com/ID`

## Task List Detection

**Rule:** Unordered list items starting with `[ ]`, `[x]`, or `[-]` render as a checkbox list:
- `[ ]` → unchecked
- `[x]` → checked (with done styling)
- `[-]` → checked with reduced opacity (partial/indeterminate)

## Star Rating Display

**Rule:** A sequence of 2+ star characters (`★☆⭐`) renders as a styled star rating.

## Table Detection

**Rule:** Lines starting and ending with `|` followed by a `|---|` separator row are parsed as standard Markdown tables. Supports alignment via `:---:` (center) and `---:` (right).

**vs. Prefix columns:** Tables have `|` on **both** sides of content and a separator row. Prefix columns have `|` only on the left side.

## GFM Alert Detection

**Rule:** A blockquote (`> `) whose first line matches `[!TYPE]` becomes an alert/admonition instead of a plain quote.

**Type mapping:**
- `[!NOTE]` → note
- `[!TIP]` → tip
- `[!WARNING]` → warning
- `[!IMPORTANT]` → info
- `[!CAUTION]` → error

## Record Block Detection

**Rule:** `:: Name` followed by indented content. Indented `Key: value` lines become fields. Plain indented text becomes the body description.

## Expandable Section Detection

**Rule:** `>| Summary text` followed by indented content. Renders as a `<details>/<summary>` collapsible.

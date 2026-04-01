# Layout: Content-Driven, Not Author-Specified

## The Problem

Responsive layout on the web today requires the author to:
1. Choose a layout system (flex, grid, float)
2. Specify how elements relate spatially (rows, columns, gaps)
3. Define breakpoints where layout changes
4. Test across screen sizes and fix edge cases

This is a nightmare even for experienced developers. A non-technical user has zero chance.

## The Insight

Content already carries layout intent. Consider:

```markdown
# My Restaurant

Welcome to Giuseppe's! We serve authentic Italian cuisine in downtown Portland.

![Restaurant interior](interior.jpg)
![Our pasta](pasta.jpg)
![The garden patio](patio.jpg)

## Menu

### Appetizers
- Bruschetta — $8
- Calamari — $12

### Entrees
- Margherita Pizza — $14
- Linguine alle Vongole — $18

## Hours & Location

Monday–Friday: 11am–10pm
Saturday–Sunday: 10am–11pm

123 Main Street, Portland, OR 97201
```

A human designer seeing this would immediately know:
- The hero text + images should be prominent at the top
- Three images together = a gallery, not three separate sections
- Menu categories are parallel/equal = columns or tabs on wide screens
- Hours & Location are short, factual blocks = could sit side by side

**The renderer should make these same inferences.**

## Proposed Approach: Structural Hinting

The renderer analyzes content blocks and applies layout rules based on patterns:

### Rule 1: Sibling Similarity → Side by Side

When consecutive blocks at the same heading level have similar structure
(similar length, same types of content), render them as columns on wide
screens, stacking on narrow screens.

"Appetizers" and "Entrees" above are both `### heading + list`. They're
structurally parallel → they should column-ify.

### Rule 2: Image Sequences → Gallery

Multiple consecutive images → gallery/grid. The renderer picks a layout
based on count:
- 1 image: full width
- 2 images: side by side
- 3 images: triptych or 1-large + 2-small
- 4+ images: grid
- Always collapse to stacked/carousel on narrow viewports

### Rule 3: Short Blocks → Compact Layout

When a section's content is short (e.g., address, hours, a phone number),
it doesn't need a full-width row. The renderer can pack multiple short
sections side by side.

### Rule 4: Heading Hierarchy → Page Sections

- `#` = page-level section (could be a full-screen hero, a major division)
- `##` = content section (gets a visual boundary — spacing, maybe a subtle divider)
- `###` = subsection (groups within a section, candidates for columnar layout)
- `####` = label/subheading (inline, no structural weight)

### Rule 5: Content Type Drives Emphasis

- A heading followed immediately by a large image → hero/banner treatment
- A heading followed by a short paragraph → intro/subtitle treatment
- A blockquote → callout/pull-quote styling
- A list → depends on length: short items = pills/tags, long items = cards

## Open Questions

### How does the author override when the inference is wrong?

Sometimes the renderer will guess wrong. We need a lightweight way to
hint without becoming a layout language. Ideas:

- **Section attributes?** `## Menu {columns}` — but this is dangerously
  close to CSS classes.
- **Layout directives?** A special block that says "the following sections
  are tabs" or "the following sections are a timeline."
- **Content-level hints?** The way you write content changes layout.
  Writing items as a list vs. as separate paragraphs might signal
  different intent.

### How much "magic" is too much?

If the renderer is too clever, authors can't predict what it'll do.
There's a sweet spot between "fully manual" and "fully automatic" —
probably closer to automatic with escape hatches.

### What about intentionally asymmetric layouts?

Some designs intentionally make one column wider than another, or
position an image to bleed off-screen. Are those in scope? Or is
Kite Pages explicitly for "clean, readable, content-first" sites
where fancy asymmetry isn't the goal?

## Comparison: What This Replaces

| Today (HTML/CSS)                        | Kite Pages                          |
|-----------------------------------------|----------------------------------------|
| `display: grid; grid-template-columns`  | Renderer infers columns from siblings  |
| `@media (max-width: 768px) { ... }`    | Renderer adapts; no breakpoints needed |
| `<div class="hero">` + custom CSS       | `# Heading` + image = hero             |
| `<div class="gallery">` + JS lightbox   | Consecutive images = gallery           |
| Manually tested on 5 screen sizes       | Tested zero times; it just works       |

## Next Steps

- Prototype a renderer that takes standard markdown and applies these
  rules to see how far we get with ZERO syntax extensions
- Identify where the rules fail and we genuinely need new syntax
- Design the minimal set of author hints for when inference is wrong

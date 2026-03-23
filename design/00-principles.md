# SuperMarkdown Design Principles

## Primary Objective

Make it REALLY easy for a non-technical user to make nice-looking websites.

## Core Principles

1. **Content implies layout.** The author describes *what* they want to show, not *where* it goes. The renderer determines placement based on content structure, viewport, and context.

2. **Readable source = readable output.** If a non-technical person can't read the source file and roughly understand the page, we've failed.

3. **No escape hatches to HTML.** If we need HTML, we haven't extended the format enough. But we also can't just re-skin HTML syntax — every extension must earn its place by being genuinely simpler.

4. **Responsive by default.** There are no breakpoints, no media queries, no "mobile version." The renderer adapts because it understands the content's *intent*, not just its pixels.

5. **LLM-friendly.** Both consumption and generation should be natural for language models.

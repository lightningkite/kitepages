# Supermarkdown — Purpose & Principles

## Purpose

Supermarkdown is a Markdown superset that turns plain text into polished, responsive websites. The renderer infers layout from content structure — no HTML, CSS, or breakpoints needed.

## Goals

1. **Non-technical people can create and maintain real websites** by editing text files. A restaurant owner can change their hours or prices without calling a developer or risking the layout.

2. **AI can generate and reliably modify sites.** 60 lines of Markdown vs 400 lines of HTML. The format is small, semantic, and unambiguous — easy for LLMs to produce and safe for them to edit without breaking layout.

3. **Theming is fully separated from content.** One config file controls colors, fonts, spacing, and style across every page. Rebrand by changing a few values.

4. **Responsive by default.** No breakpoints, no media queries, no "mobile version." The renderer adapts based on content intent, not explicit layout instructions.

5. **Markdown compatible.** Standard `.md` files that degrade gracefully in GitHub, editors, and other Markdown tools. Supermarkdown extensions are additive — they enhance rendering but don't break the source for other consumers.

6. **Rich enough for real sites.** Carousels, forms, columns, galleries, pricing, navigation, theming — all from simple syntax extensions. If a common site pattern requires HTML, we haven't extended the format enough.

## Target Audience

Small business owners, non-technical content authors, and AI — anyone who can write text but shouldn't have to learn HTML/CSS.

## Design Principles

1. **Content implies layout.** The author describes *what* they want to show, not *where* it goes. The renderer determines placement based on content structure, viewport, and context.

2. **Readable source = readable output.** If a non-technical person can't read the source file and roughly understand the page, the syntax has failed.

3. **Standard Markdown first, extensions second.** Borrow from established Markdown flavors (GFM, Pandoc, etc.) before inventing new syntax. Every extension must earn its place by being genuinely simpler than the alternative.

4. **Responsive by default.** There are no breakpoints. The renderer adapts because it understands the content's *intent*, not just its pixels.

5. **LLM-friendly.** Both consumption and generation should be natural for language models. The format should be easy to explain in a system prompt and hard to get wrong.

6. **HTML is an escape hatch, not the norm.** Raw HTML passes through for edge cases, but the format should be expressive enough that reaching for HTML is rare and discouraged by convention.

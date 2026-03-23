# Special Sections, Carousels, and Backgrounds

## Styled Sections (::: fence)

Triple-colons create a styled section block. The first word is the type.

```
::: warning
Don't forget your receipt!
:::

::: info
Free shipping on orders over $50.
:::

::: bg hero.jpg
# Welcome to Giuseppe's
The best Italian in Portland
:::
```

Types:
- `warning`, `info`, `success`, `error` — admonition cards
- `bg <image>` — section with a background image, text overlaid

## Expandable Sections

```
>| How do I return an item?
   You have 30 days to return any item.
   Just bring your receipt to the store.
```

`>|` starts a collapsible block. First line is the summary, indented lines are hidden content.

## Carousels

`>>>` separates carousel items. Content between dividers is one slide.

```
>>>
::: bg hero1.jpg
# Welcome to Giuseppe's
The best Italian in Portland
:::
>>>
::: bg hero2.jpg
# Fresh Ingredients Daily
Farm to table since 1985
:::
>>>
```

Carousels can contain any content, not just background sections.

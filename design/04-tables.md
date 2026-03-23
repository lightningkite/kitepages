# Tables / Structured Data

## Syntax: Record Blocks

```
:: Pizza
   Price: $14
   Our famous thin crust margherita

:: Calamari
   Price: $12
   Lightly fried with marinara sauce
```

Each `::` starts a record. Indented lines are fields. `Key: value` lines are named fields; plain indented text is the description/body.

## Rendering

The renderer chooses presentation based on content and viewport:
- Wide screen, many records with uniform fields → table
- Narrow screen or rich content per record → cards
- Very short records → compact list

The author never specifies which. The data is the same; only presentation changes.

## Open Questions

- Do we need a way to name the collection? E.g., a heading above is probably sufficient.
- Can records nest? Probably not — keep it flat.

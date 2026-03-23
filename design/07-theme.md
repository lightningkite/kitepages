# Theme System (theme.json)

## Spec

```json
{
  "colors": {
    "primary": "#3d6b42",
    "primaryDark": "#2c5530",
    "accent": "#c9a84c",
    "background": "#faf9f6",
    "surface": "#ffffff",
    "text": "#2d2d2d",
    "textMuted": "#6b6b6b",
    "border": "#e5e2db",
    "borderLight": "#f0ede6"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Source Sans 3"
  },
  "radius": 10,
  "radiusLg": 16,
  "mode": "light"
}
```

## Design Constraints

- **Colors**: The renderer enforces WCAG AA contrast ratios. If a user picks a primary color that doesn't contrast enough with the background, the renderer adjusts automatically.
- **Fonts**: Must be from a curated set (Google Fonts). The renderer loads them automatically.
- **Radius**: Controls border-radius globally. 0 = sharp, 20 = very round.
- **Mode**: `light` or `dark`. The renderer derives all surface/border/shadow values.

## What Users DON'T Control

- Individual element sizes
- Spacing/margins
- Font sizes or weights
- Shadow depth
- Layout behavior
- Animation timing

These are all determined by the renderer's layout engine based on content.

## Curated Font Pairings

The theme system recommends pairings rather than arbitrary picks:

1. **Classic**: Playfair Display + Source Sans 3
2. **Modern**: Inter + Inter
3. **Warm**: Lora + Nunito
4. **Bold**: Montserrat + Open Sans
5. **Elegant**: Cormorant Garamond + Proza Libre
6. **Clean**: DM Sans + DM Sans
7. **Editorial**: Fraunces + Commissioner

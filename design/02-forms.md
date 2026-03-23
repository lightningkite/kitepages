# Forms

## Syntax

Form fields use angle brackets with a type name. Labels precede them on the same line.

```
Name: <text>
Email: <email>
Message: <paragraph>
Favorite color: <red / green / blue>
Remember me: <checkbox>
[Send](POST /contact)
```

## Field Types

- `<text>` — single-line text input
- `<email>` — email with validation
- `<paragraph>` — multi-line text
- `<option1 / option2 / option3>` — selection from choices
- `<checkbox>` — boolean toggle
- `<number>` — numeric input
- `<date>` — date picker
- `<file>` — file upload

## Buttons / Submission

Buttons are links with an HTTP method prefix:

```
[Send](POST /contact)
[Delete](DELETE /item/123)
```

Regular links remain `[text](/url)` — GET is implied.

## Open Questions

- ~~How are field names determined?~~ Slugified from label text ("Favorite color" → `favorite-color`)
- Default values / placeholder text?
- Required vs optional fields?
- How does the renderer group fields into a single form vs separate forms?

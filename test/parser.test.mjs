import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseBlocks, parseFormFields, parseYaml } from '../src/parser.mjs';

describe('parseYaml', () => {
  it('parses flat key-value', () => {
    const result = parseYaml('title: Hello\ndescription: A test');
    assert.equal(result.title, 'Hello');
    assert.equal(result.description, 'A test');
  });

  it('parses nested objects', () => {
    const result = parseYaml('colors:\n  primary: "#ff0000"\n  accent: blue');
    assert.equal(result.colors.primary, '#ff0000');
    assert.equal(result.colors.accent, 'blue');
  });

  it('coerces numbers', () => {
    const result = parseYaml('radius: 12\nscale: 1.5');
    assert.equal(result.radius, 12);
    assert.equal(result.scale, 1.5);
  });

  it('coerces booleans', () => {
    const result = parseYaml('draft: true\nactive: false');
    assert.equal(result.draft, true);
    assert.equal(result.active, false);
  });

  it('strips quotes', () => {
    const result = parseYaml('name: "quoted value"');
    assert.equal(result.name, 'quoted value');
  });

  it('skips comments and blank lines', () => {
    const result = parseYaml('# comment\n\ntitle: Hello');
    assert.equal(result.title, 'Hello');
  });
});

describe('parse', () => {
  it('extracts frontmatter', () => {
    const doc = parse('---\ntitle: Hello\ndescription: A test\n---\n# Heading');
    assert.equal(doc.frontmatter.title, 'Hello');
    assert.equal(doc.frontmatter.description, 'A test');
    assert.equal(doc.blocks.length, 1);
    assert.equal(doc.blocks[0].type, 'heading');
  });

  it('handles no frontmatter', () => {
    const doc = parse('# Just a heading\nSome text');
    assert.deepEqual(doc.frontmatter, {});
    assert.equal(doc.blocks[0].type, 'heading');
  });
});

describe('parseBlocks', () => {
  it('parses headings at all levels', () => {
    const blocks = parseBlocks('# H1\n## H2\n### H3\n#### H4'.split('\n'));
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0].level, 1);
    assert.equal(blocks[1].level, 2);
    assert.equal(blocks[2].level, 3);
    assert.equal(blocks[3].level, 4);
  });

  it('generates heading IDs', () => {
    const blocks = parseBlocks('## Our Menu'.split('\n'));
    assert.equal(blocks[0].id, 'our-menu');
  });

  it('parses images', () => {
    const blocks = parseBlocks('![Alt text](image.jpg)'.split('\n'));
    assert.equal(blocks[0].type, 'image');
    assert.equal(blocks[0].alt, 'Alt text');
    assert.equal(blocks[0].src, 'image.jpg');
  });

  it('parses unordered lists', () => {
    const blocks = parseBlocks('- Item 1\n- Item 2\n- Item 3'.split('\n'));
    assert.equal(blocks[0].type, 'list');
    assert.equal(blocks[0].ordered, false);
    assert.equal(blocks[0].items.length, 3);
    assert.equal(blocks[0].items[0], 'Item 1');
  });

  it('parses ordered lists', () => {
    const blocks = parseBlocks('1. First\n2. Second\n3. Third'.split('\n'));
    assert.equal(blocks[0].type, 'list');
    assert.equal(blocks[0].ordered, true);
    assert.equal(blocks[0].items.length, 3);
    assert.equal(blocks[0].items[0], 'First');
  });

  it('parses paragraphs with newlines', () => {
    const blocks = parseBlocks('Hello world\nSecond line'.split('\n'));
    assert.equal(blocks[0].type, 'paragraph');
    assert.equal(blocks[0].text, 'Hello world\nSecond line');
  });

  it('parses fenced columns (||| / --- / |||)', () => {
    const blocks = parseBlocks('|||\n### Col 1\nContent A\n---\n### Col 2\nContent B\n|||'.split('\n'));
    assert.equal(blocks[0].type, 'columns');
    assert.equal(blocks[0].columns.length, 2);
    assert.equal(blocks[0].columns[0][0].type, 'heading');
    assert.equal(blocks[0].columns[1][0].type, 'heading');
  });

  it('parses fenced sections', () => {
    const blocks = parseBlocks('::: warning\nDanger ahead!\n:::'.split('\n'));
    assert.equal(blocks[0].type, 'alert');
    assert.equal(blocks[0].alertType, 'warning');
    assert.equal(blocks[0].blocks[0].type, 'paragraph');
  });

  it('parses card sections', () => {
    const blocks = parseBlocks('::: card\n### Title\nDescription\n:::'.split('\n'));
    assert.equal(blocks[0].type, 'card');
    assert.equal(blocks[0].blocks.length, 2);
  });

  it('parses quote sections', () => {
    const blocks = parseBlocks('::: quote\n★★★★★\nGreat!\n— **John**\n:::'.split('\n'));
    assert.equal(blocks[0].type, 'quote-block');
  });

  it('parses bg sections', () => {
    const blocks = parseBlocks('::: bg hero.jpg\n# Title\nSubtitle\n:::'.split('\n'));
    assert.equal(blocks[0].type, 'bg-section');
    assert.equal(blocks[0].bgImage, 'hero.jpg');
    assert.equal(blocks[0].blocks.length, 2);
  });

  it('parses carousel with ::: carousel syntax', () => {
    const src = '::: carousel\n::: bg a.jpg\n# Slide 1\n:::\n---\n::: bg b.jpg\n# Slide 2\n:::\n:::';
    const blocks = parseBlocks(src.split('\n'));
    assert.equal(blocks[0].type, 'carousel');
    assert.equal(blocks[0].slides.length, 2);
  });

  it('parses nested fenced blocks', () => {
    const src = '::: carousel\n::: bg a.jpg\n# Slide 1\n:::\n---\n::: bg b.jpg\n::: card\nInner card\n:::\n:::\n:::';
    const blocks = parseBlocks(src.split('\n'));
    assert.equal(blocks[0].type, 'carousel');
    assert.equal(blocks[0].slides.length, 2);
  });

  it('parses form sections with {type} syntax', () => {
    const blocks = parseBlocks('::: form\nName*: {text}\nEmail: {email}\n[Send](POST /contact)\n:::'.split('\n'));
    assert.equal(blocks[0].type, 'form');
    assert.equal(blocks[0].content.groups[0].length, 2);
    assert.equal(blocks[0].content.action.method, 'POST');
  });

  it('parses >>> as block quote', () => {
    const blocks = parseBlocks('>>>\nThis is a block quote.\nMultiple lines.\n>>>'.split('\n'));
    assert.equal(blocks[0].type, 'blockquote');
    assert.equal(blocks[0].blocks[0].type, 'paragraph');
  });

  it('parses > prefix blockquotes', () => {
    const blocks = parseBlocks('> This is a quote\n> Second line'.split('\n'));
    assert.equal(blocks[0].type, 'blockquote');
  });

  it('parses code fences', () => {
    const blocks = parseBlocks('```javascript\nconst x = 1;\n```'.split('\n'));
    assert.equal(blocks[0].type, 'code');
    assert.equal(blocks[0].lang, 'javascript');
    assert.equal(blocks[0].content, 'const x = 1;');
  });

  it('parses | prefix columns', () => {
    const blocks = parseBlocks('| ### Feature 1\n| Description 1\n\n| ### Feature 2\n| Description 2'.split('\n'));
    assert.equal(blocks[0].type, 'columns');
    assert.equal(blocks[0].columns.length, 2);
  });

  it('parses record blocks', () => {
    const blocks = parseBlocks(':: Pizza\n   Price: $14\n   Our famous margherita'.split('\n'));
    assert.equal(blocks[0].type, 'record');
    assert.equal(blocks[0].name, 'Pizza');
    assert.equal(blocks[0].fields[0].key, 'Price');
    assert.equal(blocks[0].fields[0].value, '$14');
    assert.equal(blocks[0].body, 'Our famous margherita');
  });

  it('parses expandable sections', () => {
    const blocks = parseBlocks('>| How do I return?\n   You have 30 days.'.split('\n'));
    assert.equal(blocks[0].type, 'expandable');
    assert.equal(blocks[0].summary, 'How do I return?');
    assert.equal(blocks[0].blocks[0].type, 'paragraph');
  });

  it('parses HTML blocks', () => {
    const blocks = parseBlocks('<div class="custom">\n  Custom content\n</div>'.split('\n'));
    assert.equal(blocks[0].type, 'html');
    assert.ok(blocks[0].content.includes('custom'));
  });

  it('parses hr', () => {
    const blocks = parseBlocks('---'.split('\n'));
    assert.equal(blocks[0].type, 'hr');
  });

  it('skips blank lines', () => {
    const blocks = parseBlocks('\n\n# Heading\n\n'.split('\n'));
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, 'heading');
  });

  it('handles unclosed fenced section gracefully', () => {
    const blocks = parseBlocks('::: warning\nSome text without closing'.split('\n'));
    // Unclosed fence — falls through to paragraph
    assert.equal(blocks[0].type, 'paragraph');
  });

  it('handles unclosed code fence gracefully', () => {
    const blocks = parseBlocks('```\ncode without closing'.split('\n'));
    // Unclosed — not consumed, falls through
    assert.equal(blocks[0].type, 'paragraph');
  });

  it('handles --- as column separator inside |||', () => {
    const src = '|||\nCol 1\n---\nCol 2\n---\nCol 3\n|||';
    const blocks = parseBlocks(src.split('\n'));
    assert.equal(blocks[0].type, 'columns');
    assert.equal(blocks[0].columns.length, 3);
  });

  it('does not confuse :: records with ::: fenced sections', () => {
    const blocks = parseBlocks(':: Item\n   Price: $10'.split('\n'));
    assert.equal(blocks[0].type, 'record');
    assert.equal(blocks[0].name, 'Item');
  });

  // Phase 3
  it('parses standard Markdown tables', () => {
    const src = '| Name | Price |\n|------|-------|\n| Pasta | $14 |\n| Fish | $18 |';
    const blocks = parseBlocks(src.split('\n'));
    assert.equal(blocks[0].type, 'table');
    assert.deepEqual(blocks[0].headers, ['Name', 'Price']);
    assert.equal(blocks[0].rows.length, 2);
    assert.equal(blocks[0].rows[0][0], 'Pasta');
  });

  it('parses table alignment', () => {
    const src = '| Left | Center | Right |\n|:-----|:------:|------:|\n| a | b | c |';
    const blocks = parseBlocks(src.split('\n'));
    assert.deepEqual(blocks[0].align, ['left', 'center', 'right']);
  });

  it('parses GFM alerts', () => {
    const blocks = parseBlocks('> [!NOTE]\n> This is a note.'.split('\n'));
    assert.equal(blocks[0].type, 'alert');
    assert.equal(blocks[0].alertType, 'note');
  });

  it('parses GFM warning alert', () => {
    const blocks = parseBlocks('> [!WARNING]\n> Be careful!'.split('\n'));
    assert.equal(blocks[0].type, 'alert');
    assert.equal(blocks[0].alertType, 'warning');
  });

  it('parses GFM tip alert', () => {
    const blocks = parseBlocks('> [!TIP]\n> Helpful hint.'.split('\n'));
    assert.equal(blocks[0].type, 'alert');
    assert.equal(blocks[0].alertType, 'tip');
  });

  it('parses directives', () => {
    const blocks = parseBlocks('{:toc}'.split('\n'));
    assert.equal(blocks[0].type, 'directive');
    assert.equal(blocks[0].name, 'toc');
  });

  it('parses image with sizing', () => {
    const blocks = parseBlocks('![Photo](img.jpg =300x200)'.split('\n'));
    assert.equal(blocks[0].type, 'image');
    assert.equal(blocks[0].width, 300);
    assert.equal(blocks[0].height, 200);
  });

  it('parses image with width only', () => {
    const blocks = parseBlocks('![Photo](img.jpg =400x)'.split('\n'));
    assert.equal(blocks[0].width, 400);
    assert.equal(blocks[0].height, null);
  });
});

describe('parseFormFields', () => {
  it('parses text fields with {type} syntax', () => {
    const result = parseFormFields(['Name: {text}']);
    assert.equal(result.groups[0][0].label, 'Name');
    assert.equal(result.groups[0][0].fieldType, 'text');
    assert.equal(result.groups[0][0].required, false);
  });

  it('parses required fields', () => {
    const result = parseFormFields(['Name*: {text}']);
    assert.equal(result.groups[0][0].required, true);
  });

  it('parses select fields', () => {
    const result = parseFormFields(['Size*: {Small / Medium / Large}']);
    assert.equal(result.groups[0][0].fieldType, 'select');
    assert.deepEqual(result.groups[0][0].options, ['Small', 'Medium', 'Large']);
  });

  it('parses buttons', () => {
    const result = parseFormFields(['[Send](POST /contact)']);
    assert.equal(result.action.label, 'Send');
    assert.equal(result.action.method, 'POST');
    assert.equal(result.action.url, '/contact');
  });

  it('groups fields by blank lines', () => {
    const result = parseFormFields(['Name: {text}', 'Email: {email}', '', 'Message: {paragraph}']);
    assert.equal(result.groups.length, 2);
    assert.equal(result.groups[0].length, 2);
    assert.equal(result.groups[1].length, 1);
  });

  it('parses all field types', () => {
    const result = parseFormFields([
      'Name: {text}',
      'Email: {email}',
      'Age: {number}',
      'Date: {date}',
      'File: {file}',
      'Agree: {checkbox}',
      'Notes: {paragraph}',
    ]);
    const fields = result.groups[0];
    assert.equal(fields[0].fieldType, 'text');
    assert.equal(fields[1].fieldType, 'email');
    assert.equal(fields[2].fieldType, 'number');
    assert.equal(fields[3].fieldType, 'date');
    assert.equal(fields[4].fieldType, 'file');
    assert.equal(fields[5].fieldType, 'checkbox');
    assert.equal(fields[6].fieldType, 'paragraph');
  });
});

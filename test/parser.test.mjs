import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseBlocks, parseFormFields } from '../src/parser.mjs';

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
    const blocks = parseBlocks('# H1\n## H2\n### H3\n#### H4');
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0].level, 1);
    assert.equal(blocks[1].level, 2);
    assert.equal(blocks[2].level, 3);
    assert.equal(blocks[3].level, 4);
  });

  it('parses images', () => {
    const blocks = parseBlocks('![Alt text](image.jpg)');
    assert.equal(blocks[0].type, 'image');
    assert.equal(blocks[0].alt, 'Alt text');
    assert.equal(blocks[0].src, 'image.jpg');
  });

  it('parses lists', () => {
    const blocks = parseBlocks('- Item 1\n- Item 2\n- Item 3');
    assert.equal(blocks[0].type, 'list');
    assert.equal(blocks[0].items.length, 3);
    assert.equal(blocks[0].items[0], 'Item 1');
  });

  it('parses paragraphs', () => {
    const blocks = parseBlocks('Hello world\nSecond line');
    assert.equal(blocks[0].type, 'paragraph');
    assert.ok(blocks[0].text.includes('Hello world'));
    assert.ok(blocks[0].text.includes('Second line'));
  });

  it('parses column markers', () => {
    const blocks = parseBlocks('|||>\n### Col 1\n|||\n### Col 2\n|||<');
    assert.equal(blocks[0].type, 'columns-start');
    assert.equal(blocks[1].type, 'heading');
    assert.equal(blocks[2].type, 'column-break');
    assert.equal(blocks[3].type, 'heading');
    assert.equal(blocks[4].type, 'columns-end');
  });

  it('parses fenced sections', () => {
    const blocks = parseBlocks('::: warning\nDanger ahead!\n:::');
    assert.equal(blocks[0].type, 'fenced');
    assert.equal(blocks[0].sectionType, 'warning');
    assert.equal(blocks[0].rawLines[0], 'Danger ahead!');
  });

  it('parses bg sections', () => {
    const blocks = parseBlocks('::: bg hero.jpg\n# Title\nSubtitle\n:::');
    assert.equal(blocks[0].type, 'bg-section');
    assert.equal(blocks[0].bgImage, 'hero.jpg');
    assert.equal(blocks[0].blocks.length, 2);
  });

  it('parses form sections', () => {
    const blocks = parseBlocks('::: form\nName*: <text>\nEmail: <email>\n[Send](POST /contact)\n:::');
    assert.equal(blocks[0].type, 'form');
    assert.equal(blocks[0].content.groups[0].length, 2);
    assert.equal(blocks[0].content.action.method, 'POST');
  });

  it('parses carousel', () => {
    const blocks = parseBlocks('>>>\n::: bg a.jpg\n# Slide 1\n:::\n>>>\n::: bg b.jpg\n# Slide 2\n:::\n>>>');
    assert.equal(blocks[0].type, 'carousel');
    assert.equal(blocks[0].slides.length, 2);
  });

  it('parses hr', () => {
    const blocks = parseBlocks('---');
    assert.equal(blocks[0].type, 'hr');
  });

  it('skips blank lines', () => {
    const blocks = parseBlocks('\n\n# Heading\n\n');
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, 'heading');
  });

  it('handles unclosed fence as paragraph', () => {
    const blocks = parseBlocks('::: warning\nSome text without closing');
    // Should fall back to paragraph for the opening line
    assert.equal(blocks[0].type, 'paragraph');
  });
});

describe('parseFormFields', () => {
  it('parses text fields', () => {
    const result = parseFormFields(['Name: <text>']);
    assert.equal(result.groups[0][0].label, 'Name');
    assert.equal(result.groups[0][0].fieldType, 'text');
    assert.equal(result.groups[0][0].required, false);
  });

  it('parses required fields', () => {
    const result = parseFormFields(['Name*: <text>']);
    assert.equal(result.groups[0][0].required, true);
  });

  it('parses select fields', () => {
    const result = parseFormFields(['Size*: <Small / Medium / Large>']);
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
    const result = parseFormFields(['Name: <text>', 'Email: <email>', '', 'Message: <paragraph>']);
    assert.equal(result.groups.length, 2);
    assert.equal(result.groups[0].length, 2);
    assert.equal(result.groups[1].length, 1);
  });
});

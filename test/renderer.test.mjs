import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse, parseYaml } from '../src/parser.mjs';
import { render, renderNav, renderFooter, renderBlock, inl, getThemeVars, getGoogleFontsUrl, getThemeDataAttrs } from '../src/renderer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sitesDir = join(__dirname, '..', 'sites');

function readSiteSource(name, file) {
  const mdPath = join(sitesDir, name, file.replace(/\.smd$/, '.md'));
  if (existsSync(mdPath)) return readFileSync(mdPath, 'utf-8');
  return readFileSync(join(sitesDir, name, file), 'utf-8');
}

function loadTheme(name) {
  const yamlPath = join(sitesDir, name, 'theme.yaml');
  if (existsSync(yamlPath)) return parseYaml(readFileSync(yamlPath, 'utf-8'));
  return JSON.parse(readFileSync(join(sitesDir, name, 'theme.json'), 'utf-8'));
}

describe('inl (inline formatting)', () => {
  it('renders bold', () => {
    assert.ok(inl('**bold**').includes('<strong>bold</strong>'));
  });

  it('renders italic', () => {
    assert.ok(inl('*italic*').includes('<em>italic</em>'));
  });

  it('renders links', () => {
    const html = inl('[Click](https://example.com)');
    assert.ok(html.includes('href="https://example.com"'));
    assert.ok(html.includes('Click'));
  });

  it('renders large text with ++syntax++', () => {
    assert.ok(inl('++12,847++').includes('smd-large'));
    assert.ok(inl('++12,847++').includes('12,847'));
  });

  it('renders underline', () => {
    assert.ok(inl('_underlined_').includes('<u>underlined</u>'));
  });

  it('renders star ratings', () => {
    assert.ok(inl('★★★★★').includes('smd-stars'));
  });

  it('renders code spans', () => {
    assert.ok(inl('use `code` here').includes('<code>code</code>'));
  });

  it('converts newlines to br', () => {
    assert.ok(inl('line 1\nline 2').includes('<br>'));
  });
});

describe('render', () => {
  it('renders a simple page', () => {
    const doc = parse('# Hello\nWorld');
    const html = render(doc);
    assert.ok(html.includes('<h1>Hello</h1>'));
    assert.ok(html.includes('smd-hero'));
  });

  it('renders sections with h2 using heading IDs', () => {
    const doc = parse('## About\nSome text\n## Contact\nMore text');
    const html = render(doc);
    assert.ok(html.includes('smd-section'));
    assert.ok(html.includes('id="about"'));
    assert.ok(html.includes('id="contact"'));
  });

  it('renders lists with dot leaders', () => {
    const doc = parse('## Menu\n- Pasta ... $14\n- Fish ... $18');
    const html = render(doc);
    assert.ok(html.includes('Pasta'));
    assert.ok(html.includes('$14'));
  });

  it('renders CTA buttons from link-only paragraphs', () => {
    const doc = parse('## Section\n[About](about.md) — [Menu](menu.md)');
    const html = render(doc);
    assert.ok(html.includes('smd-cta-row'));
    assert.ok(html.includes('smd-cta-primary'));
  });

  it('skips animation classes when theme.animation is none', () => {
    const doc = parse('# Hello\nWorld');
    const html = render(doc, { animation: 'none' });
    assert.ok(!html.includes('smd-animate'));
  });

  it('renders columns', () => {
    const doc = parse('## Test\n|||\n### Col 1\nA\n---\n### Col 2\nB\n|||');
    const html = render(doc);
    assert.ok(html.includes('smd-columns'));
    assert.ok(html.includes('smd-column'));
    assert.ok(html.includes('Col 1'));
    assert.ok(html.includes('Col 2'));
  });

  it('renders carousel', () => {
    const doc = parse('::: carousel\n::: bg a.jpg\n# Slide 1\n:::\n---\n::: bg b.jpg\n# Slide 2\n:::\n:::');
    const html = render(doc);
    assert.ok(html.includes('smd-carousel'));
    assert.ok(html.includes('smd-carousel-slide'));
    assert.ok(html.includes('Slide 1'));
    assert.ok(html.includes('Slide 2'));
  });

  it('renders forms', () => {
    const doc = parse('::: form\nName*: {text}\nEmail: {email}\n[Send](POST /api)\n:::');
    const html = render(doc);
    assert.ok(html.includes('smd-form'));
    assert.ok(html.includes('type="text"'));
    assert.ok(html.includes('type="email"'));
    assert.ok(html.includes('Send'));
  });

  it('renders code blocks', () => {
    const doc = parse('## Code\n```javascript\nconst x = 1;\n```');
    const html = render(doc);
    assert.ok(html.includes('<pre><code'));
    assert.ok(html.includes('language-javascript'));
    assert.ok(html.includes('const x = 1;'));
  });

  it('renders blockquotes', () => {
    const doc = parse('## Test\n> A wise quote');
    const html = render(doc);
    assert.ok(html.includes('<blockquote>'));
  });

  it('renders alerts', () => {
    const doc = parse('## Test\n::: warning\nBe careful!\n:::');
    const html = render(doc);
    assert.ok(html.includes('smd-block-warning'));
  });

  it('renders each demo site without errors', () => {
    for (const site of ['giuseppe', 'nonprofit', 'portfolio', 'salon', 'wedding']) {
      const src = readSiteSource(site, 'index.smd');
      const doc = parse(src);
      const theme = loadTheme(site);
      const html = render(doc, theme);
      assert.ok(html.length > 100, `${site} produced meaningful HTML`);
    }
  });
});

describe('renderNav', () => {
  it('renders header into nav HTML', () => {
    const headerSrc = readSiteSource('giuseppe', 'header.smd');
    const doc = parse(headerSrc);
    const html = renderNav(doc, { nav: 'transparent' });
    assert.ok(html.includes('smd-nav'));
    assert.ok(html.includes('data-style="transparent"'));
    assert.ok(html.includes('smd-nav-brand'));
    assert.ok(html.includes('Menu'));
  });

  it('returns empty string for null doc', () => {
    assert.equal(renderNav(null), '');
  });
});

describe('renderFooter', () => {
  it('renders footer into footer HTML', () => {
    const footerSrc = readSiteSource('giuseppe', 'footer.smd');
    const doc = parse(footerSrc);
    const html = renderFooter(doc, { footer: 'centered' });
    assert.ok(html.includes('smd-footer'));
    assert.ok(html.includes('data-style="centered"'));
  });

  it('returns empty string for null doc', () => {
    assert.equal(renderFooter(null), '');
  });
});

describe('getThemeVars', () => {
  it('generates CSS custom properties', () => {
    const css = getThemeVars({ colors: { primary: '#ff0000' }, radius: 8 });
    assert.ok(css.includes('--primary: #ff0000'));
    assert.ok(css.includes('--radius: 8px'));
  });

  it('returns empty string for empty theme', () => {
    assert.equal(getThemeVars({}), '');
  });
});

describe('getGoogleFontsUrl', () => {
  it('generates font URL', () => {
    const url = getGoogleFontsUrl({ fonts: { heading: 'Playfair Display', body: 'Inter' } });
    assert.ok(url.includes('Playfair'));
    assert.ok(url.includes('Inter'));
  });

  it('deduplicates fonts', () => {
    const url = getGoogleFontsUrl({ fonts: { heading: 'Inter', body: 'Inter' } });
    assert.equal((url.match(/Inter/g) || []).length, 1);
  });

  it('returns null for no fonts', () => {
    assert.equal(getGoogleFontsUrl({}), null);
  });
});

describe('getThemeDataAttrs', () => {
  it('returns defaults', () => {
    const attrs = getThemeDataAttrs({});
    assert.equal(attrs['data-sections'], 'alternating');
    assert.equal(attrs['data-cards'], 'elevated');
  });

  it('respects overrides', () => {
    const attrs = getThemeDataAttrs({ sections: 'bold', cards: 'flat' });
    assert.equal(attrs['data-sections'], 'bold');
    assert.equal(attrs['data-cards'], 'flat');
  });
});

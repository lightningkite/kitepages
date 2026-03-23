import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from '../src/parser.mjs';
import { render, renderNav, renderFooter, renderBlock, inl, getThemeVars, getGoogleFontsUrl, getThemeDataAttrs } from '../src/renderer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sitesDir = join(__dirname, '..', 'sites');

function readSite(name, file) {
  return readFileSync(join(sitesDir, name, file), 'utf-8');
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

  it('renders large text', () => {
    assert.ok(inl('__12,847__').includes('smd-large'));
  });

  it('renders star ratings', () => {
    assert.ok(inl('★★★★★').includes('smd-stars'));
  });
});

describe('render', () => {
  it('renders a simple page', () => {
    const doc = parse('# Hello\nWorld');
    const html = render(doc);
    assert.ok(html.includes('<h1>Hello</h1>'));
    assert.ok(html.includes('smd-hero'));
  });

  it('renders sections with h2', () => {
    const doc = parse('## About\nSome text\n## Contact\nMore text');
    const html = render(doc);
    assert.ok(html.includes('smd-section'));
    assert.ok(html.includes('id="section-0"'));
    assert.ok(html.includes('id="section-1"'));
  });

  it('renders lists with dot leaders', () => {
    const doc = parse('## Menu\n- Pasta ... $14\n- Fish ... $18');
    const html = render(doc);
    assert.ok(html.includes('Pasta'));
    assert.ok(html.includes('$14'));
  });

  it('renders CTA buttons from link-only paragraphs', () => {
    const doc = parse('## Section\n[About](about.smd) — [Menu](menu.smd)');
    const html = render(doc);
    assert.ok(html.includes('smd-cta-row'));
    assert.ok(html.includes('smd-cta-primary'));
  });

  it('skips animation classes when theme.animation is none', () => {
    const doc = parse('# Hello\nWorld');
    const html = render(doc, { animation: 'none' });
    assert.ok(!html.includes('smd-animate'));
  });

  it('renders the giuseppe site without errors', () => {
    const src = readSite('giuseppe', 'index.smd');
    const doc = parse(src);
    const theme = JSON.parse(readSite('giuseppe', 'theme.json'));
    const html = render(doc, theme);
    assert.ok(html.includes("Giuseppe's Italian Restaurant"));
    assert.ok(html.includes('smd-carousel'));
    assert.ok(html.includes('smd-form'));
    assert.ok(html.includes('smd-columns'));
  });

  it('renders each demo site without errors', () => {
    for (const site of ['giuseppe', 'nonprofit', 'portfolio', 'salon', 'wedding']) {
      const src = readSite(site, 'index.smd');
      const doc = parse(src);
      const theme = JSON.parse(readSite(site, 'theme.json'));
      const html = render(doc, theme);
      assert.ok(html.length > 100, `${site} produced meaningful HTML`);
    }
  });
});

describe('renderNav', () => {
  it('renders header.smd into nav HTML', () => {
    const headerSrc = readSite('giuseppe', 'header.smd');
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
  it('renders footer.smd into footer HTML', () => {
    const footerSrc = readSite('giuseppe', 'footer.smd');
    const doc = parse(footerSrc);
    const html = renderFooter(doc, { footer: 'centered' });
    assert.ok(html.includes('smd-footer'));
    assert.ok(html.includes('data-style="centered"'));
    assert.ok(html.includes('smd-footer-title'));
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

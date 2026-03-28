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

  // Phase 2 inline features
  it('renders strikethrough', () => {
    assert.ok(inl('~~deleted~~').includes('<del>deleted</del>'));
  });

  it('renders highlighted text', () => {
    assert.ok(inl('==important==').includes('<mark>important</mark>'));
  });

  it('renders superscript', () => {
    assert.ok(inl('x^2^').includes('<sup>2</sup>'));
  });

  it('renders subscript', () => {
    assert.ok(inl('H~2~O').includes('<sub>2</sub>'));
  });

  it('does not confuse ~subscript~ with ~~strikethrough~~', () => {
    const html = inl('~~strike~~ and ~sub~');
    assert.ok(html.includes('<del>strike</del>'));
    assert.ok(html.includes('<sub>sub</sub>'));
  });

  it('autolinks bare URLs', () => {
    const html = inl('Visit https://example.com for more');
    assert.ok(html.includes('href="https://example.com"'));
    assert.ok(html.includes('>https://example.com<'));
  });

  it('does not double-link explicit links', () => {
    const html = inl('[Site](https://example.com)');
    // Should have exactly one <a> tag
    assert.equal((html.match(/<a /g) || []).length, 1);
  });

  it('applies smart typography — em dash', () => {
    assert.ok(inl('one -- two').includes('\u2014'));
  });

  it('applies smart typography — ellipsis', () => {
    assert.ok(inl('wait...').includes('\u2026'));
  });

  it('applies smart typography — copyright', () => {
    assert.ok(inl('(c) 2026').includes('\u00A9'));
  });

  it('applies smart typography — trademark', () => {
    assert.ok(inl('Brand(tm)').includes('\u2122'));
  });

  it('applies smart typography — curly double quotes', () => {
    const html = inl('She said "hello"');
    assert.ok(html.includes('\u201C'));
    assert.ok(html.includes('\u201D'));
  });

  it('does not apply smart typography inside code spans', () => {
    const html = inl('Use `--flag` in terminal');
    assert.ok(html.includes('--flag'));
    assert.ok(!html.includes('\u2014flag'));
  });

  // Icon / emoji shortcodes
  it('resolves emoji shortcodes', () => {
    assert.ok(inl(':heart:').includes('\u2764'));
    assert.ok(inl(':rocket:').includes('\u{1F680}'));
    assert.ok(inl(':check:').includes('\u2705'));
  });

  it('leaves unknown shortcodes as literal text', () => {
    assert.equal(inl(':nonexistent:'), ':nonexistent:');
  });

  it('does not match shortcodes inside URLs', () => {
    const html = inl('[link](https://example.com:8080/path)');
    // Should not try to match :8080 as an emoji
    assert.ok(html.includes(':8080'));
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

  it('renders tables', () => {
    const doc = parse('## Data\n| Name | Price |\n|------|-------|\n| Pasta | $14 |');
    const html = render(doc);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<th>'));
    assert.ok(html.includes('Pasta'));
    assert.ok(html.includes('$14'));
  });

  it('renders GFM alerts', () => {
    const doc = parse('## Info\n> [!NOTE]\n> Important info here.');
    const html = render(doc);
    assert.ok(html.includes('smd-block-note'));
  });

  it('renders task lists', () => {
    const doc = parse('## Tasks\n- [ ] Todo\n- [x] Done\n- [-] Partial');
    const html = render(doc);
    assert.ok(html.includes('smd-task-list'));
    assert.ok(html.includes('smd-task-item'));
    assert.ok(html.includes('smd-task-done'));
    assert.ok(html.includes('smd-task-partial'));
    assert.ok(html.includes('type="checkbox"'));
  });

  it('renders YouTube embeds from standalone URLs', () => {
    const doc = parse('## Video\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const html = render(doc);
    assert.ok(html.includes('smd-embed'));
    assert.ok(html.includes('youtube.com/embed/dQw4w9WgXcQ'));
  });

  it('renders {:toc} directive', () => {
    const doc = parse('{:toc}\n## First\nText\n## Second\nMore text');
    const html = render(doc);
    assert.ok(html.includes('smd-toc'));
    assert.ok(html.includes('href="#first"'));
    assert.ok(html.includes('href="#second"'));
  });

  it('renders inline math', () => {
    const doc = parse('## Math\nThe formula \\( E = mc^2 \\) is famous.');
    const html = render(doc);
    assert.ok(html.includes('smd-math'));
    assert.ok(html.includes('E = mc^2') || html.includes('E = mc'));
  });

  it('renders block math', () => {
    const doc = parse('## Equations\n\\[\nx^2 + y^2 = z^2\n\\]');
    const html = render(doc);
    assert.ok(html.includes('smd-math-block'));
  });

  it('renders images with sizing', () => {
    const doc = parse('## Gallery\n![Photo](img.jpg =300x200)');
    const html = render(doc);
    assert.ok(html.includes('width="300"'));
    assert.ok(html.includes('height="200"'));
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

describe('keyboard shortcuts', () => {
  it('renders [[key]] as kbd', () => {
    assert.ok(inl('Press [[Ctrl]]').includes('<kbd>Ctrl</kbd>'));
  });

  it('renders multiple kbd in one line', () => {
    const result = inl('Press [[Cmd]] + [[K]]');
    assert.ok(result.includes('<kbd>Cmd</kbd>'));
    assert.ok(result.includes('<kbd>K</kbd>'));
  });

  it('does not confuse [[kbd]] with [links](url)', () => {
    const result = inl('[Link](url) and [[Key]]');
    assert.ok(result.includes('<a href="url">Link</a>'));
    assert.ok(result.includes('<kbd>Key</kbd>'));
  });
});

describe('tabs rendering', () => {
  it('renders tabs with nav and panels', () => {
    const doc = parse('::: tabs\n::: tab Monthly\n### $12/mo\n:::\n---\n::: tab Annual\n### $8/mo\n:::\n:::');
    const html = render(doc);
    assert.ok(html.includes('smd-tabs'));
    assert.ok(html.includes('smd-tab-btn'));
    assert.ok(html.includes('Monthly'));
    assert.ok(html.includes('Annual'));
    assert.ok(html.includes('smd-tab-panel'));
  });
});

describe('featured columns', () => {
  it('renders featured column with special class', () => {
    const doc = parse('## Pricing\n|||\n### Free\nBasic\n---\n### Pro {featured}\nEverything\n---\n### Teams\nAll\n|||');
    const html = render(doc);
    assert.ok(html.includes('smd-column-featured'));
  });
});

describe('stats bar', () => {
  it('detects stats columns', () => {
    const doc = parse('## Stats\n|||\n### ++25,000++\nTeams\n---\n### ++50ms++\nResponse time\n---\n### ++10M++\nIssues\n|||');
    const html = render(doc);
    assert.ok(html.includes('smd-columns-stats'));
  });

  it('does not flag non-stats columns', () => {
    const doc = parse('## Features\n|||\n### Speed\nFast\n---\n### Scale\nBig\n|||');
    const html = render(doc);
    assert.ok(!html.includes('smd-columns-stats'));
  });
});

describe('video backgrounds', () => {
  it('renders video element for video bg', () => {
    const doc = parse('::: bg hero.mp4\n# Welcome\n:::');
    const html = render(doc);
    assert.ok(html.includes('<video'));
    assert.ok(html.includes('autoplay'));
    assert.ok(html.includes('muted'));
    assert.ok(html.includes('loop'));
    assert.ok(html.includes('hero.mp4'));
  });
});

describe('image showcase', () => {
  it('renders showcase class', () => {
    const doc = parse('![App](app.png){showcase}');
    const html = render(doc);
    assert.ok(html.includes('smd-img-showcase'));
  });

  it('renders browser frame', () => {
    const doc = parse('![App](app.png){frame}');
    const html = render(doc);
    assert.ok(html.includes('smd-browser-frame'));
    assert.ok(html.includes('smd-browser-dots'));
  });

  it('renders phone frame', () => {
    const doc = parse('![App](app.png){phone}');
    const html = render(doc);
    assert.ok(html.includes('smd-phone-frame'));
  });
});

describe('footer columns', () => {
  it('renders columns in footer', () => {
    const footerDoc = parse('# Brand\n|||\n### Product\n- [Features](#f)\n---\n### Company\n- [About](#a)\n|||');
    const html = renderFooter(footerDoc);
    assert.ok(html.includes('smd-footer-columns'));
    assert.ok(html.includes('smd-footer-col'));
    assert.ok(html.includes('smd-footer-col-title'));
    assert.ok(html.includes('smd-footer-col-links'));
  });
});

describe('nav inline formatting', () => {
  it('renders emoji shortcodes in nav brand', () => {
    const doc = parse('# :rocket: Brand\n- [Home](#)');
    const html = renderNav(doc);
    assert.ok(html.includes('\u{1F680}'));
    assert.ok(!html.includes(':rocket:'));
  });
});

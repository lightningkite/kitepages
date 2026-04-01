// Kite Pages Browser Runtime — DOM interactions, SPA navigation, animations, editor.
// This is the client-side entry point. Import via <script type="module">.

import { parse, parseYaml } from './parser.mjs';
import { render, renderNav, renderFooter, getGoogleFontsUrl } from './renderer.mjs';

let currentTheme = {};
let currentFile = null;

const PAGE_EXT = '.md';

// ===== Core: Load & Render =====

async function loadAndRender(url) {
  currentFile = url;
  const resp = await fetch(url);
  const src = await resp.text();
  const parsed = parse(src);
  const output = document.getElementById('output');
  output.innerHTML = render(parsed, currentTheme);
  if (parsed.frontmatter.title) document.title = parsed.frontmatter.title;
  if (parsed.frontmatter.description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = parsed.frontmatter.description;
  }
  await loadHeader();
  await loadFooter();
  initScrollAnimations();
  interceptPageLinks();
}

// ===== Page Transitions =====

function isPageLink(href) {
  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (/^https?:\/\//i.test(href)) return false;
  return href.endsWith('.md');
}

function interceptPageLinks() {
  const output = document.getElementById('output');
  output.removeEventListener('click', handlePageLinkClick);
  output.addEventListener('click', handlePageLinkClick);
}

function handlePageLinkClick(e) {
  const anchor = e.target.closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!isPageLink(href)) return;
  e.preventDefault();
  navigateToPage(href, true);
}

function resolvePagePath(href) {
  if (!currentFile) return href;
  const dir = currentFile.substring(0, currentFile.lastIndexOf('/') + 1);
  return dir + href;
}

async function navigateToPage(pageFile, pushState, direction) {
  const resolvedFile = pageFile.includes('/') ? pageFile : resolvePagePath(pageFile);
  const output = document.getElementById('output');
  const dir = direction || (pushState ? 'push' : 'pop');

  const scrollY = window.scrollY;
  const snapshot = output.cloneNode(true);
  snapshot.id = '';
  snapshot.className = 'kp-page kp-page-old';
  snapshot.style.position = 'fixed';
  snapshot.style.top = -scrollY + 'px';
  snapshot.style.left = '0';
  snapshot.style.right = '0';
  snapshot.style.width = '100%';
  snapshot.style.zIndex = '50';
  snapshot.style.pointerEvents = 'none';
  document.body.appendChild(snapshot);

  output.classList.add(dir === 'push' ? 'push-in' : 'pop-in');
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById('kp-nav-mount').innerHTML = '';
  await loadAndRender(resolvedFile);

  if (pushState) {
    const url = new URL(location.href);
    url.searchParams.set('file', resolvedFile);
    history.pushState({ pageFile: resolvedFile }, '', url.toString());
  }

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  snapshot.classList.add(dir === 'push' ? 'push-out' : 'pop-out');
  output.classList.remove('push-in', 'pop-in');

  snapshot.addEventListener('transitionend', () => snapshot.remove(), { once: true });
  setTimeout(() => snapshot.remove(), 500);
}

window.addEventListener('popstate', (e) => {
  const pageFile = e.state?.pageFile || (new URLSearchParams(location.search).get('file')) || 'example.md';
  navigateToPage(pageFile, false, 'pop');
});

// ===== Header =====

let _headerCache = null;
let _headerFetched = false;

async function loadHeader() {
  const mount = document.getElementById('kp-nav-mount');
  mount.innerHTML = '';

  if (!_headerFetched) {
    _headerFetched = true;
    const dir = currentFile ? currentFile.substring(0, currentFile.lastIndexOf('/') + 1) : '';
    try {
    let resp = await fetch(dir + 'header.md');
      if (resp.ok) _headerCache = parse(await resp.text());
    } catch {}
  }

  if (!_headerCache) return;

  const navHtml = renderNav(_headerCache, currentTheme);
  mount.innerHTML = navHtml;

  // Attach SPA link handlers to nav
  const nav = mount.querySelector('.kp-nav');
  if (!nav) return;

  // Brand link
  const brand = nav.querySelector('.kp-nav-brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      if (isPageLink('index.md')) {
        e.preventDefault();
        navigateToPage('index.md', true, 'pop');
      }
    });
  }

  // Nav links
  const ul = nav.querySelector('.kp-nav-links');
  if (ul) {
    ul.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.includes('#') && !href.endsWith('.md')) {
          const parts = href.split('#');
          const file = parts[0];
          const anchor = parts[1];
          if (!file || file === currentFile?.split('/').pop()) {
            e.preventDefault();
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
            ul.classList.remove('open');
            return;
          }
        }
        if (isPageLink(href)) {
          e.preventDefault();
          ul.classList.remove('open');
          navigateToPage(href, true, 'push');
        }
      });
    });
  }

  // Hamburger toggle
  const toggle = nav.querySelector('.kp-nav-toggle');
  if (toggle && ul) {
    toggle.addEventListener('click', () => ul.classList.toggle('open'));
  }

  // Scroll behavior
  let scrolled = false;
  const scrollHandler = () => {
    const isScrolled = window.scrollY > 80;
    if (isScrolled !== scrolled) {
      scrolled = isScrolled;
      nav.classList.toggle('scrolled', scrolled);
    }
  };
  window.removeEventListener('scroll', _navScrollHandler);
  _navScrollHandler = scrollHandler;
  window.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler();
}
let _navScrollHandler = () => {};

// ===== Footer =====

let _footerCache = null;
let _footerFetched = false;

async function loadFooter() {
  if (!_footerFetched) {
    _footerFetched = true;
    const dir = currentFile ? currentFile.substring(0, currentFile.lastIndexOf('/') + 1) : '';
    try {
      let resp = await fetch(dir + 'footer.md');
      if (resp.ok) _footerCache = parse(await resp.text());
    } catch {}
  }
  if (!_footerCache) return;

  const output = document.getElementById('output');
  const footerHtml = renderFooter(_footerCache, currentTheme);
  output.insertAdjacentHTML('beforeend', footerHtml);
}

// ===== Scroll Animations =====

function initScrollAnimations() {
  if (currentTheme.animation === 'none') {
    document.querySelectorAll('.kp-animate').forEach(el => {
      el.classList.remove('kp-animate');
      el.classList.add('kp-visible');
    });
    return;
  }
  document.querySelectorAll('.kp-hero.kp-animate').forEach(el => {
    setTimeout(() => el.classList.add('kp-visible'), 100);
  });
  const firstSection = document.querySelector('.kp-section.kp-animate');
  if (firstSection) setTimeout(() => firstSection.classList.add('kp-visible'), 200);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('kp-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

  document.querySelectorAll('.kp-animate:not(.kp-hero):not(.kp-visible)').forEach(el => observer.observe(el));
}

// ===== Carousel =====

const _carouselPauseUntil = {};
const _carouselTargetIdx = {};

function _carouselGoTo(id, idx) {
  const el = document.getElementById(id);
  if (!el) return;
  const track = el.querySelector('.kp-carousel-track');
  _carouselTargetIdx[id] = idx;
  track.style.transform = `translateX(-${idx * 100}%)`;
  el.querySelectorAll('.kp-carousel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

// Expose on window for onclick handlers in rendered HTML
window.carouselNav = function(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  const count = el.querySelectorAll('.kp-carousel-slide').length;
  const current = _carouselTargetIdx[id] || 0;
  const next = (current + dir + count) % count;
  _carouselGoTo(id, next);
  _carouselPauseUntil[id] = Date.now() + 10000;
};

window.carouselGo = function(id, idx) {
  _carouselGoTo(id, idx);
  _carouselPauseUntil[id] = Date.now() + 10000;
};

setInterval(() => {
  document.querySelectorAll('.kp-carousel').forEach(el => {
    const count = el.querySelectorAll('.kp-carousel-slide').length;
    if (count <= 1) return;
    if (_carouselPauseUntil[el.id] && Date.now() < _carouselPauseUntil[el.id]) return;
    const current = _carouselTargetIdx[el.id] || 0;
    _carouselGoTo(el.id, (current + 1) % count);
  });
}, 5000);

// ===== Tabs =====

window.tabSwitch = function(id, idx) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelectorAll('.kp-tab-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
  el.querySelectorAll('.kp-tab-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
};

// ===== Theme =====

function applyTheme(theme) {
  currentTheme = theme;
  const root = document.documentElement;

  root.setAttribute('data-sections', theme.sections || 'alternating');
  root.setAttribute('data-cards', theme.cards || 'elevated');
  root.setAttribute('data-animation', theme.animation || 'subtle');
  root.setAttribute('data-spacing', theme.spacing || 'normal');

  if (theme.colors) {
    const c = theme.colors;
    if (c.primary) root.style.setProperty('--primary', c.primary);
    if (c.primaryDark) root.style.setProperty('--primary-dark', c.primaryDark);
    if (c.primaryLight) root.style.setProperty('--primary-light', c.primaryLight);
    if (c.accent) root.style.setProperty('--accent', c.accent);
    if (c.background) root.style.setProperty('--bg', c.background);
    if (c.surface) root.style.setProperty('--surface', c.surface);
    if (c.surfaceWarm) root.style.setProperty('--surface-warm', c.surfaceWarm);
    if (c.text) root.style.setProperty('--text', c.text);
    if (c.textMuted) root.style.setProperty('--text-muted', c.textMuted);
    if (c.border) root.style.setProperty('--border', c.border);
    if (c.borderLight) root.style.setProperty('--border-light', c.borderLight);
  }
  if (theme.fonts) {
    const url = getGoogleFontsUrl(theme);
    if (url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
    if (theme.fonts.body) root.style.setProperty('--font-body', `'${theme.fonts.body}', Georgia, serif`);
    if (theme.fonts.heading) root.style.setProperty('--font-heading', `'${theme.fonts.heading}', Georgia, serif`);
  }
  if (theme.radius !== undefined) root.style.setProperty('--radius', theme.radius + 'px');
  if (theme.radiusLg !== undefined) root.style.setProperty('--radius-lg', theme.radiusLg + 'px');

  if (theme.mode === 'dark') {
    const c = theme.colors || {};
    root.style.setProperty('--bg', c.background || '#0f0f0f');
    root.style.setProperty('--surface', c.surface || '#1a1a1a');
    root.style.setProperty('--surface-warm', c.surfaceWarm || '#151515');
    root.style.setProperty('--text', c.text || '#e8e8e8');
    root.style.setProperty('--text-muted', c.textMuted || '#999');
    root.style.setProperty('--text-light', c.textLight || '#666');
    root.style.setProperty('--border', c.border || '#2a2a2a');
    root.style.setProperty('--border-light', c.borderLight || '#222');
  }
}

// ===== Boot =====

const params = new URLSearchParams(location.search);
const pageFile = params.get('file') || 'example.md';
const themeFile = params.get('theme');

async function boot() {
  if (themeFile) {
    try {
      const resp = await fetch(themeFile);
      const text = await resp.text();
      // Parse as YAML or JSON based on extension
      const theme = themeFile.endsWith('.yaml') || themeFile.endsWith('.yml')
        ? parseYaml(text)
        : JSON.parse(text);
      applyTheme(theme);
    } catch (e) { console.warn('Theme not found, using defaults'); }
  }
  await loadAndRender(pageFile);
  history.replaceState({ pageFile }, '', location.href);
}

boot();

// ===== Full Site Editor (dev tool) =====

let _editorOpen = false;
const _fileCache = {};  // filename → { content, dirty }
let _activeFile = null;
let _siteDir = '';
const CANDIDATE_FILES = [
  'index.md', 'header.md', 'footer.md', 'theme.yaml',
  'about.md', 'menu.md', 'contact.md', 'services.md', 'gallery.md',
  'blog.md', 'faq.md', '404.md', 'guide.md', 'examples.md',
  'pricing.md', 'team.md', 'portfolio.md', 'events.md',
];

function initEditor() {
  // Toggle button
  const btn = document.createElement('button');
  btn.className = 'kp-editor-toggle';
  btn.innerHTML = '&lt;/&gt;';
  btn.title = 'Toggle editor (E)';
  btn.addEventListener('click', toggleEditor);
  document.body.appendChild(btn);

  // Editor panel
  const panel = document.createElement('div');
  panel.className = 'kp-editor-panel';
  panel.id = 'kp-editor-panel';
  panel.innerHTML = `
    <div class="kp-editor-sidebar" id="kp-editor-sidebar">
      <div class="kp-editor-sidebar-header">Files</div>
      <ul class="kp-editor-files" id="kp-editor-files"></ul>
    </div>
    <div class="kp-editor-main">
      <div class="kp-editor-header">
        <strong id="kp-editor-filename">editor</strong>
        <span class="kp-editor-status" id="kp-editor-status">Press E to toggle</span>
      </div>
      <div class="kp-editor-toolbar" id="kp-editor-toolbar">
        <div class="kp-toolbar-row">
          <span class="kp-toolbar-label">Text</span>
          <button data-action="bold" title="Bold (Ctrl+B)"><b>B</b></button>
          <button data-action="italic" title="Italic (Ctrl+I)"><i>I</i></button>
          <button data-action="underline" title="Underline (Ctrl+U)"><u>U</u></button>
          <button data-action="strike" title="Strikethrough"><s>S</s></button>
          <button data-action="highlight" title="Highlight ==">==</button>
          <button data-action="large" title="Large text ++">++</button>
          <button data-action="superscript" title="Superscript ^">x&#8319;</button>
          <button data-action="subscript" title="Subscript ~">x&#8322;</button>
          <span class="kp-toolbar-sep"></span>
          <button data-action="code" title="Inline code">&lt;/&gt;</button>
          <button data-action="link" title="Link (Ctrl+K)">&#128279;</button>
          <button data-action="image" title="Image">&#128247;</button>
          <button data-action="math-inline" title="Inline math \\(x\\)">&#8721;</button>
        </div>
        <div class="kp-toolbar-row">
          <span class="kp-toolbar-label">Block</span>
          <button data-action="h1" title="Heading 1">H1</button>
          <button data-action="h2" title="Heading 2">H2</button>
          <button data-action="h3" title="Heading 3">H3</button>
          <span class="kp-toolbar-sep"></span>
          <button data-action="ul" title="Bullet list">&#8226; List</button>
          <button data-action="ol" title="Numbered list">1. List</button>
          <button data-action="task" title="Task list">&#9744; Task</button>
          <span class="kp-toolbar-sep"></span>
          <button data-action="quote" title="Blockquote &gt;">&gt; Quote</button>
          <button data-action="block-quote" title="Block quote &gt;&gt;&gt;">&#10077; Block</button>
          <button data-action="hr" title="Horizontal rule">&#8213; Rule</button>
          <button data-action="codeblock" title="Code block">&#96;&#96;&#96; Code</button>
          <button data-action="table" title="Table">&#9638; Table</button>
          <button data-action="math-block" title="Math block">&#8721; Math</button>
          <button data-action="toc" title="Table of contents">&#123;:toc&#125;</button>
        </div>
        <div class="kp-toolbar-row">
          <span class="kp-toolbar-label">Rich</span>
          <button data-action="columns" title="Columns |||">&#9638;&#9638; Columns</button>
          <button data-action="card" title="Card ::: card">&#9642; Card</button>
          <button data-action="testimonial" title="Testimonial ::: quote">&#10077; Testimonial</button>
          <button data-action="alert" title="Alert/note ::: warning">&#9888; Alert</button>
          <button data-action="bg-section" title="Background section ::: bg">&#127748; Background</button>
          <button data-action="carousel" title="Carousel ::: carousel">&#9654; Carousel</button>
          <button data-action="form" title="Form ::: form">&#128221; Form</button>
          <button data-action="expandable" title="Expandable &gt;|">&#9660; Expand</button>
          <button data-action="record" title="Record :: name">&#128203; Record</button>
        </div>
      </div>
      <div class="kp-editor-content">
        <div class="kp-editor-lines" id="kp-editor-lines"></div>
        <div class="kp-editor-code-wrap">
          <pre class="kp-editor-highlight" id="kp-editor-highlight"></pre>
          <textarea id="kp-editor-textarea" spellcheck="false" wrap="off"></textarea>
        </div>
      </div>
    </div>
  `;
  document.body.insertBefore(panel, document.getElementById('kp-nav-mount'));

  const textarea = document.getElementById('kp-editor-textarea');
  let debounceTimer = null;
  let rendering = false;
  textarea.addEventListener('input', () => {
    if (_activeFile) {
      _fileCache[_activeFile] = { content: textarea.value, dirty: true };
    }
    updateLineNumbers();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (rendering) return;
      rendering = true;
      requestAnimationFrame(() => {
        handleEditorChange(textarea.value);
        rendering = false;
      });
    }, 300);
  });

  textarea.addEventListener('scroll', () => {
    document.getElementById('kp-editor-lines').scrollTop = textarea.scrollTop;
    document.getElementById('kp-editor-highlight').scrollTop = textarea.scrollTop;
    document.getElementById('kp-editor-highlight').scrollLeft = textarea.scrollLeft;
  });

  textarea.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: unindent selected lines
        editorLineTransform(textarea, line => line.startsWith('  ') ? line.slice(2) : line);
      } else {
        // Tab: indent (or insert 2 spaces if no selection)
        if (textarea.selectionStart === textarea.selectionEnd) {
          const start = textarea.selectionStart;
          textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(start);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        } else {
          editorLineTransform(textarea, line => '  ' + line);
        }
      }
      textarea.dispatchEvent(new Event('input'));
      return;
    }
    if (mod && e.key === 's') { e.preventDefault(); navigator.clipboard.writeText(textarea.value).then(() => showEditorStatus('Copied to clipboard')); return; }
    if (mod && e.key === 'b') { e.preventDefault(); editorWrapSelection(textarea, '**', '**'); return; }
    if (mod && e.key === 'i') { e.preventDefault(); editorWrapSelection(textarea, '*', '*'); return; }
    if (mod && e.key === 'u') { e.preventDefault(); editorWrapSelection(textarea, '_', '_'); return; }
    if (mod && e.key === 'k') { e.preventDefault(); editorWrapSelection(textarea, '[', '](url)'); return; }
    // Shift+> on selected lines → blockquote prefix
    if (e.key === '>' && e.shiftKey && textarea.selectionStart !== textarea.selectionEnd) {
      e.preventDefault();
      editorLineTransform(textarea, line => '> ' + line);
      return;
    }
  });

  // Toolbar button clicks
  document.getElementById('kp-editor-toolbar').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    textarea.focus();
    const actions = {
      // Inline formatting
      bold:        () => editorWrapSelection(textarea, '**', '**'),
      italic:      () => editorWrapSelection(textarea, '*', '*'),
      underline:   () => editorWrapSelection(textarea, '_', '_'),
      strike:      () => editorWrapSelection(textarea, '~~', '~~'),
      highlight:   () => editorWrapSelection(textarea, '==', '=='),
      large:       () => editorWrapSelection(textarea, '++', '++'),
      superscript: () => editorWrapSelection(textarea, '^', '^'),
      subscript:   () => editorWrapSelection(textarea, '~', '~'),
      code:        () => editorWrapSelection(textarea, '`', '`'),
      link:        () => editorWrapSelection(textarea, '[', '](url)'),
      image:       () => editorInsertText(textarea, '\n![alt](image.jpg)\n'),
      'math-inline': () => editorWrapSelection(textarea, '\\(', '\\)'),

      // Headings
      h1:          () => editorLinePrefix(textarea, '# '),
      h2:          () => editorLinePrefix(textarea, '## '),
      h3:          () => editorLinePrefix(textarea, '### '),

      // Lists & line-level
      ul:          () => editorLineTransform(textarea, line => '- ' + line),
      ol:          () => { let n = 1; editorLineTransform(textarea, line => `${n++}. ` + line); },
      task:        () => editorLineTransform(textarea, line => '- [ ] ' + line),
      quote:       () => editorLineTransform(textarea, line => '> ' + line),
      hr:          () => editorInsertText(textarea, '\n---\n'),

      // Block-level inserts
      'block-quote': () => editorInsertText(textarea, '\n>>>\nQuoted text here.\n>>>\n'),
      codeblock:   () => editorInsertText(textarea, '\n```\ncode here\n```\n'),
      table:       () => editorInsertText(textarea, '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| cell     | cell     | cell     |\n'),
      'math-block': () => editorInsertText(textarea, '\n\\[\nx^2 + y^2 = z^2\n\\]\n'),
      toc:         () => editorInsertText(textarea, '\n{:toc}\n'),

      // Rich blocks
      columns:     () => editorInsertText(textarea, '\n|||\n### Column 1\nContent here\n---\n### Column 2\nContent here\n|||\n'),
      card:        () => editorInsertText(textarea, '\n::: card\n### Card Title\nCard description.\n:::\n'),
      testimonial: () => editorInsertText(textarea, '\n::: quote\n\u2605\u2605\u2605\u2605\u2605\nAmazing experience!\n\u2014 **Customer Name**\n:::\n'),
      alert:       () => editorInsertText(textarea, '\n::: warning\nImportant information here.\n:::\n'),
      'bg-section': () => editorInsertText(textarea, '\n::: bg image.jpg\n# Heading\nOverlay text on the image.\n:::\n'),
      carousel:    () => editorInsertText(textarea, '\n::: carousel\n::: bg slide1.jpg\n# Slide 1\nSubtitle\n:::\n---\n::: bg slide2.jpg\n# Slide 2\nSubtitle\n:::\n:::\n'),
      form:        () => editorInsertText(textarea, '\n::: form\nName*: {text}\nEmail*: {email}\nMessage: {paragraph}\n\n[Submit](POST /submit)\n:::\n'),
      expandable:  () => editorInsertText(textarea, '\n>| Click to expand\n   Hidden content goes here.\n   More details.\n'),
      record:      () => editorInsertText(textarea, '\n:: Item Name\n   Price: $10\n   Description of the item.\n'),
    };
    if (actions[action]) actions[action]();
  });
}

// ===== Editor text manipulation helpers =====

// Wrap the current selection with before/after markers (e.g. ** for bold)
function editorWrapSelection(ta, before, after) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  const replacement = before + (selected || 'text') + after;
  ta.value = ta.value.substring(0, start) + replacement + ta.value.substring(end);
  // Select the inner text (not the markers)
  ta.selectionStart = start + before.length;
  ta.selectionEnd = start + before.length + (selected || 'text').length;
  ta.dispatchEvent(new Event('input'));
}

// Insert text at cursor
function editorInsertText(ta, text) {
  const pos = ta.selectionStart;
  ta.value = ta.value.substring(0, pos) + text + ta.value.substring(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = pos + text.length;
  ta.dispatchEvent(new Event('input'));
}

// Transform each line in the selection (or current line if no selection)
function editorLineTransform(ta, fn) {
  const val = ta.value;
  let start = ta.selectionStart;
  let end = ta.selectionEnd;
  // Expand to full lines
  const lineStart = val.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = val.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = val.length;
  const lines = val.substring(lineStart, lineEnd).split('\n');
  const transformed = lines.map(fn).join('\n');
  ta.value = val.substring(0, lineStart) + transformed + val.substring(lineEnd);
  ta.selectionStart = lineStart;
  ta.selectionEnd = lineStart + transformed.length;
  ta.dispatchEvent(new Event('input'));
}

// Prefix the current line (or each selected line) with a heading marker, replacing any existing one
function editorLinePrefix(ta, prefix) {
  editorLineTransform(ta, line => {
    // Strip existing heading prefix
    const stripped = line.replace(/^#{1,6}\s+/, '');
    return prefix + stripped;
  });
}

function toggleEditor() {
  const panel = document.getElementById('kp-editor-panel');
  _editorOpen = !_editorOpen;
  panel.classList.toggle('open', _editorOpen);
  if (_editorOpen) discoverAndLoadFiles();
}

async function discoverAndLoadFiles() {
  _siteDir = currentFile ? currentFile.substring(0, currentFile.lastIndexOf('/') + 1) : '';
  const fileList = document.getElementById('kp-editor-files');
  fileList.innerHTML = '';

  const foundFiles = [];
  // Try fetching each candidate
  const checks = CANDIDATE_FILES.map(async (name) => {
    try {
      const resp = await fetch(_siteDir + name, { method: 'HEAD' });
      if (resp.ok) foundFiles.push(name);
    } catch {}
  });
  await Promise.all(checks);

  // Sort: theme first, then header/footer, then pages alphabetically
  const order = { 'theme.yaml': 0, 'header.md': 1, 'footer.md': 2 };
  foundFiles.sort((a, b) => (order[a] ?? 10) - (order[b] ?? 10) || a.localeCompare(b));

  for (const name of foundFiles) {
    const li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', () => switchFile(name));
    fileList.appendChild(li);
  }

  // Load current page file
  const currentName = currentFile ? currentFile.split('/').pop() : 'index.md';
  if (foundFiles.includes(currentName)) {
    await switchFile(currentName);
  } else if (foundFiles.length > 0) {
    await switchFile(foundFiles[0]);
  }
}

async function switchFile(name) {
  // Save current content to cache
  if (_activeFile) {
    _fileCache[_activeFile] = {
      content: document.getElementById('kp-editor-textarea').value,
      dirty: _fileCache[_activeFile]?.dirty || false,
    };
  }

  _activeFile = name;

  // Load from cache or fetch
  if (!_fileCache[name]) {
    try {
      const resp = await fetch(_siteDir + name);
      _fileCache[name] = { content: await resp.text(), dirty: false };
    } catch {
      _fileCache[name] = { content: '', dirty: false };
    }
  }

  const textarea = document.getElementById('kp-editor-textarea');
  textarea.value = _fileCache[name].content;
  document.getElementById('kp-editor-filename').textContent = name;
  updateLineNumbers();
  updateFileListHighlight();
}

function updateFileListHighlight() {
  const items = document.querySelectorAll('#kp-editor-files li');
  items.forEach(li => {
    li.classList.toggle('active', li.textContent === _activeFile);
  });
}

function updateLineNumbers() {
  const textarea = document.getElementById('kp-editor-textarea');
  const lines = textarea.value.split('\n');
  document.getElementById('kp-editor-lines').innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  updateHighlight(textarea.value);
}

// Syntax-aware highlighting — renders a styled version behind the transparent textarea
function updateHighlight(source) {
  const hl = document.getElementById('kp-editor-highlight');
  if (!hl) return;
  // Escape HTML, then apply syntax coloring
  let html = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Line-by-line highlighting
  html = html.split('\n').map(line => {
    // Frontmatter delimiters
    if (/^---\s*$/.test(line)) return `<span class="hl-meta">${line}</span>`;
    // Headings — sized visually
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)[1].length;
      return `<span class="hl-heading hl-h${level}">${line}</span>`;
    }
    // Fenced block markers
    if (/^(:::|\|\|\||&gt;&gt;&gt;)/.test(line)) return `<span class="hl-fence">${line}</span>`;
    // Horizontal rule / separator
    if (/^---+\s*$/.test(line)) return `<span class="hl-hr">${line}</span>`;
    // List items
    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const m = line.match(/^([-*]|\d+\.)\s/);
      return `<span class="hl-bullet">${m[0]}</span>${highlightInline(line.slice(m[0].length))}`;
    }
    // Blockquote prefix
    if (/^&gt;\s/.test(line)) return `<span class="hl-quote-prefix">${line}</span>`;
    // YAML-like key: value (in frontmatter or theme)
    if (/^\s*[\w-]+:/.test(line)) {
      return line.replace(/^(\s*)([\w-]+)(:)(.*)$/, '$1<span class="hl-key">$2</span><span class="hl-meta">$3</span><span class="hl-value">$4</span>');
    }
    return highlightInline(line);
  }).join('\n');

  // Trailing newline so the pre height matches
  hl.innerHTML = html + '\n';
}

function highlightInline(text) {
  return text
    // Bold
    .replace(/(\*\*\*(.+?)\*\*\*)/g, '<span class="hl-bold hl-italic">$1</span>')
    .replace(/(\*\*(.+?)\*\*)/g, '<span class="hl-bold">$1</span>')
    // Italic
    .replace(/(\*(.+?)\*)/g, '<span class="hl-italic">$1</span>')
    // Code spans
    .replace(/(`[^`]+`)/g, '<span class="hl-code">$1</span>')
    // Links
    .replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="hl-link">$1</span>')
    // Images
    .replace(/(!\[[^\]]*\]\([^)]+\))/g, '<span class="hl-link">$1</span>')
    // Large text
    .replace(/(\+\+.+?\+\+)/g, '<span class="hl-large">$1</span>')
    // Strikethrough
    .replace(/(~~.+?~~)/g, '<span class="hl-strike">$1</span>')
    // Highlight
    .replace(/(==.+?==)/g, '<span class="hl-mark">$1</span>');
}

function handleEditorChange(source) {
  if (!_activeFile) return;

  // Theme file — apply live
  if (_activeFile === 'theme.yaml') {
    try {
      const theme = parseYaml(source);
      applyTheme(theme);
    } catch {}
    return;
  }

  // Header/footer — re-render nav/footer
  if (_activeFile === 'header.md' || _activeFile === 'footer.md') {
    // For simplicity, just re-render the current page (it will pick up cached header/footer)
    // A full implementation would update the nav/footer independently
  }

  // Page file — live preview
  try {
    const parsed = parse(source);
    const output = document.getElementById('output');
    output.innerHTML = render(parsed, currentTheme);
    if (parsed.frontmatter.title) document.title = parsed.frontmatter.title;
    output.querySelectorAll('.kp-animate').forEach(el => el.classList.add('kp-visible'));
    interceptPageLinks();
  } catch (e) {
    console.debug('SMD render error (expected during editing):', e.message);
  }
}

function showEditorStatus(msg) {
  const el = document.getElementById('kp-editor-status');
  el.textContent = msg;
  setTimeout(() => { el.textContent = 'Live preview · Press E to toggle'; }, 2000);
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    toggleEditor();
  }
});

initEditor();

// Update editor on page nav
const _origLoadAndRender = loadAndRender;
loadAndRender = async function(url) {
  await _origLoadAndRender.call(this, url);
  if (_editorOpen) discoverAndLoadFiles();
};

// ===== Site Switcher (dev tool) =====

const DEMO_SITES = [
  { name: 'giuseppe', label: 'Giuseppe (Restaurant)' },
  { name: 'nonprofit', label: 'River Valley (Nonprofit)' },
  { name: 'portfolio', label: 'Sarah Chen (Portfolio)' },
  { name: 'salon', label: 'Bloom Studio (Salon)' },
  { name: 'wedding', label: 'Emma & James (Wedding)' },
];

function getCurrentSiteIndex() {
  const file = params.get('file') || '';
  return DEMO_SITES.findIndex(s => file.includes(s.name));
}

function goToSite(index) {
  const site = DEMO_SITES[index];
  if (!site) return;
  const curFile = params.get('file') || '';
  let base;
  const sitesMatch = curFile.match(/^(.*\/sites\/)[^/]+\//);
  if (sitesMatch) base = sitesMatch[1];
  else base = '../sites/';
  location.href = `${location.pathname}?file=${base}${site.name}/index.md&theme=${base}${site.name}/theme.yaml&_t=${Date.now()}`;
}

function showSiteIndicator(siteName) {
  let el = document.getElementById('kp-site-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'kp-site-indicator';
    el.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:8px 20px;border-radius:8px;font:13px/1.5 system-ui,sans-serif;z-index:9999;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.textContent = `${siteName}  ·  [ ] to cycle  ·  1-5 to jump`;
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  const cur = getCurrentSiteIndex();
  if (e.key === ']' || (e.key === 'ArrowRight' && e.altKey)) {
    e.preventDefault();
    goToSite((cur + 1) % DEMO_SITES.length);
  } else if (e.key === '[' || (e.key === 'ArrowLeft' && e.altKey)) {
    e.preventDefault();
    goToSite((cur - 1 + DEMO_SITES.length) % DEMO_SITES.length);
  } else if (e.key >= '1' && e.key <= '5') {
    e.preventDefault();
    goToSite(parseInt(e.key) - 1);
  }
});

const curIdx = getCurrentSiteIndex();
if (curIdx >= 0) setTimeout(() => showSiteIndicator(DEMO_SITES[curIdx].label), 500);

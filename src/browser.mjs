// SuperMarkdown Browser Runtime — DOM interactions, SPA navigation, animations, editor.
// This is the client-side entry point. Import via <script type="module">.

import { parse, parseYaml } from './parser.mjs';
import { render, renderNav, renderFooter, getGoogleFontsUrl } from './renderer.mjs';

let currentTheme = {};
let currentSmdFile = null;

// File extension: .md (with .smd fallback for transition)
const PAGE_EXT = '.md';

// ===== Core: Load & Render =====

async function loadAndRender(url) {
  currentSmdFile = url;
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
  interceptSmdLinks();
}

// ===== Page Transitions =====

function isSmdLink(href) {
  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (/^https?:\/\//i.test(href)) return false;
  return href.endsWith('.md') || href.endsWith('.smd');
}

function interceptSmdLinks() {
  const output = document.getElementById('output');
  output.removeEventListener('click', handleSmdLinkClick);
  output.addEventListener('click', handleSmdLinkClick);
}

function handleSmdLinkClick(e) {
  const anchor = e.target.closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!isSmdLink(href)) return;
  e.preventDefault();
  navigateToSmd(href, true);
}

function resolveSmdPath(href) {
  if (!currentSmdFile) return href;
  const dir = currentSmdFile.substring(0, currentSmdFile.lastIndexOf('/') + 1);
  return dir + href;
}

async function navigateToSmd(smdFile, pushState, direction) {
  const resolvedFile = smdFile.includes('/') ? smdFile : resolveSmdPath(smdFile);
  const output = document.getElementById('output');
  const dir = direction || (pushState ? 'push' : 'pop');

  const scrollY = window.scrollY;
  const snapshot = output.cloneNode(true);
  snapshot.id = '';
  snapshot.className = 'smd-page smd-page-old';
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
  document.getElementById('smd-nav-mount').innerHTML = '';
  await loadAndRender(resolvedFile);

  if (pushState) {
    const url = new URL(location.href);
    url.searchParams.set('file', resolvedFile);
    history.pushState({ smdFile: resolvedFile }, '', url.toString());
  }

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  snapshot.classList.add(dir === 'push' ? 'push-out' : 'pop-out');
  output.classList.remove('push-in', 'pop-in');

  snapshot.addEventListener('transitionend', () => snapshot.remove(), { once: true });
  setTimeout(() => snapshot.remove(), 500);
}

window.addEventListener('popstate', (e) => {
  const smdFile = e.state?.smdFile || (new URLSearchParams(location.search).get('file')) || 'example.smd';
  navigateToSmd(smdFile, false, 'pop');
});

// ===== Header =====

let _headerCache = null;
let _headerFetched = false;

async function loadHeader() {
  const mount = document.getElementById('smd-nav-mount');
  mount.innerHTML = '';

  if (!_headerFetched) {
    _headerFetched = true;
    const dir = currentSmdFile ? currentSmdFile.substring(0, currentSmdFile.lastIndexOf('/') + 1) : '';
    try {
      // Try .md first, fall back to .smd
    let resp = await fetch(dir + 'header.md');
    if (!resp.ok) resp = await fetch(dir + 'header.smd');
      if (resp.ok) _headerCache = parse(await resp.text());
    } catch {}
  }

  if (!_headerCache) return;

  const navHtml = renderNav(_headerCache, currentTheme);
  mount.innerHTML = navHtml;

  // Attach SPA link handlers to nav
  const nav = mount.querySelector('.smd-nav');
  if (!nav) return;

  // Brand link
  const brand = nav.querySelector('.smd-nav-brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      if (isSmdLink('index.md')) {
        e.preventDefault();
        navigateToSmd('index.md', true, 'pop');
      }
    });
  }

  // Nav links
  const ul = nav.querySelector('.smd-nav-links');
  if (ul) {
    ul.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.includes('#') && !href.endsWith('.smd')) {
          const parts = href.split('#');
          const file = parts[0];
          const anchor = parts[1];
          if (!file || file === currentSmdFile?.split('/').pop()) {
            e.preventDefault();
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
            ul.classList.remove('open');
            return;
          }
        }
        if (isSmdLink(href)) {
          e.preventDefault();
          ul.classList.remove('open');
          navigateToSmd(href, true, 'push');
        }
      });
    });
  }

  // Hamburger toggle
  const toggle = nav.querySelector('.smd-nav-toggle');
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
    const dir = currentSmdFile ? currentSmdFile.substring(0, currentSmdFile.lastIndexOf('/') + 1) : '';
    try {
      let resp = await fetch(dir + 'footer.md');
    if (!resp.ok) resp = await fetch(dir + 'footer.smd');
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
    document.querySelectorAll('.smd-animate').forEach(el => {
      el.classList.remove('smd-animate');
      el.classList.add('smd-visible');
    });
    return;
  }
  document.querySelectorAll('.smd-hero.smd-animate').forEach(el => {
    setTimeout(() => el.classList.add('smd-visible'), 100);
  });
  const firstSection = document.querySelector('.smd-section.smd-animate');
  if (firstSection) setTimeout(() => firstSection.classList.add('smd-visible'), 200);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('smd-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

  document.querySelectorAll('.smd-animate:not(.smd-hero):not(.smd-visible)').forEach(el => observer.observe(el));
}

// ===== Carousel =====

const _carouselPauseUntil = {};
const _carouselTargetIdx = {};

function _carouselGoTo(id, idx) {
  const el = document.getElementById(id);
  if (!el) return;
  const track = el.querySelector('.smd-carousel-track');
  _carouselTargetIdx[id] = idx;
  track.style.transform = `translateX(-${idx * 100}%)`;
  el.querySelectorAll('.smd-carousel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

// Expose on window for onclick handlers in rendered HTML
window.carouselNav = function(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  const count = el.querySelectorAll('.smd-carousel-slide').length;
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
  document.querySelectorAll('.smd-carousel').forEach(el => {
    const count = el.querySelectorAll('.smd-carousel-slide').length;
    if (count <= 1) return;
    if (_carouselPauseUntil[el.id] && Date.now() < _carouselPauseUntil[el.id]) return;
    const current = _carouselTargetIdx[el.id] || 0;
    _carouselGoTo(el.id, (current + 1) % count);
  });
}, 5000);

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
const smdFile = params.get('file') || 'example.md';
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
  await loadAndRender(smdFile);
  history.replaceState({ smdFile }, '', location.href);
}

boot();

// ===== Live Editor (dev tool) =====

let _editorOpen = false;

function initEditor() {
  const btn = document.createElement('button');
  btn.className = 'smd-editor-toggle';
  btn.innerHTML = '&lt;/&gt;';
  btn.title = 'Toggle editor (E)';
  btn.addEventListener('click', toggleEditor);
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.className = 'smd-editor-panel';
  panel.id = 'smd-editor-panel';
  panel.innerHTML = `
    <div class="smd-editor-header">
      <strong id="smd-editor-filename">editor</strong>
      <span>Live preview · Press E to toggle</span>
    </div>
    <textarea id="smd-editor-textarea" spellcheck="false"></textarea>
  `;
  document.body.insertBefore(panel, document.getElementById('smd-nav-mount'));

  const textarea = document.getElementById('smd-editor-textarea');
  let debounceTimer = null;
  let rendering = false;
  textarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (rendering) return;
      rendering = true;
      requestAnimationFrame(() => {
        renderFromSource(textarea.value);
        rendering = false;
      });
    }, 400);
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      textarea.dispatchEvent(new Event('input'));
    }
  });
}

function toggleEditor() {
  const panel = document.getElementById('smd-editor-panel');
  _editorOpen = !_editorOpen;
  panel.classList.toggle('open', _editorOpen);
  if (_editorOpen) loadSourceIntoEditor();
}

async function loadSourceIntoEditor() {
  if (!currentSmdFile) return;
  try {
    const resp = await fetch(currentSmdFile);
    document.getElementById('smd-editor-textarea').value = await resp.text();
    document.getElementById('smd-editor-filename').textContent = currentSmdFile.split('/').pop();
  } catch {}
}

let _renderingFromEditor = false;

function renderFromSource(source) {
  if (_renderingFromEditor) return;
  _renderingFromEditor = true;
  try {
    const parsed = parse(source);
    const output = document.getElementById('output');
    output.innerHTML = render(parsed, currentTheme);
    if (parsed.frontmatter.title) document.title = parsed.frontmatter.title;
    output.querySelectorAll('.smd-animate').forEach(el => el.classList.add('smd-visible'));
    interceptSmdLinks();
  } catch (e) {
    console.debug('SMD render error (expected during editing):', e.message);
  } finally {
    _renderingFromEditor = false;
  }
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
  if (_editorOpen) loadSourceIntoEditor();
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
  let el = document.getElementById('smd-site-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'smd-site-indicator';
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

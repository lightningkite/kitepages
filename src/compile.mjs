#!/usr/bin/env node
// SuperMarkdown Compiler — reads a site directory, produces static HTML files.
// Usage: node src/compile.mjs <site-dir> [--out <output-dir>]

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from './parser.mjs';
import { render, renderNav, renderFooter, getThemeVars, getGoogleFontsUrl, getThemeDataAttrs } from './renderer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readOptional(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return null; }
}

function compile(siteDir, outDir) {
  // Load theme
  const themeJson = readOptional(join(siteDir, 'theme.json'));
  const theme = themeJson ? JSON.parse(themeJson) : {};

  // For static output, disable animations (no JS to trigger them)
  const staticTheme = { ...theme, animation: 'none' };

  // Load header/footer
  const headerSrc = readOptional(join(siteDir, 'header.smd'));
  const footerSrc = readOptional(join(siteDir, 'footer.smd'));
  const headerDoc = headerSrc ? parse(headerSrc) : null;
  const footerDoc = footerSrc ? parse(footerSrc) : null;

  // Load CSS
  const css = readFileSync(join(__dirname, 'smd.css'), 'utf-8');
  const themeVars = getThemeVars(theme);
  const fontsUrl = getGoogleFontsUrl(theme);
  const dataAttrs = getThemeDataAttrs(theme);
  const dataAttrStr = Object.entries(dataAttrs).map(([k, v]) => `${k}="${v}"`).join(' ');

  // Find all .smd page files
  const smdFiles = readdirSync(siteDir)
    .filter(f => f.endsWith('.smd') && f !== 'header.smd' && f !== 'footer.smd');

  mkdirSync(outDir, { recursive: true });

  for (const file of smdFiles) {
    const src = readFileSync(join(siteDir, file), 'utf-8');
    const doc = parse(src);
    const title = doc.frontmatter.title || file.replace('.smd', '');
    const description = doc.frontmatter.description || '';

    const bodyHtml = render(doc, staticTheme);
    const navHtml = renderNav(headerDoc, theme);
    const footerHtml = renderFooter(footerDoc, theme);

    // Compose full HTML page
    let html = `<!DOCTYPE html>
<html lang="en" ${dataAttrStr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
${fontsUrl ? `<link rel="stylesheet" href="${fontsUrl}">` : ''}
<style>
${css}
${themeVars}
</style>
</head>
<body>
${navHtml ? `<div id="smd-nav-mount">${navHtml}</div>` : ''}
<div id="output" class="smd-page">
${bodyHtml}
${footerHtml}
</div>
<script>
// Minimal runtime: hamburger toggle, carousel, scroll-based nav
(function() {
  // Hamburger
  var toggle = document.querySelector('.smd-nav-toggle');
  var links = document.querySelector('.smd-nav-links');
  if (toggle && links) toggle.addEventListener('click', function() { links.classList.toggle('open'); });

  // Nav scroll
  var nav = document.querySelector('.smd-nav');
  if (nav) {
    var scrolled = false;
    window.addEventListener('scroll', function() {
      var s = window.scrollY > 80;
      if (s !== scrolled) { scrolled = s; nav.classList.toggle('scrolled', scrolled); }
    }, { passive: true });
  }

  // Carousel
  var state = {};
  var pauseUntil = {};
  function goTo(id, idx) {
    var el = document.getElementById(id);
    if (!el) return;
    state[id] = idx;
    el.querySelector('.smd-carousel-track').style.transform = 'translateX(-' + idx * 100 + '%)';
    el.querySelectorAll('.smd-carousel-dot').forEach(function(d, i) { d.classList.toggle('active', i === idx); });
  }
  window.carouselNav = function(id, dir) {
    var el = document.getElementById(id);
    if (!el) return;
    var count = el.querySelectorAll('.smd-carousel-slide').length;
    goTo(id, ((state[id] || 0) + dir + count) % count);
    pauseUntil[id] = Date.now() + 10000;
  };
  window.carouselGo = function(id, idx) {
    goTo(id, idx);
    pauseUntil[id] = Date.now() + 10000;
  };
  setInterval(function() {
    document.querySelectorAll('.smd-carousel').forEach(function(el) {
      var count = el.querySelectorAll('.smd-carousel-slide').length;
      if (count <= 1) return;
      if (pauseUntil[el.id] && Date.now() < pauseUntil[el.id]) return;
      goTo(el.id, ((state[el.id] || 0) + 1) % count);
    });
  }, 5000);
})();
</script>
</body>
</html>`;

    // Rewrite .smd links to .html
    html = html.replace(/href="([^"]*?)\.smd(#[^"]*)?"/g, 'href="$1.html$2"');

    const outFile = join(outDir, file.replace('.smd', '.html'));
    writeFileSync(outFile, html);
    console.log(`  ${file} → ${basename(outFile)}`);
  }

  // Copy images and other static assets
  const staticExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.pdf'];
  for (const file of readdirSync(siteDir)) {
    if (staticExts.some(ext => file.toLowerCase().endsWith(ext))) {
      const src = readFileSync(join(siteDir, file));
      writeFileSync(join(outDir, file), src);
    }
  }

  console.log(`\nCompiled ${smdFiles.length} page(s) to ${outDir}`);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node src/compile.mjs <site-dir> [--out <output-dir>]');
  process.exit(1);
}

const siteDir = args[0];
let outDir = join(siteDir, 'dist');
const outIdx = args.indexOf('--out');
if (outIdx !== -1 && args[outIdx + 1]) outDir = args[outIdx + 1];

if (!existsSync(siteDir)) {
  console.error(`Site directory not found: ${siteDir}`);
  process.exit(1);
}

console.log(`Compiling ${siteDir}...`);
compile(siteDir, outDir);

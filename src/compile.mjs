#!/usr/bin/env node
// SuperMarkdown Compiler — reads a site directory, produces static HTML files.
// Usage: node src/compile.mjs <site-dir> [--out <output-dir>]

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import hljs from 'highlight.js/lib/common';
import katex from 'katex';
import { parse } from './parser.mjs';
import { render, renderNav, renderFooter, getThemeVars, getGoogleFontsUrl, getThemeDataAttrs } from './renderer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readOptional(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return null; }
}

function loadTheme(siteDir) {
  // Try theme.yaml first, fall back to theme.json for backward compat
  const yamlSrc = readOptional(join(siteDir, 'theme.yaml'));
  if (yamlSrc) return yaml.load(yamlSrc) || {};

  const jsonSrc = readOptional(join(siteDir, 'theme.json'));
  if (jsonSrc) return JSON.parse(jsonSrc);

  return {};
}

function compile(siteDir, outDir) {
  const theme = loadTheme(siteDir);

  // For static output, disable animations (no JS to trigger them)
  const staticTheme = { ...theme, animation: 'none' };

  // Load header/footer (.md first, fall back to .smd)
  const headerSrc = readOptional(join(siteDir, 'header.md')) || readOptional(join(siteDir, 'header.smd'));
  const footerSrc = readOptional(join(siteDir, 'footer.md')) || readOptional(join(siteDir, 'footer.smd'));
  const headerDoc = headerSrc ? parse(headerSrc) : null;
  const footerDoc = footerSrc ? parse(footerSrc) : null;

  // Load CSS
  const css = readFileSync(join(__dirname, 'smd.css'), 'utf-8');
  const themeVars = getThemeVars(theme);
  const fontsUrl = getGoogleFontsUrl(theme);
  const dataAttrs = getThemeDataAttrs(theme);
  const dataAttrStr = Object.entries(dataAttrs).map(([k, v]) => `${k}="${v}"`).join(' ');

  // Find all page files (.md first, fall back to .smd)
  const allFiles = readdirSync(siteDir);
  let pageFiles = allFiles.filter(f => f.endsWith('.md') && f !== 'header.md' && f !== 'footer.md');
  if (pageFiles.length === 0) {
    // Backward compat: try .smd files
    pageFiles = allFiles.filter(f => f.endsWith('.smd') && f !== 'header.smd' && f !== 'footer.smd');
  }

  mkdirSync(outDir, { recursive: true });

  for (const file of pageFiles) {
    const src = readFileSync(join(siteDir, file), 'utf-8');
    const doc = parse(src);
    const title = doc.frontmatter.title || file.replace(/\.(md|smd)$/, '');
    const description = doc.frontmatter.description || '';

    // Skip drafts
    if (doc.frontmatter.draft) continue;

    const bodyHtml = render(doc, staticTheme);
    const navHtml = renderNav(headerDoc, theme);
    const footerHtml = renderFooter(footerDoc, theme);

    const image = doc.frontmatter.image || '';

    // Open Graph meta tags
    const ogTags = [
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:type" content="website">`,
      description ? `<meta property="og:description" content="${escapeHtml(description)}">` : '',
      image ? `<meta property="og:image" content="${escapeHtml(image)}">` : '',
    ].filter(Boolean).join('\n');

    let html = `<!DOCTYPE html>
<html lang="en" ${dataAttrStr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
${ogTags}
${fontsUrl ? `<link rel="stylesheet" href="${fontsUrl}">` : ''}
<style>
${css}
${themeVars}
</style>
</head>
<body>
${navHtml ? `<div id="smd-nav-mount">${navHtml}</div>` : ''}
<main id="smd-content" class="smd-page">
${bodyHtml}
${footerHtml}
</main>
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

    // Syntax highlighting in code blocks
    html = html.replace(/<pre><code class="language-([\w.-]+)">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
      try {
        const decoded = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const result = hljs.highlight(decoded, { language: lang, ignoreIllegals: true });
        return `<pre><code class="language-${lang} hljs">${result.value}</code></pre>`;
      } catch { return match; }
    });

    // Math rendering with KaTeX
    // Block math
    html = html.replace(/<div class="smd-math smd-math-block">([\s\S]*?)<\/div>/g, (match, tex) => {
      try {
        const decoded = tex.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        return `<div class="smd-math smd-math-block">${katex.renderToString(decoded, { displayMode: true, throwOnError: false })}</div>`;
      } catch { return match; }
    });
    // Inline math
    html = html.replace(/<span class="smd-math">([\s\S]*?)<\/span>/g, (match, tex) => {
      try {
        const decoded = tex.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        return `<span class="smd-math">${katex.renderToString(decoded, { displayMode: false, throwOnError: false })}</span>`;
      } catch { return match; }
    });

    // Add KaTeX CSS if math was used
    if (html.includes('class="katex"')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">\n</head>');
    }

    // Rewrite .md and .smd links to .html
    html = html.replace(/href="([^"]*?)\.md(#[^"]*)?"/g, 'href="$1.html$2"');
    html = html.replace(/href="([^"]*?)\.smd(#[^"]*)?"/g, 'href="$1.html$2"');

    const outFile = join(outDir, file.replace(/\.(md|smd)$/, '.html'));
    writeFileSync(outFile, html);
    console.log(`  ${file} → ${basename(outFile)}`);
  }

  // Copy images and other static assets
  const staticExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.pdf'];
  for (const file of allFiles) {
    if (staticExts.some(ext => file.toLowerCase().endsWith(ext))) {
      const src = readFileSync(join(siteDir, file));
      writeFileSync(join(outDir, file), src);
    }
  }

  // Validate links and images (skip content inside code blocks)
  const warnings = [];
  for (const file of pageFiles) {
    const src = readFileSync(join(siteDir, file), 'utf-8')
      .replace(/```[\s\S]*?```/g, '')   // Strip fenced code blocks
      .replace(/`[^`]+`/g, '');          // Strip inline code
    // Check internal links
    const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
    let m;
    while ((m = linkPattern.exec(src)) !== null) {
      const href = m[2].split('#')[0]; // Strip anchor
      if (!href || /^https?:\/\//.test(href) || /^mailto:/.test(href) || /^(POST|GET|PUT|DELETE)\s/.test(href)) continue;
      const target = join(siteDir, href);
      if (!existsSync(target)) {
        warnings.push(`${file}: broken link → ${href}`);
      }
    }
    // Check image sources
    const imgPattern = /!\[[^\]]*\]\(([^)\s]+)/g;
    while ((m = imgPattern.exec(src)) !== null) {
      const imgSrc = m[1];
      if (/^https?:\/\//.test(imgSrc) || /^data:/.test(imgSrc)) continue;
      if (!existsSync(join(siteDir, imgSrc))) {
        warnings.push(`${file}: missing image → ${imgSrc}`);
      }
    }
  }
  if (warnings.length > 0) {
    console.warn(`\n⚠ ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  ${w}`);
  }

  // Generate sitemap.xml
  const compiledPages = pageFiles
    .filter(f => { const d = parse(readFileSync(join(siteDir, f), 'utf-8')); return !d.frontmatter.draft; })
    .map(f => f.replace(/\.(md|smd)$/, '.html'));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${compiledPages.map(p => `  <url><loc>${p}</loc></url>`).join('\n')}
</urlset>`;
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap);

  console.log(`\nCompiled ${compiledPages.length} page(s) + sitemap.xml to ${outDir}`);
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

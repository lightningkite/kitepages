// SuperMarkdown Renderer — pure functions, no DOM dependencies.
// render(doc, theme) → HTML string

import { parseBlocks } from './parser.mjs';

// Inline formatting
export function inl(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<span class="smd-large">$1</span>')
    .replace(/_(.+?)_/g, '<u>$1</u>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/([★☆⭐]{2,})/g, '<span class="smd-stars">$1</span>');
}

// Main render: document AST + theme → HTML body string
export function render(doc, theme = {}) {
  const blocks = doc.blocks;
  let html = '';
  let i = 0;
  let sectionIndex = 0;
  const anim = theme.animation || 'subtle';

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'heading' && block.level === 1) {
      html += `<header class="smd-hero ${anim !== 'none' ? 'smd-animate' : ''}">`;
      html += `<h1>${inl(block.text)}</h1>`;
      i++;
      if (i < blocks.length && blocks[i].type === 'paragraph') {
        html += `<p class="smd-subtitle">${inl(blocks[i].text)}</p>`;
        i++;
      }
      html += '</header>';
      continue;
    }

    if (block.type === 'heading' && block.level === 2) {
      const altClass = sectionIndex % 2 === 1 ? ' smd-section-alt' : '';
      const animClass = anim !== 'none' ? ' smd-animate' : '';
      html += `<section class="smd-section${altClass}${animClass}" id="section-${sectionIndex}">`;
      html += `<h2>${inl(block.text)}</h2>`;
      html += `<hr class="smd-section-rule">`;
      i++;
      html += renderSectionContent(blocks, i, anim);
      i = findNextH2(blocks, i);
      html += '</section>';
      sectionIndex++;
      continue;
    }

    if (block.type === 'carousel') {
      html += renderCarousel(block);
      i++; continue;
    }

    if (block.type === 'bg-section') {
      html += renderBgSection(block);
      i++; continue;
    }

    if (block.type === 'image') {
      const images = collectRun(blocks, i, 'image');
      html += renderGallery(images);
      i += images.length;
      continue;
    }

    html += renderBlock(block);
    i++;
  }

  return html;
}

function renderSectionContent(blocks, startIdx, anim) {
  const sectionBlocks = [];
  let i = startIdx;
  while (i < blocks.length && !(blocks[i].type === 'heading' && blocks[i].level <= 2)) {
    sectionBlocks.push(blocks[i]); i++;
  }
  return renderBlockList(sectionBlocks, anim);
}

function renderBlockList(blocks, anim) {
  let html = '';
  let j = 0;
  while (j < blocks.length) {
    const b = blocks[j];
    if (b.type === 'columns-start') {
      j++;
      const columns = [[]];
      while (j < blocks.length && blocks[j].type !== 'columns-end') {
        if (blocks[j].type === 'column-break') {
          columns.push([]);
        } else {
          columns[columns.length - 1].push(blocks[j]);
        }
        j++;
      }
      if (j < blocks.length) j++;
      const nonEmpty = columns.filter(c => c.length > 0);
      if (nonEmpty.length > 0) html += renderColumnsGroup(nonEmpty, anim);
      continue;
    }
    if (b.type === 'column-break' || b.type === 'columns-end') { j++; continue; }
    if (b.type === 'image') {
      const imgs = collectRunFrom(blocks, j, 'image');
      html += renderGallery(imgs); j += imgs.length; continue;
    }
    html += renderBlock(b);
    j++;
  }
  return html;
}

function renderColumnsGroup(columns, anim) {
  if (columns.length === 1) {
    let html = '';
    for (const b of columns[0]) html += renderBlock(b, 'column');
    return html;
  }
  let html = '<div class="smd-columns">';
  for (const col of columns) {
    html += '<div class="smd-column">';
    for (const b of col) html += renderBlock(b, 'column');
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function collectRun(blocks, idx, type) {
  const r = []; while (idx < blocks.length && blocks[idx].type === type) r.push(blocks[idx++]); return r;
}
function collectRunFrom(arr, idx, type) {
  const r = []; while (idx < arr.length && arr[idx].type === type) r.push(arr[idx++]); return r;
}
function findNextH2(blocks, idx) {
  while (idx < blocks.length && !(blocks[idx].type === 'heading' && blocks[idx].level <= 2)) idx++;
  return idx;
}

export function renderCarousel(block) {
  const id = 'carousel-' + Math.random().toString(36).slice(2, 8);
  let html = `<div class="smd-carousel" id="${id}">`;
  html += '<div class="smd-carousel-track">';
  block.slides.forEach((slideBlocks) => {
    html += '<div class="smd-carousel-slide">';
    for (const b of slideBlocks) {
      if (b.type === 'bg-section') html += renderBgSection(b);
      else html += renderBlock(b);
    }
    html += '</div>';
  });
  html += '</div>';
  if (block.slides.length > 1) {
    html += `<button class="smd-carousel-btn smd-carousel-prev" onclick="carouselNav('${id}',-1)" aria-label="Previous">&lsaquo;</button>`;
    html += `<button class="smd-carousel-btn smd-carousel-next" onclick="carouselNav('${id}',1)" aria-label="Next">&rsaquo;</button>`;
    html += '<div class="smd-carousel-dots">';
    block.slides.forEach((_, idx) => {
      html += `<button class="smd-carousel-dot${idx === 0 ? ' active' : ''}" onclick="carouselGo('${id}',${idx})" aria-label="Slide ${idx+1}"></button>`;
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderBgSection(block) {
  let html = `<div class="smd-bg-section" style="background-image:url('${block.bgImage}')">`;
  html += '<div class="smd-bg-overlay">';
  for (const b of block.blocks) {
    if (b.type === 'heading' && b.level === 1) {
      html += `<h1>${inl(b.text)}</h1>`;
    } else if (b.type === 'heading') {
      html += `<h${b.level}>${inl(b.text)}</h${b.level}>`;
    } else {
      html += renderBlock(b);
    }
  }
  html += '</div></div>';
  return html;
}

function renderGallery(images) {
  const n = images.length;
  let html = `<figure class="smd-gallery count-${Math.min(n, 4)}">`;
  for (const img of images) html += `<img src="${img.src}" alt="${img.alt}" loading="lazy">`;
  html += '</figure>';
  return html;
}

function isLinkOnlyParagraph(text) {
  const stripped = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '').replace(/[\s—\-|,]+/g, '');
  return stripped.length === 0 && /\[([^\]]+)\]\(([^)]+)\)/.test(text);
}

function renderCtaRow(text) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let links = [];
  while ((match = linkPattern.exec(text)) !== null) {
    links.push({ label: match[1], href: match[2] });
  }
  let html = '<div class="smd-cta-row">';
  links.forEach((link, idx) => {
    const cls = idx === 0 ? 'smd-cta-primary' : 'smd-cta-secondary';
    html += `<a href="${link.href}" class="${cls}">${link.label}</a>`;
  });
  html += '</div>';
  return html;
}

export function renderBlock(block, context) {
  switch (block.type) {
    case 'heading':
      return `<h${block.level}>${inl(block.text)}</h${block.level}>`;
    case 'paragraph':
      if (isLinkOnlyParagraph(block.text)) return renderCtaRow(block.text);
      return `<p>${inl(block.text)}</p>`;
    case 'list': return '<ul>' + block.items.map(item => {
      const dotLeaderMatch = item.match(/^(.+?)\s*\.{3,}\s*(.+)$/);
      if (dotLeaderMatch) return `<li><span>${inl(dotLeaderMatch[1])}</span><span style="color:var(--text-muted);white-space:nowrap">${inl(dotLeaderMatch[2])}</span></li>`;
      return `<li>${inl(item)}</li>`;
    }).join('') + '</ul>';
    case 'hr': return '<hr style="border:none;border-top:1px solid var(--border);margin:32px 0;">';
    case 'form': return renderForm(block.content);
    case 'image': return `<img src="${block.src}" alt="${block.alt}" style="max-width:100%;border-radius:var(--radius);">`;
    case 'fenced': return renderFenced(block);
    default: return '';
  }
}

function renderForm(form) {
  const method = form.action?.method || 'POST';
  const url = form.action?.url || '#';
  let html = `<form class="smd-form" method="${method}" action="${url}">`;
  for (const group of form.groups) {
    html += '<div class="smd-form-group">';
    for (const field of group) {
      const id = field.label.toLowerCase().replace(/\s+/g, '-');
      const req = field.required ? ' required' : '';
      const ph = field.placeholder ? ` placeholder="${field.placeholder}"` : '';
      html += '<div class="smd-field">';
      html += `<label for="${id}">${field.label}${field.required ? ' *' : ''}</label>`;
      if (field.fieldType === 'paragraph') {
        html += `<textarea id="${id}" name="${id}"${ph}${req}></textarea>`;
      } else if (field.fieldType === 'select') {
        html += `<select id="${id}" name="${id}"${req}>`;
        html += `<option value="" disabled selected>Select...</option>`;
        for (const opt of field.options) html += `<option value="${opt}">${opt}</option>`;
        html += '</select>';
      } else {
        html += `<input type="${field.fieldType}" id="${id}" name="${id}"${ph}${req}>`;
      }
      html += '</div>';
    }
    html += '</div>';
  }
  if (form.action) html += `<button type="submit">${form.action.label}</button>`;
  html += '</form>';
  return html;
}

function renderFenced(block) {
  const type = block.sectionType.toLowerCase().replace(/\s+/g, '-');
  const innerBlocks = parseBlocks(block.rawLines.join('\n'));
  let html = `<div class="smd-block smd-block-${type}">`;
  for (const b of innerBlocks) html += renderBlock(b);
  html += '</div>';
  return html;
}

// Render header.smd AST into nav HTML string
export function renderNav(headerDoc, theme = {}) {
  if (!headerDoc) return '';
  const navStyle = theme.nav || 'transparent';
  const blocks = headerDoc.blocks;
  const h1 = blocks.find(b => b.type === 'heading' && b.level === 1);
  const list = blocks.find(b => b.type === 'list');

  let html = `<nav class="smd-nav" data-style="${navStyle}">`;
  if (h1) {
    html += `<a class="smd-nav-brand" href="index.smd">${h1.text}</a>`;
  }
  html += '<ul class="smd-nav-links">';
  if (list) {
    for (const item of list.items) {
      html += `<li>${inl(item)}</li>`;
    }
  }
  html += '</ul>';
  html += '<button class="smd-nav-toggle" aria-label="Menu"><span></span></button>';
  html += '</nav>';
  return html;
}

// Render footer.smd AST into footer HTML string
export function renderFooter(footerDoc, theme = {}) {
  if (!footerDoc) return '';
  const footerStyle = theme.footer || 'minimal';
  const blocks = footerDoc.blocks;

  let html = `<footer class="smd-footer" data-style="${footerStyle}">`;
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1) {
      html += `<div class="smd-footer-title">${inl(block.text)}</div>`;
    } else if (block.type === 'list') {
      html += '<div class="smd-footer-links">';
      for (const item of block.items) html += inl(item) + ' ';
      html += '</div>';
    } else if (block.type === 'paragraph') {
      html += `<div class="smd-footer-copy">${inl(block.text)}</div>`;
    }
  }
  html += '</footer>';
  return html;
}

// Generate CSS custom property overrides from theme config
export function getThemeVars(theme = {}) {
  const lines = [];
  if (theme.colors) {
    const c = theme.colors;
    if (c.primary) lines.push(`--primary: ${c.primary};`);
    if (c.primaryDark) lines.push(`--primary-dark: ${c.primaryDark};`);
    if (c.primaryLight) lines.push(`--primary-light: ${c.primaryLight};`);
    if (c.accent) lines.push(`--accent: ${c.accent};`);
    if (c.background) lines.push(`--bg: ${c.background};`);
    if (c.surface) lines.push(`--surface: ${c.surface};`);
    if (c.surfaceWarm) lines.push(`--surface-warm: ${c.surfaceWarm};`);
    if (c.text) lines.push(`--text: ${c.text};`);
    if (c.textMuted) lines.push(`--text-muted: ${c.textMuted};`);
    if (c.border) lines.push(`--border: ${c.border};`);
    if (c.borderLight) lines.push(`--border-light: ${c.borderLight};`);
  }
  if (theme.mode === 'dark') {
    const c = theme.colors || {};
    lines.push(`--bg: ${c.background || '#0f0f0f'};`);
    lines.push(`--surface: ${c.surface || '#1a1a1a'};`);
    lines.push(`--surface-warm: ${c.surfaceWarm || '#151515'};`);
    lines.push(`--text: ${c.text || '#e8e8e8'};`);
    lines.push(`--text-muted: ${c.textMuted || '#999'};`);
    lines.push(`--text-light: ${c.textLight || '#666'};`);
    lines.push(`--border: ${c.border || '#2a2a2a'};`);
    lines.push(`--border-light: ${c.borderLight || '#222'};`);
  }
  if (theme.fonts) {
    if (theme.fonts.body) lines.push(`--font-body: '${theme.fonts.body}', Georgia, serif;`);
    if (theme.fonts.heading) lines.push(`--font-heading: '${theme.fonts.heading}', Georgia, serif;`);
  }
  if (theme.radius !== undefined) lines.push(`--radius: ${theme.radius}px;`);
  if (theme.radiusLg !== undefined) lines.push(`--radius-lg: ${theme.radiusLg}px;`);

  if (lines.length === 0) return '';
  return `:root {\n  ${lines.join('\n  ')}\n}`;
}

// Generate Google Fonts <link> URL from theme
export function getGoogleFontsUrl(theme = {}) {
  if (!theme.fonts) return null;
  const families = [];
  if (theme.fonts.heading) families.push(theme.fonts.heading);
  if (theme.fonts.body) families.push(theme.fonts.body);
  if (theme.fonts.accent) families.push(theme.fonts.accent);
  const unique = [...new Set(families)];
  if (unique.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${unique.map(f => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`).join('&')}&display=swap`;
}

// Data attributes to set on <html> for CSS selectors
export function getThemeDataAttrs(theme = {}) {
  return {
    'data-sections': theme.sections || 'alternating',
    'data-cards': theme.cards || 'elevated',
    'data-animation': theme.animation || 'subtle',
    'data-spacing': theme.spacing || 'normal',
  };
}

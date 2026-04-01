// Kite Pages Renderer — pure functions, no DOM dependencies.
// render(doc, theme) → HTML string

// ============================================================
// Inline formatting
// ============================================================

export function inl(text) {
  if (!text) return '';
  let s = text;
  // Newlines → <br>
  s = s.replace(/\n/g, '<br>');

  // Extract code spans and inline math — nothing is parsed inside them.
  // Replace with placeholders, restore after all formatting + typography.
  const codeSpans = [];
  s = s.replace(/`([^`]+)`/g, (_, content) => {
    codeSpans.push(`<code>${content}</code>`);
    return `\x00C${codeSpans.length - 1}\x00`;
  });
  // Inline math \( ... \)
  const mathSpans = [];
  s = s.replace(/\\\((.+?)\\\)/g, (_, content) => {
    mathSpans.push(`<span class="kp-math">${escapeHtml(content)}</span>`);
    return `\x00M${mathSpans.length - 1}\x00`;
  });

  // Keyboard shortcuts [[key]]
  s = s.replace(/\[\[([^\]]+)\]\]/g, '<kbd>$1</kbd>');

  // Strikethrough (GFM)
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Highlighted (markdown-it-mark)
  s = s.replace(/==(.+?)==/g, '<mark>$1</mark>');
  // Bold italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Large text (++text++)
  s = s.replace(/\+\+(.+?)\+\+/g, '<span class="kp-large">$1</span>');
  // Superscript (Pandoc)
  s = s.replace(/\^([^\^]+)\^/g, '<sup>$1</sup>');
  // Subscript (Pandoc — single ~, after ~~ is already consumed)
  s = s.replace(/~([^~]+)~/g, '<sub>$1</sub>');
  // Underline
  s = s.replace(/_(.+?)_/g, '<u>$1</u>');
  // Inline images with optional attrs: ![alt](url){avatar}
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]+)\})?/g, (_, alt, src, attrs) => {
    const eSrc = escapeHtml(src), eAlt = escapeHtml(alt);
    if (attrs === 'avatar') return `<img src="${eSrc}" alt="${eAlt}" class="kp-img-avatar" loading="lazy">`;
    return `<img src="${eSrc}" alt="${eAlt}" loading="lazy" style="max-width:100%;vertical-align:middle;">`;
  });
  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => `<a href="${escapeHtml(href)}">${text}</a>`);
  // Star ratings
  s = s.replace(/([★☆⭐]{2,})/g, '<span class="kp-stars">$1</span>');
  // Autolinks — bare URLs not already in HTML attributes
  s = s.replace(/(?<![="'>\/])(https?:\/\/[^\s<>)\]"']+)/g, '<a href="$1">$1</a>');
  // Icon / emoji shortcodes — :name: → emoji (falls back to literal if no match)
  s = s.replace(/:([a-z][a-z0-9-]*):/g, (match, name) => {
    const emoji = EMOJI_MAP[name];
    if (emoji) return emoji;
    return match; // No match — leave as literal :name:
  });
  // Smart typography (applied last, only to text outside HTML tags)
  s = smartTypography(s);

  // Restore code spans and math spans
  s = s.replace(/\x00C(\d+)\x00/g, (_, idx) => codeSpans[parseInt(idx)]);
  s = s.replace(/\x00M(\d+)\x00/g, (_, idx) => mathSpans[parseInt(idx)]);
  return s;
}

// ============================================================
// Smart typography — curly quotes, em dashes, ellipsis, symbols
// Only applied to text segments, not inside HTML tags.
// ============================================================

function smartTypography(s) {
  const parts = s.split(/(<[^>]+>)/);
  return parts.map((part, i) => {
    // Odd indices are HTML tags — skip
    if (i % 2 === 1) return part;
    return applyTypography(part);
  }).join('');
}

function applyTypography(text) {
  let s = text;
  // Em dash: convert -- or --- when preceded by a word char or space (not flag-like --help)
  s = s.replace(/([\w\s])-{2,3}(?=[\w\s])/g, (match, before) => before + '\u2014');
  // Ellipsis (... directly after a word character)
  s = s.replace(/(\w)\.\.\./g, '$1\u2026');
  // Symbols
  s = s.replace(/\(c\)/gi, '\u00A9');
  s = s.replace(/\(tm\)/gi, '\u2122');
  s = s.replace(/\(r\)/gi, '\u00AE');
  // Curly double quotes
  s = s.replace(/(^|[\s(\u2014])"/g, '$1\u201C');
  s = s.replace(/"/g, '\u201D');
  // Curly single quotes (also handles apostrophes)
  s = s.replace(/(^|[\s(\u2014])'/g, '$1\u2018');
  s = s.replace(/'/g, '\u2019');
  return s;
}

// ============================================================
// Emoji shortcode map — :name: → emoji character
// Falls back to literal :name: if no match.
// Future: Tabler Icons SVG lookup before emoji fallback.
// ============================================================

const EMOJI_MAP = {
  // Faces & gestures
  smile: '\u{1F60A}', grin: '\u{1F601}', laugh: '\u{1F602}', wink: '\u{1F609}',
  heart: '\u2764\uFE0F', 'heart-eyes': '\u{1F60D}', cry: '\u{1F622}', think: '\u{1F914}',
  thumbsup: '\u{1F44D}', thumbsdown: '\u{1F44E}', wave: '\u{1F44B}', clap: '\u{1F44F}',
  pray: '\u{1F64F}', muscle: '\u{1F4AA}', eyes: '\u{1F440}', point: '\u{1F449}',
  // Status & symbols
  check: '\u2705', x: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F',
  question: '\u2753', exclamation: '\u2757', star: '\u2B50', sparkles: '\u2728',
  fire: '\u{1F525}', '100': '\u{1F4AF}', tada: '\u{1F389}', party: '\u{1F389}',
  rocket: '\u{1F680}', trophy: '\u{1F3C6}', medal: '\u{1F3C5}', crown: '\u{1F451}',
  flag: '\u{1F6A9}', bell: '\u{1F514}', megaphone: '\u{1F4E2}', bulb: '\u{1F4A1}',
  // Objects & tools
  home: '\u{1F3E0}', gear: '\u2699\uFE0F', settings: '\u2699\uFE0F',
  lock: '\u{1F512}', unlock: '\u{1F513}', key: '\u{1F511}',
  search: '\u{1F50D}', link: '\u{1F517}', pin: '\u{1F4CC}', 'map-pin': '\u{1F4CD}',
  pencil: '\u270F\uFE0F', scissors: '\u2702\uFE0F', paperclip: '\u{1F4CE}',
  folder: '\u{1F4C1}', file: '\u{1F4C4}', trash: '\u{1F5D1}\uFE0F',
  book: '\u{1F4D6}', calendar: '\u{1F4C5}', clock: '\u{1F555}',
  phone: '\u{1F4F1}', email: '\u{1F4E7}', mail: '\u{1F4E7}',
  camera: '\u{1F4F7}', video: '\u{1F3AC}', music: '\u{1F3B5}',
  gift: '\u{1F381}', money: '\u{1F4B0}', cart: '\u{1F6D2}',
  // People
  user: '\u{1F464}', users: '\u{1F465}', person: '\u{1F464}', people: '\u{1F465}',
  // Charts & data
  chart: '\u{1F4CA}', 'chart-up': '\u{1F4C8}', 'chart-down': '\u{1F4C9}',
  // Arrows & navigation
  'arrow-right': '\u27A1\uFE0F', 'arrow-left': '\u2B05\uFE0F',
  'arrow-up': '\u2B06\uFE0F', 'arrow-down': '\u2B07\uFE0F',
  download: '\u2B07\uFE0F', upload: '\u2B06\uFE0F',
  plus: '\u2795', minus: '\u2796',
  // Nature & weather
  globe: '\u{1F30D}', world: '\u{1F30D}',
  sun: '\u2600\uFE0F', moon: '\u{1F319}', cloud: '\u2601\uFE0F',
  rain: '\u{1F327}\uFE0F', snow: '\u2744\uFE0F', rainbow: '\u{1F308}',
  tree: '\u{1F333}', flower: '\u{1F338}', leaf: '\u{1F343}',
  // Food & drink
  coffee: '\u2615', pizza: '\u{1F355}', beer: '\u{1F37A}', wine: '\u{1F377}',
  cake: '\u{1F382}',
  // Transport
  car: '\u{1F697}', airplane: '\u2708\uFE0F', ship: '\u{1F6A2}',
  // Animals
  dog: '\u{1F436}', cat: '\u{1F431}',
};

// ============================================================
// HTML escaping
// ============================================================

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// Main render: document AST + theme → HTML body string
// ============================================================

export function render(doc, theme = {}) {
  const blocks = doc.blocks;
  let html = '';
  let i = 0;
  let sectionIndex = 0;
  const anim = theme.animation || 'subtle';
  _currentAnim = anim;

  // Collect all headings for {:toc} directive
  _docHeadings = collectHeadings(blocks);

  while (i < blocks.length) {
    const block = blocks[i];

    // H1 → hero
    if (block.type === 'heading' && block.level === 1) {
      const animClass = anim !== 'none' ? ' kp-animate' : '';
      html += `<header class="kp-hero${animClass}">`;
      html += `<h1>${inl(block.text)}</h1>`;
      i++;
      if (i < blocks.length && blocks[i].type === 'paragraph') {
        html += `<p class="kp-subtitle">${inl(blocks[i].text)}</p>`;
        i++;
      }
      html += '</header>';
      continue;
    }

    // H2 → section wrapper
    if (block.type === 'heading' && block.level === 2) {
      const altClass = sectionIndex % 2 === 1 ? ' kp-section-alt' : '';
      const animClass = anim !== 'none' ? ' kp-animate' : '';
      const sectionId = block.id || `section-${sectionIndex}`;
      html += `<section class="kp-section${altClass}${animClass}" id="${sectionId}">`;
      html += `<h2>${inl(block.text)}</h2>`;
      html += `<hr class="kp-section-rule">`;
      i++;
      while (i < blocks.length && !(blocks[i].type === 'heading' && blocks[i].level <= 2)) {
        if (blocks[i].type === 'image' && !hasImageAttrs(blocks[i])) {
          const images = [];
          while (i < blocks.length && blocks[i].type === 'image' && !hasImageAttrs(blocks[i])) {
            images.push(blocks[i]);
            i++;
          }
          html += renderGallery(images);
        } else {
          html += renderBlock(blocks[i]);
          i++;
        }
      }
      html += '</section>';
      sectionIndex++;
      continue;
    }

    // Top-level carousel
    if (block.type === 'carousel') {
      html += renderCarousel(block);
      i++; continue;
    }

    // Top-level bg-section
    if (block.type === 'bg-section') {
      html += renderBgSection(block);
      i++; continue;
    }

    // Top-level image gallery (skip images with special attrs like showcase/frame/phone)
    if (block.type === 'image' && !hasImageAttrs(block)) {
      const images = [];
      while (i < blocks.length && blocks[i].type === 'image' && !hasImageAttrs(blocks[i])) {
        images.push(blocks[i]);
        i++;
      }
      html += renderGallery(images);
      continue;
    }

    // Everything else at top level
    html += renderBlock(blocks[i]);
    i++;
  }

  return html;
}

// ============================================================
// Block rendering
// ============================================================

export function renderBlock(block, context) {
  switch (block.type) {
    case 'heading': {
      const idAttr = block.id ? ` id="${block.id}"` : '';
      return `<h${block.level}${idAttr}>${inl(block.text)}</h${block.level}>`;
    }
    case 'paragraph': {
      // Check for standalone embed URL
      const trimmed = block.text.trim();
      if (/^https?:\/\//.test(trimmed) && !/\s/.test(trimmed)) {
        const embed = getEmbed(trimmed);
        if (embed) return renderEmbed(embed);
      }
      if (isLinkOnlyParagraph(block.text)) return renderCtaRow(block.text);
      return `<p>${inl(block.text)}</p>`;
    }
    case 'list':
      return renderList(block);
    case 'hr':
      return '<hr>';
    case 'code':
      return renderCode(block);
    case 'form':
      return renderForm(block.content);
    case 'image': {
      const eSrc = escapeHtml(block.src);
      const eAlt = escapeHtml(block.alt);
      const w = block.width ? ` width="${block.width}"` : '';
      const h = block.height ? ` height="${block.height}"` : '';
      const a = block.attrs || {};
      if (a.frame) {
        return `<div class="kp-browser-frame"><div class="kp-browser-dots"><span></span><span></span><span></span></div><img src="${eSrc}" alt="${eAlt}"${w}${h} loading="lazy"></div>`;
      }
      if (a.phone) {
        return `<div class="kp-phone-frame"><img src="${eSrc}" alt="${eAlt}"${w}${h} loading="lazy"></div>`;
      }
      if (a.avatar) {
        return `<img src="${eSrc}" alt="${eAlt}" loading="lazy" class="kp-img-avatar">`;
      }
      // Build inline size constraints from =WIDTHxHEIGHT
      const styles = ['max-width:100%', 'border-radius:var(--radius)'];
      if (block.width) styles.push(`max-width:${block.width}px`);
      if (block.height) styles.push(`max-height:${block.height}px`);
      const cls = a.showcase ? ' class="kp-img-showcase"' : '';
      return `<img src="${eSrc}" alt="${eAlt}"${w}${h} loading="lazy"${cls} style="${styles.join(';')}">`;
    }
    case 'columns':
      return renderColumns(block);
    case 'carousel':
      return renderCarousel(block);
    case 'bg-section':
      return renderBgSection(block);
    case 'card':
      return renderCard(block);
    case 'quote-block':
      return renderQuoteBlock(block);
    case 'alert':
      return renderAlert(block);
    case 'blockquote':
      return renderBlockquote(block);
    case 'tabs':
      return renderTabs(block);
    case 'table':
      return renderTable(block);
    case 'record':
      return renderRecord(block);
    case 'expandable':
      return renderExpandable(block);
    case 'math':
      return `<div class="kp-math kp-math-block">${escapeHtml(block.content)}</div>`;
    case 'directive':
      return renderDirective(block);
    case 'html':
      return block.content;
    case 'fenced':
      return renderFencedGeneric(block);
    default:
      return '';
  }
}

// ============================================================
// Component renderers
// ============================================================

function renderColumns(block) {
  if (block.columns.length === 1) {
    let html = '';
    for (const b of block.columns[0]) html += renderBlock(b, 'column');
    return html;
  }

  // Detect stats bar: every column starts with an H3 whose text is only ++stat++
  const isStats = block.columns.length >= 2 && block.columns.every(col => {
    const first = col[0];
    return first && first.type === 'heading' && first.level === 3 && /^\+\+.+\+\+$/.test(first.text.trim());
  });

  const staggerClass = _currentAnim !== 'none' ? ' kp-animate kp-animate-stagger' : '';
  const wrapperClass = isStats ? 'kp-columns kp-columns-stats' : 'kp-columns';
  let html = `<div class="${wrapperClass}${staggerClass}">`;
  for (const col of block.columns) {
    // Detect featured column: first heading has {featured} attr
    const firstHeading = col.find(b => b.type === 'heading');
    const isFeatured = firstHeading?.attrs?.featured;
    const colClass = isFeatured ? 'kp-column kp-column-featured' : 'kp-column';
    html += `<div class="${colClass}">`;
    for (const b of col) html += renderBlock(b, 'column');
    html += '</div>';
  }
  html += '</div>';
  return html;
}

export function renderCarousel(block) {
  const id = 'carousel-' + Math.random().toString(36).slice(2, 8);
  let html = `<div class="kp-carousel" id="${id}" role="region" aria-roledescription="carousel" aria-label="Image carousel">`;
  html += `<div class="kp-carousel-track" aria-live="polite">`;
  block.slides.forEach((slideBlocks) => {
    html += '<div class="kp-carousel-slide">';
    for (const b of slideBlocks) {
      if (b.type === 'bg-section') html += renderBgSection(b);
      else html += renderBlock(b);
    }
    html += '</div>';
  });
  html += '</div>';
  if (block.slides.length > 1) {
    html += `<button class="kp-carousel-btn kp-carousel-prev" onclick="carouselNav('${id}',-1)" aria-label="Previous">&lsaquo;</button>`;
    html += `<button class="kp-carousel-btn kp-carousel-next" onclick="carouselNav('${id}',1)" aria-label="Next">&rsaquo;</button>`;
    html += '<div class="kp-carousel-dots">';
    block.slides.forEach((_, idx) => {
      html += `<button class="kp-carousel-dot${idx === 0 ? ' active' : ''}" onclick="carouselGo('${id}',${idx})" aria-label="Slide ${idx+1}"></button>`;
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderTabs(block) {
  const id = 'tabs-' + Math.random().toString(36).slice(2, 8);
  let html = `<div class="kp-tabs" id="${id}">`;
  html += '<div class="kp-tabs-nav" role="tablist">';
  block.tabs.forEach((tab, idx) => {
    const active = idx === 0 ? ' active' : '';
    html += `<button class="kp-tab-btn${active}" role="tab" onclick="tabSwitch('${id}',${idx})">${tab.name}</button>`;
  });
  html += '</div>';
  block.tabs.forEach((tab, idx) => {
    const active = idx === 0 ? ' active' : '';
    html += `<div class="kp-tab-panel${active}" role="tabpanel">`;
    for (const b of tab.blocks) html += renderBlock(b);
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderBgSection(block) {
  const eBg = escapeHtml(block.bgImage);
  if (block.bgType === 'video') {
    let html = '<div class="kp-bg-section kp-bg-video">';
    html += `<video class="kp-bg-video-el" autoplay muted loop playsinline><source src="${eBg}"></video>`;
    html += '<div class="kp-bg-overlay">';
    for (const b of block.blocks) {
      if (b.type === 'heading' && b.level === 1) html += `<h1>${inl(b.text)}</h1>`;
      else if (b.type === 'heading') html += `<h${b.level}>${inl(b.text)}</h${b.level}>`;
      else html += renderBlock(b);
    }
    html += '</div></div>';
    return html;
  }
  let html = `<div class="kp-bg-section" style="background-image:url('${eBg}')">`;
  html += '<div class="kp-bg-overlay">';
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

function hasImageAttrs(img) {
  const a = img.attrs;
  return a && (a.showcase || a.frame || a.phone || a.avatar);
}

function renderGallery(images) {
  const n = images.length;
  let html = `<figure class="kp-gallery count-${Math.min(n, 4)}">`;
  for (const img of images) {
    const w = img.width ? ` width="${img.width}"` : '';
    const h = img.height ? ` height="${img.height}"` : '';
    html += `<img src="${img.src}" alt="${img.alt}"${w}${h} loading="lazy">`;
  }
  html += '</figure>';
  return html;
}

function renderCard(block) {
  let html = '<div class="kp-block kp-block-card">';
  for (const b of block.blocks) html += renderBlock(b);
  html += '</div>';
  return html;
}

function renderQuoteBlock(block) {
  let html = '<div class="kp-block kp-block-quote">';
  for (const b of block.blocks) html += renderBlock(b);
  html += '</div>';
  return html;
}

function renderAlert(block) {
  let html = `<div class="kp-block kp-block-${block.alertType}">`;
  for (const b of block.blocks) html += renderBlock(b);
  html += '</div>';
  return html;
}

function renderBlockquote(block) {
  let html = '<blockquote>';
  for (const b of block.blocks) html += renderBlock(b);
  html += '</blockquote>';
  return html;
}

function renderCode(block) {
  const langClass = block.lang ? ` class="language-${block.lang}"` : '';
  return `<pre><code${langClass}>${escapeHtml(block.content)}</code></pre>`;
}

function renderTable(block) {
  let html = '<table>';
  html += '<thead><tr>';
  block.headers.forEach((h, i) => {
    const style = block.align[i] !== 'left' ? ` style="text-align:${block.align[i]}"` : '';
    html += `<th${style}>${inl(h)}</th>`;
  });
  html += '</tr></thead><tbody>';
  for (const row of block.rows) {
    html += '<tr>';
    row.forEach((cell, i) => {
      const style = block.align[i] !== 'left' ? ` style="text-align:${block.align[i]}"` : '';
      html += `<td${style}>${inl(cell)}</td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

function renderRecord(block) {
  let html = '<div class="kp-record">';
  html += `<div class="kp-record-name">${inl(block.name)}</div>`;
  if (block.fields.length > 0) {
    html += '<dl class="kp-record-fields">';
    for (const f of block.fields) {
      html += `<dt>${inl(f.key)}</dt><dd>${inl(f.value)}</dd>`;
    }
    html += '</dl>';
  }
  if (block.body) html += `<p>${inl(block.body)}</p>`;
  html += '</div>';
  return html;
}

function renderExpandable(block) {
  let html = '<details class="kp-expandable">';
  html += `<summary>${inl(block.summary)}</summary>`;
  html += '<div class="kp-expandable-content">';
  for (const b of block.blocks) html += renderBlock(b);
  html += '</div></details>';
  return html;
}

function renderList(block) {
  const tag = block.ordered ? 'ol' : 'ul';
  const isTaskList = block.items.some(item => /^\[[ x\-]\]\s/.test(item));
  const listClass = isTaskList ? ' class="kp-task-list"' : '';

  return `<${tag}${listClass}>` + block.items.map(item => {
    // Task list items: [ ] todo, [x] done, [-] partial
    const taskMatch = item.match(/^\[([ x\-])\]\s*(.*)/);
    if (taskMatch) {
      const state = taskMatch[1];
      const text = taskMatch[2];
      if (state === 'x') {
        return `<li class="kp-task-item kp-task-done"><input type="checkbox" disabled checked>${inl(text)}</li>`;
      } else if (state === '-') {
        return `<li class="kp-task-item kp-task-partial"><input type="checkbox" disabled checked>${inl(text)}</li>`;
      }
      return `<li class="kp-task-item"><input type="checkbox" disabled>${inl(text)}</li>`;
    }

    // Dot-leader lists (pricing)
    const dotLeaderMatch = item.match(/^(.+?)\s*\.{3,}\s*(.+)$/);
    if (dotLeaderMatch) {
      return `<li><span>${inl(dotLeaderMatch[1])}</span><span style="color:var(--text-muted);white-space:nowrap">${inl(dotLeaderMatch[2])}</span></li>`;
    }

    return `<li>${inl(item)}</li>`;
  }).join('') + `</${tag}>`;
}

// ============================================================
// Heading collection for {:toc} directive
// ============================================================

let _docHeadings = [];
let _currentAnim = 'subtle';

// Collect only top-level H2/H3 headings for TOC (not headings inside columns, cards, etc.)
function collectHeadings(blocks) {
  const result = [];
  for (const b of blocks) {
    if (b.type === 'heading' && b.level >= 2 && b.level <= 3) result.push(b);
    // Don't recurse into columns, cards, or other nested blocks — those contain
    // content headings (column headers, card titles) not document sections.
  }
  return result;
}

function renderDirective(block) {
  if (block.name === 'toc') return renderToc();
  if (block.name === 'nav') return ''; // Future: auto-generated page nav
  return '';
}

function renderToc() {
  if (_docHeadings.length === 0) return '';
  let html = '<nav class="kp-toc" aria-label="Table of contents"><ul>';
  for (const h of _docHeadings) {
    const indent = h.level > 2 ? ` class="kp-toc-indent"` : '';
    html += `<li${indent}><a href="#${h.id}">${h.text}</a></li>`;
  }
  html += '</ul></nav>';
  return html;
}

// ============================================================
// Embed detection & rendering
// ============================================================

function getEmbed(url) {
  let m;
  // YouTube
  m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (m) return { type: 'youtube', id: m[1] };
  // Vimeo
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return { type: 'vimeo', id: m[1] };
  return null;
}

function renderEmbed(embed) {
  const wrapper = '<div class="kp-embed">';
  if (embed.type === 'youtube') {
    return `${wrapper}<iframe src="https://www.youtube.com/embed/${embed.id}" frameborder="0" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
  }
  if (embed.type === 'vimeo') {
    return `${wrapper}<iframe src="https://player.vimeo.com/video/${embed.id}" frameborder="0" allowfullscreen loading="lazy" title="Vimeo video"></iframe></div>`;
  }
  return '';
}

function renderFencedGeneric(block) {
  const type = block.sectionType.toLowerCase().replace(/\s+/g, '-');
  let html = `<div class="kp-block kp-block-${type}">`;
  for (const b of block.blocks) html += renderBlock(b);
  html += '</div>';
  return html;
}

// ============================================================
// CTA detection — paragraphs containing only links → button row
// ============================================================

function isLinkOnlyParagraph(text) {
  const stripped = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '').replace(/[\s—\-|,\n]+/g, '');
  return stripped.length === 0 && /\[([^\]]+)\]\(([^)]+)\)/.test(text);
}

function renderCtaRow(text) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let links = [];
  while ((match = linkPattern.exec(text)) !== null) {
    links.push({ label: match[1], href: match[2] });
  }
  let html = '<div class="kp-cta-row">';
  links.forEach((link, idx) => {
    const cls = idx === 0 ? 'kp-cta-primary' : 'kp-cta-secondary';
    html += `<a href="${escapeHtml(link.href)}" class="${cls}">${escapeHtml(link.label)}</a>`;
  });
  html += '</div>';
  return html;
}

// ============================================================
// Form rendering
// ============================================================

function renderForm(form) {
  const method = form.action?.method || 'POST';
  const url = form.action?.url || '#';
  let html = `<form class="kp-form" method="${escapeHtml(method)}" action="${escapeHtml(url)}">`;
  for (const group of form.groups) {
    html += '<div class="kp-form-group">';
    for (const field of group) {
      const id = escapeHtml(field.label.toLowerCase().replace(/\s+/g, '-'));
      const req = field.required ? ' required' : '';
      const ph = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : '';
      html += '<div class="kp-field">';
      html += `<label for="${id}">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>`;
      if (field.fieldType === 'paragraph') {
        html += `<textarea id="${id}" name="${id}"${ph}${req}></textarea>`;
      } else if (field.fieldType === 'select') {
        html += `<select id="${id}" name="${id}"${req}>`;
        html += '<option value="" disabled selected>Select...</option>';
        for (const opt of field.options) html += `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`;
        html += '</select>';
      } else {
        html += `<input type="${escapeHtml(field.fieldType)}" id="${id}" name="${id}"${ph}${req}>`;
      }
      html += '</div>';
    }
    html += '</div>';
  }
  if (form.action) html += `<button type="submit">${escapeHtml(form.action.label)}</button>`;
  html += '</form>';
  return html;
}

// ============================================================
// Nav & Footer rendering
// ============================================================

export function renderNav(headerDoc, theme = {}) {
  if (!headerDoc) return '';
  const navStyle = theme.nav || 'transparent';
  const blocks = headerDoc.blocks;
  const h1 = blocks.find(b => b.type === 'heading' && b.level === 1);
  const list = blocks.find(b => b.type === 'list');

  let html = '<a href="#kp-content" class="kp-skip-nav">Skip to content</a>';
  html += `<nav class="kp-nav" data-style="${navStyle}" aria-label="Main navigation">`;
  if (h1) {
    html += `<a class="kp-nav-brand" href="index.md">${inl(h1.text)}</a>`;
  }
  html += '<ul class="kp-nav-links">';
  if (list) {
    for (const item of list.items) {
      html += `<li>${inl(item)}</li>`;
    }
  }
  html += '</ul>';
  html += '<button class="kp-nav-toggle" aria-label="Menu"><span></span></button>';
  html += '</nav>';
  return html;
}

export function renderFooter(footerDoc, theme = {}) {
  if (!footerDoc) return '';
  const footerStyle = theme.footer || 'minimal';
  const blocks = footerDoc.blocks;

  let html = `<footer class="kp-footer" data-style="${footerStyle}">`;
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1) {
      html += `<div class="kp-footer-title">${inl(block.text)}</div>`;
    } else if (block.type === 'columns') {
      html += '<div class="kp-footer-columns">';
      for (const col of block.columns) {
        html += '<div class="kp-footer-col">';
        for (const b of col) {
          if (b.type === 'heading') html += `<div class="kp-footer-col-title">${inl(b.text)}</div>`;
          else if (b.type === 'list') {
            html += '<ul class="kp-footer-col-links">';
            for (const item of b.items) html += `<li>${inl(item)}</li>`;
            html += '</ul>';
          } else if (b.type === 'paragraph') {
            html += `<p>${inl(b.text)}</p>`;
          }
        }
        html += '</div>';
      }
      html += '</div>';
    } else if (block.type === 'list') {
      html += '<div class="kp-footer-links">';
      for (const item of block.items) html += inl(item) + ' ';
      html += '</div>';
    } else if (block.type === 'paragraph') {
      html += `<div class="kp-footer-copy">${inl(block.text)}</div>`;
    }
  }
  html += '</footer>';
  return html;
}

// ============================================================
// Theme utilities
// ============================================================

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
    // Dark mode needs stronger shadows to be visible
    lines.push(`--shadow-sm: 0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15);`);
    lines.push(`--shadow-md: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);`);
    lines.push(`--shadow-lg: 0 8px 24px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.25);`);
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

export function getThemeDataAttrs(theme = {}) {
  return {
    'data-sections': theme.sections || 'alternating',
    'data-cards': theme.cards || 'elevated',
    'data-animation': theme.animation || 'subtle',
    'data-spacing': theme.spacing || 'normal',
  };
}

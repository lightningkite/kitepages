(function(){
// Kite Pages Parser — pure functions, no DOM dependencies.
// parse(source) → { frontmatter, blocks }

// ============================================================
// Simple YAML parser
// Handles frontmatter (flat key-value) and theme files (one level of nesting).
// For the Node.js compiler, js-yaml is used for robustness.
// This parser covers the browser runtime where js-yaml isn't available.
// ============================================================

function parseYaml(text) {
  const result = {};
  let currentKey = null;
  let currentObj = null;

  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    // Indented line → child of current object key
    if (currentKey && /^\s/.test(line)) {
      const m = line.trim().match(/^([^:]+):\s+(.+)$/);
      if (m && currentObj) {
        currentObj[m[1].trim()] = coerceYamlValue(m[2].trim());
      }
      continue;
    }

    // Top-level key: value
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim();
      if (val === '') {
        currentKey = key;
        currentObj = {};
        result[key] = currentObj;
      } else {
        currentKey = null;
        currentObj = null;
        result[key] = coerceYamlValue(val);
      }
    }
  }

  return result;
}

function coerceYamlValue(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}

// ============================================================
// Main entry point
// ============================================================

function parse(source) {
  const { frontmatter, body } = extractFrontmatter(source);
  const lines = body.split('\n');
  const blocks = parseBlocks(lines);
  return { frontmatter, blocks };
}

function extractFrontmatter(source) {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return { frontmatter: {}, body: source };
  }
  const lines = source.split('\n');
  let endLine = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^---\s*$/)) {
      endLine = i;
      break;
    }
  }
  if (endLine === -1) return { frontmatter: {}, body: source };

  const yamlText = lines.slice(1, endLine).join('\n');
  const body = lines.slice(endLine + 1).join('\n');

  try {
    return { frontmatter: parseYaml(yamlText), body };
  } catch {
    return { frontmatter: {}, body: source };
  }
}

// ============================================================
// Heading anchor generation
// ============================================================

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[*_`\[\]()!+]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================
// Helpers
// ============================================================

// Find the matching ::: closer, respecting nesting.
// Returns line index of closing :::, or -1 if not found.
function findFenceClose(lines, openLine, end) {
  let depth = 1;
  let inCode = false;
  for (let j = openLine + 1; j < end; j++) {
    if (lines[j].match(/^`{3,}/)) { inCode = !inCode; continue; }
    if (inCode) continue;
    if (lines[j].match(/^:::\s+\w/)) depth++;
    else if (lines[j].match(/^:::\s*$/)) {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

// Split lines at top-level --- separators (respecting ::: nesting).
function splitAtSeparators(lines) {
  const segments = [[]];
  let fenceDepth = 0;
  let inCode = false;
  for (const line of lines) {
    // Track code fences — nothing is structural inside code blocks
    if (line.match(/^`{3,}/)) { inCode = !inCode; }
    if (!inCode) {
      if (line.match(/^:::\s+\w/)) fenceDepth++;
      else if (line.match(/^:::\s*$/)) { if (fenceDepth > 0) fenceDepth--; }
    }

    if (!inCode && fenceDepth === 0 && line.match(/^---+\s*$/)) {
      segments.push([]);
    } else {
      segments[segments.length - 1].push(line);
    }
  }
  return segments.filter(s => s.length > 0);
}

// ============================================================
// Block parser (recursive)
// ============================================================

function parseBlocks(lines, start = 0, end = null) {
  if (end === null) end = lines.length;
  const blocks = [];
  let i = start;

  while (i < end) {
    if (lines[i].trim() === '') { i++; continue; }

    let result;

    if ((result = tryCodeFence(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryFencedSection(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryColumnFence(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryBlockQuoteFence(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryHeading(lines, i))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryImage(lines, i))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryHr(lines, i))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryList(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryExpandable(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryPrefixBlockquote(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryTable(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryPrefixColumns(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryRecord(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryDirective(lines, i))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryBlockMath(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }
    if ((result = tryHtmlBlock(lines, i, end))) { blocks.push(result.block); i = result.next; continue; }

    result = parseParagraph(lines, i, end);
    blocks.push(result.block); i = result.next;
  }

  return blocks;
}

// ============================================================
// Block type parsers — each returns { block, next } or null
// ============================================================

function tryCodeFence(lines, i, end) {
  const match = lines[i].match(/^(`{3,})([\w.-]*)\s*$/);
  if (!match) return null;

  const fence = match[1];
  const lang = match[2] || '';
  const contentLines = [];
  let j = i + 1;

  while (j < end) {
    if (lines[j].startsWith(fence) && lines[j].trim() === fence) {
      return {
        block: { type: 'code', lang, content: contentLines.join('\n') },
        next: j + 1
      };
    }
    contentLines.push(lines[j]);
    j++;
  }

  return null; // Unclosed — don't consume
}

function tryFencedSection(lines, i, end) {
  const match = lines[i].match(/^:::\s+(.+)$/);
  if (!match) return null;

  const closeIdx = findFenceClose(lines, i, end);
  if (closeIdx === -1) return null; // Unclosed fence

  const typeStr = match[1].trim();
  const innerLines = lines.slice(i + 1, closeIdx);

  // Background section (image or video)
  if (typeStr.startsWith('bg ')) {
    const bgValue = typeStr.substring(3).trim();
    const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(bgValue);
    return {
      block: { type: 'bg-section', bgImage: bgValue, bgType: isVideo ? 'video' : 'image', blocks: parseBlocks(innerLines) },
      next: closeIdx + 1
    };
  }

  // Carousel — split slides on ---
  if (typeStr === 'carousel') {
    const segments = splitAtSeparators(innerLines);
    return {
      block: { type: 'carousel', slides: segments.map(seg => parseBlocks(seg)) },
      next: closeIdx + 1
    };
  }

  // Tabs — split on ---, each segment is a ::: tab Name block
  if (typeStr === 'tabs') {
    const segments = splitAtSeparators(innerLines);
    const tabs = [];
    for (const seg of segments) {
      const blocks = parseBlocks(seg);
      // Look for a ::: tab Name container
      if (blocks.length === 1 && blocks[0].type === 'fenced' && blocks[0].sectionType.startsWith('tab ')) {
        tabs.push({ name: blocks[0].sectionType.substring(4).trim(), blocks: blocks[0].blocks });
      } else {
        tabs.push({ name: `Tab ${tabs.length + 1}`, blocks });
      }
    }
    return {
      block: { type: 'tabs', tabs },
      next: closeIdx + 1
    };
  }

  // Form — custom parser
  if (typeStr === 'form') {
    return {
      block: { type: 'form', content: parseFormFields(innerLines) },
      next: closeIdx + 1
    };
  }

  // Card
  if (typeStr === 'card') {
    return {
      block: { type: 'card', blocks: parseBlocks(innerLines) },
      next: closeIdx + 1
    };
  }

  // Quote / testimonial
  if (typeStr === 'quote') {
    return {
      block: { type: 'quote-block', blocks: parseBlocks(innerLines) },
      next: closeIdx + 1
    };
  }

  // Alert / admonition types
  const alertTypes = ['warning', 'info', 'success', 'error', 'note', 'tip'];
  if (alertTypes.includes(typeStr)) {
    return {
      block: { type: 'alert', alertType: typeStr, blocks: parseBlocks(innerLines) },
      next: closeIdx + 1
    };
  }

  // Generic fenced block — parse contents recursively
  return {
    block: { type: 'fenced', sectionType: typeStr, blocks: parseBlocks(innerLines) },
    next: closeIdx + 1
  };
}

function tryColumnFence(lines, i, end) {
  if (!lines[i].match(/^\|\|\|\s*$/)) return null;

  // Find matching closer, respecting ::: and ``` nesting
  let depth = 0;
  let inCode = false;
  let closeIdx = -1;
  for (let j = i + 1; j < end; j++) {
    if (lines[j].match(/^`{3,}/)) { inCode = !inCode; continue; }
    if (inCode) continue;
    if (lines[j].match(/^:::\s+\w/)) depth++;
    else if (lines[j].match(/^:::\s*$/)) { if (depth > 0) depth--; }
    else if (depth === 0 && lines[j].match(/^\|\|\|\s*$/)) {
      closeIdx = j;
      break;
    }
  }

  if (closeIdx === -1) return null;

  const innerLines = lines.slice(i + 1, closeIdx);
  const segments = splitAtSeparators(innerLines);

  return {
    block: { type: 'columns', columns: segments.map(seg => parseBlocks(seg)) },
    next: closeIdx + 1
  };
}

function tryBlockQuoteFence(lines, i, end) {
  if (!lines[i].match(/^>>>\s*$/)) return null;

  let closeIdx = -1;
  for (let j = i + 1; j < end; j++) {
    if (lines[j].match(/^>>>\s*$/)) {
      closeIdx = j;
      break;
    }
  }

  if (closeIdx === -1) return null;

  const innerLines = lines.slice(i + 1, closeIdx);
  return {
    block: { type: 'blockquote', blocks: parseBlocks(innerLines) },
    next: closeIdx + 1
  };
}

function tryHeading(lines, i) {
  const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;

  let text = match[2];
  let attrs = {};

  // Parse {attr} or {key=value ...} at end of heading
  const attrMatch = text.match(/\s*\{([^}]+)\}\s*$/);
  if (attrMatch) {
    text = text.substring(0, attrMatch.index).trim();
    for (const part of attrMatch[1].split(/\s+/)) {
      const kv = part.match(/^(\w[\w-]*)=(.+)$/);
      if (kv) attrs[kv[1]] = kv[2];
      else attrs[part] = true;
    }
  }

  return {
    block: { type: 'heading', level: match[1].length, text, id: slugify(text), attrs },
    next: i + 1
  };
}

function tryImage(lines, i) {
  if (!lines[i].match(/^!\[/)) return null;
  // Support optional sizing and attributes: ![alt](url =WIDTHxHEIGHT){showcase}
  const match = lines[i].match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+=(\d*)x(\d*))?\)(?:\{([^}]+)\})?\s*$/);
  if (!match) return null;

  let attrs = {};
  if (match[5]) {
    for (const part of match[5].split(/\s+/)) {
      const kv = part.match(/^(\w[\w-]*)=(.+)$/);
      if (kv) attrs[kv[1]] = kv[2];
      else attrs[part] = true;
    }
  }

  return {
    block: {
      type: 'image', alt: match[1], src: match[2],
      width: match[3] ? parseInt(match[3]) : null,
      height: match[4] ? parseInt(match[4]) : null,
      attrs,
    },
    next: i + 1
  };
}

function tryHr(lines, i) {
  if (!lines[i].match(/^---+\s*$/)) return null;
  return { block: { type: 'hr' }, next: i + 1 };
}

function tryList(lines, i, end) {
  // Unordered
  if (lines[i].match(/^[-*]\s+/)) {
    const items = [];
    while (i < end && lines[i].match(/^[-*]\s+/)) {
      items.push(lines[i].replace(/^[-*]\s+/, ''));
      i++;
    }
    return { block: { type: 'list', ordered: false, items }, next: i };
  }

  // Ordered
  if (lines[i].match(/^\d+\.\s+/)) {
    const items = [];
    while (i < end && lines[i].match(/^\d+\.\s+/)) {
      items.push(lines[i].replace(/^\d+\.\s+/, ''));
      i++;
    }
    return { block: { type: 'list', ordered: true, items }, next: i };
  }

  return null;
}

function tryExpandable(lines, i, end) {
  const match = lines[i].match(/^>\|\s+(.+)$/);
  if (!match) return null;

  const summary = match[1];
  const contentLines = [];
  i++;

  while (i < end && (lines[i].match(/^\s{2,}/) || lines[i].trim() === '')) {
    if (lines[i].trim() === '') contentLines.push('');
    else contentLines.push(lines[i].replace(/^\s{2,}/, ''));
    i++;
  }

  return {
    block: { type: 'expandable', summary, blocks: parseBlocks(contentLines) },
    next: i
  };
}

function tryPrefixBlockquote(lines, i, end) {
  if (!lines[i].match(/^>(\s|$)/)) return null;

  const contentLines = [];
  while (i < end && lines[i].match(/^>(\s|$)/)) {
    contentLines.push(lines[i].replace(/^>\s?/, ''));
    i++;
  }

  // GFM alert syntax: > [!NOTE], > [!WARNING], > [!TIP], etc.
  if (contentLines.length > 0) {
    const alertMatch = contentLines[0].match(/^\[!(\w+)\]\s*$/);
    if (alertMatch) {
      const gfmType = alertMatch[1].toLowerCase();
      const typeMap = { note: 'note', tip: 'tip', important: 'info', warning: 'warning', caution: 'error' };
      const alertType = typeMap[gfmType];
      if (alertType) {
        return {
          block: { type: 'alert', alertType, blocks: parseBlocks(contentLines.slice(1)) },
          next: i
        };
      }
    }
  }

  return {
    block: { type: 'blockquote', blocks: parseBlocks(contentLines) },
    next: i
  };
}

function tryTable(lines, i, end) {
  // Header row: | cell | cell | (must have | on both sides)
  if (!lines[i].match(/^\|.+\|$/)) return null;
  // Separator row: |---|---| (next line)
  if (i + 1 >= end || !lines[i + 1].match(/^\|[-:\s|]+\|$/)) return null;

  // Parse header cells
  const headers = lines[i].split('|').slice(1, -1).map(c => c.trim());

  // Parse alignment from separator
  const sepCells = lines[i + 1].split('|').slice(1, -1).map(c => c.trim());
  const align = sepCells.map(c => {
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    return 'left';
  });

  // Parse body rows
  const rows = [];
  let j = i + 2;
  while (j < end && lines[j].match(/^\|.+\|$/)) {
    rows.push(lines[j].split('|').slice(1, -1).map(c => c.trim()));
    j++;
  }

  return {
    block: { type: 'table', headers, align, rows },
    next: j
  };
}

function tryPrefixColumns(lines, i, end) {
  if (!lines[i].match(/^\| /)) return null;
  if (lines[i].match(/^\|\|\|/)) return null; // Not a column fence

  const columns = [[]];

  while (i < end) {
    const line = lines[i];

    if (line.match(/^\| /) || line === '|') {
      columns[columns.length - 1].push(line === '|' ? '' : line.substring(2));
      i++;
    } else if (line.trim() === '') {
      // Blank line — check if more | content follows (new column)
      let peek = i + 1;
      while (peek < end && lines[peek].trim() === '') peek++;
      if (peek < end && (lines[peek].match(/^\| /) || lines[peek] === '|')) {
        columns.push([]);
        i = peek;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  const parsedCols = columns.filter(c => c.length > 0).map(colLines => parseBlocks(colLines));
  if (parsedCols.length === 0) return null;

  return { block: { type: 'columns', columns: parsedCols }, next: i };
}

function tryRecord(lines, i, end) {
  if (!lines[i].match(/^::\s+/) || lines[i].match(/^:::/)) return null;
  const match = lines[i].match(/^::\s+(.+)$/);
  if (!match) return null;

  const name = match[1].trim();
  const fields = [];
  const bodyLines = [];
  i++;

  while (i < end && (lines[i].match(/^\s{2,}/) || lines[i].trim() === '')) {
    const trimmed = lines[i].trim();
    if (trimmed === '') { i++; continue; }
    const fieldMatch = trimmed.match(/^([^:]+):\s+(.+)$/);
    if (fieldMatch) {
      fields.push({ key: fieldMatch[1].trim(), value: fieldMatch[2].trim() });
    } else {
      bodyLines.push(trimmed);
    }
    i++;
  }

  return {
    block: { type: 'record', name, fields, body: bodyLines.join('\n') },
    next: i
  };
}

function tryBlockMath(lines, i, end) {
  if (!lines[i].match(/^\\\[\s*$/)) return null;
  const contentLines = [];
  let j = i + 1;
  while (j < end) {
    if (lines[j].match(/^\\\]\s*$/)) {
      return {
        block: { type: 'math', display: 'block', content: contentLines.join('\n') },
        next: j + 1
      };
    }
    contentLines.push(lines[j]);
    j++;
  }
  return null;
}

function tryDirective(lines, i) {
  const match = lines[i].match(/^\{:(\w+)\}\s*$/);
  if (!match) return null;
  return { block: { type: 'directive', name: match[1] }, next: i + 1 };
}

const BLOCK_HTML_TAGS = new Set([
  'div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
  'figure', 'figcaption', 'details', 'summary', 'table', 'thead', 'tbody',
  'tr', 'td', 'th', 'fieldset', 'pre', 'video', 'audio', 'canvas', 'iframe',
  'script', 'style', 'link', 'meta'
]);

function tryHtmlBlock(lines, i, end) {
  const match = lines[i].match(/^<([a-zA-Z][\w-]*)/);
  if (!match) return null;
  if (!BLOCK_HTML_TAGS.has(match[1].toLowerCase())) return null;

  const contentLines = [lines[i]];
  i++;

  while (i < end && lines[i].trim() !== '') {
    contentLines.push(lines[i]);
    i++;
  }

  return {
    block: { type: 'html', content: contentLines.join('\n') },
    next: i
  };
}

function parseParagraph(lines, i, end) {
  const pLines = [];

  while (i < end) {
    const line = lines[i];
    if (line.trim() === '') break;
    if (line.match(/^#{1,6}\s/)) break;
    if (line.match(/^!\[/)) break;
    if (line.match(/^:::/)) break;
    if (line.match(/^>>>\s*$/)) break;
    if (line.match(/^\|\|\|\s*$/)) break;
    if (line.match(/^---+\s*$/)) break;
    if (line.match(/^[-*]\s+/)) break;
    if (line.match(/^\d+\.\s+/)) break;
    if (line.match(/^>(\s|$)/)) break;
    if (line.match(/^>\|/)) break;
    if (line.match(/^\| /)) break;
    if (line.match(/^::\s+/) && !line.match(/^:::\s/)) break;
    if (line.match(/^`{3,}/)) break;
    if (line.match(/^\\\[\s*$/)) break;
    if (line.match(/^\{:\w+\}\s*$/)) break;
    const htmlMatch = line.match(/^<([a-zA-Z][\w-]*)/);
    if (htmlMatch && BLOCK_HTML_TAGS.has(htmlMatch[1].toLowerCase())) break;

    pLines.push(line);
    i++;
  }

  if (pLines.length === 0) {
    return { block: { type: 'paragraph', text: lines[i] || '' }, next: i + 1 };
  }

  return {
    block: { type: 'paragraph', text: pLines.join('\n') },
    next: i
  };
}

// ============================================================
// Form field parser
// Uses {type} delimiters (not <type>, which collides with HTML passthrough)
// ============================================================

function parseFormFields(lines) {
  const groups = [[]];
  let action = null;

  for (const line of lines) {
    if (line.trim() === '') {
      if (groups[groups.length - 1].length > 0) groups.push([]);
      continue;
    }

    // Button: [Label](METHOD /url)
    const btnMatch = line.match(/^\[([^\]]+)\]\((\w+)\s+([^)]+)\)/);
    if (btnMatch) {
      action = { label: btnMatch[1], method: btnMatch[2], url: btnMatch[3] };
      continue;
    }

    // Select: Label*: {option1 / option2}
    const selectMatch = line.match(/^([^:]+?)(\*?):\s*\{([^}]+\/[^}]+)\}$/);
    if (selectMatch) {
      groups[groups.length - 1].push({
        label: selectMatch[1].trim(),
        required: selectMatch[2] === '*',
        fieldType: 'select',
        options: selectMatch[3].split('/').map(o => o.trim()),
        placeholder: '',
      });
      continue;
    }

    // Field: Label*: {type placeholder}
    const fieldMatch = line.match(/^([^:]+?)(\*?):\s*\{(\w+)(?:\s+([^}]*))?\}$/);
    if (fieldMatch) {
      groups[groups.length - 1].push({
        label: fieldMatch[1].trim(),
        required: fieldMatch[2] === '*',
        fieldType: fieldMatch[3],
        placeholder: fieldMatch[4] || '',
      });
      continue;
    }
  }

  return { groups: groups.filter(g => g.length > 0), action };
}

// Kite Pages Renderer — pure functions, no DOM dependencies.
// render(doc, theme) → HTML string

// ============================================================
// Inline formatting
// ============================================================

function inl(text) {
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

function render(doc, theme = {}) {
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
          // Center short paragraphs that are direct section children
          // (skip CTA rows and standalone embed URLs — those have their own rendering)
          const bi = blocks[i];
          const isStandaloneUrl = bi.type === 'paragraph' && /^https?:\/\//.test(bi.text.trim()) && !/\s/.test(bi.text.trim());
          if (bi.type === 'paragraph' && !isLinkOnlyParagraph(bi.text) && !isStandaloneUrl &&
              bi.text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~`]+/g, '').length < 120) {
            html += `<p class="kp-centered">${inl(bi.text)}</p>`;
          } else {
            html += renderBlock(bi);
          }
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

function renderBlock(block, context) {
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

  // Detect short columns: every column has brief content (centered text looks better)
  const isShort = !isStats && block.columns.length >= 2 && block.columns.every(col => {
    const textLen = col.reduce((len, b) => len + (b.text || '').replace(/[*_~`\[\]()]+/g, '').length, 0);
    return textLen < 150;
  });

  const staggerClass = _currentAnim !== 'none' ? ' kp-animate kp-animate-stagger' : '';
  const wrapperClass = isStats ? 'kp-columns kp-columns-stats' : isShort ? 'kp-columns kp-columns-centered' : 'kp-columns';
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

function renderCarousel(block) {
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

function renderNav(headerDoc, theme = {}) {
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

function renderFooter(footerDoc, theme = {}) {
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

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function getThemeVars(theme = {}) {
  const lines = [];
  if (theme.colors) {
    const c = theme.colors;
    if (c.primary) {
      lines.push(`--primary: ${c.primary};`);
      const lum = luminance(c.primary);
      lines.push(`--primary-text: ${lum > 0.35 ? '#1a1a1a' : '#ffffff'};`);
    }
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

function getGoogleFontsUrl(theme = {}) {
  if (!theme.fonts) return null;
  const families = [];
  if (theme.fonts.heading) families.push(theme.fonts.heading);
  if (theme.fonts.body) families.push(theme.fonts.body);
  if (theme.fonts.accent) families.push(theme.fonts.accent);
  const unique = [...new Set(families)];
  if (unique.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${unique.map(f => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`).join('&')}&display=swap`;
}

function getThemeDataAttrs(theme = {}) {
  return {
    'data-sections': theme.sections || 'alternating',
    'data-cards': theme.cards || 'elevated',
    'data-animation': theme.animation || 'subtle',
    'data-spacing': theme.spacing || 'normal',
  };
}

// Kite Pages Compiled Editor — playground mode for static sites.
// This file is concatenated inside an IIFE with parser.mjs and renderer.mjs by compile.mjs.
// Expects parse(), parseYaml(), render(), renderNav(), renderFooter(),
// getGoogleFontsUrl() in scope.
// Sources from <script id="kp-sources">, theme from <script id="kp-theme">.

var _editorOpen = false;
var _sources = {};
var _activeFile = null;
var _currentTheme = {};

// Load embedded data
var _srcEl = document.getElementById('kp-sources');
if (_srcEl) try { _sources = JSON.parse(_srcEl.textContent); } catch(e) {}
var _themeEl = document.getElementById('kp-theme');
if (_themeEl) try { _currentTheme = JSON.parse(_themeEl.textContent); } catch(e) {}

function _getSource(name) { return _sources[name] || ''; }

// ===== Toggle =====
function _toggleEditor() {
  var panel = document.getElementById('kp-editor-panel');
  _editorOpen = !_editorOpen;
  panel.classList.toggle('open', _editorOpen);
  if (_editorOpen) _populateFileList();
}

// ===== File list =====
function _populateFileList() {
  var fileList = document.getElementById('kp-editor-files');
  fileList.innerHTML = '';
  var order = { 'theme.yaml': 0, 'header.md': 1, 'footer.md': 2 };
  var files = Object.keys(_sources).sort(function(a, b) {
    return (order[a] !== undefined ? order[a] : 10) - (order[b] !== undefined ? order[b] : 10) || a.localeCompare(b);
  });
  files.forEach(function(name) {
    var li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', function() { _switchFile(name); });
    fileList.appendChild(li);
  });
  var currentPage = location.pathname.split('/').pop().replace('.html', '.md') || 'index.md';
  if (_sources[currentPage]) _switchFile(currentPage);
  else if (files.length > 0) _switchFile(files[0]);
}

function _switchFile(name) {
  if (_activeFile) {
    _sources[_activeFile] = document.getElementById('kp-editor-textarea').value;
  }
  _activeFile = name;
  var textarea = document.getElementById('kp-editor-textarea');
  textarea.value = _sources[name] || '';
  document.getElementById('kp-editor-filename').textContent = name;
  _updateLineNumbers();
  _updateFileListHighlight();
}

function _updateFileListHighlight() {
  document.querySelectorAll('#kp-editor-files li').forEach(function(li) {
    li.classList.toggle('active', li.textContent === _activeFile);
  });
}

// ===== Line numbers & syntax highlighting =====
function _updateLineNumbers() {
  var textarea = document.getElementById('kp-editor-textarea');
  var lines = textarea.value.split('\n');
  document.getElementById('kp-editor-lines').innerHTML = lines.map(function(_, i) { return '<div>' + (i + 1) + '</div>'; }).join('');
  _updateHighlight(textarea.value);
}

function _updateHighlight(source) {
  var hl = document.getElementById('kp-editor-highlight');
  if (!hl) return;
  var html = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.split('\n').map(function(line) {
    if (/^---\s*$/.test(line)) return '<span class="hl-meta">' + line + '</span>';
    if (/^#{1,6}\s/.test(line)) {
      var level = line.match(/^(#{1,6})/)[1].length;
      return '<span class="hl-heading hl-h' + level + '">' + line + '</span>';
    }
    if (/^(:::|\|\|\||&gt;&gt;&gt;)/.test(line)) return '<span class="hl-fence">' + line + '</span>';
    if (/^---+\s*$/.test(line)) return '<span class="hl-hr">' + line + '</span>';
    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      var m = line.match(/^([-*]|\d+\.)\s/);
      return '<span class="hl-bullet">' + m[0] + '</span>' + _highlightInline(line.slice(m[0].length));
    }
    if (/^&gt;\s/.test(line)) return '<span class="hl-quote-prefix">' + line + '</span>';
    if (/^\s*[\w-]+:/.test(line)) {
      return line.replace(/^(\s*)([\w-]+)(:)(.*)$/, '$1<span class="hl-key">$2</span><span class="hl-meta">$3</span><span class="hl-value">$4</span>');
    }
    return _highlightInline(line);
  }).join('\n');
  hl.innerHTML = html + '\n';
}

function _highlightInline(text) {
  return text
    .replace(/(\*\*\*(.+?)\*\*\*)/g, '<span class="hl-bold hl-italic">$1</span>')
    .replace(/(\*\*(.+?)\*\*)/g, '<span class="hl-bold">$1</span>')
    .replace(/(\*(.+?)\*)/g, '<span class="hl-italic">$1</span>')
    .replace(/(`[^`]+`)/g, '<span class="hl-code">$1</span>')
    .replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="hl-link">$1</span>')
    .replace(/(!\[[^\]]*\]\([^)]+\))/g, '<span class="hl-link">$1</span>')
    .replace(/(\+\+.+?\+\+)/g, '<span class="hl-large">$1</span>')
    .replace(/(~~.+?~~)/g, '<span class="hl-strike">$1</span>')
    .replace(/(==.+?==)/g, '<span class="hl-mark">$1</span>');
}

// ===== Text manipulation helpers =====
function _editorWrapSelection(ta, before, after) {
  var start = ta.selectionStart, end = ta.selectionEnd;
  var selected = ta.value.substring(start, end);
  var replacement = before + (selected || 'text') + after;
  ta.value = ta.value.substring(0, start) + replacement + ta.value.substring(end);
  ta.selectionStart = start + before.length;
  ta.selectionEnd = start + before.length + (selected || 'text').length;
  ta.dispatchEvent(new Event('input'));
}

function _editorInsertText(ta, text) {
  var pos = ta.selectionStart;
  ta.value = ta.value.substring(0, pos) + text + ta.value.substring(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = pos + text.length;
  ta.dispatchEvent(new Event('input'));
}

function _editorLineTransform(ta, fn) {
  var val = ta.value;
  var start = ta.selectionStart, end = ta.selectionEnd;
  var lineStart = val.lastIndexOf('\n', start - 1) + 1;
  var lineEnd = val.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = val.length;
  var lines = val.substring(lineStart, lineEnd).split('\n');
  var transformed = lines.map(fn).join('\n');
  ta.value = val.substring(0, lineStart) + transformed + val.substring(lineEnd);
  ta.selectionStart = lineStart;
  ta.selectionEnd = lineStart + transformed.length;
  ta.dispatchEvent(new Event('input'));
}

function _editorLinePrefix(ta, prefix) {
  _editorLineTransform(ta, function(line) {
    return prefix + line.replace(/^#{1,6}\s+/, '');
  });
}

// ===== Live preview =====
function _handleEditorChange(source) {
  if (!_activeFile) return;

  if (_activeFile === 'theme.yaml') {
    try {
      var theme = parseYaml(source);
      _currentTheme = theme;
      _applyThemeToPage(theme);
      _rerenderPage();
    } catch(e) {}
    return;
  }

  if (_activeFile === 'header.md') {
    try {
      var headerDoc = parse(source);
      var navMount = document.getElementById('kp-nav-mount');
      navMount.innerHTML = renderNav(headerDoc, _currentTheme);
      var toggle = navMount.querySelector('.kp-nav-toggle');
      var links = navMount.querySelector('.kp-nav-links');
      if (toggle && links) toggle.addEventListener('click', function() { links.classList.toggle('open'); });
      var nav = navMount.querySelector('.kp-nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
    } catch(e) {}
    return;
  }

  if (_activeFile === 'footer.md') {
    _sources['footer.md'] = source;
    _rerenderPage();
    return;
  }

  // Page file — live preview
  try {
    var parsed = parse(source);
    var main = document.getElementById('kp-content');
    var bodyHtml = render(parsed, _currentTheme);
    var footerSrc = _getSource('footer.md');
    var footerHtml = '';
    if (footerSrc) try { footerHtml = renderFooter(parse(footerSrc), _currentTheme); } catch(e) {}
    main.innerHTML = bodyHtml + footerHtml;
    main.querySelectorAll('.kp-animate').forEach(function(el) { el.classList.add('kp-visible'); });
  } catch(e) {}
}

function _rerenderPage() {
  var currentPage = location.pathname.split('/').pop().replace('.html', '.md') || 'index.md';
  var pageSrc = _getSource(currentPage);
  if (!pageSrc) return;
  try {
    var parsed = parse(pageSrc);
    var main = document.getElementById('kp-content');
    var bodyHtml = render(parsed, _currentTheme);
    var footerSrc = _getSource('footer.md');
    var footerHtml = '';
    if (footerSrc) try { footerHtml = renderFooter(parse(footerSrc), _currentTheme); } catch(e) {}
    main.innerHTML = bodyHtml + footerHtml;
    main.querySelectorAll('.kp-animate').forEach(function(el) { el.classList.add('kp-visible'); });
  } catch(e) {}
}

function _applyThemeToPage(theme) {
  var root = document.documentElement;
  root.setAttribute('data-sections', theme.sections || 'alternating');
  root.setAttribute('data-cards', theme.cards || 'elevated');
  root.setAttribute('data-animation', theme.animation || 'subtle');
  root.setAttribute('data-spacing', theme.spacing || 'normal');
  if (theme.colors) {
    var c = theme.colors;
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
    var url = getGoogleFontsUrl(theme);
    if (url && !document.querySelector('link[href="' + url + '"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
    if (theme.fonts.body) root.style.setProperty('--font-body', "'" + theme.fonts.body + "', Georgia, serif");
    if (theme.fonts.heading) root.style.setProperty('--font-heading', "'" + theme.fonts.heading + "', Georgia, serif");
  }
  if (theme.radius !== undefined) root.style.setProperty('--radius', theme.radius + 'px');
  if (theme.radiusLg !== undefined) root.style.setProperty('--radius-lg', theme.radiusLg + 'px');
  if (theme.mode === 'dark') {
    var dc = theme.colors || {};
    root.style.setProperty('--bg', dc.background || '#0f0f0f');
    root.style.setProperty('--surface', dc.surface || '#1a1a1a');
    root.style.setProperty('--surface-warm', dc.surfaceWarm || '#151515');
    root.style.setProperty('--text', dc.text || '#e8e8e8');
    root.style.setProperty('--text-muted', dc.textMuted || '#999');
    root.style.setProperty('--text-light', dc.textLight || '#666');
    root.style.setProperty('--border', dc.border || '#2a2a2a');
    root.style.setProperty('--border-light', dc.borderLight || '#222');
  }
}

function _showEditorStatus(msg) {
  var el = document.getElementById('kp-editor-status');
  el.textContent = msg;
  setTimeout(function() { el.textContent = 'Playground \u2014 edits preview live but are not saved'; }, 2000);
}

// ===== Init =====
var _editorBtn = document.createElement('button');
_editorBtn.className = 'kp-editor-toggle';
_editorBtn.innerHTML = '&lt;/&gt;';
_editorBtn.title = 'Toggle editor (E)';
_editorBtn.addEventListener('click', _toggleEditor);
document.body.appendChild(_editorBtn);

var _editorPanel = document.createElement('div');
_editorPanel.className = 'kp-editor-panel';
_editorPanel.id = 'kp-editor-panel';
_editorPanel.innerHTML =
  '<div class="kp-editor-sidebar" id="kp-editor-sidebar">' +
    '<div class="kp-editor-sidebar-header">Files</div>' +
    '<ul class="kp-editor-files" id="kp-editor-files"></ul>' +
  '</div>' +
  '<div class="kp-editor-main">' +
    '<div class="kp-editor-header">' +
      '<strong id="kp-editor-filename">editor</strong>' +
      '<span class="kp-editor-status" id="kp-editor-status">Press E to toggle</span>' +
    '</div>' +
    '<div class="kp-editor-toolbar" id="kp-editor-toolbar">' +
      '<div class="kp-toolbar-row">' +
        '<span class="kp-toolbar-label">Text</span>' +
        '<button data-action="bold" title="Bold (Ctrl+B)"><b>B</b></button>' +
        '<button data-action="italic" title="Italic (Ctrl+I)"><i>I</i></button>' +
        '<button data-action="underline" title="Underline (Ctrl+U)"><u>U</u></button>' +
        '<button data-action="strike" title="Strikethrough"><s>S</s></button>' +
        '<button data-action="highlight" title="Highlight ==">==</button>' +
        '<button data-action="large" title="Large text ++">++</button>' +
        '<button data-action="superscript" title="Superscript ^">x\u207F</button>' +
        '<button data-action="subscript" title="Subscript ~">x\u2082</button>' +
        '<span class="kp-toolbar-sep"></span>' +
        '<button data-action="code" title="Inline code">&lt;/&gt;</button>' +
        '<button data-action="link" title="Link (Ctrl+K)">\uD83D\uDD17</button>' +
        '<button data-action="image" title="Image">\uD83D\uDCF7</button>' +
        '<button data-action="math-inline" title="Inline math">\u2211</button>' +
      '</div>' +
      '<div class="kp-toolbar-row">' +
        '<span class="kp-toolbar-label">Block</span>' +
        '<button data-action="h1" title="Heading 1">H1</button>' +
        '<button data-action="h2" title="Heading 2">H2</button>' +
        '<button data-action="h3" title="Heading 3">H3</button>' +
        '<span class="kp-toolbar-sep"></span>' +
        '<button data-action="ul" title="Bullet list">\u2022 List</button>' +
        '<button data-action="ol" title="Numbered list">1. List</button>' +
        '<button data-action="task" title="Task list">\u2610 Task</button>' +
        '<span class="kp-toolbar-sep"></span>' +
        '<button data-action="quote" title="Blockquote">&gt; Quote</button>' +
        '<button data-action="block-quote" title="Block quote">\u275D Block</button>' +
        '<button data-action="hr" title="Horizontal rule">\u2015 Rule</button>' +
        '<button data-action="codeblock" title="Code block">``` Code</button>' +
        '<button data-action="table" title="Table">\u25A6 Table</button>' +
        '<button data-action="math-block" title="Math block">\u2211 Math</button>' +
        '<button data-action="toc" title="Table of contents">{:toc}</button>' +
      '</div>' +
      '<div class="kp-toolbar-row">' +
        '<span class="kp-toolbar-label">Rich</span>' +
        '<button data-action="columns" title="Columns">\u25A6\u25A6 Columns</button>' +
        '<button data-action="card" title="Card">\u25AA Card</button>' +
        '<button data-action="testimonial" title="Testimonial">\u275D Testimonial</button>' +
        '<button data-action="alert" title="Alert">\u26A0 Alert</button>' +
        '<button data-action="bg-section" title="Background section">\uD83C\uDF04 Background</button>' +
        '<button data-action="carousel" title="Carousel">\u25B6 Carousel</button>' +
        '<button data-action="form" title="Form">\uD83D\uDCDD Form</button>' +
        '<button data-action="expandable" title="Expandable">\u25BC Expand</button>' +
        '<button data-action="record" title="Record">\uD83D\uDCCB Record</button>' +
      '</div>' +
    '</div>' +
    '<div class="kp-editor-content">' +
      '<div class="kp-editor-lines" id="kp-editor-lines"></div>' +
      '<div class="kp-editor-code-wrap">' +
        '<pre class="kp-editor-highlight" id="kp-editor-highlight"></pre>' +
        '<textarea id="kp-editor-textarea" spellcheck="false" wrap="off"></textarea>' +
      '</div>' +
    '</div>' +
  '</div>';

var _navMount = document.getElementById('kp-nav-mount');
if (_navMount) document.body.insertBefore(_editorPanel, _navMount);
else document.body.insertBefore(_editorPanel, document.body.firstChild);

// Textarea events
var _editorTextarea = document.getElementById('kp-editor-textarea');
var _debounceTimer = null;
var _rendering = false;
_editorTextarea.addEventListener('input', function() {
  if (_activeFile) _sources[_activeFile] = _editorTextarea.value;
  _updateLineNumbers();
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(function() {
    if (_rendering) return;
    _rendering = true;
    requestAnimationFrame(function() {
      _handleEditorChange(_editorTextarea.value);
      _rendering = false;
    });
  }, 300);
});

_editorTextarea.addEventListener('scroll', function() {
  document.getElementById('kp-editor-lines').scrollTop = _editorTextarea.scrollTop;
  document.getElementById('kp-editor-highlight').scrollTop = _editorTextarea.scrollTop;
  document.getElementById('kp-editor-highlight').scrollLeft = _editorTextarea.scrollLeft;
});

_editorTextarea.addEventListener('keydown', function(e) {
  var mod = e.ctrlKey || e.metaKey;
  if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) {
      _editorLineTransform(_editorTextarea, function(line) { return line.startsWith('  ') ? line.slice(2) : line; });
    } else {
      if (_editorTextarea.selectionStart === _editorTextarea.selectionEnd) {
        var start = _editorTextarea.selectionStart;
        _editorTextarea.value = _editorTextarea.value.substring(0, start) + '  ' + _editorTextarea.value.substring(start);
        _editorTextarea.selectionStart = _editorTextarea.selectionEnd = start + 2;
      } else {
        _editorLineTransform(_editorTextarea, function(line) { return '  ' + line; });
      }
    }
    _editorTextarea.dispatchEvent(new Event('input'));
    return;
  }
  if (mod && e.key === 's') { e.preventDefault(); navigator.clipboard.writeText(_editorTextarea.value).then(function() { _showEditorStatus('Copied to clipboard'); }); return; }
  if (mod && e.key === 'b') { e.preventDefault(); _editorWrapSelection(_editorTextarea, '**', '**'); return; }
  if (mod && e.key === 'i') { e.preventDefault(); _editorWrapSelection(_editorTextarea, '*', '*'); return; }
  if (mod && e.key === 'u') { e.preventDefault(); _editorWrapSelection(_editorTextarea, '_', '_'); return; }
  if (mod && e.key === 'k') { e.preventDefault(); _editorWrapSelection(_editorTextarea, '[', '](url)'); return; }
  if (e.key === '>' && e.shiftKey && _editorTextarea.selectionStart !== _editorTextarea.selectionEnd) {
    e.preventDefault();
    _editorLineTransform(_editorTextarea, function(line) { return '> ' + line; });
    return;
  }
});

// Toolbar
document.getElementById('kp-editor-toolbar').addEventListener('click', function(e) {
  var btn = e.target.closest('button');
  if (!btn) return;
  var action = btn.dataset.action;
  _editorTextarea.focus();
  var actions = {
    bold:        function() { _editorWrapSelection(_editorTextarea, '**', '**'); },
    italic:      function() { _editorWrapSelection(_editorTextarea, '*', '*'); },
    underline:   function() { _editorWrapSelection(_editorTextarea, '_', '_'); },
    strike:      function() { _editorWrapSelection(_editorTextarea, '~~', '~~'); },
    highlight:   function() { _editorWrapSelection(_editorTextarea, '==', '=='); },
    large:       function() { _editorWrapSelection(_editorTextarea, '++', '++'); },
    superscript: function() { _editorWrapSelection(_editorTextarea, '^', '^'); },
    subscript:   function() { _editorWrapSelection(_editorTextarea, '~', '~'); },
    code:        function() { _editorWrapSelection(_editorTextarea, '`', '`'); },
    link:        function() { _editorWrapSelection(_editorTextarea, '[', '](url)'); },
    image:       function() { _editorInsertText(_editorTextarea, '\n![alt](image.jpg)\n'); },
    'math-inline': function() { _editorWrapSelection(_editorTextarea, '\\(', '\\)'); },
    h1:          function() { _editorLinePrefix(_editorTextarea, '# '); },
    h2:          function() { _editorLinePrefix(_editorTextarea, '## '); },
    h3:          function() { _editorLinePrefix(_editorTextarea, '### '); },
    ul:          function() { _editorLineTransform(_editorTextarea, function(l) { return '- ' + l; }); },
    ol:          function() { var n = 1; _editorLineTransform(_editorTextarea, function(l) { return (n++) + '. ' + l; }); },
    task:        function() { _editorLineTransform(_editorTextarea, function(l) { return '- [ ] ' + l; }); },
    quote:       function() { _editorLineTransform(_editorTextarea, function(l) { return '> ' + l; }); },
    hr:          function() { _editorInsertText(_editorTextarea, '\n---\n'); },
    'block-quote': function() { _editorInsertText(_editorTextarea, '\n>>>\nQuoted text here.\n>>>\n'); },
    codeblock:   function() { _editorInsertText(_editorTextarea, '\n```\ncode here\n```\n'); },
    table:       function() { _editorInsertText(_editorTextarea, '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| cell     | cell     | cell     |\n'); },
    'math-block': function() { _editorInsertText(_editorTextarea, '\n\\[\nx^2 + y^2 = z^2\n\\]\n'); },
    toc:         function() { _editorInsertText(_editorTextarea, '\n{:toc}\n'); },
    columns:     function() { _editorInsertText(_editorTextarea, '\n|||\n### Column 1\nContent here\n---\n### Column 2\nContent here\n|||\n'); },
    card:        function() { _editorInsertText(_editorTextarea, '\n::: card\n### Card Title\nCard description.\n:::\n'); },
    testimonial: function() { _editorInsertText(_editorTextarea, '\n::: quote\n\u2605\u2605\u2605\u2605\u2605\nAmazing experience!\n\u2014 **Customer Name**\n:::\n'); },
    alert:       function() { _editorInsertText(_editorTextarea, '\n::: warning\nImportant information here.\n:::\n'); },
    'bg-section': function() { _editorInsertText(_editorTextarea, '\n::: bg image.jpg\n# Heading\nOverlay text on the image.\n:::\n'); },
    carousel:    function() { _editorInsertText(_editorTextarea, '\n::: carousel\n::: bg slide1.jpg\n# Slide 1\nSubtitle\n:::\n---\n::: bg slide2.jpg\n# Slide 2\nSubtitle\n:::\n:::\n'); },
    form:        function() { _editorInsertText(_editorTextarea, '\n::: form\nName*: {text}\nEmail*: {email}\nMessage: {paragraph}\n\n[Submit](POST /submit)\n:::\n'); },
    expandable:  function() { _editorInsertText(_editorTextarea, '\n>| Click to expand\n   Hidden content goes here.\n   More details.\n'); },
    record:      function() { _editorInsertText(_editorTextarea, '\n:: Item Name\n   Price: $10\n   Description of the item.\n'); },
  };
  if (actions[action]) actions[action]();
});

// E key toggles editor (when not in an input)
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    _toggleEditor();
  }
});

})();
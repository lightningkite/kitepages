// SuperMarkdown Parser — pure functions, no DOM dependencies.
// parse(source) → { frontmatter, blocks }

// ============================================================
// Simple YAML parser
// Handles frontmatter (flat key-value) and theme files (one level of nesting).
// For the Node.js compiler, js-yaml is used for robustness.
// This parser covers the browser runtime where js-yaml isn't available.
// ============================================================

export function parseYaml(text) {
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

export function parse(source) {
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
  for (let j = openLine + 1; j < end; j++) {
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
  let depth = 0;
  for (const line of lines) {
    if (line.match(/^:::\s+\w/)) depth++;
    else if (line.match(/^:::\s*$/)) { if (depth > 0) depth--; }

    if (depth === 0 && line.match(/^---+\s*$/)) {
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

export function parseBlocks(lines, start = 0, end = null) {
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

  // Background section
  if (typeStr.startsWith('bg ')) {
    return {
      block: { type: 'bg-section', bgImage: typeStr.substring(3).trim(), blocks: parseBlocks(innerLines) },
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

  // Find matching closer, respecting ::: nesting
  let depth = 0;
  let closeIdx = -1;
  for (let j = i + 1; j < end; j++) {
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

  return {
    block: { type: 'heading', level: match[1].length, text: match[2], id: slugify(match[2]) },
    next: i + 1
  };
}

function tryImage(lines, i) {
  if (!lines[i].match(/^!\[/)) return null;
  const match = lines[i].match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
  if (!match) return null;

  return {
    block: { type: 'image', alt: match[1], src: match[2] },
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

export function parseFormFields(lines) {
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

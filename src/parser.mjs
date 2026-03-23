// SuperMarkdown Parser — pure functions, no DOM dependencies.
// parse(source) → { frontmatter, blocks }

export function parse(source) {
  let frontmatter = {};
  let body = source;
  const fmMatch = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    frontmatter = parseYamlSimple(fmMatch[1]);
    body = fmMatch[2];
  }
  return { frontmatter, blocks: parseBlocks(body) };
}

export function parseYamlSimple(yaml) {
  const result = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) result[m[1]] = m[2];
  }
  return result;
}

export function parseBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++; continue;
    }

    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
      i++; continue;
    }

    if (line.match(/^\|\|\|[><]?\s*$/)) {
      const ch = line.trim();
      if (ch === '|||>') blocks.push({ type: 'columns-start' });
      else if (ch === '|||<') blocks.push({ type: 'columns-end' });
      else blocks.push({ type: 'column-break' });
      i++; continue;
    }

    if (line.match(/^>>>\s*$/)) {
      const slides = [];
      let currentSlide = [];
      i++;
      while (i < lines.length) {
        if (lines[i].match(/^>>>\s*$/)) {
          if (currentSlide.length > 0) {
            slides.push(parseBlocks(currentSlide.join('\n')));
            currentSlide = [];
          }
          i++;
          let peek = i;
          while (peek < lines.length && lines[peek].trim() === '') peek++;
          if (peek >= lines.length || !lines[peek].match(/^:::/)) break;
          continue;
        }
        currentSlide.push(lines[i]);
        i++;
      }
      if (currentSlide.length > 0) slides.push(parseBlocks(currentSlide.join('\n')));
      if (slides.length > 0) blocks.push({ type: 'carousel', slides });
      continue;
    }

    // Bare ::: (closing fence or incomplete opening) - skip it
    if (line.match(/^:::\s*$/) || (line.match(/^:::/) && !line.match(/^:::\s+\w/))) {
      i++; continue;
    }

    if (line.match(/^:::\s+\w/)) {
      const sectionType = line.replace(/^:::\s+/, '').trim();
      const contentLines = [];
      const fenceStart = i;
      i++;
      let closed = false;
      while (i < lines.length && !lines[i].match(/^:::\s*$/)) {
        contentLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) { closed = true; i++; }
      if (!closed) {
        blocks.push({ type: 'paragraph', text: line });
        i = fenceStart + 1;
        continue;
      }
      if (sectionType === 'form') {
        blocks.push({ type: 'form', content: parseFormFields(contentLines) });
      } else if (sectionType.startsWith('bg ')) {
        const bgImage = sectionType.replace('bg ', '').trim();
        const innerBlocks = parseBlocks(contentLines.join('\n'));
        blocks.push({ type: 'bg-section', bgImage, blocks: innerBlocks });
      } else {
        blocks.push({ type: 'fenced', sectionType, rawLines: contentLines });
      }
      continue;
    }

    if (line.match(/^---+$/)) {
      blocks.push({ type: 'hr' }); i++; continue;
    }

    if (line.match(/^[-*]\s+/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    {
      const pLines = [];
      while (i < lines.length && lines[i].trim() !== '' &&
             !lines[i].match(/^#{1,6}\s/) && !lines[i].match(/^!\[/) &&
             !lines[i].match(/^:::/) && !lines[i].match(/^>>>/) &&
             !lines[i].match(/^\|\|\|[><]?\s*$/) &&
             !lines[i].match(/^---/) && !lines[i].match(/^[-*]\s+/)) {
        pLines.push(lines[i]); i++;
      }
      if (pLines.length > 0) {
        blocks.push({ type: 'paragraph', text: pLines.join('<br>') });
      }
    }
  }
  return blocks;
}

export function parseFormFields(lines) {
  const groups = [[]];
  let action = null;
  for (const line of lines) {
    if (line.trim() === '') {
      if (groups[groups.length - 1].length > 0) groups.push([]);
      continue;
    }
    const btnMatch = line.match(/^\[([^\]]+)\]\((\w+)\s+([^)]+)\)/);
    if (btnMatch) { action = { label: btnMatch[1], method: btnMatch[2], url: btnMatch[3] }; continue; }

    const selectMatch = line.match(/^([^:]+?)(\*?):\s*<([^>]+\/[^>]+)>$/);
    if (selectMatch) {
      const options = selectMatch[3].split('/').map(o => o.trim());
      groups[groups.length - 1].push({
        label: selectMatch[1].trim(), required: selectMatch[2] === '*',
        fieldType: 'select', options, placeholder: '',
      });
      continue;
    }

    const fieldMatch = line.match(/^([^:]+?)(\*?):\s*<(\w+)(?:\s+([^>]*))?>$/);
    if (fieldMatch) {
      groups[groups.length - 1].push({
        label: fieldMatch[1].trim(), required: fieldMatch[2] === '*',
        fieldType: fieldMatch[3], placeholder: fieldMatch[4] || '',
      });
    }
  }
  return { groups: groups.filter(g => g.length > 0), action };
}

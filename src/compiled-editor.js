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

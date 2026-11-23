/* Code blocks (round 0056): <figure class="s4-code" data-lang="js" data-lines data-mark="3-4,9"> with a <pre><code>.
   - Colors the code for js, ts, json, css, html, py and sh with a tiny tokenizer (no library). Code that already holds
     <span class="s4-syntax-…"> spans is left as written (any other language: tokenise it on the server). data-lang="text"
     or data-plain: no colors.
   - Numbers the lines (data-lines), marks lines (data-mark="3-4,9"), and for data-variant="diff" reads each line's
     sign: + is an added line (<ins>), - a removed one (<del>), the sign keeps its own column.
   - Adds the language label, a Wrap toggle (long lines wrap instead of scrolling) and Copy (copies the code as written,
     never the line numbers or signs' column breaks), and gives the scroller tabindex so the keyboard can scroll it.
   S4.code.render(el) draws again after the code changed; S4.code.text(el) is the code as text. */
(function () {
  var S4 = window.S4;
  var STR = '"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'';
  var NUM = '\\b(?:0x[\\da-fA-F]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b';
  var JSK = 'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|yield|interface|type|enum|as|delete|void';
  /* each language: [role, pattern] tried in order at every position */
  var LANGS = {
    js: [['comment', '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/'], ['string', '`(?:\\\\[\\s\\S]|[^`\\\\])*`|' + STR], ['number', NUM + '|\\b(?:true|false|null|undefined|NaN)\\b'],
      ['keyword', '\\b(?:' + JSK + ')\\b'], ['type', '\\b[A-Z][\\w$]*'], ['function', '[a-zA-Z_$][\\w$]*(?=\\s*\\()'], ['property', '(?<=\\.)[a-zA-Z_$][\\w$]*'], ['punctuation', '[{}()[\\];,.]']],
    json: [['property', '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)'], ['string', STR], ['number', NUM + '|-|\\b(?:true|false|null)\\b'], ['punctuation', '[{}[\\],:]']],
    css: [['comment', '\\/\\*[\\s\\S]*?\\*\\/'], ['string', STR], ['keyword', '@[\\w-]+|!important'], ['property', '(?:--)?[a-zA-Z][\\w-]*(?=\\s*:[^{]*?[;}\\n])'],
      ['function', '[\\w-]+(?=\\()'], ['number', '#[\\da-fA-F]{3,8}\\b|-?\\d*\\.?\\d+(?:%|[a-z]+)?'], ['type', '[.#][\\w-]+'], ['', '[\\w-]+'], ['punctuation', '[{}();:,]']],
    html: [['comment', '<!--[\\s\\S]*?-->'], ['type', '(?<=<\\/?)[\\w-]+'], ['property', '[\\w:-]+(?==)'], ['string', '"[^"]*"|\'[^\']*\''], ['punctuation', '<\\/?|\\/?>|=']],
    py: [['comment', '#[^\\n]*'], ['string', '"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|[rbf]?(?:' + STR + ')'], ['number', NUM + '|\\b(?:True|False|None)\\b'],
      ['keyword', '\\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|import|from|as|class|with|try|except|finally|raise|lambda|yield|pass|break|continue|global|async|await)\\b|@\\w+'],
      ['type', '\\b[A-Z]\\w*'], ['function', '\\w+(?=\\s*\\()'], ['punctuation', '[{}()[\\]:,.]']],
    sh: [['comment', '(?<=^|\\s)#[^\\n]*'], ['string', STR], ['keyword', '\\b(?:if|then|else|fi|for|do|done|in|case|esac|while|export|local|function)\\b'],
      ['function', '(?<=^\\s*|[|;&]\\s*|\\$\\(\\s*)[\\w./-]+'], ['property', '(?<=\\s)--?[\\w-]+|\\$\\{?\\w+\\}?'], ['number', NUM]]
  };
  LANGS.ts = LANGS.javascript = LANGS.typescript = LANGS.js; LANGS.xml = LANGS.svg = LANGS.html; LANGS.python = LANGS.py; LANGS.bash = LANGS.shell = LANGS.sh;
  var NAMES = { js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript', json: 'JSON', css: 'CSS', html: 'HTML', xml: 'XML', svg: 'SVG', py: 'Python', python: 'Python', sh: 'Shell', bash: 'Bash', shell: 'Shell', diff: 'Diff', text: 'Text' };
  var cache = {};
  function compile(lang) {
    if (cache[lang]) return cache[lang];
    /* a plain word is taken whole, so a digit inside a name is never read as a number */
    return (cache[lang] = LANGS[lang].concat([['', '[\\w$]+']]).map(function (r) { return [r[0], new RegExp(r[1], 'y')]; }));
  }
  function esc(t) { return t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  /* text -> [[role or '', text], …] */
  function tokenize(src, lang) {
    var rules = LANGS[lang] ? compile(lang) : null, out = [], plain = '', i = 0;
    if (!rules) return [['', src]];
    while (i < src.length) {
      var hit = null;
      for (var k = 0; k < rules.length && !hit; k++) { var re = rules[k][1]; re.lastIndex = i; var m = re.exec(src); if (m && m[0]) hit = [rules[k][0], m[0]]; }
      if (hit) { if (plain) { out.push(['', plain]); plain = ''; } out.push(hit); i += hit[1].length; }
      else { plain += src[i++]; }
    }
    if (plain) out.push(['', plain]);
    return out;
  }
  /* HTML that may hold flat <span class="s4-syntax-…"> spans -> one HTML string per line, every span closed and reopened at a break */
  function splitLines(html) {
    var lines = [''], open = [], re = /(<span\b[^>]*>)|(<\/span>)|(\n)|([^<\n]+|<[^>]*>)/g, m;
    while ((m = re.exec(html))) {
      if (m[1]) { open.push(m[1]); lines[lines.length - 1] += m[1]; }
      else if (m[2]) { open.pop(); lines[lines.length - 1] += m[2]; }
      else if (m[3]) { lines[lines.length - 1] += open.map(function () { return '</span>'; }).join(''); lines.push(open.join('')); }
      else lines[lines.length - 1] += m[4];
    }
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    return lines;
  }
  function ranges(spec) {
    var on = {};
    String(spec || '').split(',').forEach(function (p) { var a = p.split('-').map(Number); if (!a[0]) return; for (var n = a[0]; n <= (a[1] || a[0]); n++) on[n] = true; });
    return on;
  }
  function render(fig) {
    var code = fig.querySelector('pre > code'); if (!code) return;
    /* new code written into it since the last render is read afresh */
    if (!fig._s4src || !code.querySelector('.s4-code-line')) fig._s4src = { text: code.textContent, html: code.innerHTML, tokens: !!code.querySelector('[class*="s4-syntax-"]') };
    var src = fig._s4src, lang = (fig.getAttribute('data-lang') || '').toLowerCase(), diff = fig.getAttribute('data-variant') === 'diff';
    var text = src.text.replace(/\n$/, '');
    var html = diff ? esc(text) : src.tokens || fig.hasAttribute('data-plain') ? src.html.replace(/\n$/, '') : tokenize(text, lang).map(function (t) { return t[0] ? '<span class="s4-syntax-' + t[0] + '">' + esc(t[1]) + '</span>' : esc(t[1]); }).join('');
    var lines = splitLines(html), marks = ranges(fig.getAttribute('data-mark')), plainLines = text.split('\n');
    fig.style.setProperty('--_digits', String(String(lines.length).length));
    code.innerHTML = lines.map(function (l, i) {
      var n = i + 1, tag = 'span', attrs = ' class="s4-code-line" data-n="' + n + '"' + (marks[n] ? ' data-mark' : ''), body = l || ' ';
      if (diff) {
        var first = (plainLines[i] || '').charAt(0), meta = /^(\+\+\+|---|@@|diff |index )/.test(plainLines[i] || '');
        var kind = meta ? 'meta' : first === '+' ? 'add' : first === '-' ? 'remove' : '';
        if (kind === 'add') tag = 'ins'; else if (kind === 'remove') tag = 'del';
        if (kind) attrs += ' data-diff="' + kind + '"';
        if (!meta) body = '<span class="s4-code-sign">' + esc(first === '+' || first === '-' ? first : ' ') + '</span>' + (l.replace(/^[+\- ]/, '') || ' ');
      }
      return '<' + tag + attrs + '><span class="s4-code-text">' + body + '</span>\n</' + tag + '>';
    }).join('');
  }
  function textOf(fig) { return fig._s4src ? fig._s4src.text.replace(/\n$/, '') : (fig.querySelector('pre > code') || fig).textContent; }
  function button(label, icon, cls) {
    var b = document.createElement('button'); b.type = 'button'; b.className = cls;
    if (icon) { b.dataset.size = 'xs'; b.setAttribute('aria-label', label); b.innerHTML = '<span class="s4-icon" data-icon="' + icon + '"></span>'; }
    else { b.dataset.variant = 'text'; b.dataset.size = 'xs'; b.textContent = label; }
    return b;
  }
  function wire(fig) {
    var pre = fig.querySelector('pre'); if (!pre) return;
    var head = fig.querySelector(':scope > .s4-code-head'), file = head && head.querySelector('.s4-code-file');
    var lang = (fig.getAttribute('data-lang') || (fig.getAttribute('data-variant') === 'diff' ? 'diff' : '')).toLowerCase();
    if (!pre.hasAttribute('tabindex')) pre.tabIndex = 0;
    if (!pre.getAttribute('aria-label')) pre.setAttribute('aria-label', (file ? file.textContent.trim() : NAMES[lang] || 'Code') + ' code');
    if (head && lang && NAMES[lang] && !head.querySelector('.s4-code-lang')) { var l = document.createElement('span'); l.className = 's4-code-lang'; l.textContent = NAMES[lang]; head.appendChild(l); }
    var bar = fig.querySelector('.s4-code-actions');
    if (!bar && !fig.hasAttribute('data-no-actions')) {
      bar = document.createElement('div'); bar.className = 's4-code-actions';
      var wrap = button('Wrap', null, 's4-button'); wrap.setAttribute('aria-pressed', String(fig.hasAttribute('data-wrap')));
      var copy = button('Copy Code', 'copy', 's4-icon-button');
      var said = document.createElement('span'); said.className = 's4-visually-hidden'; said.setAttribute('role', 'status');
      bar.append(wrap, copy, said);
      (head || fig).appendChild(bar);
      wrap.addEventListener('click', function () { var on = !fig.hasAttribute('data-wrap'); fig.toggleAttribute('data-wrap', on); wrap.setAttribute('aria-pressed', String(on)); S4.util.emit(fig, 's4-change', { wrap: on }); });
      copy.addEventListener('click', function () {
        var t = textOf(fig);
        var done = function (ok) {
          said.textContent = ok ? 'Copied' : 'Could not copy: select the code instead';
          S4.icon.set(copy.firstElementChild, ok ? 'check' : 'copy');
          clearTimeout(copy._s4t); copy._s4t = setTimeout(function () { S4.icon.set(copy.firstElementChild, 'copy'); said.textContent = ''; }, 1800);
          S4.util.emit(fig, 's4-copy', { text: t, ok: ok });
        };
        S4.util.copy(t, { silent: true }).then(done);   /* the button and the live region say it (decision 0073) */
      });
      S4.init(bar);
    }
    render(fig);
  }
  S4.code = {
    render: function (fig) { if (fig) { fig._s4src = null; render(fig); } },
    text: textOf,
    tokenize: tokenize
  };
  S4.register('code', function (scope) {
    S4.util.all(scope, '.s4-code').forEach(function (fig) { if (S4.util.once(fig, 'code')) wire(fig); });
  });
})();

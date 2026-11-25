/* Orion's minifier (no dependencies), used by scripts/build.mjs for every .min file.
   CSS: comments and spare whitespace out; no space after a declaration's colon, after a comma, around > and ~, before
   !important; strings are untouched; spaces around + and - stay (calc() needs them).
   JS: a small tokenizer (strings, template literals with ${} inside, regular expressions, comments) that keeps every line
   break, so automatic semicolon insertion is exactly as in the source, and inside a line keeps a space only where two tokens
   would otherwise join (two words, + +, - -, a slash before / or *, a number before a dot). Issue 109 checked it by parsing
   the source and the output of every bundle with a full JavaScript parser: the same syntax tree; the build compiles every
   output too (node:vm), so a tokenizer mistake can never ship. */
import { Script } from 'node:vm';

export function minCss(css) {
  const keep = [];
  css = css.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (s) => `\u0000${keep.push(s) - 1}\u0000`);
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1').replace(/;}/g, '}').replace(/,\s+(?=[^{}]*\{)/g, ',').trim()
    .replace(/: /g, ':').replace(/, /g, ',').replace(/\s*>\s*/g, '>').replace(/\s*~\s*/g, '~').replace(/ !important/g, '!important')
    .replace(/([\s:(,/])0\.(\d)/g, '$1.$2');
  return mergeLayers(css).replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}
/* back-to-back top-level blocks of the same layer (one per component file) become one block: the same rules, in the same
   order, in the same layer */
function mergeLayers(css) {
  const blocks = []; let depth = 0, start = 0, head = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { if (depth === 0) head = css.slice(start, i); depth++; }
    else if (c === '}') { depth--; if (depth === 0) { blocks.push([head, css.slice(start + head.length + 1, i)]); start = i + 1; } if (depth < 0) return css; }
    else if (c === ';' && depth === 0) { blocks.push([css.slice(start, i + 1), null]); start = i + 1; }
  }
  if (depth !== 0 || css.slice(start).trim()) return css;
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (prev && prev[1] != null && b[1] != null && /^@layer [\w.-]+$/.test(b[0]) && prev[0] === b[0]) prev[1] += b[1];
    else out.push([b[0], b[1]]);
  }
  return out.map(([h, body]) => (body == null ? h : `${h}{${body}}`)).join('');
}

const WORD = /[A-Za-z0-9_$\\\u0080-￿]/;
const BEFORE_REGEX = /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;
const PUNCT = /^(>>>=|\.\.\.|===|!==|\*\*=|<<=|>>=|>>>|\?\?=|&&=|\|\|=|=>|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<|>>|\*\*|[\s\S])/;

/* one line-preserving pass over a script; throws on anything it cannot read (the build then fails) */
const JOIN = true;
export function squeezeJs(src) {
  let out = '', i = 0, last = '', lastKind = '', space = false;
  const n = src.length;
  const regexAllowed = () => {
    if (!last) return true;
    if (BEFORE_REGEX.test(last)) return true;
    if (last === ')' || last === ']' || last === '}' || last === '++' || last === '--') return false;
    return /[(,=:[!&|?{};+\-*%<>~^]$/.test(last);
  };
  const emit = (t, kind) => {
    if (space && out.length) {
      const a = out[out.length - 1], b = t[0];
      if (a !== '\n' && ((WORD.test(a) && WORD.test(b)) || (a === '+' && b === '+') || (a === '-' && b === '-') || (a === '/' && (b === '/' || b === '*')) || (/[0-9]/.test(a) && b === '.'))) out += ' ';
    }
    space = false; out += t; last = t; lastKind = kind || 'p';
  };
  const skipString = (j, q) => { j++; while (j < n && src[j] !== q) { if (src[j] === '\\') j++; if (src[j] === '\n' && q !== '`') throw new Error('unterminated string at ' + j); j++; } return j; };
  while (i < n) {
    const c = src[i];
    if (c === '\n') {
      /* a line that ends in a punctuator no statement can end with joins the next one: no line break there can be a
         semicolon (never after ), ], }, ++, --, a word, a string, a template or a regular expression) */
      if (JOIN && lastKind === 'p' && /^(?:[;{,([=:?!~^&|<*%]|=>|&&|\|\||\?\?|===?|!==?|<=|>=|\+=|-=|\*=|%=|&=|\|=|\^=|<<|>>>?)$/.test(last)) { space = true; i++; continue; }
      out = out.replace(/[ \t]+$/, ''); if (out.length && out[out.length - 1] !== '\n') out += '\n'; space = false; i++; continue;
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { space = true; i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) throw new Error('unterminated comment at ' + i); if (src.slice(i, e).includes('\n')) { if (out.length && out[out.length - 1] !== '\n') out += '\n'; space = false; } else space = true; i = e + 2; continue; }
    if (c === '"' || c === "'") { const j = skipString(i, c); emit(src.slice(i, j + 1), 's'); i = j + 1; continue; }
    if (c === '`') {
      /* a template literal, with ${ … } that may hold strings, braces and templates of their own */
      let j = i + 1; const stack = ['`'];
      while (j < n && stack.length) {
        const d = src[j], top = stack[stack.length - 1];
        if (top === '`') {
          if (d === '\\') { j += 2; continue; }
          if (d === '`') { stack.pop(); j++; continue; }
          if (d === '$' && src[j + 1] === '{') { stack.push('{'); j += 2; continue; }
          j++; continue;
        }
        if (d === '{') stack.push('{'); else if (d === '}') stack.pop(); else if (d === '`') stack.push('`');
        else if (d === '"' || d === "'") j = skipString(j, d);
        j++;
      }
      if (stack.length) throw new Error('unterminated template at ' + i);
      emit(src.slice(i, j), 's'); i = j; continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1, cls = false;
      while (j < n) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '\n') throw new Error('regular expression across a line at ' + i); if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; j++; }
      j++; while (j < n && /[a-z]/.test(src[j])) j++;
      emit(src.slice(i, j), 'r'); i = j; continue;
    }
    if (WORD.test(c)) { let j = i; while (j < n && WORD.test(src[j])) j++; if (/[0-9]/.test(c)) while (j < n && /[0-9.eE_xXa-fA-F]/.test(src[j])) j++; emit(src.slice(i, j), 'w'); i = j; continue; }
    const m = src.slice(i, i + 4).match(PUNCT)[0];
    emit(m); i += m.length;
  }
  return out.replace(/\n+/g, '\n').replace(/^\n/, '');
}

export function minJs(src) {
  const out = squeezeJs(src).trimEnd() + '\n';
  new Script(out);   /* compiles, or the build stops here */
  return out;
}

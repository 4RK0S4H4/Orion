#!/usr/bin/env node
/* Prove that Orion works with any accent color (decision 0045): monochrome is one choice among many, so every accent
   has to keep contrast on the neutral base. For 24 hues x 4 variants plus the named accents, in light and dark, this
   builds the accent roles exactly as S4.theme does (components/core/core.js: primary roles from the seed, selection
   from the primary palette) and checks them against the neutral surfaces in tokens/tokens.json:
     on-primary on primary, on-primary-container on primary-container, selection text on selection   4.5:1
     primary (buttons, switches, focus ring, links) on every neutral surface                          3:1
   Usage: node scripts/check-accent.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')).tokens;
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(join(root, 'components/assets/m3color.js'), 'utf8'), sandbox);
const M3 = sandbox.window.M3Color;
const core = readFileSync(join(root, 'components/core/core.js'), 'utf8');
const ACCENTS = JSON.parse((core.match(/S4\.theme\.accents = (\{[^}]+\})/) || [, '{}'])[1].replace(/'/g, '"').replace(/(\w+):/g, '"$1":'));

const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hue = (h) => { const s = 0.7, l = 0.45, k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
/* decision 0060: a seed with no variant gets 'fidelity' when muted or deep, else 'vibrant' (core.js AUTO_VARIANT); the named
   accents are proven in vibrant and in the variant they get by default */
const AUTO = JSON.parse((core.match(/AUTO_VARIANT = (\{[^}]+\})/) || [, '{"chroma":60,"tone":35}'])[1].replace(/(\w+):/g, '"$1":'));
const auto = (seed) => { const h = M3.hct(seed); return h.chroma < AUTO.chroma || h.tone < AUTO.tone ? 'fidelity' : 'vibrant'; };
const seeds = [...Array.from({ length: 24 }, (_, i) => [hue(i * 15), ['vibrant', 'tonal', 'fidelity', 'expressive']]),
  ...Object.entries(ACCENTS).filter(([, v]) => v && v !== '#000000').map(([, v]) => [v, [...new Set(['vibrant', auto(v)])]])];
const SURFACES = ['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest', 'surface-dim', 'surface-bright'];
const neutral = (role, dark) => { const t = T['--md-sys-color-' + role]; return dark ? (t.modes?.dark ?? t.value) : t.value; };

let failures = 0, n = 0; const worst = { text: Infinity, shape: Infinity };
for (const dark of [false, true]) for (const [seed, variants] of seeds) for (const v of variants) {
  n++;
  const s = M3.scheme(seed, v, dark, 0), pal = M3.palettes(seed, v), tone = (t) => pal.rows.Primary[pal.tones.indexOf(t)];
  const text = [['on-primary', s['on-primary'], s.primary], ['on-primary-container', s['on-primary-container'], s['primary-container']], ['selection text', tone(dark ? 90 : 10), tone(dark ? 20 : 90)]];
  for (const [name, fg, bg] of text) { const r = ratio(fg, bg); worst.text = Math.min(worst.text, r); if (r < 4.5) { failures++; console.error(`  x ${dark ? 'dark' : 'light'} ${seed} ${v}: ${name} is ${r.toFixed(2)}:1, needs 4.5:1`); } }
  for (const surf of SURFACES) { const r = ratio(s.primary, neutral(surf, dark)); worst.shape = Math.min(worst.shape, r); if (r < 3) { failures++; console.error(`  x ${dark ? 'dark' : 'light'} ${seed} ${v}: primary on ${surf} is ${r.toFixed(2)}:1, needs 3:1`); } }
}
/* syntax colors (code blocks) keep 4.5:1 on the tinted surfaces of every accent (S4.theme({ surfaces: 'tinted' }) uses
   M3's tonal scheme unless a variant is named), so a code block reads the same in both color modes */
const SYNTAX = ['keyword', 'string', 'number', 'comment', 'function', 'type', 'property'];
const syntax = (r, dark) => { const t = T['--s4-syntax-' + r]; return dark ? t.modes.dark : t.value; };
let tinted = 0; worst.syntax = Infinity;
for (const dark of [false, true]) for (const [seed, variants] of seeds) for (const v of ['tonal', ...variants]) {
  tinted++;
  const s = M3.scheme(seed, v, dark, 0);
  for (const surf of SURFACES) for (const r of SYNTAX) { const x = ratio(syntax(r, dark), s[surf]); worst.syntax = Math.min(worst.syntax, x); if (x < 4.5) { failures++; console.error(`  x ${dark ? 'dark' : 'light'} ${seed} ${v} tinted: syntax ${r} on ${surf} is ${x.toFixed(2)}:1, needs 4.5:1`); } }
}
if (failures) { console.error(`${failures} accent pair(s) below the bar.`); process.exit(1); }
console.log(`Accents: ${n} accent schemes (24 hues x 4 variants + the named accents in vibrant and their default variant, light and dark) on the neutral base: text on accent fills worst ${worst.text.toFixed(2)}:1 (4.5 needed), accent on neutral surfaces worst ${worst.shape.toFixed(2)}:1 (3 needed); syntax colors on ${tinted} tinted schemes worst ${worst.syntax.toFixed(2)}:1 (4.5 needed).`);

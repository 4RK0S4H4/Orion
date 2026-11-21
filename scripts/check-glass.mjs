#!/usr/bin/env node
/* Prove the glass contrast floor: text in on-surface on float glass meets WCAG AA (4.5:1) over ANY backdrop, for every
   seed. Reads the glass values from tokens/tokens.json, generates 97 color schemes (monochrome + 24 hues x 4 variants)
   with Material Color Utilities, and checks the worst case: a pure black and a pure white backdrop, after the glass's
   backdrop filter (contrast, brightness) and tint. Fails (exit 1) if any scheme in light or dark falls below 4.5:1.
   Usage: node scripts/check-glass.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')).tokens;
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(join(root, 'components/assets/m3color.js'), 'utf8'), sandbox);
const M3 = sandbox.window.M3Color;

const val = (name, mode) => parseFloat(mode === 'light' ? T[name].value : (T[name].modes?.[mode] ?? T[name].value));
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (c) => { const [r, g, b] = c.map((v) => { v = Math.min(255, Math.max(0, v)) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t));
const hue = (h) => { const s = 0.7, l = 0.45, k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
/* the default monochrome scheme is the token values (the base grays are tuned by hand, decision 0045), not the raw generated ones */
const tokenScheme = (mode) => Object.fromEntries(Object.keys(T).filter((n) => n.startsWith('--md-sys-color-')).map((n) => [n.slice(15), mode === 'light' ? T[n].value : (T[n].modes?.[mode] ?? T[n].value)]));
const schemeOf = (seed, v, mode) => (seed === '#000000' ? tokenScheme(mode) : M3.scheme(seed, v, mode === 'dark', 0));
const seeds = [['#000000', ['monochrome']], ...Array.from({ length: 24 }, (_, i) => [hue(i * 15), ['vibrant', 'tonal', 'fidelity', 'expressive']])];

let failures = 0, worstAll = Infinity;
for (const mode of ['light', 'dark']) {
  const t = val('--s4-glass-tint-opacity-float', mode), c = val('--s4-glass-backdrop-contrast-float', mode), b = val('--s4-glass-backdrop-brightness-float', mode);
  const filt = (v) => Math.min(255, Math.max(0, ((v - 127.5) * c + 127.5) * b));   /* CSS contrast() then brightness() on sRGB */
  const lo = filt(0), hi = filt(255);
  let worst = { r: Infinity };
  for (const [seed, variants] of seeds) for (const v of variants) {
    const s = schemeOf(seed, v, mode), tint = rgb(s['surface-container']), text = rgb(s['on-surface']);
    const r = Math.min(ratio(text, mix(tint, [lo, lo, lo], t)), ratio(text, mix(tint, [hi, hi, hi], t)));
    if (r < worst.r) worst = { r, seed, v };
    if (r < 4.5) { failures++; console.error(`  x ${mode}: ${seed} ${v}: on-surface on glass is ${r.toFixed(2)}:1`); }
  }
  worstAll = Math.min(worstAll, worst.r);
  /* items on glass (decision 0043): on-surface text on a filled control (ink tint) and on a selected item (accent tint),
     with neutral surfaces (the default) and with stock tinted surfaces */
  const fo = val('--s4-glass-fill-opacity', mode), so = val('--s4-glass-fill-selected-opacity', mode);
  const mono = tokenScheme(mode);
  let fillWorst = { r: Infinity };
  for (const [seed, variants] of seeds) for (const v of variants) {
    const s = schemeOf(seed, v, mode);
    for (const surf of [mono, s]) {
      const tint = rgb(surf['surface-container']), text = rgb(surf['on-surface']), accent = rgb(s.primary);
      for (const back of [lo, hi]) {
        const glass = mix(tint, [back, back, back], t);
        const r = Math.min(ratio(text, mix(text, glass, fo)), ratio(text, mix(accent, glass, so)));
        if (r < fillWorst.r) fillWorst = { r, seed, v, surfaces: surf === mono ? 'neutral' : 'tinted' };
        if (r < 4.5) { failures++; console.error(`  x ${mode}: ${seed} ${v} (${surf === mono ? 'neutral' : 'tinted'} surfaces): on-surface on a fill on glass is ${r.toFixed(2)}:1`); }
      }
    }
  }
  console.log(`Items on glass ${mode} (fill ${fo}, selected ${so}): worst ${fillWorst.r.toFixed(2)}:1 (${fillWorst.seed} ${fillWorst.v}, ${fillWorst.surfaces} surfaces)`);
  /* floating action buttons are glass tinted with their own color (decision 0025): icon and label in the FAB's on-color.
     Monochrome: every FAB color keeps 3:1 for its icon and the default FAB 4.5:1 for its label at the owner's tint.
     With a seed (decision 0060): components/core/core.js gives the default FAB the label that keeps the most glass
     (on-primary-container, white or the accent's tone 10) and raises a FAB's tint, per scheme, only as far as its label
     needs to reach 4.5:1 over a black or white backdrop; this proves that a tint at or below 1 exists for every scheme,
     in neutral mode (the roles the seed writes) and tinted mode (every role), and reports how far it had to rise. */
  const fabPairs = [['primary-container', 'on-primary-container'], ['secondary-container', 'on-secondary-container'], ['tertiary-container', 'on-tertiary-container'], ['primary', 'on-primary'], ['secondary', 'on-secondary'], ['tertiary', 'on-tertiary']];
  const tfDefault = val('--s4-glass-tint-opacity-fab', mode), tfColor = val('--s4-glass-tint-opacity-fab-color', mode);
  const onGlass = (bg, fg, tf) => { const tint = rgb(bg), text = rgb(fg); return Math.min(ratio(text, mix(tint, [lo, lo, lo], tf)), ratio(text, mix(tint, [hi, hi, hi], tf))); };
  const fabTint = (bg, fg, from) => { for (let t = from; t < 1; t = Math.round((t + 0.01) * 100) / 100) if (onGlass(bg, fg, t) >= 4.5) return t; return 1; };   /* the same rule as core.js */
  /* Decision 0063: one label rule. Each colored FAB and the vibrant toolbar has its own tint token
     (--s4-glass-tint-opacity-fab-<color>, -toolbar-vibrant), computed by the build from the owner's 90% with the same
     rule; every monochrome label reads at 4.5:1 at its own tint (the gray dial keeps luminance within 1%, build-gray.mjs) */
  const monoTint = { 'primary-container': ['--s4-glass-tint-opacity-fab', 'default FAB'], 'secondary-container': ['--s4-glass-tint-opacity-fab-secondary-container'], 'tertiary-container': ['--s4-glass-tint-opacity-fab-tertiary-container'],
    primary: ['--s4-glass-tint-opacity-fab-primary'], secondary: ['--s4-glass-tint-opacity-fab-secondary'], tertiary: ['--s4-glass-tint-opacity-fab-tertiary'] };
  let fabMonoDefault = Infinity, monoLabel = { r: Infinity }, monoRaised = [];
  for (const [bg, fg, toolbar] of [...fabPairs, ['primary-container', 'on-primary-container', true]]) {
    const tn = toolbar ? '--s4-glass-tint-opacity-toolbar-vibrant' : monoTint[bg][0], tf = val(tn, mode), r = onGlass(mono[bg], mono[fg], tf);
    const what = toolbar ? 'the vibrant toolbar' : bg === 'primary-container' ? 'the default FAB' : `a ${bg} FAB`;
    if (!toolbar && bg === 'primary-container') fabMonoDefault = r;
    else if (r < monoLabel.r) monoLabel = { r, what };
    if (!toolbar && bg !== 'primary-container' && tf > tfColor) monoRaised.push(`${bg} ${tf}`);
    if (r < 4.5) { failures++; console.error(`  x ${mode}: monochrome label of ${what} is ${r.toFixed(2)}:1 on its glass (tint ${tf})`); }
  }
  const toneOf = (seed, v) => { const pal = M3.palettes(seed, v); return (x) => pal.rows.Primary[pal.tones.indexOf(x)]; };
  const accentRoles = (seed, v, dark) => {   /* neutral mode, as core.js writes it: the accent roles from the seed, the selection from the primary palette */
    const s = M3.scheme(seed, v, dark, 0), tone = toneOf(seed, v);
    const o = { 'primary-container': s['primary-container'], 'on-primary-container': s['on-primary-container'], primary: s.primary, 'on-primary': s['on-primary'] };
    const calm = M3.palettes(seed, 'tonal'), sel = (t, row) => { const a = tone(t), b = calm.rows[row || 'Primary'][calm.tones.indexOf(t)]; return M3.hct(b).chroma < M3.hct(a).chroma ? b : a; };   /* decision 0063 */
    o['secondary-container'] = dark ? sel(25, 'Secondary') : sel(90); o['on-secondary-container'] = sel(dark ? 90 : 10);
    return o;
  };
  let fabSeeded = { t: 0 }, fabSeededColor = { t: 0 }, toolbarWorst = { t: 0 }, seededSchemes = 0; const fabTints = {};
  for (const [seed, variants] of seeds) for (const v of variants) {
    if (seed === '#000000') continue;
    for (const surfaces of ['neutral', 'tinted']) {
      seededSchemes++;
      const s = surfaces === 'tinted' ? M3.scheme(seed, v, mode === 'dark', 0) : accentRoles(seed, v, mode === 'dark');
      const tone = toneOf(seed, v);
      for (const [bg, fg] of fabPairs) {
        if (!s[bg]) continue;   /* neutral mode: secondary and tertiary stay monochrome (above) */
        const isDefault = bg === 'primary-container', from = isDefault ? tfDefault : tfColor;
        const labels = isDefault ? [s[fg], tone(100), tone(10)] : [s[fg]];
        const pick = labels.map((l) => ({ l, t: fabTint(s[bg], l, from) })).reduce((a, b) => (b.t < a.t ? b : a));
        const r = onGlass(s[bg], pick.l, pick.t), worst = isDefault ? fabSeeded : fabSeededColor;
        if (pick.t > worst.t) Object.assign(worst, { t: pick.t, seed, v, surfaces, pair: bg });
        if (isDefault) fabTints[v] = Math.max(fabTints[v] || 0, pick.t);
        if (r < 4.5) { failures++; console.error(`  x ${mode}: ${seed} ${v} (${surfaces}): a ${bg} FAB's label is ${r.toFixed(2)}:1 even solid`); }
      }
      /* the vibrant toolbar (decision 0063 ends its exception): primary-container glass from the 90% floor, its own tint */
      const tt = fabTint(s['primary-container'], s['on-primary-container'], tfColor), tr = onGlass(s['primary-container'], s['on-primary-container'], tt);
      if (tt > toolbarWorst.t) Object.assign(toolbarWorst, { t: tt, seed, v, surfaces });
      if (tr < 4.5) { failures++; console.error(`  x ${mode}: ${seed} ${v} (${surfaces}): the vibrant toolbar's label is ${tr.toFixed(2)}:1 even solid`); }
    }
  }
  console.log(`FAB glass ${mode} (tint ${tfDefault}, other colors ${tfColor}): monochrome default FAB label ${fabMonoDefault.toFixed(2)}:1, every other monochrome label ${monoLabel.r.toFixed(2)}:1 or more at its own tint (worst: ${monoLabel.what}; raised by the build: ${monoRaised.join(', ') || 'none'}). With a seed, over ${seededSchemes} schemes (neutral and tinted) every label reaches 4.5:1: the default FAB's tint rises to at most ${fabSeeded.t.toFixed(2)} (${fabSeeded.seed} ${fabSeeded.v}, ${fabSeeded.surfaces}), a colored FAB's to ${fabSeededColor.t.toFixed(2)} (${fabSeededColor.seed} ${fabSeededColor.v} ${fabSeededColor.pair}, ${fabSeededColor.surfaces}); the vibrant toolbar's to ${toolbarWorst.t.toFixed(2)} (${toolbarWorst.seed} ${toolbarWorst.v}, ${toolbarWorst.surfaces}); default FAB tint at most per variant: ${Object.entries(fabTints).map(([k, t]) => k + ' ' + t.toFixed(2)).join(', ')}`);
  console.log(`Glass ${mode}: tint ${t}, backdrop contrast ${c} brightness ${b} -> worst ${worst.r.toFixed(2)}:1 (${worst.seed} ${worst.v}) over 97 schemes`);
}
if (failures) { console.error(`${failures} scheme(s) below 4.5:1. Raise the tint or the backdrop compression in tokens/src/glass.tokens.json.`); process.exit(1); }

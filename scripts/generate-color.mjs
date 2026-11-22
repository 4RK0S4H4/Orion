#!/usr/bin/env node
/* Generate tokens/src/color.tokens.json from a seed with Material Color Utilities.
   The seed, scheme variant and spec live in the file's own $extensions["com.s4.generator"], so the JSON stays the source of
   truth: change the seed there (or pass --seed/--variant) and rerun. Writes every M3 color role for four modes:
   light (base value), dark, high-contrast and dark-high-contrast. Medium contrast and other seeds are generated at run
   time by m3color.js, so they aren't stored here.
   Usage: node scripts/generate-color.mjs [--seed '#000000'] [--variant monochrome] */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tokens/src/color.tokens.json');
const arg = (name) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; };

const previous = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
const gen = { seed: '#000000', variant: 'monochrome', spec: '2025', ...(previous?.$extensions?.['com.s4.generator'] || {}) };
if (arg('seed')) gen.seed = arg('seed');
if (arg('variant')) gen.variant = arg('variant');

const sandbox = { window: {} };
vm.runInNewContext(readFileSync(join(root, 'components/assets/m3color.js'), 'utf8'), sandbox);
const M3 = sandbox.window.M3Color;
const modes = {
  light: M3.scheme(gen.seed, gen.variant, false, 0),
  dark: M3.scheme(gen.seed, gen.variant, true, 0),
  'high-contrast': M3.scheme(gen.seed, gen.variant, false, 1),
  'dark-high-contrast': M3.scheme(gen.seed, gen.variant, true, 1),
};

/* Decision 0043: quieter, clearer error tones in dark mode (M3's tone-80 salmon reads washed out; its tone-30 container is
   too loud as a fill). Light and both high-contrast modes keep the generated values. */
Object.assign(modes.dark, { error: '#ff8983', 'on-error': '#410004', 'error-container': '#4a1719', 'on-error-container': '#ffdad7' });

/* Decision 0045, "Crisper" base grays (owner's Palette Review): a white page in light mode and a deeper black in dark
   mode, with clearer steps between surfaces. Pure gray, standard contrast only; both high-contrast modes keep the
   generated values. Applies to the default monochrome scheme, which is also every seeded app's neutral base (0043). */
if (gen.variant === 'monochrome') {
  Object.assign(modes.light, {
    background: '#ffffff', surface: '#ffffff', 'surface-bright': '#ffffff', 'surface-dim': '#dcdcdc',
    'surface-container-lowest': '#ffffff', 'surface-container-low': '#f5f5f5', 'surface-container': '#efefef',
    'surface-container-high': '#e9e9e9', 'surface-container-highest': '#e2e2e2', 'surface-variant': '#e2e2e2',
    'on-background': '#171717', 'on-surface': '#171717', 'on-surface-variant': '#454545',
    outline: '#757575', 'outline-variant': '#c9c9c9',
    'secondary-container': '#d6d6d6', 'on-secondary-container': '#171717',
    'inverse-surface': '#2e2e2e', 'inverse-on-surface': '#f2f2f2',
  });
  Object.assign(modes.dark, {
    background: '#0e0e0e', surface: '#0e0e0e', 'surface-bright': '#363636', 'surface-dim': '#0e0e0e',
    'surface-container-lowest': '#090909', 'surface-container-low': '#181818', 'surface-container': '#1e1e1e',
    'surface-container-high': '#282828', 'surface-container-highest': '#333333', 'surface-variant': '#454545',
    'on-background': '#ededed', 'on-surface': '#ededed', 'on-surface-variant': '#bdbdbd',
    outline: '#8f8f8f', 'outline-variant': '#454545',
    'secondary-container': '#454545', 'on-secondary-container': '#ededed',
    'inverse-surface': '#ededed', 'inverse-on-surface': '#2e2e2e',
  });
}

const color = (hex) => {
  const h = hex.toLowerCase(), c = [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4));
  return { colorSpace: 'srgb', components: c, hex: h };
};
const DESCRIPTIONS = {
  primary: 'High-emphasis fills, text and icons: the primary button, the active state, the FAB container in some variants.',
  'on-primary': 'Text and icons on primary.',
  'primary-container': 'Standout fills for key components, e.g. the FAB.',
  'on-primary-container': 'Text and icons on primary-container.',
  secondary: 'Less prominent accents.',
  'secondary-container': 'Selected states: nav indicator, selected chips, tonal buttons.',
  'on-secondary-container': 'Text and icons on secondary-container.',
  tertiary: 'Contrasting accents.',
  error: 'Errors and destructive actions.',
  surface: 'The default background.',
  'on-surface': 'Default text and icons.',
  'on-surface-variant': 'Secondary text and icons.',
  'surface-container-lowest': 'Lowest-emphasis container (on surface).',
  'surface-container-low': 'Low-emphasis container: cards, panes.',
  'surface-container': 'Default container: nav bar, menus.',
  'surface-container-high': 'High-emphasis container: dialogs, search.',
  'surface-container-highest': 'Highest-emphasis container: filled text fields.',
  outline: 'Boundaries that must show at 3:1: the focus ring's fallback, forced-colors borders, chart axes (nothing in Orion is outlined).',
  'outline-variant': 'Decorative boundaries: dividers.',
  'inverse-surface': 'Snackbars and other inverted surfaces.',
  scrim: 'Behind modal surfaces (used at 32% opacity).',
};

const roles = {};
for (const role of Object.keys(modes.light)) {
  const t = { $value: color(modes.light[role]) };
  if (DESCRIPTIONS[role]) t.$description = DESCRIPTIONS[role];
  const m = {};
  for (const mode of ['dark', 'high-contrast', 'dark-high-contrast']) m[mode] = color(modes[mode][role]);
  t.$extensions = { 'com.s4.modes': m };
  roles[role] = t;
}

const doc = {
  $description: 'M3 color roles for the default S4 Orion scheme. Generated by scripts/generate-color.mjs from the seed below; edit the generator block, not the values.',
  $extensions: { 'com.s4.generator': { ...gen, library: `material-color-utilities ${M3.version}` } },
  md: { sys: { color: { $type: 'color', ...roles } } },
};
writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`Wrote ${Object.keys(roles).length} color roles (${gen.variant} ${gen.seed}) to tokens/src/color.tokens.json`);

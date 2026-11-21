#!/usr/bin/env node
/* A small, dependency-free WOFF2 subsetter for the site bundle (decision 0066): reads Orion's Inter variable WOFF2,
   keeps only the characters a website needs and the weights Orion uses, and writes a smaller WOFF2. Pure Node (zlib's
   Brotli); no network, no fontTools.

   What it does, and why it is safe:
   - Glyph IDs never change. Glyphs outside the kept set become empty (no outline, no variation data), so GSUB, GPOS,
     GDEF and HVAR stay byte for byte valid without being rewritten. The kept set is closed over GSUB (every glyph a
     kept glyph can turn into: figures, case forms, ligatures, alternates) and over composite components.
   - cmap keeps only the kept characters (format 4, plus format 12 if any are astral).
   - Weights: Orion writes 400 to 700 (tokens) and allows heavier display faces, so the light half of the weight axis
     (100 to 399) is dropped: every gvar tuple that only acts below the default weight is removed (exact for 400 and
     up, because such a tuple scales to zero at the default), fvar's weight minimum becomes 400 and lighter named
     instances go. The CSS @font-face says font-weight: 400 900, so the browser never asks for less.
   - Output: WOFF2 with null transforms (glyf and loca stored as plain tables, allowed by WOFF2 1.0 section 5.1),
     Brotli quality 11.
   Usage: node scripts/font-subset.mjs in.woff2 out.woff2   (the build calls subsetInter() itself) */
import { readFileSync, writeFileSync } from 'node:fs';
import { brotliDecompressSync, brotliCompressSync, constants as Z } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const KNOWN = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];

/* ---------------- reading ---------------- */
class R {
  constructor(buf, pos = 0) { this.b = buf; this.p = pos; }
  u8() { return this.b[this.p++]; }
  u16() { const v = this.b.readUInt16BE(this.p); this.p += 2; return v; }
  i16() { const v = this.b.readInt16BE(this.p); this.p += 2; return v; }
  u32() { const v = this.b.readUInt32BE(this.p); this.p += 4; return v; }
  base128() { let v = 0; for (let i = 0; i < 5; i++) { const c = this.u8(); v = v * 128 + (c & 0x7f); if (!(c & 0x80)) return v; } throw new Error('bad UIntBase128'); }
  u255() { const c = this.u8(); if (c === 253) return this.u16(); if (c === 255) return this.u8() + 253; if (c === 254) return this.u8() + 506; return c; }
}

export function decodeWoff2(buf) {
  const r = new R(buf);
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file');
  r.p = 4; const flavor = r.u32(); r.p = 12; const numTables = r.u16(); r.p = 48;
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const f = r.u8(); const tag = (f & 0x3f) === 0x3f ? (r.p += 4, buf.toString('latin1', r.p - 4, r.p)) : KNOWN[f & 0x3f];
    const v = (f >> 6) & 3, orig = r.base128();
    const transformed = (tag === 'glyf' || tag === 'loca') ? v === 0 : v !== 0;
    if (transformed && v !== 0) throw new Error(`unsupported transform ${v} on ${tag}`);
    dir.push({ tag, orig, transformed, len: transformed ? r.base128() : orig });
  }
  if (flavor === 0x74746366) throw new Error('font collections are not supported');
  /* compressed stream follows the directory (no collection header for a single font) */
  const head = new R(buf, 20); const compLen = head.u32();
  const data = brotliDecompressSync(buf.subarray(r.p, r.p + compLen));
  const tables = new Map(); let off = 0;
  for (const t of dir) { t.data = data.subarray(off, off + t.len); off += t.len; }
  for (const t of dir) if (!t.transformed) tables.set(t.tag, Buffer.from(t.data));
  const g = dir.find((t) => t.tag === 'glyf');
  if (g && g.transformed) {
    const { glyf, loca, indexFormat } = untransformGlyf(g.data);
    tables.set('glyf', glyf); tables.set('loca', loca);
    const h = tables.get('head'); h.writeInt16BE(indexFormat, 50);
  }
  return { flavor, tables };
}

/* WOFF2 5.1: rebuild glyf and loca from the transformed glyf table */
function untransformGlyf(t) {
  const r = new R(t);
  r.u16(); const options = r.u16(); const numGlyphs = r.u16(); const indexFormat = r.u16();
  const sizes = []; for (let i = 0; i < 7; i++) sizes.push(r.u32());
  let p = r.p; const streams = sizes.map((s) => { const b = t.subarray(p, p + s); p += s; return new R(b); });
  const [nContourS, nPointsS, flagS, glyphS, compositeS, bboxS, instrS] = streams;
  const overlap = options & 1 ? t.subarray(p, p + ((numGlyphs + 7) >> 3)) : null;
  const bitmapLen = ((numGlyphs + 31) >> 5) << 2;
  const bboxBitmap = bboxS.b.subarray(0, bitmapLen); bboxS.p = bitmapLen;
  const hasBbox = (i) => (bboxBitmap[i >> 3] >> (7 - (i & 7))) & 1;
  const glyphs = [];
  for (let i = 0; i < numGlyphs; i++) {
    const nC = nContourS.i16();
    if (nC === 0) { if (hasBbox(i)) throw new Error('bbox on empty glyph'); glyphs.push(Buffer.alloc(0)); continue; }
    if (nC > 0) {
      const ends = []; let total = 0;
      for (let c = 0; c < nC; c++) { total += nPointsS.u255(); ends.push(total - 1); }
      const pts = []; let x = 0, y = 0;
      for (let k = 0; k < total; k++) {
        let f = flagS.u8(); const on = !(f >> 7); f &= 0x7f;
        const b = glyphS.b, q = glyphS.p; let dx, dy, n;
        const ws = (fl, v) => (fl & 1 ? v : -v);
        if (f < 84) n = 1; else if (f < 120) n = 2; else if (f < 124) n = 3; else n = 4;
        if (f < 10) { dx = 0; dy = ws(f, ((f & 14) << 7) + b[q]); }
        else if (f < 20) { dx = ws(f, (((f - 10) & 14) << 7) + b[q]); dy = 0; }
        else if (f < 84) { const b0 = f - 20, b1 = b[q]; dx = ws(f, 1 + (b0 & 0x30) + (b1 >> 4)); dy = ws(f >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f)); }
        else if (f < 120) { const b0 = f - 84; dx = ws(f, 1 + (Math.floor(b0 / 12) << 8) + b[q]); dy = ws(f >> 1, 1 + (((b0 % 12) >> 2) << 8) + b[q + 1]); }
        else if (f < 124) { const b2 = b[q + 1]; dx = ws(f, (b[q] << 4) + (b2 >> 4)); dy = ws(f >> 1, ((b2 & 0x0f) << 8) + b[q + 2]); }
        else { dx = ws(f, (b[q] << 8) + b[q + 1]); dy = ws(f >> 1, (b[q + 2] << 8) + b[q + 3]); }
        glyphS.p += n; x += dx; y += dy; pts.push({ x, y, on });
      }
      const instrLen = glyphS.u255();
      const instr = instrS.b.subarray(instrS.p, instrS.p + instrLen); instrS.p += instrLen;
      let bbox;
      if (hasBbox(i)) bbox = [bboxS.i16(), bboxS.i16(), bboxS.i16(), bboxS.i16()];
      else { let a = Infinity, b2 = Infinity, c = -Infinity, d = -Infinity; for (const pt of pts) { a = Math.min(a, pt.x); b2 = Math.min(b2, pt.y); c = Math.max(c, pt.x); d = Math.max(d, pt.y); } bbox = [a, b2, c, d]; }
      const ov = overlap && (overlap[i >> 3] >> (7 - (i & 7))) & 1;
      glyphs.push(encodeSimple(ends, pts, instr, bbox, ov));
    } else {
      /* composite: components from the composite stream, bbox always explicit */
      const start = compositeS.p; let flags, haveInstr = false;
      do {
        flags = compositeS.u16(); compositeS.u16();
        compositeS.p += flags & 1 ? 4 : 2;
        if (flags & 8) compositeS.p += 2; else if (flags & 0x40) compositeS.p += 4; else if (flags & 0x80) compositeS.p += 8;
        if (flags & 0x100) haveInstr = true;
      } while (flags & 0x20);
      const comp = compositeS.b.subarray(start, compositeS.p);
      const bbox = [bboxS.i16(), bboxS.i16(), bboxS.i16(), bboxS.i16()];
      let instr = Buffer.alloc(0);
      if (haveInstr) { const n = glyphS.u255(); instr = instrS.b.subarray(instrS.p, instrS.p + n); instrS.p += n; }
      const out = Buffer.alloc(10 + comp.length + (haveInstr ? 2 + instr.length : 0));
      out.writeInt16BE(-1, 0); bbox.forEach((v, k) => out.writeInt16BE(v, 2 + 2 * k));
      comp.copy(out, 10);
      if (haveInstr) { out.writeUInt16BE(instr.length, 10 + comp.length); instr.copy(out, 12 + comp.length); }
      glyphs.push(out);
    }
  }
  return { ...buildGlyfLoca(glyphs, indexFormat), indexFormat };
}

function encodeSimple(ends, pts, instr, bbox, overlap) {
  const flags = [], xs = [], ys = []; let px = 0, py = 0;
  pts.forEach((pt, k) => {
    let f = pt.on ? 1 : 0; const dx = pt.x - px, dy = pt.y - py; px = pt.x; py = pt.y;
    if (k === 0 && overlap) f |= 0x40;
    if (dx === 0) f |= 0x10; else if (Math.abs(dx) < 256) { f |= 0x02; if (dx > 0) f |= 0x10; xs.push([1, Math.abs(dx)]); } else xs.push([2, dx]);
    if (dy === 0) f |= 0x20; else if (Math.abs(dy) < 256) { f |= 0x04; if (dy > 0) f |= 0x20; ys.push([1, Math.abs(dy)]); } else ys.push([2, dy]);
    flags.push(f);
  });
  /* run-length the flags */
  const fb = [];
  for (let k = 0; k < flags.length;) { let n = 1; while (k + n < flags.length && flags[k + n] === flags[k] && n < 256) n++; if (n > 2) { fb.push(flags[k] | 0x08, n - 1); k += n; } else { fb.push(flags[k]); k++; } }
  const coordLen = (a) => a.reduce((s, [w]) => s + w, 0);
  const out = Buffer.alloc(10 + 2 * ends.length + 2 + instr.length + fb.length + coordLen(xs) + coordLen(ys));
  let o = 0; out.writeInt16BE(ends.length, o); o += 2; for (const v of bbox) { out.writeInt16BE(v, o); o += 2; }
  for (const e of ends) { out.writeUInt16BE(e, o); o += 2; }
  out.writeUInt16BE(instr.length, o); o += 2; instr.copy ? instr.copy(out, o) : Buffer.from(instr).copy(out, o); o += instr.length;
  for (const f of fb) out[o++] = f;
  for (const [w, v] of xs) { if (w === 1) out[o++] = v; else { out.writeInt16BE(v, o); o += 2; } }
  for (const [w, v] of ys) { if (w === 1) out[o++] = v; else { out.writeInt16BE(v, o); o += 2; } }
  return out;
}

function buildGlyfLoca(glyphs, indexFormat) {
  const padded = glyphs.map((g) => (g.length % 4 ? Buffer.concat([g, Buffer.alloc(4 - (g.length % 4))]) : g));
  const total = padded.reduce((s, g) => s + g.length, 0);
  if (indexFormat === 0 && total > 0x1fffe) indexFormat = 1;
  const loca = Buffer.alloc((glyphs.length + 1) * (indexFormat ? 4 : 2)); let off = 0;
  padded.forEach((g, i) => { indexFormat ? loca.writeUInt32BE(off, i * 4) : loca.writeUInt16BE(off / 2, i * 2); off += g.length; });
  indexFormat ? loca.writeUInt32BE(off, glyphs.length * 4) : loca.writeUInt16BE(off / 2, glyphs.length * 2);
  return { glyf: Buffer.concat(padded), loca, indexFormat };
}

function readGlyphs(tables) {
  const head = tables.get('head'), fmt = head.readInt16BE(50), loca = tables.get('loca'), glyf = tables.get('glyf');
  const n = tables.get('maxp').readUInt16BE(4), out = [];
  for (let i = 0; i < n; i++) {
    const a = fmt ? loca.readUInt32BE(i * 4) : loca.readUInt16BE(i * 2) * 2, b = fmt ? loca.readUInt32BE(i * 4 + 4) : loca.readUInt16BE(i * 2 + 2) * 2;
    out.push(glyf.subarray(a, b));
  }
  return { glyphs: out, fmt };
}

function components(g) {
  if (g.length < 10 || g.readInt16BE(0) >= 0) return [];
  const r = new R(g, 10), out = []; let flags;
  do {
    flags = r.u16(); out.push(r.u16());
    r.p += flags & 1 ? 4 : 2;
    if (flags & 8) r.p += 2; else if (flags & 0x40) r.p += 4; else if (flags & 0x80) r.p += 8;
  } while (flags & 0x20);
  return out;
}

/* ---------------- cmap ---------------- */
function readCmap(t) {
  const r = new R(t); r.u16(); const n = r.u16(); const map = new Map(); let best = null;
  for (let i = 0; i < n; i++) { const pid = r.u16(), eid = r.u16(), off = r.u32(); const fmt = t.readUInt16BE(off); if (pid === 3 || pid === 0) { if (fmt === 12) best = { off, fmt }; else if (fmt === 4 && (!best || best.fmt !== 12)) best = { off, fmt }; } }
  if (!best) throw new Error('no Unicode cmap');
  const s = new R(t, best.off);
  if (best.fmt === 12) {
    s.u16(); s.u16(); s.u32(); s.u32(); const groups = s.u32();
    for (let i = 0; i < groups; i++) { const a = s.u32(), b = s.u32(), g = s.u32(); for (let c = a; c <= b; c++) map.set(c, g + c - a); }
  } else {
    s.u16(); s.u16(); s.u16(); const segX2 = s.u16(); s.p += 6; const seg = segX2 / 2, base = s.p;
    const end = (i) => t.readUInt16BE(base + i * 2), start = (i) => t.readUInt16BE(base + segX2 + 2 + i * 2);
    const delta = (i) => t.readInt16BE(base + segX2 * 2 + 2 + i * 2), roOff = base + segX2 * 3 + 2;
    for (let i = 0; i < seg; i++) {
      const ro = t.readUInt16BE(roOff + i * 2);
      for (let c = start(i); c <= end(i) && c !== 0xffff; c++) {
        let g; if (!ro) g = (c + delta(i)) & 0xffff; else { const a = roOff + i * 2 + ro + (c - start(i)) * 2; g = t.readUInt16BE(a); if (g) g = (g + delta(i)) & 0xffff; }
        if (g) map.set(c, g);
      }
    }
  }
  return map;
}

function writeCmap(map) {
  const codes = [...map.keys()].sort((a, b) => a - b), bmp = codes.filter((c) => c < 0xffff);
  /* format 4: one segment per run of consecutive codes with consecutive glyphs (idDelta), plus the 0xFFFF end */
  const segs = [];
  for (const c of bmp) { const g = map.get(c), s = segs[segs.length - 1]; if (s && c === s.end + 1 && g === s.g + (c - s.start)) s.end = c; else segs.push({ start: c, end: c, g }); }
  segs.push({ start: 0xffff, end: 0xffff, g: 1 });
  const segX2 = segs.length * 2, es = 2 ** Math.floor(Math.log2(segs.length));
  const f4 = Buffer.alloc(16 + segs.length * 8);
  let o = 0; const w = (v) => { f4.writeUInt16BE(v & 0xffff, o); o += 2; };
  w(4); w(f4.length); w(0); w(segX2); w(es * 2); w(Math.log2(es)); w(segX2 - es * 2);
  segs.forEach((s) => w(s.end)); w(0); segs.forEach((s) => w(s.start)); segs.forEach((s) => w(s.g - s.start)); segs.forEach(() => w(0));
  const astral = codes.some((c) => c > 0xffff);
  let f12 = null;
  if (astral) {
    const groups = []; for (const c of codes) { const g = map.get(c), s = groups[groups.length - 1]; if (s && c === s.end + 1 && g === s.g + (c - s.start)) s.end = c; else groups.push({ start: c, end: c, g }); }
    f12 = Buffer.alloc(16 + groups.length * 12); f12.writeUInt16BE(12, 0); f12.writeUInt32BE(f12.length, 4); f12.writeUInt32BE(groups.length, 12);
    groups.forEach((s, i) => { f12.writeUInt32BE(s.start, 16 + i * 12); f12.writeUInt32BE(s.end, 20 + i * 12); f12.writeUInt32BE(s.g, 24 + i * 12); });
  }
  const recs = astral ? [[0, 3, f4], [0, 4, f12], [3, 1, f4], [3, 10, f12]] : [[0, 3, f4], [3, 1, f4]];
  const head = Buffer.alloc(4 + recs.length * 8); head.writeUInt16BE(0, 0); head.writeUInt16BE(recs.length, 2);
  const subs = astral ? [f4, f12] : [f4]; const offs = new Map(); let off = head.length;
  for (const s of subs) { offs.set(s, off); off += s.length; }
  recs.forEach(([p, e, s], i) => { head.writeUInt16BE(p, 4 + i * 8); head.writeUInt16BE(e, 6 + i * 8); head.writeUInt32BE(offs.get(s), 8 + i * 8); });
  return Buffer.concat([head, ...subs]);
}

/* ---------------- GSUB closure ---------------- */
function coverage(t, off) {
  const r = new R(t, off), fmt = r.u16(), out = [];
  if (fmt === 1) { const n = r.u16(); for (let i = 0; i < n; i++) out.push(r.u16()); }
  else { const n = r.u16(); for (let i = 0; i < n; i++) { const a = r.u16(), b = r.u16(); r.u16(); for (let g = a; g <= b; g++) out.push(g); } }
  return out;
}
/* the OpenType features a website set in Orion can reach: the ones browsers turn on by themselves, the numeral and
   capital forms Orion's CSS asks for (tabular, old-style and lining figures, small capitals).
   Stylistic sets and character variants (Inter's alternate a, l, 0 …) are left out: Orion never turns them on. */
export const SITE_FEATURES = ['ccmp', 'locl', 'rvrn', 'rlig', 'liga', 'clig', 'calt', 'tnum', 'pnum', 'onum', 'lnum', 'smcp', 'c2sc'];
function featureLookups(t, features) {
  const fl = t.readUInt16BE(6), nf = t.readUInt16BE(fl), out = new Set();
  const addFeature = (fo) => { const n = t.readUInt16BE(fo + 2); for (let j = 0; j < n; j++) out.add(t.readUInt16BE(fo + 4 + j * 2)); };
  for (let i = 0; i < nf; i++) { const tag = t.toString('latin1', fl + 2 + i * 6, fl + 6 + i * 6); if (features.includes(tag)) addFeature(fl + t.readUInt16BE(fl + 6 + i * 6)); }
  /* GSUB 1.1 feature variations (weight-dependent substitutions): every alternate feature table counts */
  if (t.readUInt16BE(2) >= 1 && t.length >= 14) {
    const fv = t.readUInt32BE(10);
    if (fv) {
      const nr = t.readUInt32BE(fv + 4);
      for (let i = 0; i < nr; i++) {
        const fts = t.readUInt32BE(fv + 8 + i * 8 + 4); if (!fts) continue;
        const base = fv + fts, ns = t.readUInt16BE(base + 4);
        for (let k = 0; k < ns; k++) addFeature(base + t.readUInt32BE(base + 6 + k * 6 + 2));
      }
    }
  }
  return out;
}
function gsubClosure(t, keep, features = SITE_FEATURES) {
  if (!t) return;
  const lookupList = t.readUInt16BE(8), n = t.readUInt16BE(lookupList), lookups = [];
  for (let i = 0; i < n; i++) {
    const lo = lookupList + t.readUInt16BE(lookupList + 2 + i * 2); let type = t.readUInt16BE(lo); const cnt = t.readUInt16BE(lo + 4), subs = [];
    for (let k = 0; k < cnt; k++) {
      let so = lo + t.readUInt16BE(lo + 6 + k * 2), ty = type;
      if (ty === 7) { ty = t.readUInt16BE(so + 2); so = so + t.readUInt32BE(so + 4); }
      subs.push([ty, so]);
    }
    lookups.push(subs);
  }
  /* reachable lookups: the features' own, plus every lookup a contextual one calls (searched in its bytes) */
  const reach = featureLookups(t, features);
  for (let grew = true; grew;) {
    grew = false;
    for (const li of [...reach]) for (const [ty, so] of lookups[li]) for (const x of nestedLookups(t, ty, so)) if (!reach.has(x)) { reach.add(x); grew = true; }
  }
  const subs = [...reach].flatMap((li) => lookups[li]);
  let grew = true;
  while (grew) {
    grew = false; const add = (g) => { if (!keep.has(g)) { keep.add(g); grew = true; } };
    for (const [ty, so] of subs) {
      if (ty > 4 && ty !== 8) continue;
      const fmt = t.readUInt16BE(so), cov = coverage(t, so + t.readUInt16BE(so + 2));
      if (ty === 1) {
        cov.forEach((g, i) => { if (!keep.has(g)) return; add(fmt === 1 ? (g + t.readInt16BE(so + 4)) & 0xffff : t.readUInt16BE(so + 6 + i * 2)); });
      } else if (ty === 2 || ty === 3) {
        cov.forEach((g, i) => { if (!keep.has(g)) return; const so2 = so + t.readUInt16BE(so + 6 + i * 2), m = t.readUInt16BE(so2); for (let j = 0; j < m; j++) add(t.readUInt16BE(so2 + 2 + j * 2)); });
      } else if (ty === 4) {
        cov.forEach((g, i) => {
          if (!keep.has(g)) return; const ls = so + t.readUInt16BE(so + 6 + i * 2), m = t.readUInt16BE(ls);
          for (let j = 0; j < m; j++) { const lo = ls + t.readUInt16BE(ls + 2 + j * 2), lig = t.readUInt16BE(lo), cc = t.readUInt16BE(lo + 2); let all = true; for (let q = 1; q < cc; q++) if (!keep.has(t.readUInt16BE(lo + 2 + q * 2))) all = false; if (all) add(lig); }
        });
      } else if (ty === 8) {
        /* reverse chaining single: substitutes listed after the backtrack and lookahead coverages */
        let p = so + 4; const bt = t.readUInt16BE(p); p += 2 + bt * 2; const la = t.readUInt16BE(p); p += 2 + la * 2; const gc = t.readUInt16BE(p);
        cov.forEach((g, i) => { if (keep.has(g) && i < gc) add(t.readUInt16BE(p + 2 + i * 2)); });
      }
      /* 5 and 6 (contextual) only call other lookups, which are all in this list: covered by the loop */
    }
  }
}

/* lookup indices a contextual (5) or chained contextual (6) subtable calls */
function nestedLookups(t, ty, so) {
  if (ty !== 5 && ty !== 6) return [];
  const fmt = t.readUInt16BE(so), out = [];
  const records = (p, n) => { for (let i = 0; i < n; i++) out.push(t.readUInt16BE(p + i * 4 + 2)); };
  const ruleSets = (countAt, readRule) => { const n = t.readUInt16BE(so + countAt); for (let i = 0; i < n; i++) { const rs = t.readUInt16BE(so + countAt + 2 + i * 2); if (!rs) continue; const base = so + rs, m = t.readUInt16BE(base); for (let j = 0; j < m; j++) readRule(base + t.readUInt16BE(base + 2 + j * 2)); } };
  if (ty === 5) {
    if (fmt === 1 || fmt === 2) ruleSets(fmt === 1 ? 4 : 6, (r) => { const gc = t.readUInt16BE(r), sc = t.readUInt16BE(r + 2); records(r + 4 + (gc - 1) * 2, sc); });
    else if (fmt === 3) { const gc = t.readUInt16BE(so + 2), sc = t.readUInt16BE(so + 4); records(so + 6 + gc * 2, sc); }
  } else {
    const chain = (r) => { let p = r; const b = t.readUInt16BE(p); p += 2 + b * 2; const i = t.readUInt16BE(p); p += 2 + (i - 1) * 2; const l = t.readUInt16BE(p); p += 2 + l * 2; const sc = t.readUInt16BE(p); records(p + 2, sc); };
    if (fmt === 1) ruleSets(4, chain);
    else if (fmt === 2) ruleSets(10, chain);
    else if (fmt === 3) { let p = so + 2; const b = t.readUInt16BE(p); p += 2 + b * 2; const i = t.readUInt16BE(p); p += 2 + i * 2; const l = t.readUInt16BE(p); p += 2 + l * 2; const sc = t.readUInt16BE(p); records(p + 2, sc); }
  }
  return out;
}

/* ---------------- gvar: empty unkept glyphs, drop tuples below the default weight ---------------- */
function fvarAxes(t) { const r = new R(t, 4); const off = r.u16(); r.u16(); const n = r.u16(), size = r.u16(), axes = []; for (let i = 0; i < n; i++) { const o = off + i * size; axes.push({ tag: t.toString('latin1', o, o + 4), min: t.readInt32BE(o + 4) / 65536, def: t.readInt32BE(o + 8) / 65536, max: t.readInt32BE(o + 12) / 65536, o }); } return axes; }

function subsetGvar(t, keep, dropAxis) {
  const axisCount = t.readUInt16BE(4), sharedCount = t.readUInt16BE(6), sharedOff = t.readUInt32BE(8), n = t.readUInt16BE(12), flags = t.readUInt16BE(14), dataOff = t.readUInt32BE(16);
  const long = flags & 1, offAt = (i) => (long ? t.readUInt32BE(20 + i * 4) : t.readUInt16BE(20 + i * 2) * 2);
  const shared = []; for (let i = 0; i < sharedCount; i++) { const a = []; for (let k = 0; k < axisCount; k++) a.push(t.readInt16BE(sharedOff + (i * axisCount + k) * 2)); shared.push(a); }
  const out = [];
  for (let g = 0; g < n; g++) {
    const a = dataOff + offAt(g), b = dataOff + offAt(g + 1);
    if (!keep.has(g) || a === b) { out.push(Buffer.alloc(0)); continue; }
    const d = t.subarray(a, b);
    if (dropAxis == null) { out.push(Buffer.from(d)); continue; }
    const r = new R(d); const tc = r.u16(), count = tc & 0x0fff, sharedPts = tc & 0x8000, serOff = r.u16();
    const hdrs = [];
    for (let i = 0; i < count; i++) {
      const start = r.p, size = r.u16(), idx = r.u16(); let peak;
      if (idx & 0x8000) { peak = []; for (let k = 0; k < axisCount; k++) peak.push(r.i16()); } else peak = shared[idx & 0x0fff];
      if (idx & 0x4000) r.p += axisCount * 4;
      hdrs.push({ raw: d.subarray(start, r.p), size, peak });
    }
    /* serialized data: optional shared point numbers, then each tuple's data in order */
    let p = serOff, sharedBytes = Buffer.alloc(0);
    if (sharedPts) { const s = p; p = skipPoints(d, p); sharedBytes = d.subarray(s, p); }
    const kept = []; for (const h of hdrs) { h.data = d.subarray(p, p + h.size); p += h.size; if (!(h.peak[dropAxis] < 0)) kept.push(h); }
    if (!kept.length) { out.push(Buffer.alloc(0)); continue; }
    const hb = Buffer.concat(kept.map((h) => h.raw)); const head = Buffer.alloc(4);
    head.writeUInt16BE(kept.length | sharedPts, 0); head.writeUInt16BE(4 + hb.length, 2);
    out.push(Buffer.concat([head, hb, sharedBytes, ...kept.map((h) => h.data)]));
  }
  const padded = out.map((x) => (x.length % 2 ? Buffer.concat([x, Buffer.alloc(1)]) : x));
  const total = padded.reduce((s, x) => s + x.length, 0), useLong = total > 0x1fffe;
  const offs = Buffer.alloc((n + 1) * (useLong ? 4 : 2)); let off = 0;
  padded.forEach((x, i) => { useLong ? offs.writeUInt32BE(off, i * 4) : offs.writeUInt16BE(off / 2, i * 2); off += x.length; });
  useLong ? offs.writeUInt32BE(off, n * 4) : offs.writeUInt16BE(off / 2, n * 2);
  const sharedTuples = t.subarray(sharedOff, sharedOff + sharedCount * axisCount * 2);
  const head = Buffer.alloc(20); t.copy(head, 0, 0, 20);
  head.writeUInt32BE(20 + offs.length, 8); head.writeUInt16BE(useLong ? flags | 1 : flags & ~1, 14);
  head.writeUInt32BE(20 + offs.length + sharedTuples.length + (sharedTuples.length % 4 ? 4 - (sharedTuples.length % 4) : 0), 16);
  const pad = Buffer.alloc(sharedTuples.length % 4 ? 4 - (sharedTuples.length % 4) : 0);
  return Buffer.concat([head, offs, sharedTuples, pad, ...padded]);
}
function skipPoints(d, p) {
  let n = d[p++]; if (n & 0x80) n = ((n & 0x7f) << 8) | d[p++];
  let read = 0;
  while (read < n) { const c = d[p++], run = (c & 0x3f) + 1; p += run * (c & 0x80 ? 2 : 1); read += run; }
  return p;
}

function trimFvar(t, axisIndex, newMin) {
  const out = Buffer.from(t); const off = t.readUInt16BE(4), n = t.readUInt16BE(8), size = t.readUInt16BE(10);
  const o = off + axisIndex * size; out.writeInt32BE(Math.round(newMin * 65536), o + 4);
  const ic = t.readUInt16BE(12), is = t.readUInt16BE(14), ib = off + n * size; const keepI = [];
  for (let i = 0; i < ic; i++) { const p = ib + i * is; if (t.readInt32BE(p + 4 + axisIndex * 4) / 65536 >= newMin) keepI.push(t.subarray(p, p + is)); }
  out.writeUInt16BE(keepI.length, 12);
  return Buffer.concat([out.subarray(0, ib), ...keepI]);
}

/* ---------------- GPOS: blank what only unkept glyphs use ----------------
   Nothing moves (offsets stay valid); values that can only apply to an unkept glyph become zeros, which Brotli all but
   erases. Kerning: rows and columns of class kerning whose classes hold no kept glyph, pair values whose second glyph is
   unkept, pair sets only unkept first glyphs use. Mark attachment: when no kept glyph is a mark, every mark lookup is
   emptied (its subtable count set to 0) and its bytes blanked, except bytes a kept lookup can still reach. */
function classDefOf(t, off) {
  const fmt = t.readUInt16BE(off), map = new Map(); let end;
  if (fmt === 1) { const s = t.readUInt16BE(off + 2), n = t.readUInt16BE(off + 4); for (let i = 0; i < n; i++) map.set(s + i, t.readUInt16BE(off + 6 + i * 2)); end = off + 6 + n * 2; }
  else { const n = t.readUInt16BE(off + 2); for (let i = 0; i < n; i++) { const a = t.readUInt16BE(off + 4 + i * 6), b = t.readUInt16BE(off + 6 + i * 6), c = t.readUInt16BE(off + 8 + i * 6); for (let g = a; g <= b; g++) map.set(g, c); } end = off + 4 + n * 6; }
  return { map, end };
}
function coverageEnd(t, off) { const fmt = t.readUInt16BE(off), n = t.readUInt16BE(off + 2); return off + 4 + n * (fmt === 1 ? 2 : 6); }
const vrSize = (vf) => { let n = 0; for (let b = 0; b < 8; b++) if (vf & (1 << b)) n += 2; return n; };
function deviceEnd(t, off) { const a = t.readUInt16BE(off), b = t.readUInt16BE(off + 2), f = t.readUInt16BE(off + 4); if (f === 0x8000) return off + 6; const per = [0, 8, 4, 2][f] || 8; return off + 6 + Math.ceil((b - a + 1) / per) * 2; }

export function pruneGpos(src, keep, markGlyphs, direct = keep) {
  const t = Buffer.from(src), protect = new Uint8Array(t.length);
  const guard = (a, b) => protect.fill(1, a, b);
  const ll = t.readUInt16BE(8), n = t.readUInt16BE(ll), lookups = [];
  for (let i = 0; i < n; i++) {
    const lo = ll + t.readUInt16BE(ll + 2 + i * 2), type = t.readUInt16BE(lo), cnt = t.readUInt16BE(lo + 4), subs = [];
    guard(lo, lo + 6 + cnt * 2 + 2);
    for (let k = 0; k < cnt; k++) { let so = lo + t.readUInt16BE(lo + 6 + k * 2), ty = type; if (ty === 9) { guard(so, so + 8); ty = t.readUInt16BE(so + 2); so += t.readUInt32BE(so + 4); } subs.push([ty, so]); }
    lookups.push({ lo, type, subs });
  }
  const starts = lookups.flatMap((l) => l.subs.map(([, so]) => so)).sort((a, b) => a - b);
  guard(0, starts[0]);
  const isMark = (ty) => ty === 4 || ty === 5 || ty === 6;
  /* a mark is only reached through a character the subset maps; marks pulled in by a GSUB rule need a combining
     character (outside the subset) to fire, so they never meet a base glyph here */
  const keptHasMark = [...direct].some((g) => markGlyphs.has(g));
  const otherTypes = lookups.some((l) => l.subs.some(([ty]) => !isMark(ty) && ty !== 1 && ty !== 2));
  const dropMarks = !keptHasMark && !otherTypes;
  const devices = (base, rec, vf) => { let p = rec; for (let b = 0; b < 8; b++) if (vf & (1 << b)) { if (b >= 4) { const o = t.readUInt16BE(p); if (o) guard(base + o, deviceEnd(t, base + o)); } p += 2; } };
  for (const l of lookups) for (const [ty, so] of l.subs) {
    if (isMark(ty) && dropMarks) continue;
    if (isMark(ty)) { const i = starts.indexOf(so); guard(so, starts[i + 1] || t.length); continue; }
    const fmt = t.readUInt16BE(so), covOff = so + t.readUInt16BE(so + 2), cov = coverage(t, covOff);
    guard(covOff, coverageEnd(t, covOff));
    if (ty === 1) {
      const vf = t.readUInt16BE(so + 4), sz = vrSize(vf);
      if (fmt === 1) { guard(so, so + 6 + sz); devices(so, so + 6, vf); }
      else { const c = t.readUInt16BE(so + 6); guard(so, so + 8 + c * sz); for (let i = 0; i < c; i++) devices(so, so + 8 + i * sz, vf); }
      continue;
    }
    const vf1 = t.readUInt16BE(so + 4), vf2 = t.readUInt16BE(so + 6), s1 = vrSize(vf1), s2 = vrSize(vf2);
    if (fmt === 1) {
      const count = t.readUInt16BE(so + 8); guard(so, so + 10 + count * 2);
      const keptSets = new Set(), allSets = new Set();
      for (let i = 0; i < count; i++) { const ps = so + t.readUInt16BE(so + 10 + i * 2); allSets.add(ps); if (keep.has(cov[i])) keptSets.add(ps); }
      for (const ps of allSets) {
        const m = t.readUInt16BE(ps), rs = 2 + s1 + s2;
        if (!keptSets.has(ps)) continue;
        guard(ps, ps + 2 + m * rs);
        for (let j = 0; j < m; j++) {
          const r = ps + 2 + j * rs;
          if (!keep.has(t.readUInt16BE(r))) t.fill(0, r + 2, r + rs);
          else { devices(so, r + 2, vf1); devices(so, r + 2 + s1, vf2); }
        }
      }
      for (const ps of allSets) if (!keptSets.has(ps)) { const m = t.readUInt16BE(ps), end = ps + 2 + m * (2 + s1 + s2); for (let p = ps; p < end; p++) if (!protect[p]) t[p] = 0; }
    } else {
      const cd1 = classDefOf(t, so + t.readUInt16BE(so + 8)), cd2 = classDefOf(t, so + t.readUInt16BE(so + 10));
      guard(so + t.readUInt16BE(so + 8), cd1.end); guard(so + t.readUInt16BE(so + 10), cd2.end);
      const c1 = t.readUInt16BE(so + 12), c2 = t.readUInt16BE(so + 14), rs = s1 + s2;
      const used1 = new Set(), used2 = new Set([0]);
      for (const g of cov) if (keep.has(g)) used1.add(cd1.map.get(g) || 0);
      for (const [g, c] of cd2.map) if (keep.has(g)) used2.add(c);
      guard(so, so + 16 + c1 * c2 * rs);
      for (let a = 0; a < c1; a++) for (let b = 0; b < c2; b++) {
        const r = so + 16 + (a * c2 + b) * rs;
        if (!used1.has(a) || !used2.has(b)) t.fill(0, r, r + rs);
        else { devices(so, r, vf1); devices(so, r + s1, vf2); }
      }
    }
  }
  if (dropMarks) for (const l of lookups) if (isMark(l.type) || l.subs.every(([ty]) => isMark(ty))) {
    for (const [, so] of l.subs) { const i = starts.indexOf(so), end = starts[i + 1] || t.length; for (let p = so; p < end; p++) if (!protect[p]) t[p] = 0; }
    t.writeUInt16BE(0, l.lo + 4);
  }
  return t;
}
export function markGlyphsOf(gdef) {
  if (!gdef) return new Set(); const off = gdef.readUInt16BE(4); if (!off) return new Set();
  const { map } = classDefOf(gdef, off); return new Set([...map].filter(([, c]) => c === 3).map(([g]) => g));
}

/* ---------------- writing ---------------- */
function base128(v) { const b = []; do { b.unshift(v & 0x7f); v = Math.floor(v / 128); } while (v); for (let i = 0; i < b.length - 1; i++) b[i] |= 0x80; return Buffer.from(b); }

export function encodeWoff2(flavor, tables) {
  const tags = [...tables.keys()].sort();
  /* WOFF2 requires loca right after glyf in the stream; sorted order already has glyf < loca, with nothing between that matters for decoders that rebuild offsets */
  const order = tags.filter((t) => t !== 'loca'); const gi = order.indexOf('glyf'); if (gi >= 0 && tables.has('loca')) order.splice(gi + 1, 0, 'loca');
  const dirParts = [];
  for (const tag of order) {
    const k = KNOWN.indexOf(tag), nullX = tag === 'glyf' || tag === 'loca' ? 3 : 0;
    dirParts.push(Buffer.from([(nullX << 6) | (k >= 0 ? k : 0x3f)]));
    if (k < 0) dirParts.push(Buffer.from(tag, 'latin1'));
    dirParts.push(base128(tables.get(tag).length));
  }
  const dir = Buffer.concat(dirParts);
  const stream = Buffer.concat(order.map((t) => tables.get(t)));
  const comp = brotliCompressSync(stream, { params: { [Z.BROTLI_PARAM_QUALITY]: 11, [Z.BROTLI_PARAM_LGWIN]: 24, [Z.BROTLI_PARAM_MODE]: Z.BROTLI_MODE_FONT, [Z.BROTLI_PARAM_SIZE_HINT]: stream.length } });
  let sfntSize = 12 + 16 * order.length; for (const t of order) sfntSize += (tables.get(t).length + 3) & ~3;
  const compPad = (4 - ((48 + dir.length + comp.length) % 4)) % 4;
  const total = 48 + dir.length + comp.length + compPad;
  const h = Buffer.alloc(48);
  h.write('wOF2', 0, 'latin1'); h.writeUInt32BE(flavor, 4); h.writeUInt32BE(total, 8); h.writeUInt16BE(order.length, 12);
  h.writeUInt32BE(sfntSize, 16); h.writeUInt32BE(comp.length, 20); h.writeUInt16BE(1, 24); h.writeUInt16BE(0, 26);
  return Buffer.concat([h, dir, comp, Buffer.alloc(compPad)]);
}

/* the characters a website needs: Basic Latin, Latin-1, the Latin-1-adjacent letters Western European text uses
   (Œ œ Š š Ž ž Ÿ ƒ), and general punctuation, currency and symbols that real copy reaches for */
export const SITE_RANGES = [[0x20, 0x7e], [0xa0, 0xff], [0x131, 0x131], [0x152, 0x153], [0x160, 0x161], [0x178, 0x178], [0x17d, 0x17e], [0x192, 0x192],
  [0x2c6, 0x2c6], [0x2da, 0x2da], [0x2dc, 0x2dc], [0x2000, 0x206f], [0x20ac, 0x20ac], [0x20b9, 0x20b9], [0x2113, 0x2113], [0x2122, 0x2122], [0x2190, 0x2193],
  [0x2212, 0x2212], [0x2215, 0x2215], [0x2248, 0x2248], [0x2260, 0x2260], [0x2264, 0x2265], [0x25cf, 0x25cf], [0xfeff, 0xfeff], [0xfffd, 0xfffd]];

export function subsetTables(tables, ranges = SITE_RANGES, { minWeight = 400 } = {}) {
  const t = new Map(tables);
  const cmap = readCmap(t.get('cmap')); const map = new Map();
  for (const [a, b] of ranges) for (let c = a; c <= b; c++) if (cmap.has(c)) map.set(c, cmap.get(c));
  const keep = new Set([0, ...map.values()]);
  gsubClosure(t.get('GSUB'), keep);
  const { glyphs, fmt } = readGlyphs(t);
  for (let grew = true; grew;) { grew = false; for (const g of [...keep]) for (const c of components(glyphs[g] || Buffer.alloc(0))) if (!keep.has(c)) { keep.add(c); grew = true; } }
  const { glyf, loca, indexFormat } = buildGlyfLoca(glyphs.map((g, i) => (keep.has(i) ? g : Buffer.alloc(0))), fmt);
  t.set('glyf', glyf); t.set('loca', loca);
  const head = Buffer.from(t.get('head')); head.writeInt16BE(indexFormat, 50); head.writeUInt32BE(0, 8); t.set('head', head);
  t.set('cmap', writeCmap(map));
  let wIndex = null;
  if (t.has('fvar')) {
    const axes = fvarAxes(t.get('fvar')); wIndex = axes.findIndex((a) => a.tag === 'wght');
    if (wIndex >= 0 && minWeight > axes[wIndex].min && minWeight <= axes[wIndex].def) t.set('fvar', trimFvar(t.get('fvar'), wIndex, minWeight));
    else wIndex = null;
    if (wIndex != null && minWeight !== axes[wIndex].def) throw new Error('the weight floor must be the default weight to drop tuples exactly');
  }
  if (t.has('gvar')) t.set('gvar', subsetGvar(t.get('gvar'), keep, wIndex));
  if (t.has('GPOS')) t.set('GPOS', pruneGpos(t.get('GPOS'), keep, markGlyphsOf(t.get('GDEF')), new Set(map.values())));
  /* advances of unkept glyphs: zero (nothing draws them) */
  { const hm = Buffer.from(t.get('hmtx')), nh = t.get('hhea').readUInt16BE(34), ng = t.get('maxp').readUInt16BE(4);
    for (let g = 0; g < ng; g++) if (!keep.has(g)) { if (g < nh) hm.writeUInt32BE(0, g * 4); else hm.writeInt16BE(0, nh * 4 + (g - nh) * 2); }
    t.set('hmtx', hm); }
  /* tables a browser does not need for web text */
  t.delete('DSIG');
  /* keep `post` but as version 3 (no glyph names) */
  const post = t.get('post'); if (post && post.readUInt32BE(0) !== 0x00030000) { const p = Buffer.from(post.subarray(0, 32)); p.writeUInt32BE(0x00030000, 0); t.set('post', p); }
  /* head checksum adjustment */
  return { tables: t, glyphs: keep.size, chars: map.size };
}

export function sfnt(flavor, tables) {
  const tags = [...tables.keys()].sort(), n = tags.length, es = 2 ** Math.floor(Math.log2(n));
  const head = Buffer.alloc(12 + 16 * n); head.writeUInt32BE(flavor, 0); head.writeUInt16BE(n, 4); head.writeUInt16BE(es * 16, 6); head.writeUInt16BE(Math.log2(es), 8); head.writeUInt16BE(n * 16 - es * 16, 10);
  let off = head.length; const bodies = [];
  const sum = (b) => { let s = 0; const p = Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4)]); for (let i = 0; i < p.length; i += 4) s = (s + p.readUInt32BE(i)) >>> 0; return s; };
  tags.forEach((tag, i) => { const b = tables.get(tag); head.write(tag, 12 + i * 16, 'latin1'); head.writeUInt32BE(sum(b), 16 + i * 16); head.writeUInt32BE(off, 20 + i * 16); head.writeUInt32BE(b.length, 24 + i * 16); const p = Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4)]); bodies.push(p); off += p.length; });
  return Buffer.concat([head, ...bodies]);
}

/* the build's entry: Inter for websites */
export function subsetInter(src) {
  const { flavor, tables } = decodeWoff2(src);
  const s = subsetTables(tables);
  return { woff2: encodeWoff2(flavor, s.tables), tables: s.tables, glyphs: s.glyphs, chars: s.chars };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , inp, out] = process.argv;
  if (!inp || !out) { console.error('usage: node scripts/font-subset.mjs in.woff2 out.woff2'); process.exit(2); }
  const src = readFileSync(inp); const r = subsetInter(src);
  writeFileSync(out, r.woff2);
  console.log(`${inp} ${(src.length / 1024).toFixed(1)} KB -> ${out} ${(r.woff2.length / 1024).toFixed(1)} KB (${r.chars} characters, ${r.glyphs} glyphs)`);
}

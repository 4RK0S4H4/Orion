/* Mid-motion check (issue 70, decision 0072): a page can be right at rest and broken while it moves (a rail whose labels
   wrap one letter per line as it widens). Shared by the page checker (check.mjs), the production suite and the checker
   proofs (tests/checker.mjs). Runs in Node with a Playwright page:

     const problems = await midMotion(page);

   For each kind of thing that moves (the rail's toggle, a dialog, a floating panel, a menu, an expand, an accordion, a
   page), it takes the first one shown on the page, starts the motion (and then the motion back: collapse, close, Back),
   freezes every animation and transition it started at 25%, 50% and 75% of the longest one (the shorter ones keep their
   place in time, as the scrubber does), and fails a word split across lines, a box one glyph wide or the page scrolling
   sideways in any of those frames. Loops (infinite animations) and motion that was already running are left alone. It
   changes the page (things open and close), so run it last. */
import { silentAudit } from './silent.mjs';

export const MOVES = [
  { kind: 'rail', open: '.s4-nav-rail [data-rail-toggle]', back: 'again' },
  { kind: 'dialog', open: '[data-dialog]', back: 'escape' },
  { kind: 'panel', open: '[data-sheet]', back: 'escape' },
  { kind: 'menu', open: '[data-menu]:not(.s4-menubar-item)', back: 'escape' },
  { kind: 'expand', open: '[data-expand]', back: 'again' },
  { kind: 'accordion', open: '.s4-accordion summary, details.s4-accordion-item > summary', back: 'again' },
  { kind: 'page', open: '[data-page-open]', back: 'back' },
];
const FRACTIONS = [0.25, 0.5, 0.75];

/* in the page: the first one shown; the motion already running; then, after the step, the motion it started, frozen */
function find(sel) {
  return [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length && e.checkVisibility() && !e.closest('[hidden], [inert], dialog:not([open]), [popover]:not(:popover-open)')) || null;
}
function before() { window.__s4before = new Set(document.getAnimations()); }
async function collect() {
  const old = window.__s4before || new Set();
  let list = [];
  for (let i = 0; i < 20 && !list.length; i++) {
    list = document.getAnimations().filter((a) => !old.has(a) && a.playState !== 'finished' && a.effect && a.effect.getComputedTiming().endTime !== Infinity);
    if (!list.length) await new Promise((r) => requestAnimationFrame(() => r()));
  }
  list.forEach((a) => { try { a.pause(); } catch (e) { /* gone */ } });
  window.__s4mid = list;
  return { count: list.length, end: list.reduce((m, a) => Math.max(m, a.effect.getComputedTiming().endTime || 0), 0) };
}
function seek(t) {
  for (const a of window.__s4mid || []) { try { a.currentTime = Math.min(t, a.effect.getComputedTiming().endTime); } catch (e) { /* gone */ } }
  void document.body.offsetWidth;
  const de = document.documentElement;
  return de.scrollWidth > de.clientWidth + 1 ? `the page is ${de.scrollWidth}px wide in a ${de.clientWidth}px window` : '';
}
function finish() { for (const a of window.__s4mid || []) { try { a.finish(); } catch (e) { try { a.play(); } catch (e2) { /* gone */ } } } window.__s4mid = []; }

export async function midMotion(page, { moves = MOVES } = {}) {
  const out = [];
  const startY = await page.evaluate(() => scrollY);
  for (const m of moves) {
    const steps = [['open'], [m.back]];
    for (const [step] of steps) {
      let r, rest;
      try {
        const h = await page.evaluateHandle(find, m.open), el = h.asElement();
        if (!el && (step === 'open' || step === 'again')) break;
        rest = new Set((await page.evaluate(silentAudit)).broken);   /* broken at rest is the rest audit's to report */
        await page.evaluate(before);
        if (step === 'open' || step === 'again') await el.click({ timeout: 3000 });
        else if (step === 'escape') await page.keyboard.press('Escape');
        else if (step === 'back') await page.evaluate(() => history.back());
        r = await page.evaluate(collect);
      } catch (e) { break; }
      if (typeof process !== "undefined" && process.env.S4_MID_DEBUG) console.log(`    ${m.kind} ${step}: ${r.count} animations, ${Math.round(r.end)}ms`);
      const what = `${m.kind} ${step === 'open' ? (m.kind === 'rail' ? 'expanding or collapsing' : 'opening') : (m.kind === 'rail' ? 'moving back' : 'closing')}`;
      if (r.count) {
        for (const f of FRACTIONS) {
          const wide = await page.evaluate(seek, f * r.end);
          if (wide) out.push(`mid-motion (${what}, ${Math.round(f * 100)}%): ${wide}`);
          const q = await page.evaluate(silentAudit);
          for (const x of q.broken) if (!rest.has(x)) out.push(`mid-motion (${what}, ${Math.round(f * 100)}%): ${x}`);
        }
      }
      await page.evaluate(finish);
      await page.waitForTimeout(350);
    }
  }
  await page.evaluate((y) => scrollTo(0, y), startY);
  return [...new Set(out)];
}

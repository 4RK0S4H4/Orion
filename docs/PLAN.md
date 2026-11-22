# The plan: every area to a 10 (resume here after NEXT.md)

Written 2026-11-22 by the orchestrating session so any later session can pick this up cold. `NEXT.md` says what was
built and what waits for the owner; this file says **where we are going, how we work, and what comes next**. Update
the "Status" table and "Current stage" whenever a stage moves.

## The goal

The owner asked (2026-11-16) for S4 Orion to be "polished fully until I get a solid 10 for each area you graded it",
for apps and websites on phone and desktop, and desktop applications: great as-is and deeply customizable per app.
On 2026-11-21 the owner handed over the lead: "I'll let you take the lead on this, and feel free to change past rules
as well and do anything you feel like it is for the best, including glass rules ... I am only here to look at results
and maybe come up with some suggestions." So: make the calls, record them as decisions, publish results, and only
pause for what truly needs the owner's eyes or hands (device checks, taste calls the owner has opinions on).

A 10 means: a top-tier professional team would ship it without reservations, checked by an **independent** review
(a fresh agent that did not build the work), not by the builder's own word.

## Status

| Area | Review 1 (11-16) | Review 2 (11-21, 8ca40e5) | Review 3 (11-22, c089ade) | Target |
|---|---|---|---|---|
| Foundations | 9 | 8.5 | 9 | 10 |
| Behaviour | 9 | 8 | 8.5 | 10 |
| Accessibility | 8 | 7.5 | 8.5 | 10 |
| App Components | 8 | 8.5 | 9 | 10 |
| Visual Hierarchy | 6 | 7.5 | 8.5 | 10 |
| Desktop Apps | 6 | 7.5 | 8.5 | 10 |
| Websites | 4 | 7.5 | 8.5 | 10 |
| Per-App Customization | 4 | 8 | 9 | 10 |

Review 1 is `explore/design-review.html` (issues 51-60). Review 2, with every blocker ranked and tagged, is
[`history/round-0058/regrade-2.md`](history/round-0058/regrade-2.md). Review 3 is [`history/round-0058/regrade-3.md`](history/round-0058/regrade-3.md); its Top 10 plans round 0059. Review 2 was stricter on behaviour and
accessibility, so some scores fell although nothing got worse.

## How we work (owner's rules plus what we learned)

- **The main session orchestrates; subagents build** (owner, 2026-11-16). Opus subagents for design-sensitive work,
  Sonnet for mechanical work. **At most two subagents at a time** (owner, after repeated usage limits).
- Each workstream gets its own git worktree under `.claude/worktrees/<name>` and branch `roundNN/<name>`, created from
  `origin/s4-orion`. Workstreams split by files so they do not collide; one of them owns the shared docs (CLAUDE.md,
  CHANGELOG, NEXT.md, decisions README, issues README, SKILL.md, skill package) and merges the other at the end; the
  other writes its notes to `docs/history/round-NNNN/<name>.md` and its own decision record.
- Every workstream: `npm run build` twice, `npm run check`, full `npm test` green before its last commit; never weaken
  a check; screenshots at 390 dark, 1280 light, 1600 light, looked at and fixed.
- **Usage limits** stop agents mid-work. Their work in the worktree survives: resume the same agent (SendMessage) after
  the reset rather than starting a new one; ask it to commit WIP first.
- **Publishing:** the main session fast-forwards `s4-orion` to the finished branch and runs
  `git push origin s4-orion && git push origin s4-orion:main`. Subagents do not publish (the permission system blocked
  that once; the owner then approved publishing from the main session). Reply with Pages links carrying `?v=<commit>`.
- After each published round, an **independent re-grade** (read-only agent, fresh context) scores the eight areas
  and ranks blockers; its findings plan the next round.
- Owner critiques become issues in `docs/issues/README.md` (images in `docs/issues/img/`); calls become decision records.

## Stages

1. **Round 0056** (done, 3c34785): dials, website kit, reach, hierarchy, critiques 61-65, button groups vs tabs,
   templates as 20 products, lessons, rich inputs, data at scale, desktop anatomy (decisions 0055-0062).
2. **Round 0057** (done, 8ca40e5): the eleven owner calls taken on our recommendation (0063: brand files, kicker,
   meter, board, quiet table checkbox, one FAB label rule, data-dense, calmer selection); the owner's feedback (0064:
   calm dialogs as bottom cards on phones, docked glass without the edge glow). Review 2 run.
3. **Round 0058** (done: A, decision 0065, and B, decision 0066, merged on `round58/a`; checked and tested): review 2's blockers, in two workstreams.
   - **A** (branch `round58/a`, worktree `r58-a`, decision 0065, owns shared docs): Back keeps place and focus;
     focus never drops to body (board add, mod+comma, menubar Escape, palette duplicate); Linnea grid keyboard (one
     header stop, one body stop, Home/End, Tab out) and quiet Select All; page checker fails unknown `s4-` classes,
     mid-word breaks and components outside their container; bare tables stack, rail FABs render; `.s4-num`; a rule
     for filled status tones; Linnea and Parley toolbars and finish; docs drift pass with a banned-phrase check;
     issues 61, 62, 64, 65 marked done.
   - **B** (branch `round58/b`, worktree `r58-b`, decision 0066, notes `history/round-0058/b.md`): site bundle
     (`orion.site.min.*`, subset Inter, size budget in check); Showcase wide Home and every element again; the hub as
     a front page; Tally and Relay at 1600; no filled home-nav item on sites; one filled selection in Mallet; quiet
     danger zones; grabber and drag-following scrim on modal panels; firm corners reach containers; `scale` and
     `headings` dials.
   - Measured (B, gzip): site bundle 42.4 KB css + 26.4 KB js + 67.4 KB font + 36.9 KB icons = 173 KB (budget 180; the app bundle was 375 KB). Landing loads 185 KB over the network, docs 181 KB.
   - Then: A merged B, full tests green, the main session publishes, links to the owner.
4. **Owner device pass** (needs the owner; runs alongside round 0059, device bugs jump the queue): iPhone (dialog swipe and corners, modal-panel drag with the following scrim, docked hairline while scrolling, Linnea
   and Parley at phone width, the rich inputs, subset Inter in Safari), a desktop (Parley's menu bar and shortcuts, Linnea's grid,
   the Electron example), VoiceOver on a dialog and the table. Device-only bugs come before anything new.
5. **Review 3** (done, c089ade, [`history/round-0058/regrade-3.md`](history/round-0058/regrade-3.md)): 9 / 8.5 / 8.5 / 9 / 8.5 / 8.5 / 8.5 / 9; nothing a 10 yet.
6. **Round 0059 — current stage**: review 3's Top 10, in two workstreams.
   - **A** (branch `round59/a`, worktree `r59-a`, decision 0067, owns shared docs): dial values validated (dev warning
     and page checker); grid header keys surfaced (hint, aria-description, README); 0049 wording for shortcut-opened
     palettes; checker rules for mid-word breaks and one-glyph boxes proven on a known-bad page and added to evals; a
     suite test for Back scroll restore; CHANGELOG dates for 1.0.0/1.1.0 (the main session tags at publish).
   - **B** (branch `round59/b`, worktree `r59-b`, decision 0068, notes `history/round-0059/b.md`): Parley list column
     wider and resizable; one filled selection per region (Parley, Mallet docs); wide-window emptiness (Tally, Showcase
     at 1600); per-page icon subset for sites and a lower landing budget; app bundle split by component if it fits.
   - Then A merges B, full tests, publish, review 4. Later rounds: WebKit/Firefox runs, screen-reader passes, shells
     run for real, print pagination, skill evals proving bespoke results.
7. **After the 10s**: Horizon 1 in `ROADMAP.md` (real apps built end to end with the skill), skill evals, a dated
   release 1.2 with a git tag and a re-packaged skill (CHANGELOG 1.0.0 and 1.1.0 are still "Unreleased").

## Calls we made under the owner's handover (so nobody reopens them by accident)

0063 (all eleven recommendations), 0064 (calm dialogs, docked hairline; replaces 0039/0040, amends 0043), and in
round 0058: grabber on modal panels only; danger zones are neutral panes with a tonal-error trigger; firm corners step
containers down too; `scale` and `headings` dials; status pills are tints, a fill only for the one state that needs
action now. The owner can overrule any of these; otherwise they stand.

## Session log

- 2026-11-22 (round 0058, workstream A): decision 0065 built (Back keeps place and focus, focus never on body, the
  grid keyboard for data tables, silent-failure checks in the checker and suite, bare tables and rail FABs, `.s4-num`,
  statuses are tints, one tonal tool per toolbar, Parley finish, drift and `check:words`, issues 61/62/64/65 Done);
  merged origin/s4-orion (PLAN.md). Next: merge B, full tests, publish; then the owner device pass and review 3.

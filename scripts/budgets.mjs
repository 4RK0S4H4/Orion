/* Orion's size budgets in one place (gzip level 9 KB, what a server sends; fonts as shipped). scripts/build.mjs holds the
   built files to them (npm run check), and tests/network.mjs holds every template's real network transfer to them, so a
   budget always describes what a page loads, not only what is on disk (issue 107). Raise one only with a decision. */
export const SITE_BUDGET = { css: 44, js: 30, font: 70, icons: 12, total: 150 };   /* icons: the site set (decision 0068; was the whole set, 37 KB, and a 180 total) */
/* core js 38 -> 40 and data 42 -> 44 for the shared selection model and the keyboard of static tables (decision 0078) */
/* icons: the app icon pack, icons-app.js (issue 109; apps loaded icons.js, every set, 103 KB) */
export const APP_BUDGET = { core: { css: 44, js: 40 }, packs: { data: 44, commands: 12, desktop: 13, direct: 10, inputs: 35, sitekit: 10 }, leanTemplate: 170, icons: 28 };
export const FULL_BUDGET = { css: 66, js: 124 };   /* js 120 -> 124: selecting several with the keyboard and the mouse (decision 0078) */
/* what a page fetches over the network, by kind (tests/network.mjs): a site page is held to the site total; a lean app page to
   its bundle (leanTemplate) plus the full Inter and the icons; a page on the full bundle (the Showcase, prototypes) to that */
export const NETWORK_BUDGET = {
  site: SITE_BUDGET.total,
  lean: { bundle: APP_BUDGET.leanTemplate, font: 170, icons: APP_BUDGET.icons },   /* a lean page that fetched the full set as well would pass 28 */
  full: { bundle: 325, font: 170, icons: 66 },   /* the Showcase and the brand trial load orion.css and orion.js as written, 308 KB */
};

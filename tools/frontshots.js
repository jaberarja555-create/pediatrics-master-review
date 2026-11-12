// Pictures of the front pages for the About tiles (tools/frontpages.py): serve the build, then
//   node tools/frontshots.js http://localhost:PORT/ <prefix> && python3 tools/frontshots.py
// writes build/fp/<name>.png; frontshots.py turns them into content/img/ab_<name>.jpg and the thumbnails abt_<name>.jpg.
const { chromium } = require('playwright'); const fs = require('fs'); const [U, px] = process.argv.slice(2);
(async () => {
  fs.mkdirSync('build/fp', { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
  await ctx.route(/fonts\.g|supabase|workers\.dev/, r => r.abort());
  await ctx.addInitScript(px => { localStorage.setItem(px + '-chz', '1') }, px);
  const p = await ctx.newPage(); await p.goto(U); await p.waitForTimeout(1500);
  const g = await p.$('#v2welGo'); if (g && await g.isVisible()) { await g.click(); await p.waitForTimeout(1300) }
  await p.evaluate(() => { const x = document.createElement('button'); x.dataset.act = 'cover'; document.body.appendChild(x); x.click(); x.remove() });
  await p.waitForTimeout(1500);
  for (const s of await p.$$('#pages section.page:has(>.fp:not(.fpimg))')) {
    await s.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
    const k = await s.$eval('.fp', e => e.dataset.fp);
    await s.screenshot({ path: `build/fp/${k}.png` }); console.log(k);
  }
  await b.close();
})();

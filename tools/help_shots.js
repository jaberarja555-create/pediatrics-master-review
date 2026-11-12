// Pictures for the user manual (Settings → دليل الاستخدام): screenshots of this book's app (owner, 11 Nov 2026, as in Obstetrics).
// Run after the screens change:  PRR_V2=1 SRR_OUT=build/v2 python3 build.py && (cd build/v2 && python3 -m http.server 8830 &) && node tools/help_shots.js
const pw = require(process.env.PW || 'playwright'), path = require('path');
const OUT = path.join(__dirname, '..', 'content', 'img'), URL = process.env.URL || 'http://localhost:8830/index.html';
const SHOTS = [['home', []], ['chapters', ['#v2nav [data-v=v2chapters]', '[data-act=ch][data-n="1"]']], ['reader', ['#v2nav [data-v=v2chapters]', '[data-act=ch][data-n="1"]', '[data-act=topic]']],
  ['practice', ['#v2nav [data-v=v2practice]']], ['resources', ['#v2nav [data-v=v2resources]']], ['sub', ['#v2nav [data-v=v2settings]', '#v2settingsW [data-act=sub]']], ['settings', ['#v2nav [data-v=v2settings]']]];
(async () => {
  const b = await pw.chromium.launch();
  for (const [name, steps] of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
    await ctx.route(/supabase|workers\.dev|fonts\.g/, r => r.abort());
    await ctx.addInitScript(() => { try { localStorage.setItem('prr-chz', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    await p.goto(URL); await p.waitForTimeout(2200); await p.click('#v2welGo'); await p.waitForTimeout(1500);
    const c = await p.$('#v2chz [data-c="free"]'); if (c && await c.isVisible()) { await c.click(); await p.waitForTimeout(400); }
    for (const s of steps) { await p.evaluate(q => document.querySelector(q).click(), s); await p.waitForTimeout(700); }
    await p.screenshot({ path: path.join(OUT, 'help_' + name + '.jpg'), type: 'jpeg', quality: 72 }); await ctx.close();
  }
  await b.close(); console.log('help pictures written');
})();

// Usage: node check.js [screenshot-dir]
// Checks that every book page fits (no text cut off at the bottom) and optionally saves screenshots.
const path = require('path');
const pw = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
(async () => {
  const shots = process.argv[2];
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + path.join(process.env.SRR_OUT || path.join(__dirname, 'docs'), 'index.html'));
  await page.waitForTimeout(1200);
  const problems = await page.evaluate(() => {
    const out = [];
    const box = document.createElement('div'); box.className = 'bk';
    box.style.cssText = 'position:absolute;left:0;top:0;width:816px';
    document.body.appendChild(box);
    document.getElementById('bookPages').content.querySelectorAll('section.page').forEach(sec => {
      const s = sec.cloneNode(true); box.innerHTML = ''; box.appendChild(s);
      const body = s.querySelector('.body'); if (!body) return;
      const limit = body.getBoundingClientRect().bottom;
      s.querySelectorAll('.main, .side, .rr > div').forEach(col => {
        let bottom = 0; [...col.children].forEach(c => { bottom = Math.max(bottom, c.getBoundingClientRect().bottom); });
        if (bottom > limit + 1) out.push(`${s.dataset.id} ${col.className}: ${Math.round(bottom - limit)}px too long`);
        else if (bottom > limit - 40 && col.classList.contains('main')) out.push(`${s.dataset.id} ${col.className}: crowded (only ${Math.round(limit - bottom)}px left at the bottom)`);
      });
    });
    box.remove(); return out;
  });
  if (shots) {
    const m = await browser.newPage({ viewport: { width: 400, height: 860 } });
    await m.goto('file://' + path.join(process.env.SRR_OUT || path.join(__dirname, 'docs'), 'index.html')); await m.waitForTimeout(1200);
    await m.screenshot({ path: shots + '/home.png' });
    const ids = await m.evaluate(() => JSON.parse(document.getElementById('meta').textContent).pages.map(p => p.id));
    const full = await browser.newPage({ viewport: { width: 816, height: 1152 } });
    await full.goto('file://' + path.join(process.env.SRR_OUT || path.join(__dirname, 'docs'), 'index.html')); await full.waitForTimeout(1200);
    const html = await full.evaluate(() => [...document.getElementById('bookPages').content.querySelectorAll('section.page')].map(s => s.outerHTML));
    for (let i = 0; i < ids.length; i++) {
      await full.evaluate(h => { document.body.innerHTML = '<div class="bk">' + h + '</div>'; document.body.style.overflow = 'visible'; }, html[i]);
      await full.waitForTimeout(150);
      await full.screenshot({ path: `${shots}/page-${String(i + 1).padStart(2, '0')}-${ids[i]}.png` });
    }
  }
  await browser.close();
  if (problems.length) { console.log('Pages that do not fit:\n  ' + problems.join('\n  ')); process.exit(1); }
  console.log('All pages fit.');
})();

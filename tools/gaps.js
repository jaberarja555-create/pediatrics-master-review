// Usage: node tools/gaps.js  — empty space at the bottom of every topic page (px of 1152-px pages)
const path = require('path'); const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await p.goto('file://' + path.join(__dirname, '..', 'docs', 'index.html')); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const out = []; const box = document.createElement('div'); box.className = 'bk';
    box.style.cssText = 'position:absolute;left:0;top:0;width:816px'; document.body.appendChild(box);
    document.getElementById('bookPages').content.querySelectorAll('section.page.mz').forEach(s => {
      const c = s.cloneNode(true); box.innerHTML = ''; box.appendChild(c);
      const lim = c.querySelector('.body').getBoundingClientRect().bottom; let bot = 0;
      [...c.querySelector('.mzm').children].forEach(x => bot = Math.max(bot, x.getBoundingClientRect().bottom));
      out.push([c.id, c.querySelector('.mzh span:last-child').textContent.trim(), Math.round(lim - bot)]); });
    return out; });
  r.forEach(x => console.log(x.join('\t'))); await b.close(); })();

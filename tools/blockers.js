// Usage: node tools/blockers.js [min_gap] — for every page with a gap mid-topic: the gap and the first box of the next page (what did not fit)
const path = require('path'); const pw = require('playwright'); const MIN = +(process.argv[2] || 100);
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await p.goto('file://' + path.join(__dirname, '..', 'docs', 'index.html')); await p.waitForTimeout(1200);
  const r = await p.evaluate((MIN) => { const out = []; const box = document.createElement('div'); box.className = 'bk';
    box.style.cssText = 'position:absolute;left:0;top:0;width:816px'; document.body.appendChild(box);
    const S = [...document.getElementById('bookPages').content.querySelectorAll('section.page.mz')];
    const info = S.map(s => { const c = s.cloneNode(true); box.innerHTML = ''; box.appendChild(c);
      const lim = c.querySelector('.body').getBoundingClientRect().bottom; let bot = 0;
      const kids = [...c.querySelector('.mzm').children]; kids.forEach(x => bot = Math.max(bot, x.getBoundingClientRect().bottom));
      const f = kids.find(k => k.querySelector && k.querySelector('.mb'));
      const mb = f ? f.querySelector('.mb') : null;
      return { id: c.id, topic: c.querySelector('.mzh span:first-child').textContent.trim(), gap: Math.round(lim - bot),
        first: mb ? ((mb.querySelector('.mh') || {}).textContent || '(piece) ' + mb.textContent.trim().slice(0, 40)) : '', fh: f ? Math.round(f.getBoundingClientRect().height) : 0,
        cls: mb ? mb.className : '', kinds: mb ? [...mb.querySelector('.mc').children].map(x => x.tagName.toLowerCase() + (x.className ? '.' + x.className.split(' ')[0] : '')).join(' ') : '' }; });
    info.forEach((x, i) => { const n = info[i + 1]; if (n && n.topic === x.topic && x.gap >= MIN && !x.id.startsWith('rr')) out.push([x.id, x.gap, n.fh, n.first.slice(0, 45), n.cls, n.kinds.slice(0, 80)]); });
    return out; }, MIN);
  r.forEach(x => console.log(x.join('\t'))); await b.close(); })();

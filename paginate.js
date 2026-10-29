// Usage: node paginate.js
// Plans every chapter's pages: measures each box at full and half width, then packs rows so pages fill well.
// Each topic starts on a new page; boxes never split across pages; short boxes pair side by side; the topic's Key numbers box may move up into a gap.
// Writes content/layout.json and rebuilds the book.
const path = require('path'), fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const pw = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const MARGIN = 40, GAP = 10;
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'srr-measure-'));
  execSync('python3 build.py', { cwd: __dirname, stdio: 'ignore', env: { ...process.env, SRR_MEASURE: '1', SRR_OUT: tmp } });
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + path.join(tmp, 'index.html'));
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const box = document.createElement('div'); box.className = 'bk';
    box.style.cssText = 'position:absolute;left:0;top:0;width:816px';
    document.body.appendChild(box);
    const out = {};
    document.querySelectorAll('section.page.mz').forEach(s => {
      box.innerHTML = ''; const c = s.cloneNode(true); box.appendChild(c);
      const bd = c.querySelector('.body').getBoundingClientRect();
      const mzc = document.createElement('h1'); mzc.className = 'mzt mzc'; mzc.textContent = 'X';
      c.querySelector('.mzm').prepend(mzc);
      const cont = 0; // no repeated topic title on continuation pages (owner)
      mzc.remove();
      out[s.dataset.orig] = { cap: bd.height, cont, atoms: [...c.querySelectorAll('.ms')].map(m => ({
        k: m.dataset.k, w: m.dataset.w === '1', t: m.dataset.t,
        nums: !!m.querySelector('.mb.nums'), rv: !!m.querySelector('.msf .mb.rv'), ph: !!m.querySelector('.msf .mb > .mc > .photo:only-child'),
        full: m.querySelector('.msf').getBoundingClientRect().height,
        half: m.querySelector('.msh').getBoundingClientRect().height })) };
    });
    return out;
  });
  await browser.close();
  const layout = {}, report = [];
  for (const [key, ch] of Object.entries(data)) {
    const A = ch.atoms, cap = ch.cap - MARGIN, pages = [];
    let rows = [], used = 0;
    const done = new Set();
    const newPage = (midTopic) => { if (rows.length) pages.push(rows); rows = []; used = midTopic ? ch.cont : 0; };
    let lastT = null;
    const place = (row, h) => { rows.push(row); used += h; row.forEach(i => done.add(i)); lastT = A[row[row.length - 1]].t; };
    const pairable = (i, j) => j < A.length && A[i].k === 'box' && A[j].k === 'box' && !A[i].w && !A[j].w && A[i].t === A[j].t;
    // best way to set atom i (and maybe i+1) as the next row
    const option = (i) => {
      let j = i + 1;
      if (A[i].ph && A[i].k === 'box') {   // a photo box pairs with the nearest following short box of its topic
        for (let k = i + 1; k < A.length && k <= i + 4 && A[k].t === A[i].t; k++)
          if (!done.has(k) && A[k].k === 'box' && !A[k].w) { const pair = Math.max(A[i].half, A[k].half) + GAP; return { row: [i, k], h: pair }; }
      }
      if (A[i].k === 'box' && !A[i].w && pairable(i, j) && !done.has(j)) {
        const pair = Math.max(A[i].half, A[j].half) + GAP, short = Math.min(A[i].half, A[j].half);
        if (pair < A[i].full + A[j].full && short > 0.45 * (pair - GAP)) return { row: [i, j], h: pair };
      }
      return { row: [i], h: A[i].full };
    };
    // before a page break, fill a big gap (owner: no empty space unless necessary): first the topic's Key numbers
    // box, then the next boxes of the same topic that fit (looking at most 3 boxes ahead); never split a box
    const fill = (i) => {
      for (;;) {
        if (cap - used <= 0.08 * cap) return;
        // only the topic already on this page; Rapid Review pieces keep their order
        let n = A.findIndex((a, j) => j > i && !done.has(j) && a.nums && a.t === lastT && a.full <= cap - used);
        if (n < 0) n = A.findIndex((a, j) => j >= i && j <= i + 3 && !done.has(j) && !a.rv && (a.k === 'box' || a.k === 'row') && a.t === lastT && a.full <= cap - used);
        if (n < 0) return;
        place([n], A[n].full);
      }
    };
    for (let i = 0; i < A.length; i++) {
      if (done.has(i)) continue;
      let opt = option(i);
      if (A[i].k === 'title') {                                // every topic (and Exam corner) starts on a new page
        if (rows.length) newPage(false);
        place(opt.row, opt.h); continue;
      }
      if (A[i].k === 'raw' && rows.length) {                   // an opening sentence stays with the box after it
        let need = opt.h, j = i + 1;
        while (j < A.length && A[j].k === 'raw' && A[j].t === A[i].t) need += A[j++].full;
        if (j < A.length && A[j].t === A[i].t && A[j].k !== 'title' && need + option(j).h <= cap - ch.cont) need += option(j).h;
        if (used + need > cap && need <= cap - ch.cont) { fill(i); newPage(true); }
      }
      if (used + opt.h > cap && opt.row.length === 2 && used + A[i].full <= cap) opt = { row: [i], h: A[i].full };
      if (used + opt.h > cap && rows.length) {
        fill(i);
        newPage(A[i].k !== 'title');
        opt = option(i);
      }
      if (opt.h > cap) report.push(`${key} box ${i} is taller than a page`);
      place(opt.row, opt.h);
    }
    newPage(false);
    layout[key] = { n: A.length, pages };
  }

  fs.writeFileSync(path.join(__dirname, 'content', 'layout.json'), JSON.stringify(layout) + '\n');
  execSync('python3 build.py', { cwd: __dirname, stdio: 'ignore' });
  console.log(`planned ${Object.values(layout).reduce((s, l) => s + l.pages.length, 0)} pages` + (report.length ? '\n' + report.join('\n') : ''));
})();

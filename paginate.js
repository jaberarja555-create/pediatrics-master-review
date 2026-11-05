// Usage: node paginate.js
// Plans every chapter's pages: measures each box at full and half width, then packs rows so pages fill well.
// Each topic starts on a new page; boxes never split across pages; short boxes pair side by side; the topic's Key numbers box may move up into a gap.
// Writes content/layout.json and rebuilds the book.
const path = require('path'), fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const pw = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const MARGIN = 40, GAP = 10, CONT_TOP = 18, JOIN = 40;  // a box piece at the top of a page gets a 'continued' heading and its table header
(async () => {
  let data;
  for (let pass = 0; pass < 3; pass++) {   // pass 1 learns the column widths of split tables; then measure again with them
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prr-measure-'));
    execSync('python3 build.py', { cwd: __dirname, stdio: 'ignore', env: { ...process.env, SRR_MEASURE: '1', SRR_OUT: tmp } });
    const browser = await pw.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
    await page.goto('file://' + path.join(tmp, 'index.html'));
    await page.waitForTimeout(1500);
    const res = await page.evaluate(() => {
      const box = document.createElement('div'); box.className = 'bk';
      box.style.cssText = 'position:absolute;left:0;top:0;width:816px';
      document.body.appendChild(box);
      const out = {}, colw = {};
      document.querySelectorAll('section.page.mz').forEach(s => {
        box.innerHTML = ''; const c = s.cloneNode(true); box.appendChild(c);
        const bd = c.querySelector('.body').getBoundingClientRect();
        const mzc = document.createElement('h1'); mzc.className = 'mzt mzc'; mzc.textContent = 'X';
        c.querySelector('.mzm').prepend(mzc);
        const cont = 0; mzc.getBoundingClientRect(); // pediatrics (owner): no repeated topic title on later pages
        mzc.remove();
        const ms = [...c.querySelectorAll('.ms')];
        // a split box: measure its pieces joined together, so the saving of each join is exact
        const joinSave = {};
        for (let i = 0; i < ms.length; i++) {
          if (ms[i].dataset.k !== 'box' || !ms[i + 1] || ms[i + 1].dataset.k !== 'cbox') continue;
          let j = i + 1; while (ms[j] && ms[j].dataset.k === 'cbox') j++;
          const holder = document.createElement('div'); holder.className = 'main mzm'; holder.style.cssText = 'position:static;display:flow-root';
          const h1 = document.createElement('h1'); h1.className = 'mzt mzc'; h1.textContent = 'X'; holder.appendChild(h1);
          let sum = 0;
          for (let k = i; k < j; k++) { sum += ms[k].querySelector('.msf').getBoundingClientRect().height; holder.append(...[...ms[k].querySelector('.msf').children].map(x => x.cloneNode(true))); }
          const tail = document.createElement('div'); holder.appendChild(tail);
          c.querySelector('.mzm').appendChild(holder);
          const rows = [...holder.children].slice(1, -1);
          const joined = rows[rows.length - 1].getBoundingClientRect().bottom - rows[0].getBoundingClientRect().top + 10;
          holder.remove();
          for (let k = i + 1; k < j; k++) joinSave[k] = (sum - joined) / (j - i - 1);
        }
        c.querySelectorAll('.mtk').forEach(m => {
          const tb = m.querySelector('table'), W = tb.getBoundingClientRect().width;
          const row = [...tb.rows].sort((a, b) => b.cells.length - a.cells.length)[0];
          colw[m.dataset.tk] = [...row.cells].map(td => +(100 * td.getBoundingClientRect().width / W).toFixed(2));
        });
        out[s.dataset.orig] = { cap: bd.height, cont, atoms: ms.map((m, ix) => ({ js: joinSave[ix] || 0,
          k: m.dataset.k, w: m.dataset.w === '1', t: m.dataset.t,
          nums: !!m.querySelector('.mb.nums'), rc: !!m.querySelector('.mb.rv.rvc'), ph: !!m.querySelector('.msf .mb > .mc > .photo:only-child'),
          full: m.querySelector('.msf').getBoundingClientRect().height,
          half: m.querySelector('.msh').getBoundingClientRect().height })) };
      });
      return { out, colw };
    });
    await browser.close();
    data = res.out;
    const cf = path.join(__dirname, 'content', 'colw.json');
    const prev = fs.existsSync(cf) ? fs.readFileSync(cf, 'utf8') : '';
    const next = JSON.stringify(res.colw) + '\n';
    if (prev === next) break;
    fs.writeFileSync(cf, next);
  }
  const layout = {}, report = [];
  for (const [key, ch] of Object.entries(data)) {
    const A = ch.atoms, cap = ch.cap - MARGIN, pages = [];
    let rows = [], used = 0;
    const done = new Set();
    const newPage = (midTopic) => { if (rows.length) pages.push(rows); rows = []; used = midTopic ? ch.cont : 0; };
    const place = (row, h) => { rows.push(row); used += h; row.forEach(i => done.add(i)); };
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
    // before a page break, fill a big gap with the topic's Key numbers box (it may move up); never split a box
    const fill = (i) => {
      if (cap - used <= 0.15 * cap) return;
      const n = A.findIndex((a, j) => j > i && !done.has(j) && a.nums && a.t === A[i].t && a.full <= cap - used);
      if (n >= 0) place([n], A[n].full);
    };
    // 1) rows in reading order (short boxes paired); an opening sentence is glued to the row after it
    const units = [];  // {rows, h, title, seg}
    let seg = -1, glue = null;
    for (let i = 0; i < A.length; i++) {
      if (done.has(i)) continue;
      const opt = option(i); opt.row.forEach(j => done.add(j));
      const isTitle = A[i].k === 'title';
      if (isTitle) seg++;
      const h = opt.h + (A[i].k === 'rvt' ? (A[i].rc ? 2 : GAP) : 0) - (A[i].k === 'cbox' ? A[i].js : 0);
      if (A[i].k === 'raw' && !isTitle) { glue = glue ? { rows: [...glue.rows, opt.row], h: glue.h + h } : { rows: [opt.row], h }; continue; }
      const u = { rows: [opt.row], h, title: isTitle, rv: A[i].k === 'rvt', cb: A[i].k === 'cbox', seg: Math.max(seg, 0) };
      if (glue && !isTitle && glue.h + u.h <= cap - ch.cont) { u.rows = [...glue.rows, ...u.rows]; u.h += glue.h; glue = null; }
      else if (glue) { units.push({ rows: glue.rows, h: glue.h, seg: isTitle ? Math.max(seg - 1, 0) : u.seg }); glue = null; }
      units.push(u);
    }
    if (glue) units.push({ rows: glue.rows, h: glue.h, seg: Math.max(seg, 0) });
    if (process.env.DBG === key) console.log(cap, ch.cont, JSON.stringify(units.map(u => [u.seg, u.rows.flat().join(','), Math.round(u.h), u.cb ? 'c' + Math.round(A[u.rows[0][0]].js) : ''])));
    // 2) per topic, choose the page breaks that leave the most even pages (least sum of squared gaps): no nearly empty last page
    const fills = [];
    for (let sg = 0; sg <= seg; sg++) {
      const all = units.filter(u => u.seg === sg); if (!all.length) continue;
      const numsU = all.filter(u => u.rows.length === 1 && u.rows[0].length === 1 && A[u.rows[0][0]].nums);
      for (const tryNums of [false, true]) {   // Key numbers box (old chapters): first try to tuck it into a gap
      const U = tryNums ? all : all.filter(u => !numsU.includes(u));
      const cont = U.some(u => u.rv) ? 0 : ch.cont;  // Rapid Review pages have no continued title
      const n = U.length, best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(-1); best[0] = 0;
      for (let e = 1; e <= n; e++) for (let st = e - 1; st >= 0; st--) {
        let h = (st === 0 ? 0 : cont) - (U[st].rv ? GAP : 0) + (U[st].cb ? CONT_TOP : 0); for (let k = st; k < e; k++) h += U[k].h;
        if (h > cap && e - st > 1) break;
        if (h > cap) report.push(`${key} a box is taller than a page`);
        const last = e === n, rvG = true;  // owner: fill every page (topics and Rapid Review); space is left only at the end  // Rapid Review (owner): fill each page, the space is left only at the chapter's end
        const c = best[st] + cap * cap * 20 + (rvG ? (last ? 0 : Math.max(cap - h, 0) * cap * 4 * Math.pow(n - st + 1, 2)) : Math.pow(Math.max(cap - h, 0), 2)) + (U[st].cb ? Math.pow(0.22 * cap, 2) : 0);  // splitting a box costs something  // fewest pages first, then the most even
        if (c < best[e]) { best[e] = c; prev[e] = st; }
      }
      // owner (pediatrics): fill every page in order; when the next piece does not fit, a later whole box of the same topic
      // that fits (up to 3 boxes ahead) moves up into the gap; space is left only at the topic's end
      const P = [], F = []; {
        const R = U.map((u, i) => i);
        while (R.length) {
          const first = R[0]; let h = (P.length === 0 ? 0 : cont) - (U[first].rv ? GAP : 0) + (U[first].cb ? CONT_TOP : 0) + U[first].h;
          if (h > cap) report.push(`${key} a box is taller than a page`);
          const rs = [...U[first].rows]; R.shift();
          while (R.length) {
            if (h + U[R[0]].h <= cap) { h += U[R[0]].h; rs.push(...U[R.shift()].rows); continue; }
            let moved = false;
            for (let a = 1; a < Math.min(R.length, 4); a++) {
              const u = U[R[a]], nx = U[R[a + 1]];
              if (u.cb || u.rv || u.title || (nx && nx.cb) || h + u.h > cap) continue;
              h += u.h; rs.push(...u.rows); R.splice(a, 1); moved = true; break;
            }
            if (!moved) break;
          }
          P.push(rs); F.push(cap - h);
        }
      }
      let ok = true;
      if (!tryNums) for (const nu of numsU) {
        let bi = -1; F.forEach((f, i) => { if (f >= nu.h && (bi < 0 || f > F[bi])) bi = i; });
        if (bi < 0) { ok = false; break; }
        P[bi].push(...nu.rows); F[bi] -= nu.h;
      }
      if (!ok) continue;
      P.forEach((p, i) => { pages.push(p); fills.push(Math.max(0, Math.round(F[i]))); });
      break;
      }
    }
    layout[key] = { n: A.length, pages, fills };
  }

  fs.writeFileSync(path.join(__dirname, 'content', 'layout.json'), JSON.stringify(layout) + '\n');
  execSync('python3 build.py', { cwd: __dirname, stdio: 'ignore' });
  console.log(`planned ${Object.values(layout).reduce((s, l) => s + l.pages.length, 0)} pages` + (report.length ? '\n' + report.join('\n') : ''));
})();

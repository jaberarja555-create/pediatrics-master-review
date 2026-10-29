// Usage: node tools/pdf.js [out.pdf]  ->  the whole book as a PDF (one book page per PDF page), for reviewers.
// Contents rows and cross-references become PDF links; every page carries a small "Review copy" mark.
const path = require('path');
const pw = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const out = process.argv[2] || path.join(__dirname, '..', 'Surgery_Master_Review_review_copy.pdf');
(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: 816, height: 1152 } });
  await p.goto('file://' + path.join(__dirname, '..', 'docs', 'index.html'));
  await p.waitForTimeout(1500);
  const n = await p.evaluate(() => {
    const secs = [...document.getElementById('bookPages').content.querySelectorAll('section.page')];
    document.body.innerHTML = '';
    document.body.className = '';
    const st = document.createElement('style');
    st.textContent = `@page{size:816px 1152px;margin:0}
      html,body{margin:0;padding:0;background:#fff;overflow:visible!important;height:auto!important}
      .pp{position:relative;width:816px;height:1152px;overflow:hidden;page-break-after:always;break-after:page}
      .pp:last-child{page-break-after:auto}
      .rc{position:absolute;right:10px;top:6px;font:600 9px Inter,sans-serif;letter-spacing:.8px;color:rgba(120,120,130,.55);text-transform:uppercase;z-index:9}
      a.pl{color:inherit;text-decoration:none}`;
    document.head.appendChild(st);
    secs.forEach((s, i) => {
      const w = document.createElement('div'); w.className = 'pp bk'; w.id = 'p' + (i + 1);
      const c = s.cloneNode(true); w.appendChild(c);
      if (i > 0) { const m = document.createElement('div'); m.className = 'rc'; m.textContent = 'Review copy · not for distribution'; w.appendChild(m); }
      // contents rows / references with data-p -> internal links
      c.querySelectorAll('[data-p]').forEach(el => { const a = document.createElement('a'); a.className = 'pl'; a.href = '#p' + el.dataset.p;
        el.parentNode.insertBefore(a, el); a.appendChild(el); });
      document.body.appendChild(w);
    });
    return secs.length;
  });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  await p.pdf({ path: out, width: '816px', height: '1152px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await b.close();
  console.log(`${n} pages -> ${out}`);
})();

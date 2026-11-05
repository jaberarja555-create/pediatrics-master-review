// Usage: node tools/pack.js — plans the pages (paginate.js), measures the real pages, and re-plans any page left with
// less than 42 px free at the bottom (content/capfix.json keeps the correction per chapter page); up to 4 rounds.
const { execSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'), fixF = path.join(root, 'content', 'capfix.json');
let fix = {}; try { fix = JSON.parse(fs.readFileSync(fixF, 'utf8')); } catch (e) {}
for (let round = 0; round < 8; round++) {
  console.log(execSync('node paginate.js', { cwd: root }).toString().trim());
  const L = JSON.parse(fs.readFileSync(path.join(root, 'content', 'layout.json'), 'utf8'));
  const keys = Object.keys(L).filter(k => /^ch\d+$/.test(k)).sort((a, b) => +a.slice(2) - +b.slice(2))
    .concat(Object.keys(L).filter(k => /^rr\d+$/.test(k)).sort((a, b) => +a.slice(2) - +b.slice(2)));
  const idx = []; keys.forEach(k => L[k].pages.forEach((p, i) => idx.push([k, i])));
  const g = execSync('node tools/gaps.js', { cwd: root }).toString().trim().split('\n').map(x => x.split('\t'));
  if (g.length !== idx.length) { console.log('page count mismatch', g.length, idx.length); break; }
  let bad = 0;
  g.forEach((x, i) => { const free = +x[2]; if (free < 42) { const [k, pi] = idx[i]; fix[k] = fix[k] || {}; fix[k][pi] = (fix[k][pi] || 0) + (42 - free) + 4; bad++; } });
  fs.writeFileSync(fixF, JSON.stringify(fix) + '\n');
  console.log(`round ${round + 1}: ${bad} page(s) corrected`);
  if (!bad) break;
}

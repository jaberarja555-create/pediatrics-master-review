// Usage: node tools/terms.js artifact/index.html
// Lists every word the book explains on tap (abbreviations a…, glossary g…) with the text around it, to check
// that each one shows the right meaning in its context.
const pw=require('playwright');(async()=>{const b=await pw.chromium.launch();const p=await b.newPage({viewport:{width:900,height:1000}});
await p.goto('file://'+require('path').resolve(process.argv[2]));await p.waitForTimeout(1500);
await p.click('#coverBtn');await p.waitForTimeout(800);
const H=await p.evaluate(()=>document.getElementById('scroller').scrollHeight);
for(let y=0;y<H;y+=500){await p.evaluate(v=>document.getElementById('scroller').scrollTop=v,y);await p.waitForTimeout(60);}
await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const out={};document.querySelectorAll('#pages .gt').forEach(g=>{
   const ctx=(g.parentNode.textContent||'').replace(/\s+/g,' ');const i=ctx.indexOf(g.textContent);
   const key=g.textContent+' ['+g.dataset.t+']';(out[key]=out[key]||[]).push(ctx.slice(Math.max(0,i-35),i+g.textContent.length+30))});return out});
console.log(Object.keys(r).length+' distinct');
for(const k of Object.keys(r).sort())console.log(k,'||',r[k].length,'||',r[k][0]);
await b.close()})();

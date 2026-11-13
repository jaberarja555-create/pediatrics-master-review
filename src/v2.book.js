/* ===== Book adapter (owner, 11 Nov 2026: Pediatrics and Surgery exactly like the new Obstetrics app; the same file in both repositories). The screens are the Obstetrics code, copied by
   tools/port_v2.py; this part runs first inside the same closure and gives this book's data the names that code expects. Names that the
   old app uses with another meaning (pct, pc) are declared here, so they stay local to the new code. ===== */
var BKI=window.BOOK_INFO||{},BK=BKI.bk||{};
BK.chImg=function(n){var f=BK.chFallback||[];return (BKI.chimg||[]).indexOf(n)>=0?'img/chcover_'+n+'.jpg':(f[n%f.length]||'img/part1.jpg')};
var sp=st,spj=stj;
function pc(a,b){return b?Math.round(a/b*100):0}
/* the Obstetrics code knows a page by its topic (p.t) and its file name (p.f: a00_cover, k<n>_cover, x9… Rapid Review, y0… drugs) */
function v2names(){var rr=(META.rr||0)-1,dr=(META.dr||0)-1;PAGES.forEach(function(p,i){if(p.user)return;
  p.t=p.topic&&!p.ex?p.topic:'';
  p.f=p.id==='cover'?'a00_cover':i===rr?'x900_rrcover':p.ex?'x9_'+p.id:i===dr?'y00_drcover':p.chcover?'k'+p.ch+'_cover':p.topic?'t_'+p.id:'a0_'+p.id})}
v2names();
var tpages={};function v2tp(){tpages={};PAGES.forEach(function(p,i){if(p.t&&!p.user)(tpages[p.t]=tpages[p.t]||[]).push(i)})}v2tp();
function tRead(t){var n=0;(tpages[t]||[]).forEach(function(i){if(readSet[PKEY[i]])n++});return n}
function tMast(t){var n=0;(tpages[t]||[]).forEach(function(i){if(readSet[PKEY[i]]===2)n++});return n}
function pct(t){return pc(tRead(t),(tpages[t]||[]).length)}
/* question records: this book keeps {c: 1 right / 0 wrong, m: marked}; the Obstetrics code reads {a: answered, w: wrong, m} */
function qst(id){var s=QU[id];if(!s)return null;var a='c' in s;return a||s.m?{a:a?1:0,n:a?1:0,w:s.c===0?1:0,m:s.m?1:0}:null}
function saveQ(){saveQB()}
function openNotes(){openSheet('Notes & highlights',hlHtml())}
if(!META.chapters)META.chapters=(META.contents||[]).filter(function(c){return TOPICS.some(function(t){return t.ch===c.no})}).map(function(c){return {n:c.no,name:c.title,img:BK.chImg(c.no)}});
/* access state as the Obstetrics licence layer marks it */
window.__LK=LOCKED?(BKI.locked||{}):{};
if(INTRIAL)root.classList.add('intrial');else if(!LOCKED)root.classList.add('unlocked');
/* ---------- subscription through the shared system (owner, 11 Nov 2026: the same as Obstetrics, one admin for the three books) ----------
   The Obstetrics screens (Subscription, Payment, link number, renewal) call window.__lic. Here it talks to the same Supabase functions with
   this book's id; an approved device receives this book's key (<prefix>-k), checked against ACC.key_hash. Old codes (PMR- / SMR-) (Worker) still open
   the book until ACC.old_until. */
function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')})}
function kindOf(){var ua=navigator.userAgent;return (/Android|iPhone|iPod|iPad|Mobile/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))?'phone':'computer'}
function labelOf(){var ua=navigator.userAgent;if(/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return 'iPad';if(/iPhone/.test(ua))return 'iPhone';if(/Android/.test(ua))return /Mobile/.test(ua)?'Android phone':'Android tablet';if(/Windows/.test(ua))return 'Windows computer';if(/Mac/.test(ua))return 'Mac';if(/Linux/.test(ua))return 'Linux computer';return 'Device'}
function keyMeta(j){st('exp',j.exp?String(Date.parse(j.exp)):'');st('plan',j.plan||'');if(j.name)st('sname',j.name);try{localStorage.removeItem(BK.prefix+'-ended')}catch(e){}}
function dropKey(){['k','kc','exp','plan'].forEach(function(k){try{localStorage.removeItem(BK.prefix+'-'+k)}catch(e){}})}
if(HASK&&!REVIEW){sha(st('k')).then(function(h){if(h!==ACC.key_hash){dropKey();location.reload()}}).catch(function(){})}
/* online check (at most once a day): a plan that ended or a subscription the owner switched off locks this device again */
if(HASK&&window.__sbRpc&&navigator.onLine!==false&&Date.now()-(+st('kc')||0)>864e5)window.__sbRpc('obs_check',{p_dev:SDEV}).then(function(r){var j=r.data;if(r.error||!j)return;
  if(j.ok){keyMeta(j);st('kc',String(Date.now()));if(j.key&&j.key!==st('k')){st('k',j.key);location.reload()}}
  else if(j.reason==='expired'){st('ended','1');dropKey();location.reload()}
  else if(j.reason==='off'||j.reason==='none'){dropKey();location.reload()}}).catch(function(){});
window.__lic=window.__sbRpc?{dev:SDEV,kind:kindOf,label:labelOf,rpc:window.__sbRpc,
  unlocked:function(){return !LOCKED&&!INTRIAL},intrial:function(){return INTRIAL},fresh:function(){return TRIALNEW},
  trialLeft:trialTxt,trialDur:trialDur,startTrial:function(){startTrial()},
  adopt:function(j){return sha(j.key||'').then(function(h){if(h!==ACC.key_hash)throw new Error('key');keyMeta(j);st('k',j.key);if(j.code)st('scode',j.code);st('kc',String(Date.now()));
    choiceSnd('ok');openingFx('تم تفعيل اشتراكك · جارٍ فتح الكتاب كاملًا');setTimeout(function(){location.reload()},1100)})},
  /* an old activation code (PMR- or SMR-XXXX-XXXX) typed in the new app: first the shared system (the owner moves the old codes there,
     13 Nov 2026), then the book's own server (Worker), as before */
  activate:function(code,say){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(code.slice(0,3)!==BK.code||!/^[A-Z]{3}[A-Z0-9]{8}$/.test(code)){say('يكون الكود بهذا الشكل: '+BK.code+'-XXXX-XXXX');return}
    say('جارٍ التفعيل…');
    oldToNew(code).then(function(j){if(j){window.__lic.adopt(j).catch(function(){say(ACT_ERR.server)});return}
    if(OLDEND){say('انتهت مدة أكواد التفعيل القديمة. اشترك من هذه الصفحة.');return}
    if(SRV==null){say('التفعيل يعمل من رابط الكتاب الأصلي فقط.');return}
    fetch(SRV.replace(/\/$/,'')+'/activate',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({code:code,dev:DEV})}).then(function(r){return r.json()}).then(function(j){
      if(!j||!j.ok){say(ACT_ERR[j&&j.reason]||ACT_ERR.server);return}
      return checkCode(j.token).then(function(ok){if(!ok){say(ACT_ERR.server);return}st('act',j.token);st('code',j.code);if(j.name)st('name',j.name);say('تم التفعيل. يُفتح الكتاب كاملًا الآن…');choiceSnd('ok');setTimeout(function(){location.reload()},900)})})
      .catch(function(){say(ACT_ERR.net)})})}}:null;
/* Old codes moved to the shared system (owner, 13 Nov 2026: "shift the old codes to new-style subscriptions, starting with 1 month").
   oldToNew(code) asks the shared system to take this device on the moved code; it answers the key (or null when the code is not there).
   A device that opened the book with an old code joins by itself: once every 6 hours until it has this book's key, with no message and
   no reload (the book is already open; the new key is used from the next opening). */
function oldToNew(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(!window.__sbRpc||!/^[A-Z]{3}[A-Z0-9]{8}$/.test(code))return Promise.resolve(null);
  var f=code.slice(0,3)+'-'+code.slice(3,7)+'-'+code.slice(7),R=window.__sbRpc;
  return R('obs_request_status',{p_dev:SDEV,p_kind:kindOf(),p_label:labelOf()}).then(function(){return R('obs_activate',{p_code:f,p_dev:SDEV,p_kind:kindOf(),p_label:labelOf()})})
    .then(function(r){var j=r&&r.data;if(r.error||!j||!j.ok||!j.key)return null;return sha(j.key).then(function(h){return h===ACC.key_hash?j:null})}).catch(function(){return null})}
if(window.__sbRpc&&!REVIEW&&!st('k')&&st('act')&&st('code')&&navigator.onLine!==false&&Date.now()-(+st('mvtry')||0)>6*36e5){st('mvtry',String(Date.now()));
  setTimeout(function(){oldToNew(st('code')).then(function(j){if(!j)return;keyMeta(j);st('k',j.key);if(j.code)st('scode',j.code);st('kc',String(Date.now()))})},4000)}

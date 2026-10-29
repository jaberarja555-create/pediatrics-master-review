(function(){
var $=function(id){return document.getElementById(id)};
function st(k,v){try{if(v===undefined)return localStorage.getItem('prr-'+k);localStorage.setItem('prr-'+k,v)}catch(e){return null}}
function stj(k,v){if(v===undefined){try{return JSON.parse(st(k))}catch(e){return null}}st(k,JSON.stringify(v))}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
var root=document.documentElement;
root.setAttribute('data-theme','dark');   // the app (Home, cards, QBank, search) is always the dark-blue look (owner)
$('themeBtn').onclick=function(){toggleDark()};

var META=JSON.parse($('meta').textContent), DECKS=JSON.parse($('decks').textContent);
/* ---------- subscription: free trial until a device code is activated ---------- */
var ACC=META.access||{},FREE={};(ACC.free_topics||[]).forEach(function(t){FREE[t]=1});
var DEV=st('dev');if(!DEV||!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(DEV)){var AB='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=new Uint8Array(8);crypto.getRandomValues(r);DEV='';for(var i=0;i<8;i++){DEV+=AB[r[i]%32];if(i===3)DEV+='-'}st('dev',DEV)}
/* an activation from before the PMR- codes (no code saved) cannot be switched off or synced: ask for a code once */
if(st('act')&&!st('code')){try{localStorage.removeItem('prr-act')}catch(e){}}
var LOCKED=!st('act')||!ACC.public_key;
var SRV=ACC.server==='same'?(/^https?:$/.test(location.protocol)&&!/claude|localhost|127\.0/.test(location.hostname)?'':null):(ACC.server||null);
var LINKCODE=(location.hash.match(/code=([A-Za-z0-9-]{11,16})/)||[])[1];if(LINKCODE){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
window.addEventListener('hashchange',function(){var m=location.hash.match(/code=([A-Za-z0-9-]{11,16})/);if(m){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}if(LOCKED)openSub(m[1])}});
function b64u(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
/* activation: the student types the code (PMR-XXXX-XXXX); the server binds this device (max 2 per code) and returns
   a token = DEVICE.signature, checked here with the public key so the book also opens offline */
function checkCode(code){code=(code||'').replace(/\s+/g,'');var parts=code.split('.'),sig=parts.pop(),me=DEV.replace('-','');
  if(!window.crypto||!crypto.subtle||!sig||parts.indexOf(me)<0)return Promise.resolve(false);
  return crypto.subtle.importKey('jwk',ACC.public_key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']).then(function(k){
    return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,b64u(sig),new TextEncoder().encode('PMR|pediatrics|1|'+parts.join(',')))}).catch(function(){return false})}
function relock(){try{localStorage.removeItem('prr-act');localStorage.removeItem('prr-code')}catch(e){}location.reload()}
if(!LOCKED)checkCode(st('act')).then(function(ok){if(!ok)return relock();
  /* online check: the authors can switch a code off or reset its devices; offline the book stays open */
  if(SRV!=null&&st('code')&&navigator.onLine!==false)fetch(SRV.replace(/\/$/,'')+'/check?dev='+DEV+'&code='+encodeURIComponent(st('code')),{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok===false&&j.reason!=='device')relock()}).catch(function(){})});
if(LOCKED){var fd={};Object.keys(ACC.cards||{}).forEach(function(id){if(DECKS[id])fd[id]={short:DECKS[id].short,cards:ACC.cards[id].map(function(j){return DECKS[id].cards[j]})}});DECKS=fd}
function pageFree(i){var p=META.pages[i];if(!LOCKED)return true;if(/^(cover|authors|about|contents|abbr)/.test(p.id))return true;return p.ex?(ACC.free_chapters||[]).indexOf(p.ch)>=0:!!FREE[p.topic]}
function freeList(){if(ACC.free_label)return '<b>'+ACC.free_label.replace(/([A-Za-z][A-Za-z ]*[A-Za-z])/g,'<span class="en">$1</span>')+'</b>';return (ACC.free_names||[]).map(function(n){return '<b class="en">'+esc(n)+'</b>'}).join('، ')}
function E(t){return '<span class="en">'+t+'</span>'}
function subHtml(code){var wa=(ACC.whatsapp||'').replace(/[^0-9]/g,''),who=esc(ACC.contact_name||'');
  var msg='السلام عليكم '+(ACC.contact_name||'')+'، داير أشترك في Pediatrics Master Review.';
  return '<div class="subx ar" dir="rtl"><p class="lead">الـ '+E('free trial')+' بيفتح ليك '+(ACC.free_label?freeList()+'، مع الـ '+E('flashcards')+' والـ '+E('QBank')+' بتاعته.':'كاملين: '+freeList()+'، مع كل الـ '+E('flashcards')+' والـ '+E('QBank')+' بتاعتهم.')+' لو اشتركت مرّة واحدة بيتفتح ليك <b>الكتاب كلّه</b>، وكل الـ '+E('flashcards')+'، والـ '+E('QBank')+' كامل، للطبعة دي كلّها.</p>'+
  (ACC.price?'<div class="price">'+esc(ACC.price)+'</div>':'')+
  '<ol class="sst"><li><b>حوّل المبلغ بـ بنكك</b>'+(ACC.bankak_account?': رقم الحساب <b class="sel en">'+esc(ACC.bankak_account)+'</b>'+(ACC.bankak_name?' ('+esc(ACC.bankak_name)+')':''):' (رقم الحساب بنرسله ليك في الواتساب)')+'.</li>'+
  '<li><b>رسّل صورة الإشعار</b> واتساب لـ '+who+(ACC.whatsapp_local?' (<span class="en">'+esc(ACC.whatsapp_local)+'</span>)':'')+'.</li>'+
  '<li>بنرسل ليك <b>'+E('activation code')+'</b>: اكتبه تحت ودوس '+E('Activate')+'. الكود الواحد بيفتح <b>جهازين</b> (الموبايل واللابتوب): اكتبه في كل جهاز.</li></ol>'+
  (wa?'<a class="btn wa" id="waBtn" href="https://wa.me/'+wa+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">رسّل واتساب لـ '+who+'</a>':'')+
  '<input id="actIn" class="actin" dir="ltr" placeholder="PMR-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" value="'+esc(code||'')+'"><button type="button" class="btn" id="actGo">'+E('Activate')+'</button><p class="muted" id="actMsg"></p></div>'}
var ACT_ERR={unknown:'الكود دا غلط. اتأكّد منه واكتبه تاني زي ما وصلك.',off:'الكود دا مقفول. كلّم '+(ACC.contact_name||'المؤلفين')+'.',full:'الكود دا اتفعّل في جهازين قبل كدا. لو غيّرت جهازك كلّم '+(ACC.contact_name||'المؤلفين')+'.',server:'في مشكلة في السيرفر. جرّب تاني بعد شويّة.',net:'ما في إنترنت. التفعيل محتاج نت مرّة واحدة بس، اتأكّد من النت وجرّب تاني.',here:'التفعيل بيشتغل من لينك الكتاب الأصلي بس.'};
function activate(code){var msg=$('actMsg'),go=$('actGo');code=(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!/^PMR[A-Z0-9]{8}$/.test(code)){msg.textContent='الكود بيكون زي كدا: PMR-XXXX-XXXX';return}
  if(SRV==null){msg.textContent=ACT_ERR.here;return}
  msg.textContent='لحظة…';go.disabled=true;
  fetch(SRV.replace(/\/$/,'')+'/activate',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({code:code,dev:DEV})})
    .then(function(r){return r.json()}).then(function(j){
      if(!j||!j.ok){go.disabled=false;msg.textContent=ACT_ERR[j&&j.reason]||ACT_ERR.server;return}
      return checkCode(j.token).then(function(ok){if(!ok){go.disabled=false;msg.textContent=ACT_ERR.server;return}
        st('act',j.token);st('code',j.code);msg.textContent='تمام، اتفعّل! الكتاب كلّه بيفتح هسّي…';setTimeout(function(){location.reload()},700)})})
    .catch(function(){go.disabled=false;msg.textContent=ACT_ERR.net})}
function openSub(code){if(!LOCKED){openSheet('الاشتراك','<div class="ar" dir="rtl"><p class="lead">الجهاز دا متفعّل والكتاب كلّه مفتوح. شكراً ليك!</p>'+(st('code')?'<div class="devc"><span>الـ '+E('activation code')+'</span><b dir="ltr">'+esc(st('code'))+'</b></div>':'')+'</div>');return}
  openSheet('افتح الكتاب كامل',subHtml(code));
  $('actGo').onclick=function(){activate($('actIn').value)};$('actIn').onkeydown=function(e){if(e.key==='Enter')activate(this.value)};
  if(code)activate(code)}
document.addEventListener('click',function(e){if(e.target.closest('[data-sub]'))openSub()});
var TOPICS=META.topics, PAGES=META.pages, NP=PAGES.length;
var byId={};PAGES.forEach(function(p,i){byId[p.id]=i});
/* saved things (highlights, pages read, last page) are keyed by topic + page within the topic ("appendicitis:2"),
   so they stay in place when pages are added or moved elsewhere in the book */
var PKEY=[],byKey={},KEYOF={};(function(){var n={};PAGES.forEach(function(p,i){var g=p.ex?'ex'+p.ch:p.topic,k=g?g+':'+(n[g]=(n[g]||0)+1):p.id;PKEY[i]=k;byKey[k]=i;KEYOF[p.id]=k})})();

/* ---------- saved state ---------- */
var readSet=stj('prog')||{};          // pageKey -> 1 done, 2 mastered (set by the student with the page button)
try{localStorage.removeItem('prr-read')}catch(e){}  // old automatic 'read' marks are not trusted
var HL=stj('hl')||{};                 // pageId -> [{s,e,c,t}]
var KNOWN=stj('known')||{};           // cardKey -> 1
var PROGU=stj('progu')||{};          // pageKey -> time of the student's last change (for sync)
function saveRead(){stj('prog',readSet);stj('progu',PROGU);if(typeof syncSoon==='function')syncSoon();gcommit()}function saveKnown(){stj('known',KNOWN);if(typeof syncSoon==='function')syncSoon()}

/* ---------- pages ---------- */
var tpl=$('bookPages').content, pagesEl=$('pages'), wraps=[], srcPages=[].slice.call(tpl.querySelectorAll('section.page'));
srcPages.forEach(function(sec,i){
  var pw=document.createElement('div');pw.className='pw';pw.dataset.i=i;
  var host=document.createElement('div');host.className='bk';host.appendChild(sec.cloneNode(true));
  pw.appendChild(host);pagesEl.appendChild(pw);wraps.push(pw)});
if(LOCKED)wraps.forEach(function(pw,i){if(pageFree(i))return;pw.classList.add('lk');var o=document.createElement('div');o.className='lko';o.innerHTML='<div class="ar" dir="rtl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><b>للمشتركين بس</b><span>الصفحة دي في الكتاب الكامل. الـ <span class="en">free trial</span> بيفتح '+freeList()+(ACC.free_label?'':' كاملين')+'.</span><button type="button" class="btn" data-sub="1">افتح الكتاب كامل</button></div>';pw.appendChild(o)});
var cm=$('coverMini');cm.appendChild(srcPages[0].cloneNode(true));
function fitCover(){var w=cm.parentNode.clientWidth||112;cm.style.transform='scale('+(w/816)+')'}fitCover();
/* page size (side-rail panel): auto = page width up to the screen, 'width' = fill the screen width, 'page' = the whole page
   in view, or a fixed scale (1 = 816 px wide). − / + and Ctrl + mouse wheel (or touchpad pinch) step by 10 %. Saved in prr-zoom. */
var ZM=st('zoom')||'auto';
function zscale(){var sc=$('scroller'),W=sc.clientWidth-16,H=sc.clientHeight-20;if(ZM==='width')return W/816;if(ZM==='page')return Math.min(W/816,H/1152);if(ZM==='auto')return Math.min(W,816)/816;return +ZM||1}
function layout(){var s=zscale(),avail=816*s;if(avail<100)return;$('zoomLbl').textContent=zlabel();
  wraps.forEach(function(pw){pw.style.width=avail+'px';pw.style.height=(1152*s)+'px';pw.firstChild.style.transform='scale('+s+')'})}
/* on a screen narrower than the page (phones) sizes are shown against the screen width (fill width = 100 %), with bigger steps */
function zbase(){var W=($('scroller').clientWidth||innerWidth)-16;return W<816?Math.max(.1,W/816):1}   // before the reader is first shown its width is 0
function zpct(){return Math.round(zscale()/zbase()*100)}
function zlabel(){return ZM==='auto'?'الحجم':ZM==='width'?'العرض':ZM==='page'?'صفحة':zpct()+'%'}
function setZoom(z){var sc=$('scroller'),cur=currentPage(),w=wraps[cur],f=w.offsetHeight?(sc.scrollTop-w.offsetTop)/w.offsetHeight:0,cx=sc.scrollWidth>sc.clientWidth?(sc.scrollLeft+sc.clientWidth/2)/sc.scrollWidth:.5;
  ZM=z;st('zoom',ZM);$('zoomLbl').textContent=zlabel();layout();sc.scrollTop=w.offsetTop+f*w.offsetHeight;sc.scrollLeft=cx*sc.scrollWidth-sc.clientWidth/2;onScroll()}
function zstep(k){if(zbase()<1)k=k>1?1.25:0.8;setZoom(String(Math.round(Math.max(.3,Math.min(4,zscale()*k))*100)/100))}
function zoomFly(){var f=$('penFly');f.dataset.k='z';var pc=zpct(),ph=zbase()<1;
  f.innerHTML='<b>حجم الصفحة</b><div class="zrow"><button type="button" class="zb" data-zs="-1" aria-label="أصغر">−</button><span>'+pc+'%</span><button type="button" class="zb" data-zs="1" aria-label="أكبر">+</button></div>'+
    (ph?'<div class="zrow" style="margin-top:8px">'+[1.5,2,3].map(function(x){return '<button type="button" class="ptog'+(Math.abs(pc-x*100)<3?' on':'')+'" data-zx="'+x+'">×'+x+'</button>'}).join('')+'</div>':'')+(ph?[['width','ملء عرض الشاشة (عادي)']]:[['width','ملء عرض الشاشة'],['page','الصفحة كاملة في الشاشة'],['auto','الحجم العادي']]).map(function(x){return '<button type="button" class="ptog'+(ZM===x[0]?' on':'')+'" data-zm="'+x[0]+'" style="margin-top:6px">'+x[1]+'</button>'}).join('')+
    (FINE?'<small>Ctrl + عجلة الماوس (أو قرصة اللوحة) بتكبّر وتصغّر كمان.</small>':'<small>وممكن تكبّر وتصغّر بصباعين على الصفحة (قرصة).</small>');flyAt(f,$('zoomBtn'))}
$('zoomBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='z')penFly(false);else zoomFly()};
/* two-finger pinch on the pages zooms (not while the drawing pen is on: there two fingers scroll) */
var pin=null,pinF=0;function tdist(e){var a=e.touches[0],b=e.touches[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
$('scroller').addEventListener('touchstart',function(e){if(e.touches.length===2&&!INKON)pin={d:tdist(e),s:zscale()};else if(e.touches.length<2)pin=null},{passive:true});
$('scroller').addEventListener('touchmove',function(e){if(!pin||e.touches.length!==2)return;e.preventDefault();var z=Math.round(Math.max(.3,Math.min(4,pin.s*tdist(e)/pin.d))*100)/100;
  if(pinF)return;pinF=requestAnimationFrame(function(){pinF=0;if(pin&&Math.abs(z-zscale())>=.02)setZoom(String(z))})},{passive:false});
$('scroller').addEventListener('touchend',function(e){if(e.touches.length<2)pin=null},{passive:true});
$('scroller').addEventListener('wheel',function(e){if(!e.ctrlKey||$('reader').hidden)return;e.preventDefault();zstep(e.deltaY<0?1.1:1/1.1)},{passive:false});
window.addEventListener('resize',function(){layout();fitCover()});
$('zoomLbl').textContent=zlabel();
function currentPage(){var sc=$('scroller'),mid=sc.scrollTop+sc.clientHeight*0.35,cur=0;for(var i=0;i<wraps.length;i++){if(wraps[i].offsetTop<=mid)cur=i}return cur}
var lastCur=-1;   // page in view (renderPage re-decorates pages near it)
function onScroll(){var c=currentPage();lastCur=c;decorateNear(c);updLis(c);updPr(c);fitRail();$('pnum').textContent=(c+1)+' / '+NP;$('subtitle').textContent=PAGES[c].label;st('page',PKEY[c]);if(c!==lastSyncPg){lastSyncPg=c;if(typeof syncSoon==='function'&&SYNC)syncSoon()}}
var lastSyncPg=-1;
/* page progress button: each tap moves Not read (red) → Done (blue) → Mastered (green) → Not read */
var PRS=[['ما قريتها','<circle cx="12" cy="12" r="8"/>'],['قريتها','<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'],['أتقنتها','<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>']];
/* the side rail never scrolls: when it is taller than the reader it is scaled down so every button shows */
function fitRail(){var r=$('rbar');if(!r||$('reader').hidden)return;var av=$('reader').clientHeight-20;r.classList.remove('two');var h=r.offsetHeight;
  if(h>av&&av/h<.7){r.classList.add('two');h=r.offsetHeight}   // very short screens (phone on its side): two columns
  r.style.setProperty('--rs',h>av&&h?Math.max(.4,av/h).toFixed(3):1);railSpace()}
/* the open rail never covers the book: the pages get the space to its left; hidden = full width (show button in the top bar) */
function railSpace(){var r=$('rbar'),sc=$('scroller');if(!r||!sc)return;var w=r.classList.contains('off')?0:Math.ceil(r.getBoundingClientRect().width)+12;
  if(sc._rw===w)return;sc._rw=w;var cur=currentPage(),wp=wraps[cur],f=wp&&wp.offsetHeight?(sc.scrollTop-wp.offsetTop)/wp.offsetHeight:0;
  sc.style.right=w+'px';layout();if(wp)sc.scrollTop=wp.offsetTop+f*wp.offsetHeight}
window.addEventListener('resize',fitRail);
function updPr(c){var b=$('prBtn'),pg=PAGES[c]||{};b.hidden=!pg.topic;b.classList.toggle('soon',LOCKED&&!pageFree(c));var v=readSet[PKEY[c]]||0;b.className='pr'+v;b.querySelector('svg').innerHTML=PRS[v][1];$('prLbl').textContent=PRS[v][0]}
var actx=null;function chime(notes,type){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var t0=actx.currentTime+.02;
  notes.forEach(function(f,i){var o=actx.createOscillator(),g=actx.createGain(),t=t0+i*.09;o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.55);o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+.6)})}catch(e){}}
/* tapping the button opens a small panel with the three choices; each choice has its own sound */
$('prBtn').onclick=function(e){e.stopPropagation();var c=currentPage();if(LOCKED&&!pageFree(c)){railTip('الصفحة دي للمشتركين: بعد الاشتراك تقدر تعلّمها قريتها أو أتقنتها');return}
  var f=$('penFly');if(!f.hidden&&f.dataset.k==='p'){penFly(false);return}f.dataset.k='p';var v=readSet[PKEY[c]]||0;
  f.innerHTML='<b>الصفحة دي</b>'+PRS.map(function(x,n){return '<button type="button" class="propt p'+n+(n===v?' cur':'')+'" data-pv="'+n+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+x[1]+'</svg>'+x[0]+'</button>'}).join('');flyAt(f,$('prBtn'))};
function setProg(v){var c=currentPage(),k=PKEY[c];if(v)readSet[k]=v;else delete readSet[k];PROGU[k]=Date.now();saveRead();updPr(c);
  var b=$('prBtn');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
  if(v===0)chime([523.3,392],'sine');else if(v===1)chime([659.3,987.8],'sine');else chime([523.3,659.3,784,1046.5,1318.5],'triangle')}
$('scroller').addEventListener('scroll',onScroll,{passive:true});
function goPage(i){i=Math.max(0,Math.min(NP-1,i));show('reader');layout();$('scroller').scrollTop=wraps[i].offsetTop-10;onScroll()}
function lastPage(){var k=st('page');return k&&byKey[k]!==undefined?byKey[k]:0}
pagesEl.addEventListener('click',function(e){var nm=e.target.closest('span.nm');if(nm){openNote(+nm.closest('.pw').dataset.i,+nm.dataset.k);return}
  var m=e.target.closest('mark.uhl');if(m){if(m.classList.contains('hasn'))openNote(+m.closest('.pw').dataset.i,+m.dataset.k);else pickHL(m);return}
  var r=e.target.closest('[data-p]');if(r){goPage(+r.dataset.p-1)}});

/* ---------- topic cross-links and definitions (added to a page when it comes into view) ---------- */
var XR=META.xref||[],TNO=META.tnos||{};
function reEsc(x){return x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
var xrMap={};XR.forEach(function(x){xrMap[x[0].toLowerCase()]=x});
var xrRe=XR.length?new RegExp('(^|[^A-Za-z0-9])('+XR.map(function(x){return x[0]}).sort(function(a,b){return b.length-a.length}).map(reEsc).join('|')+')(?![A-Za-z0-9])','gi'):null;
var noRe=/\((?:see )?(\d{1,2}\.\d)\)/g;
function skipNode(n){return n.parentNode.closest('svg,a,abbr,mark,h1,.kicker,.hdr,.toc-h,button,.xr')}
function decorate(i){var pw=wraps[i];if(!pw||pw.dataset.dec)return;pw.dataset.dec='1';
  var p=PAGES[i],sec=pw.querySelector('section.page');if(!sec)return;
  if(!p.topic||p.ex){if(!FRONT.test(p.id))termify(sec);return}   // links only on topic pages; definitions also in exam corners and rapid review
  var own=p.topic,used={};
  // cross-links first: the first mention of each other topic on this page
  textNodes(sec).forEach(function(n){if(skipNode(n))return;var t=n.nodeValue,out=[],last=0,mm;
    var hits=[];
    if(xrRe){xrRe.lastIndex=0;while((mm=xrRe.exec(t))){var x=xrMap[mm[2].toLowerCase()];if(x&&x[1]!==own&&!used[x[1]]){used[x[1]]=1;hits.push({a:mm.index+mm[1].length,b:mm.index+mm[0].length,p:x[2],no:x[3]})}}}
    noRe.lastIndex=0;while((mm=noRe.exec(t))){var tn=TNO[mm[1]];if(tn&&tn[0]!==own){var a0=mm.index+1+mm[0].indexOf(mm[1])-1;hits.push({a:a0,b:a0+mm[1].length,p:tn[1],no:mm[1]})}}
    if(!hits.length)return;hits.sort(function(x,y){return x.a-y.a});
    var frag=document.createDocumentFragment();
    hits.forEach(function(h){if(h.a<last)return;frag.appendChild(document.createTextNode(t.slice(last,h.a)));
      var el=document.createElement('a');el.className='xr';el.dataset.p=h.p;el.title='Go to '+h.no;el.textContent=t.slice(h.a,h.b);frag.appendChild(el);last=h.b});
    frag.appendChild(document.createTextNode(t.slice(last)));n.parentNode.replaceChild(frag,n)});
  termify(sec)}
function decorateNear(c){for(var i=Math.max(0,c-1);i<=Math.min(NP-1,c+2);i++)decorate(i)}

/* night */
/* book page look (owner): the top-bar button (shown in the reader) opens 3 choices: day (white pages, the default),
   eye comfort (warm, softer paper, less blue light) and night (dark pages). Saved in prr-bmode. */
var BMODES={day:{l:'نهار',d:'صفحات بيضاء',i:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'},
  eye:{l:'حماية العين',d:'لون دافي ومريح للقراية الطويلة',i:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'},
  night:{l:'ليلي',d:'صفحات غامقة',i:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'}};
var BMODE=BMODES[st('bmode')]?st('bmode'):'day';
function bmSvg(m){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+BMODES[m].i+'</svg>'}
function setNight(){var r=$('reader');r.classList.toggle('night',BMODE==='night');r.classList.toggle('eye',BMODE==='eye');var b=$('themeBtn');b.innerHTML=bmSvg(BMODE);b.setAttribute('aria-label','Page colour: '+BMODE);b.title=BMODES[BMODE].l}setNight();
var bmMenu=document.createElement('div');bmMenu.className='bmmenu';bmMenu.hidden=true;bmMenu.lang='ar';document.body.appendChild(bmMenu);
function bmOpen(){bmMenu.innerHTML='<b>لون الصفحات</b>'+Object.keys(BMODES).map(function(m){return '<button type="button" data-bm="'+m+'" class="'+(m===BMODE?'cur':'')+'">'+bmSvg(m)+'<span>'+BMODES[m].l+'<small>'+BMODES[m].d+'</small></span></button>'}).join('');
  var r=$('themeBtn').getBoundingClientRect();bmMenu.style.top=(r.bottom+6)+'px';bmMenu.style.right=Math.max(8,innerWidth-r.right)+'px';bmMenu.hidden=false}
function toggleDark(){if(bmMenu.hidden)bmOpen();else bmMenu.hidden=true}
bmMenu.addEventListener('click',function(e){var b=e.target.closest('[data-bm]');if(!b)return;BMODE=b.dataset.bm;st('bmode',BMODE);setNight();bmMenu.hidden=true});
document.addEventListener('click',function(e){if(!bmMenu.hidden&&!e.target.closest('.bmmenu,#themeBtn'))bmMenu.hidden=true});
/* hidden rail: its show button sits in the top bar (takes no room from the page and covers no text) */
function setRail(off){$('rbar').classList.toggle('off',off);$('rbShow').hidden=!off||$('reader').hidden;st('rail',off?'off':'on');setTimeout(railSpace,off?0:60)}setRail(st('rail')==='off');
$('rbHide').onclick=function(){setRail(true)};$('rbShow').onclick=function(){setRail(false)};

/* ---------- views ---------- */
var views=['home','reader','cards','search','qbank','lectures'];
function show(v){views.forEach(function(x){$(x).hidden=x!==v});[].forEach.call($('tabs').children,function(b){b.classList.toggle('on',b.dataset.go===v)});
  $('backBtn').hidden=v==='home';$('themeBtn').hidden=v!=='reader';bmMenu.hidden=true;$('rbShow').hidden=v!=='reader'||!$('rbar').classList.contains('off');hideBar();
  if(v==='home'){$('subtitle').textContent=META.edition;refreshHome()}
  if(v==='cards'){$('subtitle').textContent='Flashcards';if(!started)startDeck(curDeck)}
  if(v==='search'){$('subtitle').textContent='Search the book';setTimeout(function(){$('q').focus()},50)}
  if(v==='reader'){layout();onScroll()}
  if(v==='lectures'){$('subtitle').textContent='Audio lectures';renderLect()}
  if(v==='qbank'){if(CUR&&CUR.done&&CUR.review===undefined)CUR=null;CUR&&!CUR.done?renderQ():renderQB()}}
document.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(g&&!e.target.closest('.bk')){var v=g.dataset.go;if(v==='reader')goPage(lastPage());else show(v)}
  var p=e.target.closest('.tp[data-p],.htp[data-p]');if(p)goPage(+p.dataset.p-1)});
$('backBtn').onclick=function(){show('home')};

/* ---------- home ---------- */
function topicRead(t){var n=0;t.pages.forEach(function(id){if(readSet[KEYOF[id]])n++});return n}
/* per-topic progress on Home: a thin bar (blue = done, green = mastered) and the page counts */
function tprog(rr,mm,nn){return '<span class="tpg"><span class="tpb"><i class="d" style="width:'+pct(rr,nn)+'%"></i><i class="m" style="width:'+pct(mm,nn)+'%"></i></span>'+
  '<em>'+(rr?'<b class="d">'+rr+'/'+nn+' done</b>'+(mm?' · <b class="m">'+mm+' mastered</b>':''):'Not started · '+nn+' page'+(nn>1?'s':''))+'</em></span>'}
function topicMast(t){var n=0;t.pages.forEach(function(id){if(readSet[KEYOF[id]]===2)n++});return n}
function deckKnown(id){var n=0;(DECKS[id]?DECKS[id].cards:[]).forEach(function(c){if(KNOWN[cardKey(id,c)])n++});return n}
function pct(a,b){return b?Math.round(a/b*100):0}
function refreshHome(){
  var lp=st('page'),i=lastPage();
  if(lp&&i>0){$('contK').textContent='Continue reading';$('contT').textContent='Page '+(i+1)+' · '+PAGES[i].label}else{$('contK').textContent='Start reading';$('contT').textContent='Cover and contents'}
  var tp=0,tr=0,tm=0;TOPICS.forEach(function(t){tp+=t.pages.length;tr+=topicRead(t);tm+=topicMast(t)});
  var tc=0,tk=0;deckIds.forEach(function(id){tc+=DECKS[id].cards.length;tk+=deckKnown(id)});
  var nh=0;Object.keys(HL).forEach(function(k){HL[k].forEach(function(h){if(h.c!=='n')nh++})});
  var done=TOPICS.filter(function(t){return topicRead(t)===t.pages.length}).length;
  $('prog').innerHTML=
    '<div class="row"><div class="lab">Pages done<span>'+tr+' / '+tp+' · '+pct(tr,tp)+'%</span></div><div class="pbar pdone"><i style="width:'+pct(tr,tp)+'%"></i></div></div>'+
    '<div class="row"><div class="lab">Pages mastered<span>'+tm+' / '+tp+' · '+pct(tm,tp)+'%</span></div><div class="pbar pmast"><i style="width:'+pct(tm,tp)+'%"></i></div></div>'+
    '<div class="row"><div class="lab">Flashcards known<span>'+tk+' / '+tc+' · '+pct(tk,tc)+'%</span></div><div class="pbar"><i style="width:'+pct(tk,tc)+'%"></i></div></div>'+
    '<div class="row"><div class="lab">Topics done<span>'+done+' / '+TOPICS.length+'</span></div></div>'+
    '<p class="prhint" dir="rtl" lang="ar">علّم كل صفحة بالزر التحت: ضغطة = <b class="c1">قريتها</b>، ضغطة تانية = <b class="c2">أتقنتها</b>، والتالتة بترجعها <b class="c0">ما قريتها</b>.</p>';
  // Home: parts → chapter cards (tap to open) → topic rows with progress
  var tById={};TOPICS.forEach(function(t){tById[t.id]=t});
  var cur=(PAGES[lastPage()]||{}).topic, curCh=cur&&tById[cur]?tById[cur].ch:null;
  var parts=[],PIMG=['part1','part2','part3','part4','part5','part6'],PCLR=[];
  META.contents.forEach(function(ch){if(ch.part||!parts.length){parts.push({name:ch.part||'Chapters',chs:[]});PCLR.push(ch.color)}parts[parts.length-1].chs.push(ch)});
  $('topics').innerHTML=parts.map(function(pt,pi){
    var pr=0,pn=0,nt=0,curIn=false;
    var inner=pt.chs.map(function(ch){
      var ts=ch.topics.map(function(x){return tById[x.id]}).filter(Boolean),soon=ch.topics.filter(function(x){return !tById[x.id]});nt+=soon.length;
      var soonRows=soon.map(function(x){return '<div class="htp soon"><span class="tn">'+esc(x.no)+'</span><span class="tl">'+esc(x.title)+'<small>'+esc(x.sub||'')+'</small></span><span class="pc">Soon</span></div>'}).join('');
      if(!ts.length)return '<details class="hch ch'+ch.no+'"><summary class="shine"><span class="hn">'+ch.no+'</span><span class="ht"><b class="gtx">'+esc(ch.title)+'</b><small>'+soon.length+' topic'+(soon.length>1?'s':'')+' · coming soon</small></span><span class="hx">›</span><span class="tbar"><i style="width:0"></i></span></summary>'+soonRows+'</details>';
      var r=0,n=0;ts.forEach(function(t){r+=topicRead(t);n+=t.pages.length});pr+=r;pn+=n;nt+=ts.length;if(ch.no===curCh)curIn=true;
      return '<details class="hch ch'+ch.no+'"'+(ch.no===curCh?' open':'')+'><summary class="shine"><span class="hn">'+ch.no+'</span>'+
        '<span class="ht"><b class="gtx">'+esc(ch.title)+'</b><small>'+ts.length+' topic'+(ts.length>1?'s':'')+' · '+pct(r,n)+'% done</small></span>'+
        '<span class="hx">›</span><span class="tbar"><i style="width:'+pct(r,n)+'%"></i></span></summary>'+
        ts.map(function(t){var rr=topicRead(t),mm=topicMast(t),nn=t.pages.length;
          return '<button class="htp" type="button" data-p="'+t.p+'"><span class="tn">'+esc(t.no)+'</span><span class="tl">'+esc(t.title)+'<small>'+esc(t.sub)+'</small>'+(LOCKED&&!FREE[t.id]?'':tprog(rr,mm,nn))+'</span>'+(LOCKED&&!FREE[t.id]?'<span class="pc lkd" title="Subscribers only">🔒</span>':(LOCKED?'<span class="pc free">FREE</span>':(mm===nn?'<span class="pc ms" title="Mastered">★</span>':'<span class="pc'+(rr===nn?' ok':'')+'">'+(rr===nn?'✓':pct(rr,nn)+'%')+'</span>')))+'</button>'}).join('')+soonRows+
        '</details>'}).join('');
    if(!nt)return '';
    return '<details class="hpt"'+(curIn?' open':'')+'><summary class="shine" style="background-image:linear-gradient(90deg,rgba(6,27,36,.78) 0,rgba(6,27,36,.35) 50%,rgba(6,27,36,0) 75%),url(img/'+PIMG[pi]+'.jpg),linear-gradient(120deg,#08232f 0,'+(PCLR[pi]||'#13606b')+' 100%)">'+
      '<span class="pk">Part '+['I','II','III','IV','V'][pi]+'</span><b class="gtx">'+esc(pt.name)+'</b><small>'+pt.chs.length+' chapter'+(pt.chs.length>1?'s':'')+' · '+nt+' topics · '+pct(pr,pn)+'% done</small>'+
      '<span class="hx">›</span><span class="tbar"><i style="width:'+pct(pr,pn)+'%"></i></span></summary><div class="hpb">'+inner+'</div></details>'}).join('');
  if(deckIds.length)refreshDaily();else $('dailyBtn').hidden=true;
  var nn=0;Object.keys(HL).forEach(function(k){HL[k].forEach(function(h){if(h.n)nn++})});
  var tparts=[];if(nn)tparts.push(nn+' note'+(nn>1?'s':''));if(nh)tparts.push(nh+' highlight'+(nh>1?'s':''));
  if($('toolHl'))$('toolHl').textContent=tparts.length?tparts.join(' · '):'Select text while reading';
}
$('pill').textContent=META.pill;
$('contBtn').onclick=function(){goPage(lastPage())};
$('coverBtn').onclick=function(){goPage(0)};
if(LOCKED){$('trialCard').hidden=false;$('trialTxt').innerHTML=ACC.free_label?'بيفتح ليك '+freeList()+'، مع الـ <span class="en">flashcards</span> والـ <span class="en">QBank</span> بتاعته':freeList()+' كاملين، مع الـ <span class="en">flashcards</span> والـ <span class="en">QBank</span>'}
document.querySelector('.hero .cv').onclick=function(){goPage(0)};
/* Study tools: Rapid Review tile (owner) = each chapter's Rapid Review section */
(function(){var rv=META.contents.filter(function(ch){return ch.rv}),t=$('rrTool');if(!rv.length){t.hidden=true;return}
  $('toolRr').textContent=rv.length+' chapter'+(rv.length>1?'s':'')+' · last-minute revision';
  t.onclick=function(){openSheet('Rapid Review',rv.map(function(ch){var lk=LOCKED&&(ACC.free_chapters||[]).indexOf(ch.no)<0;
    return '<button class="trow rvt c'+ch.no+'" type="button" data-p="'+ch.rv+'"><span class="n">'+ch.no+'</span><span class="l">'+esc(ch.title)+'<small>Rapid Review</small></span><span class="p">'+(lk?'🔒':'p '+ch.rv)+'</span></button>'}).join(''))}})();

/* ---------- sheet: contents and highlights ---------- */
function openSheet(title,html){$('sheetT').textContent=title;$('sheetBody').innerHTML=html;$('sheet').hidden=false}
function contentsHtml(){return META.contents.map(function(ch){
  return (ch.part?'<div class="partx">'+esc(ch.part)+'</div>':'')+'<div class="sh" style="margin:14px 0 4px"><h3><small>Chapter '+ch.no+'</small> · '+esc(ch.title)+'</h3></div>'+ch.topics.map(function(t){
    if(!t.p)return '<div class="trow soon c'+ch.no+'"><span class="n">'+esc(t.no)+'</span><span class="l">'+esc(t.title)+'<small>Coming soon</small></span><span class="p"></span></div>';
    var tt=TOPICS.filter(function(x){return x.id===t.id})[0],ok=tt&&topicRead(tt)===tt.pages.length;
    return '<button class="trow c'+ch.no+'" type="button" data-p="'+t.p+'"><span class="n">'+esc(t.no)+'</span><span class="l">'+esc(t.title)+'<small>'+esc(t.sub||'')+'</small></span><span class="p'+(ok?' ok':'')+'">'+(ok?'✓ ':'')+'p '+t.p+'</span></button>'}).join('')+(ch.rv?'<button class="trow rvt" type="button" data-p="'+ch.rv+'"><span class="n">RR</span><span class="l">Rapid Review<small>All key points of the chapter</small></span><span class="p">p '+ch.rv+'</span></button>':'')}).join('')+
  (META.rr<=NP?'<button class="trow rvt" type="button" data-p="'+META.rr+'"><span class="n">RR</span><span class="l">Rapid review<small>Every clue → answer</small></span><span class="p">p '+META.rr+'</span></button>':'')}
$('tocBtn').onclick=function(){openSheet('Contents',contentsHtml())};
/* Notes and highlights are listed apart: tab Notes = everything with a note, tab Highlights = coloured highlights */
var HLTAB=st('hltab')==='h'?'h':'n';
function hlHtml(){var notes=[],hls=[];PAGES.forEach(function(p,i){(HL[PKEY[i]]||[]).forEach(function(h){var x={i:i,h:h};if(h.n)notes.push(x);if(h.c!=='n')hls.push(x)})});
  var list=HLTAB==='n'?notes:hls;
  var tabs='<div class="seg hltabs">'+[['n','Notes',notes.length],['h','Highlights',hls.length]].map(function(t){return '<button type="button" data-ht="'+t[0]+'" class="'+(HLTAB===t[0]?'on':'')+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></button>'}).join('')+'</div>';
  var empty=HLTAB==='n'?'No notes yet. In the reader, select text and tap <b>Note</b> to write one.':'No highlights yet. In the reader, select text and tap a colour.';
  return syncBar()+tabs+(list.length?list.map(function(x){var note=HLTAB==='n';return '<button class="hli'+(note?' isn':'')+'" type="button" data-p="'+(x.i+1)+'"><i class="'+x.h.c+'"></i><span><b>p '+(x.i+1)+' · '+esc(PAGES[x.i].label)+'</b>'+
    (note?'<em class="hn">'+esc(x.h.n)+'</em><span class="hq">“'+esc(x.h.t)+'”</span>':'<span>'+esc(x.h.t)+'</span>'+(x.h.n?'<em class="hn">✎ note</em>':''))+'</span></button>'}).join(''):'<p class="empty">'+empty+'</p>')}
document.addEventListener('click',function(e){var b=e.target.closest('[data-ht]');if(!b)return;HLTAB=b.dataset.ht;st('hltab',HLTAB);$('sheetBody').innerHTML=hlHtml()});
if($('hlTool'))$('hlTool').onclick=function(){openSheet('Notes & highlights',hlHtml())};
$('sheetX').onclick=function(){$('sheet').hidden=true};
$('sheet').addEventListener('click',function(e){if(e.target===$('sheet'))$('sheet').hidden=true;var r=e.target.closest('[data-p]');if(r){$('sheet').hidden=true;goPage(+r.dataset.p-1)}});

/* ---------- highlights ---------- */
function textNodes(sec){var w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode.closest('svg')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),a=[];while(w.nextNode())a.push(w.currentNode);return a}
function renderPage(i){var host=wraps[i].firstChild,sec=srcPages[i].cloneNode(true);host.innerHTML='';host.appendChild(sec);delete wraps[i].dataset.dec;
  (HL[PKEY[i]]||[]).forEach(function(h,k){wrapRange(sec,h.s,h.e,function(){var m=document.createElement('mark');m.className='uhl '+h.c+(h.uw?' uw'+h.uw:'')+(h.n?' hasn':'');m.dataset.k=k;return m});
    if(h.n){var ms=sec.querySelectorAll('mark.uhl[data-k="'+k+'"]'),last=ms[ms.length-1];if(last){var nm=document.createElement('span');nm.className='nm';nm.dataset.k=k;nm.title='Note';last.parentNode.insertBefore(nm,last.nextSibling)}}});if(Math.abs(i-lastCur)<=2)decorate(i)}
function wrapRange(sec,s,e,mk){var pos=0;textNodes(sec).forEach(function(n){var L=n.nodeValue.length,a=Math.max(s,pos),b=Math.min(e,pos+L);
  if(b>a&&n.nodeValue.slice(a-pos,b-pos).trim()){var r=document.createRange();r.setStart(n,a-pos);r.setEnd(n,b-pos);try{r.surroundContents(mk())}catch(err){}}pos+=L})}
function selOffsets(){var sel=window.getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;var rg=sel.getRangeAt(0);
  var pw=rg.commonAncestorContainer.nodeType===1?rg.commonAncestorContainer.closest('.pw'):rg.commonAncestorContainer.parentNode.closest('.pw');if(!pw)return null;
  var sec=pw.querySelector('section.page'),pos=0,s=-1,e=-1;
  textNodes(sec).forEach(function(n){var L=n.nodeValue.length;if(sel.containsNode(n,true)){var a=n===rg.startContainer?rg.startOffset:0,b=n===rg.endContainer?rg.endOffset:L;if(b>a){if(s<0)s=pos+a;e=pos+b}}pos+=L});
  if(s<0||e<=s)return null;var t=textNodes(sec).map(function(n){return n.nodeValue}).join('').slice(s,e).replace(/\s+/g,' ').trim();if(!t)return null;
  return {i:+pw.dataset.i,s:s,e:e,t:t}}
var pending=null,picked=null;
function hideBar(){$('hlbar').hidden=true;pending=null;if(picked){picked.el.forEach(function(m){m.classList.remove('sel')});picked=null}}
/* highlighter in the side rail: pick a colour and switch the pen on or off there. With the pen on, text is highlighted at once:
   mouse = select it; touch = swipe a finger sideways along the line (up/down still scrolls) or long-press a word.
   With the pen off, selecting text opens the colour bar as before. */
var HCOL=['y','g','p','b'],PCOL=HCOL.indexOf(st('pcol'))>=0?st('pcol'):'y',PEN=st('pen')==='1',NPEN=st('npen')==='1'&&st('pen')!=='1',FINE=window.matchMedia&&matchMedia('(pointer:fine)').matches,penDrag=null,penT=null,lastPT='';
/* the note pen works the same way: with it on, the text you select (or swipe / long-press) opens the note box at once.
   Only one pen is on at a time. */
/* underline: a third quick tool like the highlighter; it saves into the same highlights list with colours ur/uk/ub/uo */
var UCOLS=['ur','uk','ub','uo'],UHEX={ur:'#dc2626',uk:'#111827',ub:'#1d4ed8',uo:'#ea580c'},UCOL=UCOLS.indexOf(st('ucol'))>=0?st('ucol'):'ur',UW=Math.max(1,Math.min(3,+st('uw')||2)),UPEN=st('upen')==='1'&&!PEN&&!NPEN;
function isU(c){return c&&c.charAt(0)==='u'}
function penOn(){return PEN||NPEN||UPEN}
function penApply(o){if(NPEN){window.getSelection().removeAllRanges();hideBar();openNote(o.i,null,o)}else addHL(o,UPEN?UCOL:PCOL)}
function setPens(h,n,u){PEN=h;NPEN=n;UPEN=!!u;st('pen',h?'1':'0');st('npen',n?'1':'0');st('upen',u?'1':'0');if((h||n||u)&&INKON)setInk(false);if((h||n||u)&&TXON)setTx(false);updPen()}
function updPen(){var b=$('hlPen');b.classList.toggle('on',PEN);b.dataset.pc=PCOL;$('penLbl').textContent=PEN?'تظليل ✓':'تظليل';
  $('rNotes').classList.toggle('on',NPEN);var ub=$('ulBtn');ub.classList.toggle('on',UPEN);ub.dataset.uc=UCOL;$('ulLbl').textContent=UPEN?'خط ✓':'خط';$('nLbl').textContent=NPEN?'ملاحظات ✓':'ملاحظات';$('reader').classList.toggle('penon',penOn())}
function flyAt(f,btn){var r=btn.getBoundingClientRect(),R=$('reader').getBoundingClientRect();f.hidden=false;f.style.top=Math.max(8,Math.min(r.top-R.top+r.height/2-f.offsetHeight/2,R.height-f.offsetHeight-8))+'px'}
function noteFly(){var f=$('penFly');f.dataset.k='n';
  f.innerHTML='<b>الملاحظات</b><button type="button" class="ptog'+(NPEN?' on':'')+'" data-npen="1">'+(NPEN?'قلم الملاحظات شغّال · اضغط لإيقافو':'شغّل قلم الملاحظات')+'</button>'+
    '<button type="button" class="ptog" data-list="1" style="margin-top:8px">عرض كل الملاحظات والتظليل</button>'+
    '<small>'+(NPEN?(FINE?'حدّد أي كلام بالماوس ويفتح ليك مربّع الملاحظة طوالي.':'اسحب صباعك بالعرض على السطر، أو اضغط مطوّل على كلمة، ويفتح مربّع الملاحظة طوالي.'):'القلم مقفول: لمّا تحدّد كلام اضغط ✎ Note في الشريط التحت.')+'</small>';flyAt(f,$('rNotes'))}
function penFly(open){var f=$('penFly');if(!open){f.hidden=true;return}f.dataset.k='h';
  f.innerHTML='<b>لون التظليل</b><div class="pdots">'+HCOL.map(function(c){return '<button type="button" class="dot'+(c===PCOL?' cur':'')+'" data-pc="'+c+'" aria-label="colour"></button>'}).join('')+'</div>'+
    '<button type="button" class="ptog'+(PEN?' on':'')+'" data-pen="1">'+(PEN?'التظليل السريع شغّال · اضغط لإيقافو':'شغّل التظليل السريع')+'</button>'+
    '<small>'+(PEN?(FINE?'حدّد أي كلام بالماوس ويتظلّل طوالي.':'اسحب صباعك بالعرض على السطر، أو اضغط مطوّل على كلمة، ويتظلّل طوالي. السحب لفوق وتحت بيقلّب الصفحات عادي.'):'التظليل السريع مقفول: لمّا تحدّد كلام بيظهر شريط الألوان وتختار.')+'</small>';
  flyAt(f,$('hlPen'))}
$('hlPen').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='h')penFly(false);else penFly(true)};
function uwRow(attr,cur){return '<div class="isz uwr">'+[1,2,3].map(function(n){return '<button type="button" class="'+(n===cur?'cur':'')+'" '+attr+'="'+n+'"><i style="height:'+[2,3.5,6][n-1]+'px"></i>'+n+'</button>'}).join('')+'</div>'}
function ulFly(){var f=$('penFly');f.dataset.k='u';
  f.innerHTML='<b>خط تحت الكلام</b><div class="pdots">'+UCOLS.map(function(c){return '<button type="button" class="dot'+(c===UCOL?' cur':'')+'" data-uc="'+c+'" style="background:'+UHEX[c]+'" aria-label="colour"></button>'}).join('')+'</div>'+uwRow('data-uw',UW)+
    '<button type="button" class="ptog'+(UPEN?' on':'')+'" data-upen="1">'+(UPEN?'الخط السريع شغّال · اضغط لإيقافو':'شغّل الخط السريع')+'</button>'+
    '<small>'+(UPEN?(FINE?'حدّد أي كلمة أو جملة بالماوس ويتخط تحتها طوالي.':'اسحب صباعك بالعرض على السطر، أو اضغط مطوّل على كلمة، ويتخط تحتها طوالي.'):'مقفول: حدّد الكلام واضغط <b>U خط</b> في الشريط التحت.')+'</small>';flyAt(f,$('ulBtn'))}
$('ulBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='u')penFly(false);else ulFly()};
$('rNotes').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='n')penFly(false);else noteFly()};
$('penFly').addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('button');if(!b)return;
  if(b.dataset.pv!=null){setProg(+b.dataset.pv);penFly(false);return}
  if(b.dataset.ic){ICOL=b.dataset.ic;st('icol',ICOL);setInk(true);penFly(false);railTip('القلم شغّال: ارسم على الصفحة');return}
  if(b.dataset.isz){ISI=+b.dataset.isz;st('isz',ISI);if(!INKON)setInk(true);inkFly();return}
  if(b.dataset.ink){setInk(!INKON);penFly(false);railTip(INKON?'القلم شغّال: ارسم على الصفحة':'القلم مقفول');return}
  if(b.dataset.iu){inkUndo();return}if(b.dataset.ir){inkRedo();return}
  if(b.dataset.ic0){var ck=PKEY[currentPage()];if(INK[ck])inkDo({t:'del',k:ck,items:INK[ck].slice()});return}
  if(b.dataset.zs){zstep(b.dataset.zs==='1'?1.1:1/1.1);zoomFly();return}
  if(b.dataset.zm){setZoom(b.dataset.zm);penFly(false);return}
  if(b.dataset.zx){setZoom(String(Math.round(zbase()*b.dataset.zx*100)/100));zoomFly();return}
  if(b.dataset.list){penFly(false);openSheet('Notes & highlights',hlHtml());return}
  if(b.dataset.tc){TCOL=b.dataset.tc;st('tcol',TCOL);if(!TXON)setTx(true);else updTx();txFly();return}
  if(b.dataset.tsz){TSI=+b.dataset.tsz;st('tsz',TSI);if(!TXON)setTx(true);txFly();return}
  if(b.dataset.txon){setTx(!TXON);penFly(false);railTip(TXON?'النص شغّال: اضغط مكان النص في الصفحة':'النص مقفول');return}
  if(b.dataset.uw){UW=+b.dataset.uw;st('uw',UW);ulFly();return}
  if(b.dataset.uc){UCOL=b.dataset.uc;st('ucol',UCOL);setPens(false,false,true);penFly(false);railTip('الخط السريع شغّال: الكلام البتحدّدو يتخط تحتو طوالي');return}
  if(b.dataset.upen){setPens(false,false,!UPEN);penFly(false);railTip(UPEN?'الخط السريع شغّال: الكلام البتحدّدو يتخط تحتو طوالي':'الخط السريع مقفول');return}
  if(b.dataset.npen){setPens(false,!NPEN);penFly(false);railTip(NPEN?'قلم الملاحظات شغّال: حدّد كلام وتكتب ملاحظتك طوالي':'قلم الملاحظات مقفول');return}
  if(b.dataset.pc){PCOL=b.dataset.pc;st('pcol',PCOL);setPens(true,false)}else if(b.dataset.pen)setPens(!PEN,false);penFly(false);
  railTip(PEN?'التظليل السريع شغّال: الكلام البتحدّدو بيتظلّل طوالي':'التظليل السريع مقفول')});
document.addEventListener('click',function(e){if(!$('penFly').hidden&&!e.target.closest('#penFly'))penFly(false)});
$('scroller').addEventListener('scroll',function(){var f=$('penFly');if(!f.hidden&&f.dataset.k!=='z')penFly(false)},{passive:true});
function addHL(o,c){var id=PKEY[o.i],h={s:o.s,e:o.e,c:c,t:o.t.slice(0,240)};if(isU(c))h.uw=UW;(HL[id]=HL[id]||[]).push(h);saveHL();window.getSelection().removeAllRanges();hideBar();renderPage(o.i)}
function caretAt(x,y){if(document.caretRangeFromPoint)return document.caretRangeFromPoint(x,y);var p=document.caretPositionFromPoint&&document.caretPositionFromPoint(x,y);if(!p)return null;var r=document.createRange();r.setStart(p.offsetNode,p.offset);return r}
document.addEventListener('pointerdown',function(e){lastPT=e.pointerType},true);
pagesEl.addEventListener('mouseup',function(){if(!penOn()||NOTE||lastPT!=='mouse')return;setTimeout(function(){var o=selOffsets();if(o)penApply(o)},10)});
/* two fingers (pinch zoom, two-finger scroll) never mark text: a second finger cancels the swipe, and nothing is marked
   until a moment after the fingers lift (mtUntil) */
var mtUntil=0;function multiTouch(){return Date.now()<mtUntil}
document.addEventListener('touchstart',function(e){if(e.touches.length>1){mtUntil=Date.now()+800;clearTimeout(penT);if(penDrag){penDrag=null;window.getSelection().removeAllRanges()}}},{capture:true,passive:true});
document.addEventListener('touchend',function(e){if(e.touches.length>0||multiTouch())mtUntil=Date.now()+800},{capture:true,passive:true});
pagesEl.addEventListener('pointerdown',function(e){if(!penOn()||NOTE||e.pointerType==='mouse'||!e.isPrimary||multiTouch()||e.target.closest('mark.uhl,span.nm,.lko'))return;var c=caretAt(e.clientX,e.clientY);if(!c)return;penDrag={x:e.clientX,y:e.clientY,a:c,on:false}});
pagesEl.addEventListener('pointermove',function(e){if(!penDrag||!e.isPrimary)return;if(multiTouch()){penDrag=null;window.getSelection().removeAllRanges();return}
  if(!penDrag.on){var dx=Math.abs(e.clientX-penDrag.x),dy=Math.abs(e.clientY-penDrag.y);if(dy>12&&dy*2>=dx){penDrag=null;return}   // up/down = scrolling, not marking
    if(dx<16||dx<2*dy)return;penDrag.on=true}
  var c=caretAt(e.clientX,e.clientY);if(!c)return;var a=penDrag.a,r=document.createRange();
  try{if(a.compareBoundaryPoints(Range.START_TO_START,c)<=0){r.setStart(a.startContainer,a.startOffset);r.setEnd(c.startContainer,c.startOffset)}else{r.setStart(c.startContainer,c.startOffset);r.setEnd(a.startContainer,a.startOffset)}}catch(err){return}
  var s=getSelection();s.removeAllRanges();s.addRange(r)});
pagesEl.addEventListener('pointerup',function(){var d=penDrag;penDrag=null;if(d&&d.on){if(multiTouch()){window.getSelection().removeAllRanges();return}var o=selOffsets();if(o)penApply(o)}});
pagesEl.addEventListener('pointercancel',function(){penDrag=null});

/* ---------- drawing pen (قلم): free-hand ink on the page in red, black, blue or orange ----------
   Strokes are saved per page key in prr-ink as SVG points in page units (816 × 1152), so they scale with zoom.
   With the pen on: one finger / the mouse draws, two fingers scroll; links and words on the page do not react. */
var INK=stj('ink')||{},IHEX={r:'#dc2626',k:'#111827',b:'#1d4ed8',o:'#ea580c'},ICOLS=['r','k','b','o'],ICOL=ICOLS.indexOf(st('icol'))>=0?st('icol'):'r',INKON=false,ISZ=[2,4,6,9,13],ISI=Math.max(1,Math.min(5,+st('isz')||2)),inkS=null,inkPts={},inkPan=null;
/* each stroke has an id and u (time drawn); undo / clear leave tombstones in prr-inkdel so sync never brings a stroke back */
var INKDEL=stj('inkdel')||{};function rid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
(function(){var ch=false;Object.keys(INK).forEach(function(k){INK[k].forEach(function(x){if(!x.id){x.id=rid();x.u=0;ch=true}})});if(ch)stj('ink',INK)})();
function saveInk(){stj('ink',INK);stj('inkdel',INKDEL);if(typeof syncSoon==='function')syncSoon();gcommit()}
function inkApply(ink,del){if(JSON.stringify(ink)===JSON.stringify(INK)){INKDEL=del;stj('inkdel',INKDEL);return}
  var touched={};Object.keys(INK).concat(Object.keys(ink)).forEach(function(k){touched[k]=1});INK=ink;INKDEL=del;stj('ink',INK);stj('inkdel',INKDEL);
  Object.keys(touched).forEach(function(k){if(byKey[k]!==undefined)inkRender(byKey[k])})}
function inkSvg(pw,make){var svg=pw.querySelector('svg.ink');if(!svg&&make){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','ink');svg.setAttribute('viewBox','0 0 816 1152');svg.setAttribute('preserveAspectRatio','none');pw.appendChild(svg)}return svg}
/* item types: pen (t missing: free line), 'a' arrow, 'u' underline (straight, level), 't' text box */
var TFS=[10,12,15,19,23];   // text box sizes in page units (book text ≈ 13); size 2 = book text
function tfs(fs){var i=[14,18,24,30,38].indexOf(fs);return i>=0?TFS[i]:fs||TFS[1]}   // boxes made with the old, bigger sizes shrink too
function inkEl(x){var c=IHEX[x.c]||'#111827',w=x.w||3;
  if(x.t==='t'){var fs=tfs(x.fs);return '<text data-id="'+x.id+'" x="'+x.x+'" y="'+x.y+'" font-size="'+fs+'" fill="'+c+'" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="600">'+String(x.txt||'').split('\n').map(function(l,n){return '<tspan x="'+x.x+'" dy="'+(n?Math.round(fs*1.25):0)+'">'+(esc(l)||' ')+'</tspan>'}).join('')+'</text>'}
  if(x.t==='a'){var q=x.p.split(' ').map(function(v){return v.split(',').map(Number)}),a=q[0],b=q[q.length-1],g=Math.atan2(b[1]-a[1],b[0]-a[0]),h=10+w*2.2,
      L=[b[0]-h*Math.cos(g-.45),b[1]-h*Math.sin(g-.45)],R=[b[0]-h*Math.cos(g+.45),b[1]-h*Math.sin(g+.45)],e=[b[0]-h*.7*Math.cos(g),b[1]-h*.7*Math.sin(g)],f=function(v){return v.map(function(n){return Math.round(n*10)/10}).join(',')};
    return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+f(e).split(',')[0]+'" y2="'+f(e).split(',')[1]+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"/><polygon points="'+f(b)+' '+f(L)+' '+f(R)+'" fill="'+c+'" stroke="'+c+'" stroke-width="1" stroke-linejoin="round"/>'}
  return '<polyline points="'+x.p+'" stroke="'+c+'" stroke-width="'+w+'"'+(x.t==='u'?' stroke-linecap="butt" opacity=".85"':'')+'/>'}
function inkRender(i){var L=INK[PKEY[i]],svg=inkSvg(wraps[i],L&&L.length);if(!svg)return;svg.innerHTML=(L||[]).map(inkEl).join('')}
/* undo / redo: a history of this session's actions ({t:'add'|'del', k: page key, items}); every change still syncs */
var ITOOL=['p','a','u','e'].indexOf(st('itool'))>=0?st('itool'):'p',IHIST=[],IREDO=[];
function inkAdd(k,items){INK[k]=INK[k]||[];var now=Date.now();items.forEach(function(x){x.u=now;delete INKDEL[x.id];if(!INK[k].some(function(y){return y.id===x.id}))INK[k].push(x)})}
function inkDel(k,ids){var now=Date.now();INK[k]=(INK[k]||[]).filter(function(x){if(ids.indexOf(x.id)>=0){INKDEL[x.id]=now;return false}return true});if(!INK[k].length)delete INK[k]}
function inkDo(a,rec){if(a.t==='mod'){inkDel(a.k,a.del.map(function(x){return x.id}));inkAdd(a.k,a.add)}else if(a.t==='add')inkAdd(a.k,a.items);else inkDel(a.k,a.items.map(function(x){return x.id}));
  saveInk();if(byKey[a.k]!==undefined)inkRender(byKey[a.k]);updInkBar();updTxBar()}
/* ---------- undo / redo for everything done in the reader: highlights, underlines, notes, page progress, drawings, text boxes ----------
   After every change the whole state is compared with the last one; the previous state goes on the undo stack.
   Undo / redo restore a state as a normal change (new times, tombstones), so it syncs to the other device too. */
var GLAST=null,GH=[],GR=[],GMUTE=false;
function gsnap(){return JSON.stringify({h:HL,r:readSet,i:INK})}
function gcommit(){if(GMUTE||GLAST===null)return;var c=gsnap();if(c===GLAST)return;GH.push(GLAST);if(GH.length>60)GH.shift();GR=[];GLAST=c;updUR()}
function grestore(str){var o=JSON.parse(str),now=Date.now();GMUTE=true;
  var tk={};Object.keys(HL).concat(Object.keys(o.h)).forEach(function(k){tk[k]=1});HL=o.h;saveHL();
  Object.keys(readSet).concat(Object.keys(o.r)).forEach(function(k){if((readSet[k]||0)!==(o.r[k]||0))PROGU[k]=now});readSet=o.r;saveRead();
  var had={},has={};Object.keys(INK).forEach(function(k){tk[k]=1;INK[k].forEach(function(x){had[x.id]=1})});
  Object.keys(o.i).forEach(function(k){tk[k]=1;o.i[k].forEach(function(x){has[x.id]=1;if(!had[x.id]){x.u=now;delete INKDEL[x.id]}})});
  Object.keys(had).forEach(function(id){if(!has[id])INKDEL[id]=now});INK=o.i;saveInk();
  GMUTE=false;GLAST=gsnap();
  Object.keys(tk).forEach(function(k){var i=byKey[k];if(i!==undefined){renderPage(i);inkRender(i)}});
  if(!$('reader').hidden)updPr(currentPage());if(!$('home').hidden)refreshHome();TXP=null;TXMV=null;updUR()}
function inkUndo(){if(!GH.length){railTip('ما في حاجة ترجعها');return}GR.push(gsnap());grestore(GH.pop());railTip('↶ رجّعنا آخر خطوة')}
function inkRedo(){if(!GR.length){railTip('ما في حاجة تعيدها');return}GH.push(gsnap());grestore(GR.pop());railTip('↷ أعدنا الخطوة')}
function updUR(){var u=$('urUndo'),r=$('urRedo');if(u){u.disabled=!GH.length;r.disabled=!GR.length}updInkBar();updTxBar()}
$('urUndo').onclick=function(){inkUndo()};$('urRedo').onclick=function(){inkRedo()};
function segD(p,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function inkHit(x,p){var r=10+(x.w||3)/2;if(x.t==='t'){var fs=tfs(x.fs),ls=String(x.txt).split('\n'),wd=Math.max.apply(0,ls.map(function(l){return l.length}))*fs*.56;
    return p[0]>=x.x-r&&p[0]<=x.x+wd+r&&p[1]>=x.y-fs-r&&p[1]<=x.y+fs*1.25*(ls.length-1)+r}
  var q=x.p.split(' ').map(function(v){return v.split(',').map(Number)});if(q.length===1)return Math.hypot(p[0]-q[0][0],p[1]-q[0][1])<r;
  for(var n=0;n<q.length-1;n++)if(segD(p,q[n],q[n+1])<r)return true;return false}
Object.keys(INK).forEach(function(k){if(byKey[k]!==undefined)inkRender(byKey[k])});
function updInk(){var b=$('inkBtn');b.classList.toggle('on',INKON);updInkBar();b.dataset.ic=ICOL;$('inkLbl').textContent=INKON?'قلم ✓':'قلم';$('reader').classList.toggle('inkon',INKON)}
function setInk(on){INKON=on;if(on&&(PEN||NPEN||UPEN))setPens(false,false);if(on&&TXON)setTx(false);updInk()}
/* tool bar shown while the pen is on: free pen, arrow, underline, text box, eraser · undo · redo · close */
var IB=document.createElement('div');IB.className='inkbar';IB.id='inkBar';IB.lang='ar';IB.hidden=true;$('reader').appendChild(IB);
var ITL=[['p','قلم','<path d="M17 3l4 4L8 20H4v-4z"/>'],['a','سهم','<path d="M5 19L19 5M10 5h9v9"/>'],['u','خط تحت','<path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>'],['e','ممحاة','<path d="M20 20H9L4 15a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-7 7"/><path d="M8 11l6 6"/>']];
function updInkBar(){IB.hidden=!INKON;if(!INKON)return;
  IB.innerHTML=ITL.map(function(x){return '<button type="button" class="'+(ITOOL===x[0]?'cur':'')+'" data-itl="'+x[0]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+x[2]+'</svg><span>'+x[1]+'</span></button>'}).join('')+
    '<i class="sep"></i><button type="button" data-iun="1"'+(GH.length?'':' disabled')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg><span>تراجع</span></button>'+
    '<button type="button" data-ire="1"'+(GR.length?'':' disabled')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></svg><span>إعادة</span></button>'+
    '<button type="button" class="ix" data-ix="1" aria-label="اقفل القلم">✕</button>'}
IB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.itl){ITOOL=b.dataset.itl;st('itool',ITOOL);inkTxt(false);updInkBar();railTip({p:'ارسم بحرّية',a:'اسحب عشان ترسم سهم',u:'اسحب على السطر عشان تخط تحتو',e:'امسح بالضغط أو السحب على الرسمة'}[ITOOL])}
  else if(b.dataset.iun)inkUndo();else if(b.dataset.ire)inkRedo();else if(b.dataset.ix){setInk(false);railTip('القلم مقفول')}});
/* ---------- text boxes (نص): a separate rail tool. With it on: tap the page to write; tap a text to edit, move or delete it
   (on a computer a text can also be dragged). Colour and size in its panel and in the writing box. Saved with the drawings. */
var TXON=false,TCOL=ICOLS.indexOf(st('tcol'))>=0?st('tcol'):'k',TSI=Math.max(1,Math.min(5,+st('tsz')||2)),TXP=null,TXMV=null;
function setTx(on){TXON=on;if(on&&(PEN||NPEN||UPEN))setPens(false,false);if(on&&INKON)setInk(false);if(!on){inkTxt(false);TXP=null;TXMV=null}updTx()}
function updTx(){var b=$('txtBtn');b.classList.toggle('on',TXON);b.dataset.ic=TCOL;$('txtLbl').textContent=TXON?'نص ✓':'نص';$('reader').classList.toggle('txon',TXON);updTxBar()}
function tdots(attr,cur){return ICOLS.map(function(c){return '<button type="button" class="dot'+(c===cur?' cur':'')+'" '+attr+'="'+c+'" style="background:'+IHEX[c]+'" aria-label="colour"></button>'}).join('')}
function tsizes(attr,cur){return '<div class="isz tsz">'+TFS.map(function(f,n){return '<button type="button" class="'+(n+1===cur?'cur':'')+'" '+attr+'="'+(n+1)+'"><b style="font-size:'+(9+n*3)+'px">ع</b>'+(n+1)+'</button>'}).join('')+'</div>'}
function txFly(){var f=$('penFly');f.dataset.k='x';
  f.innerHTML='<b>مربّع النص</b><div class="pdots">'+tdots('data-tc',TCOL)+'</div>'+tsizes('data-tsz',TSI)+
    '<button type="button" class="ptog'+(TXON?' on':'')+'" data-txon="1">'+(TXON?'النص شغّال · اضغط لإيقافو':'شغّل النص')+'</button>'+
    '<small>اضغط أي مكان في الصفحة واكتب. اضغط على نص مكتوب عشان تعدّلو أو تحرّكو أو تمسحو.</small>';flyAt(f,$('txtBtn'))}
$('txtBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='x')penFly(false);else txFly()};
/* bar while the text tool is on: undo · redo · close, or for a tapped text: edit · move · delete */
var TB=document.createElement('div');TB.className='inkbar';TB.id='txBar';TB.lang='ar';TB.hidden=true;$('reader').appendChild(TB);
function tbtn(a,label,path,dis){return '<button type="button" data-tb="'+a+'"'+(dis?' disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg><span>'+label+'</span></button>'}
function updTxBar(){TB.hidden=!TXON;if(!TXON)return;
  TB.innerHTML=TXP?tbtn('edit','تعديل','<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')+tbtn('move','تحريك','<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>')+
      tbtn('del','حذف','<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>')+'<button type="button" class="ix" data-tb="x" aria-label="رجوع">✕</button>'
    :'<span class="tbl">'+(TXMV?'اضغط المكان الجديد للنص':'اضغط مكان النص')+'</span>'+tbtn('undo','تراجع','<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',!GH.length)+tbtn('redo','إعادة','<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',!GR.length)+
      '<button type="button" class="ix" data-tb="off" aria-label="اقفل النص">✕</button>'}
function txPick(i,it){TXP=it?{i:i,it:it}:null;TXMV=null;inkRender(i);if(it){var el=wraps[i].querySelector('svg.ink text[data-id="'+it.id+'"]');if(el)el.classList.add('sel')}updTxBar()}
TB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var a=b.dataset.tb,P=TXP;
  if(a==='undo')inkUndo();else if(a==='redo')inkRedo();else if(a==='off'){setTx(false);railTip('النص مقفول')}
  else if(a==='x')txPick(P.i,null);
  else if(a==='edit'){txPick(P.i,null);inkTxt({i:P.i,edit:P.it})}
  else if(a==='del'){txPick(P.i,null);inkDo({t:'del',k:PKEY[P.i],items:[P.it]})}
  else if(a==='move'){TXMV=P;TXP=null;updTxBar();railTip('اضغط المكان الجديد للنص')}
  updTxBar()});
/* the writing box: text + its own colour and size */
var ITX=document.createElement('div');ITX.className='itx';ITX.lang='ar';ITX.hidden=true;$('reader').appendChild(ITX);
var ITXAT=null;
function itxRows(){var a=ITXAT;ITX.querySelector('.irow').innerHTML='<div class="pdots">'+tdots('data-xc',a.c)+'</div>'+tsizes('data-xs',TFS.indexOf(a.fs)+1);var ta=ITX.querySelector('textarea');ta.style.color=IHEX[a.c]}
function inkTxt(at){ITXAT=at||null;ITX.hidden=!at;if(!at)return;
  at.c=at.edit?at.edit.c:TCOL;at.fs=at.edit?tfs(at.edit.fs):TFS[TSI-1];
  ITX.innerHTML='<div class="irow"></div><textarea rows="3" maxlength="400" placeholder="اكتب هنا…"></textarea><div class="iact"><button type="button" data-ok="1">حفظ</button>'+(at.edit?'<button type="button" data-del="1">حذف</button>':'')+'<button type="button" data-no="1">إلغاء</button></div>';
  itxRows();var ta=ITX.querySelector('textarea');ta.value=at.edit?at.edit.txt:'';setTimeout(function(){ta.focus()},30)}
ITX.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!ITXAT)return;var a=ITXAT;
  if(b.dataset.xc){a.c=b.dataset.xc;itxRows();return}if(b.dataset.xs){a.fs=TFS[+b.dataset.xs-1];itxRows();return}
  var v=ITX.querySelector('textarea').value.replace(/\s+$/,''),k=PKEY[a.i];inkTxt(false);
  if(b.dataset.del&&a.edit){inkDo({t:'del',k:k,items:[a.edit]});return}
  if(!b.dataset.ok)return;
  if(a.edit){if(!v.trim()){inkDo({t:'del',k:k,items:[a.edit]});return}if(v===a.edit.txt&&a.c===a.edit.c&&a.fs===a.edit.fs)return;
    inkDo({t:'mod',k:k,del:[a.edit],add:[Object.assign({},a.edit,{id:rid(),txt:v,c:a.c,fs:a.fs})]});return}
  if(v.trim())inkDo({t:'add',k:k,items:[{id:rid(),t:'t',c:a.c,fs:a.fs,x:a.p[0],y:Math.round(a.p[1]+a.fs*.8),txt:v}]})});
function inkFly(){var f=$('penFly');f.dataset.k='i';
  f.innerHTML='<b>القلم</b><div class="pdots">'+ICOLS.map(function(c){return '<button type="button" class="dot'+(c===ICOL?' cur':'')+'" data-ic="'+c+'" style="background:'+IHEX[c]+'" aria-label="colour"></button>'}).join('')+'</div>'+
    '<div class="isz">'+ISZ.map(function(w,n){return '<button type="button" class="'+(n+1===ISI?'cur':'')+'" data-isz="'+(n+1)+'" aria-label="size '+(n+1)+'"><i style="width:'+(w+3)+'px;height:'+(w+3)+'px;background:'+IHEX[ICOL]+'"></i>'+(n+1)+'</button>'}).join('')+'</div>'+
    '<button type="button" class="ptog'+(INKON?' on':'')+'" data-ink="1">'+(INKON?'القلم شغّال · اضغط لإيقافو':'شغّل القلم')+'</button>'+
    '<div class="zrow" style="margin-top:8px"><button type="button" class="ptog" data-iu="1">↶ تراجع</button><button type="button" class="ptog" data-ir="1">↷ إعادة</button><button type="button" class="ptog" data-ic0="1">مسح الصفحة</button></div>'+
    '<small>'+(FINE?'اختار الأداة من الشريط التحت: قلم، سهم، خط تحت، نص أو ممحاة. اقفل القلم عشان تحدّد كلام أو تضغط الروابط.':'اختار الأداة من الشريط التحت. ارسم بصباع واحد، وقلّب الصفحات بصباعين.')+'</small>';flyAt(f,$('inkBtn'))}
$('inkBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='i')penFly(false);else inkFly()};
function inkXY(pw,e){var r=pw.getBoundingClientRect();return [Math.round((e.clientX-r.left)*816/r.width),Math.round((e.clientY-r.top)*1152/r.height)]}
function inkMid(){var a=Object.keys(inkPts).map(function(k){return inkPts[k]});return [(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2]}
pagesEl.addEventListener('pointerdown',function(e){if(!INKON&&!TXON)return;var pw=e.target.closest('.pw');if(!pw||pw.classList.contains('lk'))return;if(INKON||e.pointerType==='mouse')e.preventDefault();
  inkPts[e.pointerId]=[e.clientX,e.clientY];try{pw.setPointerCapture(e.pointerId)}catch(err){}
  if(Object.keys(inkPts).length>=2){if(inkS){if(inkS.el)inkS.el.remove();if(inkS.t==='e')inkEraseEnd(inkS);inkS=null}if(INKON)inkPan=inkMid();return}
  var i=+pw.dataset.i,p=inkXY(pw,e),NS='http://www.w3.org/2000/svg';
  if(TXON){var hitT=(INK[PKEY[i]]||[]).filter(function(x){return x.t==='t'&&inkHit(x,p)}).pop();
    inkS={t:'t',i:i,pw:pw,a:p,x:e.clientX,y:e.clientY,item:hitT,o:hitT?[hitT.x,hitT.y]:null,mouse:e.pointerType==='mouse'};return}
  if(ITOOL==='e'){inkS={t:'e',i:i,pw:pw,items:[],p0:p,t0:Date.now()};return}   // erase only after a moment, so the first finger of a pinch erases nothing
  var g=document.createElementNS(NS,'g');inkSvg(pw,true).appendChild(g);inkS={t:ITOOL,i:i,pw:pw,el:g,pts:[p]};inkPreview(inkS)});
function inkPreview(s){var pts=s.t==='p'?s.pts:[s.pts[0],s.pts[s.pts.length-1]];s.el.innerHTML=inkEl({t:s.t==='p'?undefined:s.t,c:ICOL,w:ISZ[ISI-1],p:pts.map(function(q){return q.join(',')}).join(' ')})}
function inkErase(s,p){var k=PKEY[s.i],hit=(INK[k]||[]).filter(function(x){return inkHit(x,p)});if(!hit.length)return;s.items=s.items.concat(hit);inkDel(k,hit.map(function(x){return x.id}));inkRender(s.i)}
function inkEraseEnd(s){if(!s.items.length)return;saveInk()}
pagesEl.addEventListener('pointermove',function(e){if((!INKON&&!TXON)||!inkPts[e.pointerId])return;inkPts[e.pointerId]=[e.clientX,e.clientY];
  if(inkPan&&Object.keys(inkPts).length>=2){var m=inkMid(),sc=$('scroller');sc.scrollTop-=m[1]-inkPan[1];sc.scrollLeft-=m[0]-inkPan[0];inkPan=m;return}
  if(!inkS)return;var p=inkXY(inkS.pw,e);
  if(inkS.t==='t'){if(Math.abs(e.clientX-inkS.x)+Math.abs(e.clientY-inkS.y)>8)inkS.moved=true;
    if(inkS.item&&inkS.moved&&inkS.mouse){inkS.item.x=inkS.o[0]+p[0]-inkS.a[0];inkS.item.y=inkS.o[1]+p[1]-inkS.a[1];inkRender(inkS.i)}return}
  if(inkS.t==='e'){if(Date.now()-inkS.t0<150)return;if(inkS.p0){inkErase(inkS,inkS.p0);inkS.p0=null}inkErase(inkS,p);return}
  if(inkS.t==='u')p[1]=inkS.pts[0][1];
  if(inkS.t==='p'){var l=inkS.pts[inkS.pts.length-1];if(Math.abs(p[0]-l[0])+Math.abs(p[1]-l[1])<2)return;inkS.pts.push(p)}else inkS.pts[1]=p;inkPreview(inkS)});
function inkEnd(e){if(!inkPts[e.pointerId])return;delete inkPts[e.pointerId];if(!Object.keys(inkPts).length)inkPan=null;if(!inkS)return;var s=inkS;inkS=null;
  if(s.t==='t'){var it=s.item;
    if(it&&s.moved&&s.mouse){var nx=it.x,ny=it.y;it.x=s.o[0];it.y=s.o[1];TXP=null;inkDo({t:'mod',k:PKEY[s.i],del:[Object.assign({},it)],add:[Object.assign({},it,{id:rid(),x:nx,y:ny})]});return}
    if(s.moved||e.type!=='pointerup')return;
    if(TXMV){var M=TXMV,mi=M.it;TXMV=null;if(M.i!==s.i){railTip('حرّك النص جوّه نفس الصفحة');updTxBar();return}
      inkDo({t:'mod',k:PKEY[s.i],del:[mi],add:[Object.assign({},mi,{id:rid(),x:s.a[0],y:Math.round(s.a[1]+mi.fs*.8)})]});return}
    if(it){txPick(s.i,it);return}if(TXP){txPick(TXP.i,null);return}inkTxt({i:s.i,p:s.a});return}
  if(s.t==='e'){if(s.p0&&e.type==='pointerup')inkErase(s,s.p0);inkEraseEnd(s);return}
  var pts=s.t==='p'?s.pts:[s.pts[0],s.pts[s.pts.length-1]],a=pts[0],b=pts[pts.length-1];s.el.remove();
  if(pts.length<2||(s.t!=='p'&&Math.hypot(b[0]-a[0],b[1]-a[1])<8)){inkRender(s.i);return}
  var it={id:rid(),c:ICOL,w:ISZ[ISI-1],p:pts.map(function(q){return q.join(',')}).join(' ')};if(s.t!=='p')it.t=s.t;inkDo({t:'add',k:PKEY[s.i],items:[it]})}
pagesEl.addEventListener('pointerup',inkEnd);pagesEl.addEventListener('pointercancel',inkEnd);
updInk();
updTx();
updPen();
function colDots(attr,list,cur){return (list||HCOL).map(function(c){return '<button class="dot'+(c===(cur||PCOL)?' cur':'')+'" type="button" '+attr+'="'+c+'" aria-label="colour"></button>'}).join('')}
function showPalette(){$('hlbar').innerHTML='<span class="lbl">Highlight</span>'+colDots('data-c')+'<button class="txt ul" type="button" data-ul="1"><u style="text-decoration-color:'+UHEX[UCOL]+'">U</u> خط</button><button class="txt nb" type="button" data-n="1">✎ Note</button><button class="txt" type="button" data-x="1">✕</button>';$('hlbar').hidden=false}
document.addEventListener('selectionchange',function(){if($('reader').hidden)return;clearTimeout(document._hs);document._hs=setTimeout(function(){var o=selOffsets();if(o){if(penOn()&&!NOTE){if(lastPT!=='mouse'&&!penDrag&&!multiTouch()){clearTimeout(penT);penT=setTimeout(function(){var o2=selOffsets();if(o2&&!penDrag&&!NOTE&&!multiTouch())penApply(o2)},500)}return}if(picked)hideBar();pending=o;showPalette()}else if(pending){hideBar()}},250)});
function pickHL(m){var i=+m.closest('.pw').dataset.i,k=+m.dataset.k;hideBar();picked={i:i,k:k,el:[].slice.call(wraps[i].querySelectorAll('mark.uhl[data-k="'+k+'"]'))};
  picked.el.forEach(function(x){x.classList.add('sel')});
  var pc=(HL[PKEY[i]][k]||{}).c;var ph=HL[PKEY[i]][k]||{};$('hlbar').innerHTML=(isU(pc)?colDots('data-cc',UCOLS,pc)+'<span class="uwp">'+[1,2,3].map(function(n){return '<button type="button" class="txt'+((ph.uw||2)===n?' cur':'')+'" data-cw="'+n+'">'+n+'</button>'}).join('')+'</span>':colDots('data-cc',HCOL,pc))+'<button class="txt" type="button" data-rm="1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>Remove</button><button class="txt nb" type="button" data-an="1">✎ Note</button><button class="txt" type="button" data-x="1">✕</button>';$('hlbar').hidden=false}
$('hlbar').addEventListener('mousedown',function(e){e.preventDefault()});
$('hlbar').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.ul&&pending){addHL(pending,UCOL)}
  else if(b.dataset.c&&pending){PCOL=b.dataset.c;st('pcol',PCOL);updPen();addHL(pending,PCOL)}
  else if(b.dataset.cw&&picked){var wid=PKEY[picked.i],wi=picked.i;HL[wid][picked.k].uw=+b.dataset.cw;saveHL();picked=null;hideBar();renderPage(wi)}
  else if(b.dataset.cc&&picked){var cid=PKEY[picked.i],ci=picked.i;HL[cid][picked.k].c=b.dataset.cc;saveHL();picked=null;hideBar();renderPage(ci)}
  else if(b.dataset.n&&pending){var o=pending;window.getSelection().removeAllRanges();hideBar();openNote(o.i,null,o)}
  else if(b.dataset.an&&picked){var pi=picked.i,pk=picked.k;hideBar();openNote(pi,pk,null,true)}
  else if(b.dataset.rm&&picked){var pid=PKEY[picked.i];HL[pid].splice(picked.k,1);if(!HL[pid].length)delete HL[pid];saveHL();var j=picked.i;picked=null;hideBar();renderPage(j)}
  else hideBar()});
PAGES.forEach(function(p,i){if(HL[PKEY[i]])renderPage(i)});

/* ---------- notes: a small box to write a note on selected text; the note stays as a ✎ mark beside it ---------- */
var nbox=document.createElement('div');nbox.className='nbox';nbox.hidden=true;nbox.innerHTML='<div class="nh"><b>Note</b><span class="nq"></span></div><div class="nv"></div><textarea rows="4" placeholder="Write your note…"></textarea><div class="nact"></div>';
document.body.appendChild(nbox);var NOTE=null;
function openNote(i,k,sel,forceEdit){var key=PKEY[i],h=k!=null?(HL[key]||[])[k]:null;if(k!=null&&!h)return;hideBar();
  NOTE={i:i,k:k,sel:sel};var q=(h?h.t:sel.t)||'';nbox.querySelector('.nq').textContent='“'+(q.length>70?q.slice(0,70)+'…':q)+'”';
  var view=h&&h.n&&!forceEdit,ta=nbox.querySelector('textarea'),nv=nbox.querySelector('.nv');
  nv.hidden=!view;ta.hidden=view;nv.textContent=view?h.n:'';ta.value=h&&h.n?h.n:'';
  nbox.querySelector('.nact').innerHTML=view?'<button type="button" data-a="del" class="ndel">Delete</button><button type="button" data-a="edit">Edit</button><button type="button" data-a="close" class="nok">Close</button>'
    :(h&&h.n?'<button type="button" data-a="del" class="ndel">Delete</button>':'')+'<button type="button" data-a="close">Cancel</button><button type="button" data-a="save" class="nok">Save</button>';
  nbox.hidden=false;placeNote();if(!view)setTimeout(function(){ta.focus();placeNote()},60)}
/* keep the note box in the visible part of the screen, above the keyboard */
function placeNote(){if(nbox.hidden)return;var vv=window.visualViewport;nbox.style.top=((vv?vv.offsetTop:0)+64)+'px'}
if(window.visualViewport){visualViewport.addEventListener('resize',placeNote);visualViewport.addEventListener('scroll',placeNote)}
nbox.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!NOTE)return;var a=b.dataset.a,key=PKEY[NOTE.i],list=HL[key]=HL[key]||[];
  if(a==='edit'){openNote(NOTE.i,NOTE.k,null,true);return}
  if(a==='save'){var txt=nbox.querySelector('textarea').value.trim();if(!txt){nbox.hidden=true;NOTE=null;if(!list.length)delete HL[key];return}
    if(NOTE.k!=null)list[NOTE.k].n=txt.slice(0,1000);else list.push({s:NOTE.sel.s,e:NOTE.sel.e,c:'n',t:NOTE.sel.t.slice(0,240),n:txt.slice(0,1000)});saveHL();renderPage(NOTE.i)}
  if(a==='del'&&NOTE.k!=null){var h=list[NOTE.k];if(h.c==='n')list.splice(NOTE.k,1);else delete h.n;if(!list.length)delete HL[key];saveHL();renderPage(NOTE.i)}
  if(!list.length)delete HL[key];nbox.hidden=true;NOTE=null});

/* ---------- sync: highlights and notes shared by the devices of one activation code ----------
   Each highlight has an id (page key + start + end) and u = time of its last change; deletions are kept as
   tombstones (HLDEL id → time). Merging keeps the newest of each, so two devices never undo each other.
   Page progress travels too: prog = {page key: [0 not read | 1 done | 2 mastered, time of change]}, newest wins. */
var HLDEL=stj('hldel')||{};
function hid(k,h){return k+'|'+h.s+'|'+h.e+(isU(h.c)?'|u':'')}   // an underline and a highlight on the same words are two items
function hsnap(){var o={};Object.keys(HL).forEach(function(k){HL[k].forEach(function(h){o[hid(k,h)]=(h.c||'')+'\u0001'+(h.n||'')+'\u0001'+(h.uw||'')})});return o}
var HLPREV=hsnap();
function saveHL(){var now=Date.now(),cur=hsnap();
  Object.keys(HL).forEach(function(k){HL[k].forEach(function(h){var id=hid(k,h);if(HLPREV[id]!==cur[id]){h.u=now;delete HLDEL[id]}})});
  Object.keys(HLPREV).forEach(function(id){if(cur[id]===undefined)HLDEL[id]=now});
  HLPREV=cur;stj('hl',HL);stj('hldel',HLDEL);syncSoon();gcommit()}
function hlMerge(a,b){var items={},del={},out={},cut=Date.now()-180*864e5;
  [a,b].forEach(function(x){if(!x)return;Object.keys(x.del||{}).forEach(function(id){if(x.del[id]>(del[id]||0))del[id]=x.del[id]});
    Object.keys(x.hl||{}).forEach(function(k){(x.hl[k]||[]).forEach(function(h){var id=hid(k,h),o=items[id];if(!o||(h.u||0)>(o.h.u||0))items[id]={k:k,h:h}})})});
  Object.keys(items).forEach(function(id){var x=items[id];if(del[id]>=(x.h.u||0))return;delete del[id];(out[x.k]=out[x.k]||[]).push(x.h)});
  Object.keys(out).forEach(function(k){out[k].sort(function(x,y){return x.s-y.s||x.e-y.e})});
  Object.keys(del).forEach(function(id){if(del[id]<cut)delete del[id]});
  var pg={};[a,b].forEach(function(x){if(!x||!x.prog)return;Object.keys(x.prog).forEach(function(k){var v=x.prog[k],o=pg[k];if(!o||v[1]>o[1]||(v[1]===o[1]&&v[0]>o[0]))pg[k]=v})});
  Object.keys(pg).forEach(function(k){if(!pg[k][0]&&pg[k][1]<cut)delete pg[k]});
  var it={},idel={};[a,b].forEach(function(x){if(!x)return;Object.keys(x.idel||{}).forEach(function(id){if(x.idel[id]>(idel[id]||0))idel[id]=x.idel[id]});
    Object.keys(x.ink||{}).forEach(function(k){(x.ink[k]||[]).forEach(function(st){if(st.id&&!it[st.id])it[st.id]={k:k,s:st}})})});
  var ink={};Object.keys(it).forEach(function(id){var x=it[id];if(idel[id]>=(x.s.u||0))return;(ink[x.k]=ink[x.k]||[]).push(x.s)});
  Object.keys(ink).forEach(function(k){ink[k].sort(function(x,y){return (x.u||0)-(y.u||0)||(x.id<y.id?-1:1)})});
  Object.keys(idel).forEach(function(id){if(idel[id]<cut)delete idel[id]});
  return {hl:out,del:del,prog:pg,ink:ink,idel:idel,sm:smMerge(a&&a.sm,b&&b.sm,cut)}}
function progData(){var o={};Object.keys(readSet).concat(Object.keys(PROGU)).forEach(function(k){o[k]=[readSet[k]||0,PROGU[k]||0]});return o}
function progApply(pg){var r={},u={};Object.keys(pg).forEach(function(k){if(pg[k][0])r[k]=pg[k][0];u[k]=pg[k][1]});
  if(JSON.stringify(r)===JSON.stringify(readSet))return;readSet=r;PROGU=u;stj('prog',readSet);stj('progu',PROGU);
  if(!$('home').hidden)refreshHome();if(!$('reader').hidden)updPr(currentPage())}
var SYNC=!LOCKED&&SRV!=null&&!!st('code'),syncing=false,syncAgain=false,syncT=null,syncErr='';
function syncSoon(){if(!SYNC)return;clearTimeout(syncT);syncT=setTimeout(function(){syncNow()},4000)}
function syncPost(body){body.code=st('code');body.dev=DEV;body.token=st('act');
  return fetch(SRV.replace(/\/$/,'')+'/sync',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()})}
function hlApply(m){progApply(m.prog||{});smApply(m.sm||{});inkApply(m.ink||{},m.idel||{});var before=JSON.stringify(HL);if(JSON.stringify(m.hl)===before&&JSON.stringify(m.del)===JSON.stringify(HLDEL))return;
  var touched={};Object.keys(HL).concat(Object.keys(m.hl)).forEach(function(k){touched[k]=1});
  HL=m.hl;HLDEL=m.del;HLPREV=hsnap();stj('hl',HL);stj('hldel',HLDEL);
  Object.keys(touched).forEach(function(k){if(byKey[k]!==undefined)renderPage(byKey[k])});
  if(!$('home').hidden)refreshHome();if(!$('sheet').hidden&&$('syncBar'))$('sheetBody').innerHTML=hlHtml()}
function syncNow(tries){if(!SYNC||navigator.onLine===false)return Promise.resolve();
  if(syncing){syncAgain=true;return Promise.resolve()}
  if(NOTE||pending||picked){syncSoon();return Promise.resolve()}      // the student is busy with a highlight: sync a bit later
  syncing=true;syncErr='';showSync();
  return syncPost({}).then(function(j){if(!j||!j.ok)throw j||{};
      var m=hlMerge({hl:HL,del:HLDEL,prog:progData(),ink:INK,idel:INKDEL,sm:smData()},j.data);hlApply(m);GLAST=gsnap();
      if(JSON.stringify(m)===JSON.stringify(j.data))return j;
      return syncPost({ver:j.ver,data:m}).then(function(w){if(w&&w.reason==='stale'&&(tries||0)<3){syncing=false;return syncNow((tries||0)+1)}if(!w||!w.ok)throw w||{};return w})})
    .then(function(){st('synced',Date.now())})
    .catch(function(e){syncErr=e&&e.reason?e.reason:'net';if(/^(off|reset|unknown|token)$/.test(syncErr))SYNC=false})
    .then(function(){syncing=false;showSync();if(syncAgain){syncAgain=false;syncSoon()}})}
function ago(t){var m=Math.round((Date.now()-t)/6e4);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'}
function syncBar(){var t=+st('synced')||0,msg,btn='';
  if(SYNC){msg=syncing?'Syncing…':syncErr==='net'?'Not synced: no internet. It syncs again when you are online.':syncErr==='big'?'Not synced: too much saved (mostly drawings). Clear some drawings and try again.':syncErr?'Not synced. Try again later.':t?'Synced with your other device · '+ago(t):'Not synced yet';btn='<button type="button" class="chip" id="syncGo"'+(syncing?' disabled':'')+'>Sync now</button>'}
  else if(LOCKED)msg='After you subscribe, your notes, highlights, drawings, progress, flashcards and QBank results sync between your two devices.';
  else if(SRV==null)msg='Sync works when the book is opened from its own link.';
  else msg='Sync stopped: this device is no longer active for the code.';
  return '<div class="syncb" id="syncBar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 9.5 4 4 0 0 0 7 19z"/>'+(SYNC&&!syncErr?'<path d="M9.5 14l2 2 3.5-4"/>':'')+'</svg><span>'+msg+'</span>'+btn+'</div>'}
function showSync(){var b=$('syncBar');if(b)b.outerHTML=syncBar()}
document.addEventListener('click',function(e){if(e.target.closest('#syncGo'))syncNow()});
if(SYNC){setTimeout(function(){syncNow()},1500);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')syncNow();else if(syncT){clearTimeout(syncT);syncNow()}});
  window.addEventListener('online',function(){syncNow()})}

/* ---------- definitions: hover (computer) or tap (phone) an abbreviation or a medical word ---------- */
var TM=META.terms||{ab:[],gl:[]},TAB={},TGL={};
function rx(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function gnorm(s){return s.toLowerCase().replace(/[’`]/g,"'").replace(/[–—]/g,'-').replace(/\s+/g,' ')}
TM.ab.forEach(function(r,i){r[0].forEach(function(f){if(TAB[f]===undefined)TAB[f]=i;else if([].concat(TAB[f]).indexOf(i)<0)TAB[f]=[].concat(TAB[f],i)})});
TM.gl.forEach(function(r,i){r[0].forEach(function(f){TGL[gnorm(f)]=i})});
function alts(keys,fn){return keys.sort(function(a,b){return b.length-a.length}).map(fn).join('|')}
var AB_RE=Object.keys(TAB).length?new RegExp('(^|[^A-Za-z0-9])('+alts(Object.keys(TAB),rx)+')(s?)(?![A-Za-z0-9₀-₉⁺⁻])','g'):null;
var GL_RE=Object.keys(TGL).length?new RegExp('(^|[^A-Za-z])('+alts(Object.keys(TGL),function(f){return rx(f).replace(/'/g,"['’]").replace(/-/g,'[-–]').replace(/ /g,'\\s+')})+')((?:e?s)?)(?![A-Za-z])','gi'):null;
var TSKIP='svg,script,style,.gt,.ftr,h1,.kicker,.toc-h,.mzh,a,input,textarea';
function termText(root,skip){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode.closest(skip)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),a=[];while(w.nextNode())a.push(w.currentNode);return a}
function termPass(root,skip,re,key,seen){if(!re)return;termText(root,skip).forEach(function(n){var t=n.nodeValue,m,last=0,frag=null;re.lastIndex=0;
  while((m=re.exec(t))){var k=key(m[2]);
    /* part of a chemical formula (PO4, CO2, HCO3 written with <sub>): not an abbreviation */
    if(k!==undefined&&m.index+m[0].length===t.length&&n.nextSibling&&/^(SUB|SUP)$/.test(n.nextSibling.nodeName))k=undefined;
    if(k===undefined){re.lastIndex=m.index+m[1].length+1;continue}
    if(seen&&seen[k]){re.lastIndex=m.index+m[0].length;continue}  /* already explained on this page: skip the whole phrase */if(seen)seen[k]=1;
    var st0=m.index+m[1].length,word=m[2]+m[3];frag=frag||document.createDocumentFragment();frag.appendChild(document.createTextNode(t.slice(last,st0)));
    var sp=document.createElement('span');sp.className='gt';sp.dataset.t=k;sp.textContent=word;frag.appendChild(sp);last=st0+word.length;re.lastIndex=last}
  if(frag){frag.appendChild(document.createTextNode(t.slice(last)));n.parentNode.replaceChild(frag,n)}})}
function termify(root,skip){if(!root||root.dataset.tm)return;root.dataset.tm='1';skip=skip?TSKIP+','+skip:TSKIP;
  termPass(root,skip,AB_RE,function(w){var v=TAB[w];return v===undefined?undefined:'a'+[].concat(v).join('.')},null);
  termPass(root,skip,GL_RE,function(w){var v=TGL[gnorm(w)];return v===undefined?undefined:'g'+v},{})}
var FRONT=/^(cover|authors|about|contents|abbr)/;
var tip=document.createElement('div');tip.className='gtip';tip.hidden=true;document.body.appendChild(tip);var tipFor=null,ptr='mouse';
function tipHtml(k){var ids=k.slice(1).split('.'),L=k[0]==='a'?TM.ab:TM.gl;return ids.map(function(i){var r=L[+i];return '<b>'+esc(k[0]==='a'?r[1]:r[0][0].charAt(0).toUpperCase()+r[0][0].slice(1))+'</b><span>'+esc(r[2])+'</span>'}).join('')}
function showTip(el){tipFor=el;tip.innerHTML=tipHtml(el.dataset.t);tip.className='gtip '+(el.dataset.t[0]==='a'?'ab':'gl');tip.hidden=false;
  var r=el.getBoundingClientRect(),W=innerWidth,tw=Math.min(300,W-24);tip.style.maxWidth=tw+'px';tip.style.left='0px';tip.style.top='0px';
  var b=tip.getBoundingClientRect(),x=Math.max(12,Math.min(W-12-b.width,r.left+r.width/2-b.width/2)),y=r.top-b.height-8;if(y<8)y=r.bottom+8;
  tip.style.left=x+'px';tip.style.top=y+'px'}
function hideTip(){tip.hidden=true;tipFor=null}
document.addEventListener('pointerdown',function(e){ptr=e.pointerType||'mouse'},true);
document.addEventListener('mouseover',function(e){if(ptr!=='mouse')return;var g=e.target.closest&&e.target.closest('.gt');if(g){if(g!==tipFor)showTip(g)}else if(tipFor&&!e.target.closest('.gtip'))hideTip()});
document.addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('.gt');
  if(g&&ptr!=='mouse'&&!(window.getSelection()+'')){e.preventDefault();e.stopPropagation();if(g===tipFor)hideTip();else showTip(g);return}
  if(tipFor&&!e.target.closest('.gtip'))hideTip()},true);
document.addEventListener('scroll',function(){if(tipFor)hideTip()},true);

/* ---------- search ---------- */
var TEXT=wraps.map(function(pw){return pw.textContent.replace(/\s+/g,' ')});
$('qchips').innerHTML=META.chips.map(function(c){return '<button class="chip" type="button">'+esc(c)+'</button>'}).join('');
$('qchips').onclick=function(e){var b=e.target.closest('.chip');if(b){$('q').value=b.textContent;runSearch()}};
function runSearch(){var q=$('q').value.trim();var out=$('results');if(q.length<2){out.innerHTML='<p class="empty">Type at least 2 letters. Every page of the book is searched.</p>';return}
  var ql=q.toLowerCase(),hits=[];TEXT.forEach(function(t,i){var tl=t.toLowerCase(),k=tl.indexOf(ql),n=0;if(k<0)return;var c=k;while(c>=0){n++;c=tl.indexOf(ql,c+1)}
    var a=Math.max(0,k-60),snip=(a?'…':'')+esc(t.slice(a,k))+'<mark>'+esc(t.slice(k,k+q.length))+'</mark>'+esc(t.slice(k+q.length,k+q.length+80))+'…';hits.push({i:i,n:n,snip:snip})});
  out.innerHTML=hits.length?'<div class="res">'+hits.map(function(h){return '<button class="ri" type="button" data-i="'+h.i+'"><span class="pn">p '+(h.i+1)+'</span><span><b>'+esc(PAGES[h.i].label)+' · '+h.n+'×</b><span>'+h.snip+'</span></span></button>'}).join('')+'</div>':'<p class="empty">No page mentions “'+esc(q)+'”.</p>'}
$('q').addEventListener('input',runSearch);runSearch();
$('results').onclick=function(e){var b=e.target.closest('.ri');if(!b)return;var i=+b.dataset.i;goPage(i);markIn(i,$('q').value.trim())};
function markIn(i,q){[].forEach.call(document.querySelectorAll('.bk mark.hit'),function(m){m.replaceWith(document.createTextNode(m.textContent))});if(!q)return;
  var ql=q.toLowerCase(),first=null;textNodes(wraps[i]).forEach(function(n){var t=n.nodeValue,k=t.toLowerCase().indexOf(ql);if(k<0)return;var r=document.createRange();r.setStart(n,k);r.setEnd(n,k+q.length);var m=document.createElement('mark');m.className='hit';try{r.surroundContents(m);if(!first)first=m}catch(e){}});
  if(first){var sc=$('scroller');sc.scrollTop=first.getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop-120}}

/* ---------- flashcards (known cards are remembered) ---------- */
function cardKey(id,c){var s=c[1],h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return id+':'+(h>>>0).toString(36)}
var curDeck='all',deck=[],total=0,known=0,started=false;
var deckIds=Object.keys(DECKS);
$('toolCards').textContent=deckIds.reduce(function(a,k){return a+DECKS[k].cards.length},0)+' cards · '+deckIds.length+' topic'+(deckIds.length===1?'':'s');
function chips(){$('deckChips').innerHTML=['daily','all'].concat(deckIds).map(function(k){var lab,cnt;
  if(k==='daily'){var D=daily();lab='Today';cnt=D.done.length+'/'+D.keys.length}
  else if(k==='all'){lab='All topics';var a=0,b=0;deckIds.forEach(function(id){a+=deckKnown(id);b+=DECKS[id].cards.length});cnt=a+'/'+b}else{lab=DECKS[k].short;cnt=deckKnown(k)+'/'+DECKS[k].cards.length}
  return '<button class="chip'+(k===curDeck?' on':'')+'" type="button" data-d="'+k+'">'+esc(lab)+'<small>'+cnt+'</small></button>'}).join('')+(LOCKED?'<button class="chip lkc" type="button" data-sub="1" dir="rtl">🔒 كل الـ flashcards: اشترك</button>':'')}
$('deckChips').onclick=function(e){var b=e.target.closest('.chip');if(b&&b.dataset.d){curDeck=b.dataset.d;startDeck(curDeck)}};
function startDeck(k,all){started=true;
  if(k==='daily'){var D=daily();deck=[];total=D.keys.length;known=D.done.length;D.keys.forEach(function(key){if(D.done.indexOf(key)<0){var x=CBYK[key];deck.push({key:key,t:DECKS[x.id].short,cat:x.c[0],q:x.c[1],a:x.c[2]})}});chips();renderCard();return}
  var src=k==='all'?deckIds:[k];deck=[];total=0;known=0;
  src.forEach(function(id){DECKS[id].cards.forEach(function(c){var key=cardKey(id,c);total++;if(KNOWN[key]&&!all){known++;return}deck.push({key:key,t:DECKS[id].short,cat:c[0],q:c[1],a:c[2]})})});
  if(all)known=0;
  for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=deck[i];deck[i]=deck[j];deck[j]=x}chips();renderCard()}
function renderCard(){$('fcProg').style.width=(total?known/total*100:0)+'%';$('fcScore').textContent=(curDeck==='daily'?'Done ':'Known ')+known+' / '+total;
  if(!deck.length&&curDeck==='daily'){var sk=streak();$('fcLeft').textContent='';$('fcScore').textContent='Today '+total+' / '+total;
    $('fcStage').innerHTML='<div class="done"><b class="gtx">Today\'s cards are done</b><span class="flame">🔥 '+sk+'-day streak</span><span class="muted">Come back tomorrow for '+DN+' new cards. Keep the streak going!</span><button class="btn" type="button" id="fcMore">Study all topics</button></div>';
    $('fcMore').onclick=function(){curDeck='all';startDeck('all')};return}
  if(!deck.length){$('fcLeft').textContent='';$('fcStage').innerHTML='<div class="done"><b>Deck finished</b><span class="muted">All '+total+' cards are marked as known. They stay known next time you open the app.</span><button class="btn" type="button" id="fcAll">Study all cards again</button><button class="chip" type="button" id="fcReset">Reset progress for this deck</button></div>';
    $('fcAll').onclick=function(){startDeck(curDeck,true)};
    $('fcReset').onclick=function(){var src=curDeck==='all'?deckIds:[curDeck];src.forEach(function(id){DECKS[id].cards.forEach(function(c){delete KNOWN[cardKey(id,c)]})});saveKnown();startDeck(curDeck)};return}
  var c=deck[0];$('fcLeft').textContent=deck.length+' left';
  $('fcStage').innerHTML='<button class="fc" type="button" id="fcCard" aria-label="Flip card"><div class="in"><div class="face q"><span class="k">'+esc(c.t)+' · '+esc(c.cat)+'</span><div class="tx">'+esc(c.q)+'</div></div><div class="face a"><span class="k">Answer</span><div class="tx">'+esc(c.a)+'</div></div></div></button><p class="fhint" style="margin-top:10px">Tap the card to see the answer</p><div class="fact" style="margin-top:12px"><button class="ag" type="button" id="fcNo">Again</button><button class="gd" type="button" id="fcYes">Knew it</button></div>';
  [].forEach.call($('fcCard').querySelectorAll('.tx'),function(x){termify(x)});$('fcCard').onclick=function(){this.classList.toggle('flip')};
  $('fcNo').onclick=function(){deck.push(deck.shift());renderCard()};
  $('fcYes').onclick=function(){var x=deck.shift();KNOWN[x.key]=1;saveKnown();known++;if(curDeck==='daily')dailyDone(x.key);chips();renderCard()}}
/* daily flashcards: the same 10 cards all day (unknown cards first), a new set tomorrow, and a streak */
var CBYK={};deckIds.forEach(function(id){DECKS[id].cards.forEach(function(c){CBYK[cardKey(id,c)]={id:id,c:c}})});
var DN=10;
function today(o){var d=new Date();if(o)d.setDate(d.getDate()+o);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function daily(){var D=stj('daily'),td=today();if(D&&D.d===td&&D.keys&&D.keys.length&&D.keys.every(function(k){return CBYK[k]}))return D;
  var keys=Object.keys(CBYK),seed=7;for(var i=0;i<td.length;i++)seed=(seed*31+td.charCodeAt(i))|0;
  function rnd(){seed=(Math.imul(seed,1103515245)+12345)|0;return ((seed>>>8)&0xffff)/65536}
  var fresh=keys.filter(function(k){return !KNOWN[k]}),pool=(fresh.length>=DN?fresh:keys).slice();
  for(var j=pool.length-1;j>0;j--){var r=Math.floor(rnd()*(j+1)),x=pool[j];pool[j]=pool[r];pool[r]=x}
  D={d:td,keys:pool.slice(0,DN),done:[]};stj('daily',D);return D}
function streak(){var S=stj('streak')||{};return S.last===today()||S.last===today(-1)?S.n||0:0}
function dailyDone(key){var D=daily();if(D.done.indexOf(key)<0)D.done.push(key);stj('daily',D);
  if(D.done.length>=D.keys.length){var S=stj('streak')||{},td=today();if(S.last!==td){S.n=S.last===today(-1)?(S.n||0)+1:1;S.last=td;stj('streak',S);syncSoon()}}}
function refreshDaily(){var D=daily(),n=D.done.length,N=D.keys.length,sk=streak(),fin=n>=N;
  $('dailyT').textContent=fin?'Done for today ✓':n?n+' of '+N+' done · keep going':N+' new cards for today';
  $('dailyDots').innerHTML=D.keys.map(function(k,i){return '<i'+(i<n?' class="on"':'')+'></i>'}).join('');
  $('dailyS').innerHTML=sk?'<b>🔥 '+sk+'</b><small>day'+(sk>1?'s':'')+'</small>':'';$('dailyBtn').classList.toggle('fin',fin)}
$('dailyBtn').onclick=function(){curDeck='daily';started=false;show('cards')};

/* ---------- question bank ---------- */
var QB=JSON.parse($('qbdata').textContent);if(LOCKED)QB.qs=(ACC.qs||[]).map(function(i){return QB.qs[i]});var QS=QB.qs,QTOP={};QB.topics.forEach(function(t){QTOP[t.id]=t});
function qid(q){var s=q[0]+q[1],h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
QS.forEach(function(q){q.id=qid(q)});
var QU=stj('qb')||{};            // qid -> {c:1|0 last answer correct, m:1 marked}
var QT=stj('qbtests')||[];       // finished tests
var CUR=stj('qbcur');            // test in progress
var qset={mode:'tutor',pool:'unused',n:10,ch:{}};
var qsaved=stj('qbset');if(qsaved)qset=qsaved;
function saveQB(){stj('qb',QU);stj('qbtests',QT);stj('qbcur',CUR);stj('qbset',qset);syncSoon()}
var L='ABCDE';
if($('toolQb'))$('toolQb').textContent=QS.length+' MCQs with explanations';
var qchs=[];QB.topics.forEach(function(t){if(qchs.indexOf(t.ch)<0)qchs.push(t.ch)});
function chTitle(n){var c=META.contents.filter(function(x){return x.no===n})[0];return c?c.title:'Chapter '+n}
function inPool(q,pool){var u=QU[q.id];if(pool==='unused')return !u||u.c===undefined;if(pool==='incorrect')return u&&u.c===0;if(pool==='marked')return u&&u.m;return true}
function poolQs(){var any=Object.keys(qset.ch).some(function(k){return qset.ch[k]});
  return QS.filter(function(q){return (!any||qset.ch[QTOP[q[0]].ch])&&inPool(q,qset.pool)})}
function qbStats(){var used=0,ok=0,m=0;QS.forEach(function(q){var u=QU[q.id];if(u&&u.c!==undefined){used++;if(u.c)ok++}if(u&&u.m)m++});return {used:used,ok:ok,m:m}}
function renderQB(){if(CUR&&!CUR.done)return renderQ();$('subtitle').textContent='Question bank';
  var s=qbStats(),pool=poolQs(),max=pool.length,n=Math.min(qset.n,max);
  var h='<div class="qbst"><div><b>'+pct(s.ok,s.used)+'%</b><span>Correct</span></div><div><b>'+s.used+'<small> / '+QS.length+'</small></b><span>Used</span></div><div><b>'+(QS.length-s.used)+'</b><span>Unused</span></div><div><b>'+s.m+'</b><span>Marked</span></div></div>';
  if(LOCKED)h+='<button type="button" class="trial ar" dir="rtl" data-sub="1"><b><span class="en">Free trial</span> · '+QS.length+' سؤال</b><span>اشترك عشان يتفتح ليك الـ <span class="en">QBank</span> كامل</span><i>اشترك</i></button>';
  h+='<div class="sh"><h3>Create a test</h3></div><div class="qbf">';
  h+='<div class="qbl">Mode</div><div class="seg" data-k="mode">'+[['tutor','Tutor','answer after each question'],['timed','Timed','answers at the end · 1 min 15 s each']].map(function(o){return '<button type="button" data-v="'+o[0]+'" class="'+(qset.mode===o[0]?'on':'')+'"><b>'+o[1]+'</b><span>'+o[2]+'</span></button>'}).join('')+'</div>';
  h+='<div class="qbl">Questions</div><div class="chips" data-k="pool">'+[['unused','Unused'],['incorrect','Incorrect'],['marked','Marked'],['all','All']].map(function(o){
    var c=QS.filter(function(q){return inPool(q,o[0])}).length;return '<button type="button" class="chip'+(qset.pool===o[0]?' on':'')+'" data-v="'+o[0]+'">'+o[1]+'<small>'+c+'</small></button>'}).join('')+'</div>';
  var any=Object.keys(qset.ch).some(function(k){return qset.ch[k]});
  h+='<div class="qbl">Chapters <span>'+(any?'':'all chapters')+'</span></div><div class="qbch">'+qchs.map(function(n){var c=QS.filter(function(q){return QTOP[q[0]].ch===n}).length;
    return '<button type="button" class="qx'+n+(qset.ch[n]?' on':'')+'" data-ch="'+n+'"><span class="n">'+n+'</span><span class="l">'+esc(chTitle(n))+'</span><small>'+c+'</small></button>'}).join('')+'</div>';
  h+='<div class="qbl">Number of questions <span>'+max+' available</span></div><div class="qbn"><input type="range" id="qbN" min="1" max="'+Math.max(1,Math.min(max,100))+'" value="'+Math.max(1,n)+'"'+(max?'':' disabled')+'><b id="qbNv">'+n+'</b></div>';
  h+='<button class="btn qbgo" type="button" id="qbGo"'+(max?'':' disabled')+'>'+(max?'Start test':'No questions match')+'</button></div>';
  if(QT.length){h+='<div class="sh"><h3>Previous tests</h3><span>Tap to review</span></div><div class="qbprev">'+QT.slice().reverse().map(function(t,i){var j=QT.length-1-i,sc=pct(t.ok,t.ids.length);
    return '<button type="button" data-t="'+j+'"><span class="sc '+(sc>=70?'g':sc>=50?'m':'b')+'">'+sc+'%</span><span class="l"><b>'+t.ok+' / '+t.ids.length+' correct</b><small>'+(t.mode==='timed'?'Timed':'Tutor')+' · '+new Date(t.d).toLocaleDateString(undefined,{day:'numeric',month:'short'})+'</small></span><span class="go">›</span></button>'}).join('')+'</div>'+
    '<button class="chip qbreset" type="button" id="qbReset">Reset all question-bank progress</button>'}
  $('qbWrap').innerHTML=h;$('qbWrap').scrollTop=0}
$('qbWrap').addEventListener('input',function(e){if(e.target.id==='qbN'){qset.n=+e.target.value;$('qbNv').textContent=e.target.value;saveQB()}});
$('qbWrap').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!$('qbWrap').contains(b))return;
  var g=b.parentNode.dataset&&b.parentNode.dataset.k;
  if(g&&b.dataset.v){qset[g]=b.dataset.v;saveQB();renderQB();return}
  if(b.dataset.ch){qset.ch[b.dataset.ch]=!qset.ch[b.dataset.ch];saveQB();renderQB();return}
  if(b.id==='qbGo'){startTest();return}
  if(b.dataset.t){var t=QT[+b.dataset.t];CUR={ids:t.ids,ans:t.ans,mode:t.mode,i:0,done:true,review:+b.dataset.t};renderQ();return}
  if(b.id==='qbReset'){ask('Clear all answers, marks and previous tests?','Reset',function(){QU={};QT=[];CUR=null;saveQB();renderQB()});return}
  if(b.dataset.o!==undefined){pick(+b.dataset.o);return}
  if(b.id==='qbSub'){submitQ();return}
  if(b.id==='qbPrev'){go(CUR.i-1);return}if(b.id==='qbNext'){go(CUR.i+1);return}
  if(b.id==='qbMark'){var id=CUR.ids[CUR.i];QU[id]=QU[id]||{};if(QU[id].m)delete QU[id].m;else QU[id].m=1;saveQB();renderQ();return}
  if(b.id==='qbEnd'){if(CUR.done){CUR=null;saveQB();renderQB()}else{var un=CUR.ids.filter(function(x){return CUR.ans[x]===undefined}).length;if(!un)finishTest();else ask('End the test now? '+un+' unanswered question'+(un>1?'s stay':' stays')+' unused.','End test',finishTest)}return}
  if(b.id==='qbGrid'){$('qbPal').hidden=!$('qbPal').hidden;return}
  if(b.dataset.j!==undefined){go(+b.dataset.j);return}
  if(b.id==='qbRes'){showResult(CUR.review);return}
  if(b.dataset.p){goPage(+b.dataset.p-1);return}});
function startTest(){var pool=poolQs();for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=pool[i];pool[i]=pool[j];pool[j]=x}
  var n=Math.min(qset.n,pool.length);CUR={ids:pool.slice(0,n).map(function(q){return q.id}),ans:{},sub:{},mode:qset.mode,i:0,start:Date.now(),lim:n*75};saveQB();renderQ()}
var QBY={};QS.forEach(function(q){QBY[q.id]=q});
function go(i){if(i<0||i>=CUR.ids.length)return;CUR.i=i;saveQB();renderQ();$('qbank').scrollTop=0}
function pick(o){var id=CUR.ids[CUR.i];if(CUR.done||(CUR.mode==='tutor'&&CUR.sub[id]))return;CUR.ans[id]=o;saveQB();renderQ()}
function submitQ(){var id=CUR.ids[CUR.i],q=QBY[id];if(CUR.ans[id]===undefined)return;CUR.sub[id]=1;record(id);saveQB();renderQ()}
function record(id){var q=QBY[id];if(!q)return;QU[id]=QU[id]||{};QU[id].c=CUR.ans[id]===q[3]?1:0}
function finishTest(){var ok=0;CUR.ids.forEach(function(id){if(CUR.ans[id]!==undefined)record(id);if(QBY[id]&&CUR.ans[id]===QBY[id][3])ok++});
  QT.push({d:Date.now(),mode:CUR.mode,ids:CUR.ids,ans:CUR.ans,ok:ok});var k=QT.length-1;if(QT.length>50)QT.shift(),k--;CUR=null;saveQB();showResult(k)}
function showResult(k){var t=QT[k],n=t.ids.length,sc=pct(t.ok,n);CUR=null;
  var byT={};t.ids.forEach(function(id){var q=QBY[id];if(!q)return;var s=QTOP[q[0]].short;byT[s]=byT[s]||[0,0];byT[s][1]++;if(t.ans[id]===q[3])byT[s][0]++});
  $('qbWrap').innerHTML='<div class="qbres"><div class="ring '+(sc>=70?'g':sc>=50?'m':'b')+'" style="--v:'+sc+'"><b>'+sc+'%</b></div><b>'+t.ok+' of '+n+' correct</b><span class="muted">'+(t.mode==='timed'?'Timed':'Tutor')+' test</span></div>'+
    '<div class="sh"><h3>By topic</h3></div><div class="qbtop">'+Object.keys(byT).map(function(s){var v=byT[s];return '<div><span>'+esc(s)+'</span><b>'+v[0]+' / '+v[1]+'</b><div class="pbar"><i style="width:'+pct(v[0],v[1])+'%"></i></div></div>'}).join('')+'</div>'+
    '<div class="sh"><h3>Questions</h3><span>Tap to review</span></div><div class="qbgrid">'+t.ids.map(function(id,j){var q=QBY[id],a=t.ans[id];return '<button type="button" data-rv="'+j+'" class="'+(a===undefined?'na':q&&a===q[3]?'ok':'no')+'">'+(j+1)+'</button>'}).join('')+'</div>'+
    '<button class="btn qbgo" type="button" id="qbBack">Back to the question bank</button>';
  $('qbWrap').querySelector('.qbgrid').onclick=function(e){var b=e.target.closest('[data-rv]');if(b){CUR={ids:t.ids,ans:t.ans,mode:t.mode,i:+b.dataset.rv,done:true,review:k};renderQ()}};
  $('qbBack').onclick=function(){renderQB()};$('qbank').scrollTop=0}
function ask(msg,ok,cb){openSheet('Are you sure?','<p class="qbask">'+esc(msg)+'</p><div class="qbnav"><button type="button" class="chip" id="askNo">Cancel</button><button type="button" class="btn" id="askYes">'+esc(ok)+'</button></div>');
  $('askNo').onclick=function(){$('sheet').hidden=true};$('askYes').onclick=function(){$('sheet').hidden=true;cb()}}
var qtick=null;
function timeLeft(){return Math.max(0,CUR.lim-Math.floor((Date.now()-CUR.start)/1000))}
function fmt(s){return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function renderQ(){clearInterval(qtick);var id=CUR.ids[CUR.i],q=QBY[id],n=CUR.ids.length;
  if(!q){CUR.ids.splice(CUR.i,1);if(!CUR.ids.length){CUR=null;saveQB();return renderQB()}CUR.i=Math.min(CUR.i,CUR.ids.length-1);return renderQ()}
  var a=CUR.ans[id],shown=CUR.done||(CUR.mode==='tutor'&&CUR.sub&&CUR.sub[id]),t=QTOP[q[0]],mk=QU[id]&&QU[id].m;
  $('subtitle').textContent=CUR.done?'Review':'Question bank';
  var h='<div class="qbbar"><span class="qn">Q '+(CUR.i+1)+' <small>/ '+n+'</small></span>'+(CUR.mode==='timed'&&!CUR.done?'<span class="qt" id="qbT">'+fmt(timeLeft())+'</span>':'')+
    '<button type="button" id="qbMark" class="qbic'+(mk?' on':'')+'" aria-label="Mark question"><svg viewBox="0 0 24 24" fill="'+(mk?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4h11l-2 4 2 4H5"/></svg></button>'+
    '<button type="button" id="qbGrid" class="qbic" aria-label="All questions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg></button>'+
    '<button type="button" id="qbEnd" class="chip">'+(CUR.done?'Close':'End test')+'</button></div>';
  h+='<div class="qbgrid pal" id="qbPal" hidden>'+CUR.ids.map(function(x,j){var c='';if(CUR.done||(CUR.sub&&CUR.sub[x]))c=QBY[x]&&CUR.ans[x]===QBY[x][3]?'ok':CUR.ans[x]===undefined?'na':'no';else if(CUR.ans[x]!==undefined)c='an';
    return '<button type="button" data-j="'+j+'" class="'+c+(j===CUR.i?' cur':'')+'">'+(j+1)+'</button>'}).join('')+'</div>';
  h+='<div class="qbq qx'+t.ch+'"><span class="k">'+esc(t.no)+' · '+esc(t.short)+'</span><p>'+esc(q[1])+'</p></div><div class="qbo">'+q[2].map(function(o,j){
    var c='';if(shown){if(j===q[3])c='ok';else if(j===a)c='no'}else if(j===a)c='sel';
    return '<button type="button" data-o="'+j+'" class="'+c+'"><span class="l">'+L[j]+'</span><span>'+esc(o)+'</span></button>'}).join('')+'</div>';
  if(shown){var right=a===q[3];h+='<div class="qbe '+(a===undefined?'na':right?'ok':'no')+'"><b>'+(a===undefined?'Not answered':right?'Correct':'Incorrect')+' · answer '+L[q[3]]+'</b><p>'+esc(q[4])+'</p><button type="button" class="qblink" data-p="'+q[5]+'">Read in the book · p '+q[5]+' ›</button></div>'}
  else if(CUR.mode==='tutor')h+='<button class="btn qbgo" type="button" id="qbSub"'+(a===undefined?' disabled':'')+'>Submit answer</button>';
  h+='<div class="qbnav"><button type="button" class="chip" id="qbPrev"'+(CUR.i?'':' disabled')+'>‹ Previous</button>'+
    (CUR.i<n-1?'<button type="button" class="chip" id="qbNext">Next ›</button>':CUR.done?(CUR.review!==undefined?'<button type="button" class="chip" id="qbRes">Results ›</button>':''):'<button type="button" class="chip on" id="qbEnd2">Finish test</button>')+'</div>';
  $('qbWrap').innerHTML=h;termify($('qbWrap').querySelector('.qbq'));termify($('qbWrap').querySelector('.qbe'),'button');
  var e2=$('qbEnd2');if(e2)e2.onclick=function(){var un=CUR.ids.filter(function(x){return CUR.ans[x]===undefined}).length;if(!un)finishTest();else ask(un+' question'+(un>1?'s are':' is')+' unanswered. Finish anyway?','Finish',finishTest)};
  if(CUR.mode==='timed'&&!CUR.done){qtick=setInterval(function(){if(!CUR||CUR.done||!$('qbT')){clearInterval(qtick);return}var s=timeLeft();$('qbT').textContent=fmt(s);$('qbT').classList.toggle('low',s<60);if(!s){clearInterval(qtick);finishTest()}},1000)}}


/* ---------- audio lectures: the author explains each page (META.audio, one file per page; tools/audio.py) ----------
   One player for the app: plays a topic page by page, turns the book page with it, remembers where you stopped,
   and can download files to the phone (Cache API 'prr-audio') to listen with no internet. */
var AU=META.audio||[],AUG={},AUP={},ACACHE='prr-audio',HAVE={},DLING={};
AU.forEach(function(g){AUG[g.g]=g;g.sec=0;g.bytes=0;g.parts.forEach(function(p,k){p.abs=new URL(p[1],location.href).href;AUP[p[0]]=[g,k];g.sec+=p[2];g.bytes+=p[3]})});
var aud=new Audio();aud.preload='metadata';var PL=null,SPD=[1,1.25,1.5,1.75,2,0.75],spd=+st('aspd')||1;
function gFree(g){return pageFree(g.parts[0][0])}
function tfmt(x){x=Math.max(0,Math.floor(x||0));var h=Math.floor(x/3600),m=Math.floor(x/60)%60,s=x%60;return (h?h+':'+('0'+m).slice(-2):m)+':'+('0'+s).slice(-2)}
function mins(x){var m=Math.round(x/60);return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'}
function mb(b){return (b/1e6).toFixed(b<1e7?1:0)+' MB'}
function gHave(g){return g.parts.every(function(p){return HAVE[p.abs]})}
function haveBytes(){var b=0;AU.forEach(function(g){g.parts.forEach(function(p){if(HAVE[p.abs])b+=p[3]})});return b}
function cacheList(){if(!window.caches)return Promise.resolve();return caches.open(ACACHE).then(function(c){return c.keys()}).then(function(ks){HAVE={};ks.forEach(function(r){HAVE[r.url]=1})}).catch(function(){})}
function download(gs){if(!window.caches)return Promise.resolve();
  return caches.open(ACACHE).then(function(c){var todo=[];gs.forEach(function(g){if(!gFree(g))return;g.parts.forEach(function(p){if(!HAVE[p.abs])todo.push({g:g,p:p})})});
    var chain=Promise.resolve();todo.forEach(function(x){DLING[x.g.g]=1;chain=chain.then(function(){return fetch(x.p.abs).then(function(r){if(!r.ok)throw 0;return c.put(x.p.abs,r)}).then(function(){HAVE[x.p.abs]=1}).catch(function(){}).then(function(){if(gHave(x.g))delete DLING[x.g.g];if(!$('lectures').hidden)renderLect()})})});
    if(todo.length&&!$('lectures').hidden)renderLect();return chain.then(function(){DLING={};if(!$('lectures').hidden)renderLect()})})}
function forget(){if(!window.caches)return;caches.delete(ACACHE).then(function(){HAVE={};renderLect()})}
function srcFor(p){if(!HAVE[p.abs]||!window.caches)return Promise.resolve(p.abs);
  return caches.match(p.abs).then(function(r){return r?r.blob().then(function(b){return URL.createObjectURL(b)}):p.abs}).catch(function(){return p.abs})}
function playPart(g,k,t,keepPaused){if(!gFree(g)){openSub();return}var follow=PL&&PL.g===g&&!$('reader').hidden&&currentPage()===g.parts[PL.k][0];
  PL={g:g,k:k};var p=g.parts[k];aud._sw=1;
  srcFor(p).then(function(src){if(aud._blob)URL.revokeObjectURL(aud._blob);aud._blob=src.indexOf('blob:')===0?src:null;aud.src=src;aud.playbackRate=spd;
    var go=function(){aud._sw=0;try{if(t)aud.currentTime=t}catch(e){}aud.playbackRate=spd;if(!keepPaused)aud.play().catch(function(){});updPlayer()};
    if(aud.readyState>=1)go();else aud.addEventListener('loadedmetadata',go,{once:true});aud.load()});
  if(follow)goPage(p[0]);
  $('player').hidden=false;savePos(t||0);updPlayer();media()}
function gAt(g,x){for(var k=0;k<g.parts.length;k++){if(x<g.parts[k][2]||k===g.parts.length-1)return [k,Math.min(x,g.parts[k][2])];x-=g.parts[k][2]}}
function before(g,k){var x=0;for(var j=0;j<k;j++)x+=g.parts[j][2];return x}
function savePos(t){if(PL)st('apos',JSON.stringify({g:PL.g.g,k:PL.k,t:t==null?aud.currentTime:t}));}
function resumeOf(g){try{var a=JSON.parse(st('apos'));if(a&&a.g===g.g&&g.parts[a.k])return a}catch(e){}return null}
function playGroup(g){if(PL&&PL.g===g){aud.paused?aud.play().catch(function(){}):aud.pause();return}var r=resumeOf(g);playPart(g,r?r.k:0,r?r.t:0)}
var PLAY_I='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',PAUSE_I='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
function updPlayer(){if(!PL)return;var g=PL.g,p=g.parts[PL.k],now=before(g,PL.k)+(aud._sw?0:aud.currentTime||0);
  $('plTitle').textContent=g.no+' · '+g.title;$('plSub').textContent='Page '+(p[0]+1)+' · part '+(PL.k+1)+' of '+g.parts.length;
  $('plSeek').max=Math.round(g.sec);if(!seeking)$('plSeek').value=Math.round(now);$('plSeek').style.setProperty('--v',(g.sec?now/g.sec*100:0)+'%');
  $('plNow').textContent=tfmt(now);$('plTot').textContent=tfmt(g.sec);$('plPlay').innerHTML=aud.paused?PLAY_I:PAUSE_I;$('plSpd').textContent=spd+'×';
  updLis(currentPage());if(!$('lectures').hidden)markRows()}
var seeking=false,lastSave=0;
$('plSeek').addEventListener('input',function(){seeking=true;if(!PL)return;var x=+this.value;$('plNow').textContent=tfmt(x);this.style.setProperty('--v',(PL.g.sec?x/PL.g.sec*100:0)+'%')});
$('plSeek').addEventListener('change',function(){seeking=false;if(!PL)return;var a=gAt(PL.g,+this.value);if(a[0]===PL.k){aud.currentTime=a[1];updPlayer()}else playPart(PL.g,a[0],a[1],aud.paused)});
aud.addEventListener('timeupdate',function(){updPlayer();if(Date.now()-lastSave>5000){lastSave=Date.now();savePos()}});
['play','pause'].forEach(function(ev){aud.addEventListener(ev,function(){updPlayer();savePos()})});
aud.addEventListener('ended',function(){if(!PL)return;if(PL.k+1<PL.g.parts.length)playPart(PL.g,PL.k+1,0);else{savePos(0);st('apos','');updPlayer()}});
$('plPlay').onclick=function(){if(!PL)return;if(aud.paused){if(!aud.src)playPart(PL.g,PL.k,+(resumeOf(PL.g)||{}).t||0);else aud.play().catch(function(){})}else aud.pause()};
$('plBack').onclick=function(){if(!PL)return;if(aud.currentTime<10&&PL.k>0)playPart(PL.g,PL.k-1,Math.max(0,PL.g.parts[PL.k-1][2]-10+aud.currentTime),aud.paused);else aud.currentTime=Math.max(0,aud.currentTime-10)};
$('plSpd').onclick=function(){spd=SPD[(SPD.indexOf(spd)+1)%SPD.length];st('aspd',spd);aud.playbackRate=spd;updPlayer()};
$('plPage').onclick=function(){if(PL)goPage(PL.g.parts[PL.k][0])};
$('plX').onclick=function(){aud.pause();savePos();PL=null;$('player').hidden=true;updLis(currentPage());if(!$('lectures').hidden)markRows()};
function media(){if(!('mediaSession' in navigator)||!PL)return;try{navigator.mediaSession.metadata=new MediaMetadata({title:PL.g.no+' · '+PL.g.title,artist:'Pediatrics Master Review',album:'Audio lectures',artwork:[{src:'img/icon.png',sizes:'512x512',type:'image/png'}]});
  navigator.mediaSession.setActionHandler('play',function(){aud.play()});navigator.mediaSession.setActionHandler('pause',function(){aud.pause()});
  navigator.mediaSession.setActionHandler('seekbackward',function(){$('plBack').click()});navigator.mediaSession.setActionHandler('seekforward',function(){aud.currentTime=Math.min(aud.duration||0,aud.currentTime+10)});
  navigator.mediaSession.setActionHandler('previoustrack',function(){if(PL&&PL.k>0)playPart(PL.g,PL.k-1,0)});navigator.mediaSession.setActionHandler('nexttrack',function(){if(PL&&PL.k+1<PL.g.parts.length)playPart(PL.g,PL.k+1,0)})}catch(e){}}
/* reader pill: Listen on a recorded page, Playing while its lecture plays */
function updLis(c){var b=$('lisBtn');if(!b||!AUP)return;var a=AUP[c],pg=PAGES[c]||{};b.hidden=!pg.topic;b.classList.toggle('soon',!a);if(!a){b.classList.remove('on');$('lisLbl').textContent='استمع';return}var on=PL&&PL.g===a[0]&&!aud.paused;
  b.classList.toggle('on',!!on);$('lisLbl').innerHTML=on?'<i class="eq"><i></i><i></i><i></i></i>شغّال':'استمع'}
var lisT=null;function lisSoon(){railTip('The audio lecture for this page is coming soon')}
function railTip(msg){var t=$('lisTip');if(!t){t=document.createElement('div');t.id='lisTip';t.className='listip';$('reader').appendChild(t)}
  t.textContent=msg;t.classList.add('on');clearTimeout(lisT);lisT=setTimeout(function(){t.classList.remove('on')},2600)}
$('lisBtn').onclick=function(){var c=currentPage(),a=AUP[c];if(!a){lisSoon();return}if(PL&&PL.g===a[0]&&PL.k===a[1]){aud.paused?aud.play().catch(function(){}):aud.pause();return}playPart(a[0],a[1],0)};
/* Lectures screen */
function lectRow(g,t,c){if(!g)return '<div class="lr soon lc'+c+'"><span class="n">'+esc(t.no)+'</span><span class="l"><b>'+esc(t.title)+'</b><small>Recording soon</small></span><span class="tag">SOON</span></div>';
  var free=gFree(g),hv=gHave(g),dl=DLING[g.g],on=PL&&PL.g===g&&!aud.paused;
  return '<div class="lr lc'+c+(PL&&PL.g===g?' cur':'')+'" data-g="'+g.g+'"><span class="n">'+esc(g.no)+'</span><span class="l"><b>'+esc(g.title)+'</b><small>'+mins(g.sec)+' · '+g.parts.length+' page'+(g.parts.length>1?'s':'')+(g.parts.length<g.n?' of '+g.n:'')+' · '+mb(g.bytes)+(hv?' · downloaded ✓':dl?' · downloading…':'')+'</small></span>'+
    (!free?'<button type="button" class="lk" data-sub="1" aria-label="Subscribers only">🔒</button>':
     (hv||!window.caches?'':'<button type="button" class="dl" data-dl="'+g.g+'" aria-label="Download"'+(dl?' disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></button>')+
     '<button type="button" class="pl" data-pl="'+g.g+'" aria-label="Play">'+(on?PAUSE_I:PLAY_I)+'</button>')+'</div>'}
function renderLect(){var rec=TOPICS.filter(function(t){return AUG[t.id]}).length,tot=0,all=0,need=0;AU.forEach(function(g){tot+=g.sec;if(gFree(g)){all+=g.bytes;g.parts.forEach(function(p){if(!HAVE[p.abs])need+=p[3]})}});
  var busy=Object.keys(DLING).length,h='<div class="lhero"><h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg><span class="gtx">Lectures</span></h2>'+
  '<p>Every page explained by the author. Tap <b>Listen</b> on any page while you read, or play a whole topic here. Download once and listen with no internet.</p>'+
  '<div class="lchips"><span>'+rec+' of '+TOPICS.length+' topics recorded</span><span>'+mins(tot)+'</span><span>On this phone: '+mb(haveBytes())+'</span></div>'+
  (AU.length&&window.caches?(need?'<button type="button" class="ldl" id="lcAll"'+(busy?' disabled':'')+'>'+(busy?'Downloading…':'Download all · '+mb(need))+'</button>':(all?'<button type="button" class="ldl done" disabled>All downloaded ✓</button>':'')):'')+'</div>';
  META.contents.forEach(function(ch){var rows=ch.topics.filter(function(t){return t.p}).map(function(t){return lectRow(AUG[t.id],t,ch.no)});var ex=AUG['ex'+ch.no];if(ex)rows.push(lectRow(ex,null,ch.no));
    if(rows.length)h+='<div class="lch lc'+ch.no+'"><i></i>Chapter '+ch.no+' · '+esc(ch.title)+'</div>'+rows.join('')});
  if(haveBytes())h+='<button type="button" class="chip lforget" id="lcForget">Remove downloads from this phone · '+mb(haveBytes())+'</button>';
  if(LOCKED)h+='<p class="muted" style="text-align:center;margin:0">Free trial: lectures of the free topics. Subscribe to open them all.</p>';
  $('lcWrap').innerHTML=h}
function markRows(){[].forEach.call(document.querySelectorAll('#lcWrap .lr[data-g]'),function(r){var g=AUG[r.dataset.g],on=PL&&PL.g===g&&!aud.paused,b=r.querySelector('.pl');r.classList.toggle('cur',!!(PL&&PL.g===g));if(b)b.innerHTML=on?PAUSE_I:PLAY_I})}
$('lcWrap').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.pl)playGroup(AUG[b.dataset.pl]);else if(b.dataset.dl)download([AUG[b.dataset.dl]]);else if(b.id==='lcAll')download(AU);
  else if(b.id==='lcForget')ask('Remove the downloaded lectures from this phone? You can download them again.','Remove',forget)});
(function(){var r=null;try{r=JSON.parse(st('apos'))}catch(e){}if(r&&AUG[r.g]&&gFree(AUG[r.g])){PL={g:AUG[r.g],k:Math.min(r.k,AUG[r.g].parts.length-1)};$('player').hidden=false;updPlayer();
  var t=+r.t||0;$('plNow').textContent=tfmt(before(PL.g,PL.k)+t);$('plSeek').value=Math.round(before(PL.g,PL.k)+t)}})();
$('lectSub').textContent=AU.length?TOPICS.filter(function(t){return AUG[t.id]}).length+' topics · '+mins(AU.reduce(function(a,g){return a+g.sec},0))+' · listen offline':'Every page explained by the author · coming soon';
cacheList().then(function(){if(!$('lectures').hidden)renderLect()});

/* ---------- sync of everything else: flashcards known, QBank answers/marks, previous tests, daily streak, last page ----------
   Each is a map; a change is stamped with the time it was noticed (SMU name → key → time), removed keys stay as tombstones,
   and merging keeps the newest value per key. */
var SM={known:{get:function(){return KNOWN},set:function(v){KNOWN=v;stj('known',KNOWN)}},
  qb:{get:function(){return QU},set:function(v){QU=v;stj('qb',QU)}},
  qt:{get:function(){var o={};QT.forEach(function(t){o[t.d]=t});return o},set:function(v){QT=Object.keys(v).map(function(k){return v[k]}).sort(function(a,b){return a.d-b.d}).slice(-50);stj('qbtests',QT)}},
  streak:{get:function(){var S=stj('streak');return S?{s:S}:{}},set:function(v){if(v.s)stj('streak',v.s)}},
  page:{get:function(){var p=st('page');return p?{p:p}:{}},set:function(v){if(v.p)st('page',v.p)}}};
var SMU=stj('smu')||{},SMP={};
function smSnap(n){var o={},c=SM[n].get();Object.keys(c).forEach(function(k){o[k]=JSON.stringify(c[k])});return o}
Object.keys(SM).forEach(function(n){SMP[n]=smSnap(n);SMU[n]=SMU[n]||{}});
function smTouch(){var now=Date.now(),ch=false;Object.keys(SM).forEach(function(n){var cur=smSnap(n),pv=SMP[n];
  Object.keys(cur).forEach(function(k){if(cur[k]!==pv[k]){SMU[n][k]=now;ch=true}});Object.keys(pv).forEach(function(k){if(cur[k]===undefined){SMU[n][k]=now;ch=true}});SMP[n]=cur});
  if(ch)stj('smu',SMU)}
function smData(){smTouch();var o={};Object.keys(SM).forEach(function(n){var c=SM[n].get(),u=SMU[n],m={};Object.keys(c).concat(Object.keys(u)).forEach(function(k){m[k]=[c[k]===undefined?null:c[k],u[k]||0]});o[n]=m});return o}
function smMerge(a,b,cut){var o={};[a,b].forEach(function(x){Object.keys(x||{}).forEach(function(n){var m=o[n]=o[n]||{};Object.keys(x[n]).forEach(function(k){var v=x[n][k],w=m[k];if(!w||v[1]>w[1])m[k]=v})})});
  Object.keys(o).forEach(function(n){Object.keys(o[n]).forEach(function(k){if(o[n][k][0]===null&&o[n][k][1]<cut)delete o[n][k]})});return o}
function smApply(sm){var ch=false;Object.keys(SM).forEach(function(n){var m=sm[n];if(!m)return;var v={},u={};Object.keys(m).forEach(function(k){if(m[k][0]!==null)v[k]=m[k][0];u[k]=m[k][1]});
  SMU[n]=u;if(JSON.stringify(v)!==JSON.stringify(SM[n].get())){SM[n].set(v);ch=true}SMP[n]=smSnap(n)});stj('smu',SMU);
  if(ch){if(!$('home').hidden)refreshHome();if(!$('qbank').hidden&&typeof renderQB==='function'&&!CUR)renderQB()}}
/* start */
GLAST=gsnap();updUR();
refreshHome();
if(LINKCODE&&LOCKED)openSub(LINKCODE);
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();

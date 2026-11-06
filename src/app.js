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
var REVIEW=!!META.review;   // review copy for the authors (PRR_REVIEW build): everything open, no activation
/* free trial (owner, Nov 2026): on opening, the student chooses the trial («النسخة التجريبية لمدة ساعة كاملة») or «الاشتراك في النسخة المدفوعة».
   The trial opens the WHOLE book, cards, QBank and tools for ACC.trial_hours (owner: 1 h) from the moment it is chosen; then
   only the free topics (the first topic of each chapter) stay open until a code is entered. prr-trial = {s: start, m: latest time seen, x: 1 when ended}; a clock turned back by more than
   10 min ends it; the server keeps the first trial start of each device (/trial). */
var TRIAL_MS=(+ACC.trial_hours||0)*3600e3,TRIAL=(function(){var t=null,now=Date.now();try{t=JSON.parse(localStorage.getItem('prr-trial')||'null')}catch(e){}
  if(!t||!t.s)return null;if(now<t.m-6e5)t.x=1;t.m=Math.max(t.m,now);if(now>=t.s+TRIAL_MS)t.x=1;try{localStorage.setItem('prr-trial',JSON.stringify(t))}catch(e){}return t})();
function trialLeft(){return TRIAL_MS&&TRIAL&&!TRIAL.x?Math.max(0,TRIAL.s+TRIAL_MS-Date.now()):0}
var INTRIAL=!REVIEW&&!!TRIAL_MS&&!st('act')&&trialLeft()>0,TRIALNEW=!REVIEW&&!!TRIAL_MS&&!st('act')&&!TRIAL,TRIALEND=!REVIEW&&!!TRIAL_MS&&!st('act')&&!!TRIAL&&!INTRIAL;
var LOCKED=!REVIEW&&!INTRIAL&&(!st('act')||!ACC.public_key);
if(INTRIAL)setTimeout(function(){location.reload()},Math.min(trialLeft()+500,2e9));
function trialPost(start){if(SRV==null)return Promise.resolve(null);return fetch(SRV.replace(/\/$/,'')+'/trial',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({dev:DEV,start:start||0})}).then(function(r){return r.json()}).catch(function(){return null})}
/* opening the book (owner, Nov 2026: it was slow): the choice is saved at once, the server is told in the background (the first
   start is reconciled on the next launch) and the app reloads after a short animation with its own sound */
function choiceSnd(k){if(k==='trial')chime([523.3,659.3,784,1046.5,1318.5,1568],'triangle');else if(k==='paid')chime([392,523.3,659.3,784],'sine');else if(k==='code')chime([880,1174.7],'sine');else if(k==='ok')chime([523.3,784,1046.5,1568],'triangle');else chime([659.3,523.3],'sine')}
function openingFx(msg){var d=$('opening');if(!d){d=document.createElement('div');d.id='opening';document.body.appendChild(d)}
  d.innerHTML='<img src="img/logo.webp" alt=""><b class="ar" dir="rtl">'+msg+'</b><i><span></span></i>';requestAnimationFrame(function(){d.classList.add('on')})}
function startTrial(){st('chz','1');var now=Date.now(),t={s:now,m:now};try{localStorage.setItem('prr-trial',JSON.stringify(t))}catch(e){}
  if(SRV!=null)try{fetch(SRV.replace(/\/$/,'')+'/trial',{method:'POST',keepalive:true,cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({dev:DEV,start:now})}).catch(function(){})}catch(e){}
  choiceSnd('trial');$('sheet').hidden=true;openingFx('جارٍ فتح الكتاب كاملًا · '+trialDur());setTimeout(function(){location.reload()},900)}
if(INTRIAL&&!TRIAL.r)trialPost(TRIAL.s).then(function(j){if(!j||!j.ok)return;TRIAL.r=1;if(j.start&&j.start<TRIAL.s){TRIAL.s=j.start;if(Date.now()>=TRIAL.s+TRIAL_MS)TRIAL.x=1}try{localStorage.setItem('prr-trial',JSON.stringify(TRIAL))}catch(e){}if(TRIAL.x)location.reload()});
var SRV=ACC.server==='same'?(/^https?:$/.test(location.protocol)&&!/claude|localhost|127\.0/.test(location.hostname)?'':null):(ACC.server||null);
var LINKCODE=(location.hash.match(/code=([A-Za-z0-9-]{11,16})/)||[])[1];if(LINKCODE){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
window.addEventListener('hashchange',function(){var m=location.hash.match(/code=([A-Za-z0-9-]{11,16})/);if(m){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}if(LOCKED||INTRIAL)openSub(m[1])}});
function b64u(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
/* activation: the student types the code (PMR-XXXX-XXXX); the server binds this device (max 2 per code) and returns
   a token = DEVICE.signature, checked here with the public key so the book also opens offline */
function checkCode(code){code=(code||'').replace(/\s+/g,'');var parts=code.split('.'),sig=parts.pop(),me=DEV.replace('-','');
  if(!window.crypto||!crypto.subtle||!sig||parts.indexOf(me)<0)return Promise.resolve(false);
  return crypto.subtle.importKey('jwk',ACC.public_key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']).then(function(k){
    return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,b64u(sig),new TextEncoder().encode('PMR|pediatrics|1|'+parts.join(',')))}).catch(function(){return false})}
function relock(){try{localStorage.removeItem('prr-act');localStorage.removeItem('prr-code');localStorage.removeItem('prr-name')}catch(e){}location.reload()}
if(!LOCKED&&!REVIEW&&!INTRIAL)checkCode(st('act')).then(function(ok){if(!ok)return relock();
  /* online check: the authors can switch a code off or reset its devices; offline the book stays open */
  if(SRV!=null&&st('code')&&navigator.onLine!==false)fetch(SRV.replace(/\/$/,'')+'/check?dev='+DEV+'&code='+encodeURIComponent(st('code')),{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok===false&&j.reason!=='device')relock();else if(j&&j.ok&&typeof j.name==='string'&&j.name!==(st('name')||'')){st('name',j.name);welcomeName()}}).catch(function(){})});
if(LOCKED){var fd={};Object.keys(ACC.cards||{}).forEach(function(id){if(DECKS[id])fd[id]={short:DECKS[id].short,cards:ACC.cards[id].map(function(j){return DECKS[id].cards[j]})}});DECKS=fd}
function pageFree(i){var p=META.pages[i];if(!LOCKED||p.user||p.chcover)return true;if(/^(cover|authors|about|reviewers|howto|references|contents|abbr)/.test(p.id))return true;return p.ex?(ACC.free_chapters||[]).indexOf(p.ch)>=0:!!FREE[p.topic]}
function trialDur(){var h=+ACC.trial_hours||1;return h===1?'ساعة كاملة':h===2?'ساعتين':h+' ساعة'}
function trialTxt(){var ms=trialLeft(),h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);return 'باقي '+(h?h+' ساعة و':'')+m+' دقيقة'}
function freeMsg(){var fr='النسخة المجانية تفتح لك '+freeList()+' مع بطاقاته وأسئلته.';return TRIAL_MS?(TRIALNEW?fr+' ويمكنك أن تجرّب <b>الكتاب كله</b> مع كل الأدوات لمدة '+trialDur()+' مجانًا.':INTRIAL?'أنت الآن في <b>الفترة التجريبية</b>: الكتاب كله مفتوح ('+trialTxt()+').':'انتهت <b>الفترة التجريبية</b>. '+fr):fr}
function freeList(){if(ACC.free_label)return '<b>'+ACC.free_label.replace(/([A-Za-z][A-Za-z ]*[A-Za-z])/g,'<span class="en">$1</span>')+'</b>';return (ACC.free_names||[]).map(function(n){return '<b class="en">'+esc(n)+'</b>'}).join('، ')}
function E(t){return '<span class="en">'+t+'</span>'}
function subHtml(code){var wa=(ACC.whatsapp||'').replace(/[^0-9]/g,''),who=esc(ACC.contact_name||'المؤلفين');
  var msg='السلام عليكم '+(ACC.contact_name||'')+'، أرغب في الاشتراك في كتاب Pediatrics Master Review.';
  return '<div class="subx ar" dir="rtl"><img class="sublogo" src="img/logo.webp" alt="">'+
  (TRIALNEW?'<button type="button" class="chc tr" data-trial="1"><span><b>جرّب أولًا: النسخة التجريبية لمدة '+trialDur()+'</b><small>مجانًا، الكتاب كله مع كل الأدوات</small></span></button>':'')+'<p class="lead">'+freeMsg()+' اشترك مرة واحدة لتفتح <b>الكتاب كاملًا</b>، وكل البطاقات، وبنك الأسئلة كاملًا، طوال هذه الطبعة.</p>'+
  (ACC.price?'<div class="price">قيمة الاشتراك: '+esc(ACC.price)+'</div>':'')+
  '<b class="ssth">طريقة الاشتراك</b><ol class="sst">'+
  '<li><b>حوّل قيمة الاشتراك</b> عن طريق تطبيق بنكك'+(ACC.bankak_account?' إلى الحساب رقم <b class="sel" dir="ltr">'+esc(ACC.bankak_account)+'</b>'+(ACC.bankak_name?' باسم '+esc(ACC.bankak_name):''):'، وسنرسل لك رقم الحساب في واتساب')+'.</li>'+
  '<li><b>اضغط زر واتساب</b> في الأسفل، وأرسل صورة إشعار التحويل إلى '+who+(ACC.whatsapp_local?' على الرقم <b dir="ltr">'+esc(ACC.whatsapp_local)+'</b>':'')+'.</li>'+
  '<li>سنرسل لك <b>كود التفعيل</b> في واتساب. اكتبه في الخانة أدناه واضغط <b>تفعيل</b>.</li></ol>'+
  '<p class="muted">الكود الواحد يفتح <b>جهازين</b> (الهاتف والحاسوب مثلًا)، فاكتبه في كل جهاز. ويكفي الاتصال بالإنترنت مرة واحدة عند التفعيل.</p>'+
  (wa?'<a class="btn wa" id="waBtn" href="https://wa.me/'+wa+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">اضغط هنا لمراسلة '+who+' في واتساب</a>':'')+
  '<b class="ssth">عندك كود التفعيل؟</b>'+
  '<input id="actIn" class="actin" dir="ltr" placeholder="PMR-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" value="'+esc(code||'')+'"><button type="button" class="btn" id="actGo">تفعيل</button><p class="muted" id="actMsg"></p></div>'}
var ACT_ERR={unknown:'هذا الكود غير صحيح. تأكد منه واكتبه كما وصلك.',off:'هذا الكود موقوف. تواصل مع '+(ACC.contact_name||'المؤلفين')+'.',full:'هذا الكود مفعّل على جهازين من قبل. لتنقله إلى هذا الجهاز: افتح الكتاب في الجهاز القديم، ثم «الاشتراك» ← «إزالة الكود من هذا الجهاز». إذا فقدت الجهاز القديم فتواصل مع '+(ACC.contact_name||'المؤلفين')+'.',server:'حدثت مشكلة في الخادم. حاول مرة أخرى بعد قليل.',net:'لا يوجد اتصال بالإنترنت. التفعيل يحتاج إلى الإنترنت مرة واحدة فقط؛ تأكد من الاتصال وحاول مرة أخرى.',here:'التفعيل يعمل من رابط الكتاب الأصلي فقط.'};
function activate(code){var msg=$('actMsg'),go=$('actGo');code=(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!/^PMR[A-Z0-9]{8}$/.test(code)){msg.textContent='يكون الكود بهذا الشكل: PMR-XXXX-XXXX';return}
  if(SRV==null){msg.textContent=ACT_ERR.here;return}
  msg.textContent='جارٍ التفعيل…';go.disabled=true;
  fetch(SRV.replace(/\/$/,'')+'/activate',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({code:code,dev:DEV})})
    .then(function(r){return r.json()}).then(function(j){
      if(!j||!j.ok){go.disabled=false;msg.textContent=ACT_ERR[j&&j.reason]||ACT_ERR.server;return}
      return checkCode(j.token).then(function(ok){if(!ok){go.disabled=false;msg.textContent=ACT_ERR.server;return}
        st('act',j.token);st('code',j.code);if(j.name)st('name',j.name);msg.textContent='تم التفعيل بنجاح! يُفتح الكتاب كاملًا الآن…';choiceSnd('ok');$('sheet').hidden=true;openingFx('تم التفعيل · جارٍ فتح الكتاب كاملًا');setTimeout(function(){location.reload()},1000)})})
    .catch(function(){go.disabled=false;msg.textContent=ACT_ERR.net})}
function openChoose(){
  var ic1='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
      ic2='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8l4 10h12l4-10-6 4-4-7-4 7z"/></svg>',
      ic3='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2"/></svg>';
  
  openSheet('مرحبًا بك في الكتاب','<div class="chz ar" dir="rtl"><img class="sublogo" src="img/logo.webp" alt=""><p class="lead">اختر طريقة فتح الكتاب:</p>'+
    (TRIALNEW?'<button type="button" class="chc tr" id="chTrial"><i>'+ic1+'</i><span><b>النسخة التجريبية لمدة '+trialDur()+'</b><small>مجانًا: الكتاب كله، البطاقات، بنك الأسئلة، المحاضرات وكل أدوات المذاكرة. يبدأ الوقت من لحظة الضغط، وبعده يبقى '+esc(ACC.free_label||'جزء من الكتاب')+' مفتوحًا.</small></span></button>'
      :'<div class="chc tr off"><i>'+ic1+'</i><span><b>النسخة التجريبية'+(INTRIAL?': '+trialTxt():': انتهت')+'</b><small>'+(INTRIAL?'الكتاب كله مفتوح لك حتى نهاية الفترة.':'استُخدمت الفترة التجريبية على هذا الجهاز، ويبقى '+esc(ACC.free_label||'جزء من الكتاب')+' مفتوحًا.')+'</small></span></div>')+
    '<button type="button" class="chc pd" id="chPaid"><i>'+ic2+'</i><span><b>الاشتراك في النسخة المدفوعة</b><small>'+(ACC.price?esc(ACC.price)+' · ':'')+'الكتاب كاملًا طوال الطبعة على جهازين، مع مزامنة ملاحظاتك.</small></span></button>'+
    '<button type="button" class="chc cd" id="chCode"><i>'+ic3+'</i><span><b>عندي كود تفعيل</b><small>اكتب الكود الذي وصلك في واتساب.</small></span></button>'+
    '<button type="button" class="chfree" id="chFree">متابعة بالنسخة المجانية: '+esc(ACC.free_label||'جزء من الكتاب')+'</button></div>');
  $('chFree').onclick=function(){choiceSnd('free');st('chz','1');setMust(false);$('sheet').hidden=true};
  if($('chTrial'))$('chTrial').onclick=function(){this.disabled=true;startTrial()};
  $('chPaid').onclick=function(){choiceSnd('paid');openSub()};$('chCode').onclick=function(){choiceSnd('code');openSub();setTimeout(function(){var x=$('actIn');if(x){x.scrollIntoView({block:'center'});x.focus()}},250)}}
/* the student removes the code from this device himself (owner, Nov 2026): first tap asks to confirm, the second removes it
   (after a last sync, so nothing is lost); the device then locks and the code can open another device */
function releaseCode(){var b=$('relGo'),m=$('relMsg');
  if(!b.dataset.sure){b.dataset.sure='1';b.textContent='تأكيد: أزل الكود من هذا الجهاز';b.classList.add('sure');m.textContent='سيُقفل الكتاب في هذا الجهاز، ويمكنك استعمال الكود في جهاز آخر.';return}
  if(SRV==null){m.textContent='هذا يعمل من رابط الكتاب الأصلي فقط.';return}
  if(navigator.onLine===false){m.textContent='يحتاج هذا إلى الإنترنت. تأكد من الاتصال وحاول مرة أخرى.';return}
  b.disabled=true;m.textContent='جارٍ الحفظ والإزالة…';
  (typeof syncNow==='function'?syncNow().catch(function(){}):Promise.resolve()).then(function(){
    return fetch(SRV.replace(/\/$/,'')+'/release',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({code:st('code'),dev:DEV,token:st('act')})}).then(function(r){return r.json()})})
  .then(function(j){if(!j||(!j.ok&&j.reason!=='reset'&&j.reason!=='unknown')){b.disabled=false;m.textContent='تعذّرت الإزالة. حاول مرة أخرى بعد قليل.';return}
    choiceSnd('free');m.textContent='تمت إزالة الكود من هذا الجهاز.';setTimeout(relock,900)})
  .catch(function(){b.disabled=false;m.textContent='لا يوجد اتصال بالإنترنت. حاول مرة أخرى.'})}
function openSub(code){if(!LOCKED&&!INTRIAL){openSheet('الاشتراك','<div class="ar" dir="rtl"><p class="lead">هذا الجهاز مفعّل والكتاب مفتوح كاملًا. شكرًا لك!</p>'+(st('code')?'<div class="devc"><span>كود التفعيل</span><b dir="ltr">'+esc(st('code'))+'</b></div>'+
    '<div class="relx"><b class="ssth">تغيير الجهاز</b><p class="muted">إذا أردت أن تنقل الكتاب إلى جهاز آخر، أزل الكود من هذا الجهاز أولًا، ثم اكتبه في الجهاز الجديد. ملاحظاتك وتظليلك وتقدّمك محفوظة مع الكود وتظهر في الجهاز الجديد.</p>'+
    '<button type="button" class="btn relb" id="relGo">إزالة الكود من هذا الجهاز</button><p class="muted" id="relMsg"></p></div>':'')+'</div>');
  if($('relGo'))$('relGo').onclick=releaseCode;return}
  openSheet('الاشتراك في الكتاب',(TRIALNEW?'<button type="button" class="chback ar" dir="rtl" data-choose="1">→ الرجوع إلى الخيارات</button>':'')+subHtml(code));
  $('actGo').onclick=function(){activate($('actIn').value)};$('actIn').onkeydown=function(e){if(e.key==='Enter')activate(this.value)};
  if(code)activate(code)}
document.addEventListener('click',function(e){if(e.target.closest('[data-choose]')){choiceSnd('free');openChoose();return}if(e.target.closest('[data-trial]')){startTrial();return}if(e.target.closest('[data-sub]'))(TRIALNEW?openChoose:openSub)()});
var TOPICS=META.topics, PAGES=META.pages, NP=PAGES.length;
/* the student's own blank note pages (side-rail button): stored in prr-upg as id -> {a: key of the book page they follow, n: time made};
   they get their own keys (their id), so book page keys and everything saved on book pages stay the same */
var BOOKN=PAGES.length,UPG=stj('upg')||{};
(function(){var n={},ok={};PAGES.forEach(function(p,i){p.bn=i+1;var g=p.ex?'ex'+p.ch:p.topic;ok[g?g+':'+(n[g]=(n[g]||0)+1):p.id]=i});
  Object.keys(UPG).filter(function(id){return UPG[id]&&ok[UPG[id].a]!==undefined}).sort(function(x,y){return UPG[x].n-UPG[y].n}).forEach(function(id){
    var a=PAGES.indexOf(META.pages.filter(function(p){return p.bn===ok[UPG[id].a]+1})[0]),j=a+1;while(j<PAGES.length&&PAGES[j].user)j++;
    PAGES.splice(j,0,{id:id,user:1,label:PAGES[a].label+' · صفحتي',a:UPG[id].a})});
  NP=PAGES.length})();
var BIDX=[];PAGES.forEach(function(p,i){if(p.bn)BIDX[p.bn-1]=i});   // book page index -> place in the reader
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
srcPages=(function(){var k=0;return PAGES.map(function(p){if(!p.user)return srcPages[k++];var s=document.createElement('section');s.className='page upage';s.dataset.id=p.id;
  s.innerHTML='<div class="uph"><span>صفحتي · My notes</span><em>'+esc(PAGES[PAGES.indexOf(p)-1]?PAGES[PAGES.indexOf(p)-1].label:'')+'</em></div><div class="upl"></div>';return s})})();
srcPages.forEach(function(sec,i){
  var pw=document.createElement('div');pw.className='pw';pw.dataset.i=i;
  var host=document.createElement('div');host.className='bk';host.appendChild(sec.cloneNode(true));
  pw.appendChild(host);pagesEl.appendChild(pw);wraps.push(pw)});
if(LOCKED)wraps.forEach(function(pw,i){if(pageFree(i))return;pw.classList.add('lk');var o=document.createElement('div');o.className='lko';o.innerHTML='<div class="ar" dir="rtl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><b>هذه الصفحة للمشتركين</b><span>'+freeMsg()+' اشترك لتفتح الكتاب كاملًا مع كل البطاقات وبنك الأسئلة.</span><button type="button" class="btn" data-sub="1">اضغط هنا للاشتراك</button></div>';pw.appendChild(o)});
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
/* blank note pages (owner, Nov 2026): add an empty page after the page in view; delete one of your own pages */
/* page colour (owner, Nov 2026): white, cream (the first one) or light blue; the chosen colour is used for new pages,
   and on one of your own pages it also changes that page */
var UPC=['w','c','b'].indexOf(st('upc'))>=0?st('upc'):'c';
function upFly(){var f=$('penFly');f.dataset.k='u';var c=currentPage(),me=PAGES[c].user;
  f.innerHTML='<b>لون الصفحة</b><div class="upc">'+[['w','أبيض'],['c','كريمي'],['b','أزرق فاتح']].map(function(x){return '<button type="button" data-upc="'+x[0]+'" class="'+(x[0]===(me&&UPG[PAGES[c].id]?UPG[PAGES[c].id].c||'c':UPC)?'cur':'')+'"><i class="pcd pc'+x[0]+'"></i>'+x[1]+'</button>'}).join('')+'</div>'+
    '<b>أضف صفحة بعد دي</b><div class="upk">'+[[0,'بدون سطور'],[1,'سطور صغيرة'],[2,'سطور كبيرة']].map(function(x){return '<button type="button" data-up="add" data-ls="'+x[0]+'"><i class="upi ls'+x[0]+' pc'+UPC+'"></i>'+x[1]+'</button>'}).join('')+'</div>'+(me?'<button type="button" class="ptog" data-up="del">🗑 احذف صفحتي دي</button>':'')+
    '<small>صفحة تكتب وترسم فيها بالقلم والنص، وتتحفظ مع ملاحظاتك.</small>';flyAt(f,$('upBtn'))}
$('upBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='u'){penFly(false);return}upFly()};
$('penFly').addEventListener('click',function(e){var u=e.target.closest('[data-upc]');if(u){e.stopPropagation();UPC=u.dataset.upc;st('upc',UPC);var cc=currentPage(),pp=PAGES[cc];
    if(pp.user&&UPG[pp.id]){UPG[pp.id].c=UPC;stj('upg',UPG);if(typeof syncSoon==='function')syncSoon();
      [srcPages[cc],wraps[cc].querySelector('section.upage')].forEach(function(sec){if(sec)sec.className=sec.className.replace(/ pc\w/,'')+' pc'+UPC})}
    upFly();return}
  var b=e.target.closest('[data-up]');if(!b)return;e.stopPropagation();var c=currentPage(),p=PAGES[c];
  var go;if(b.dataset.up==='add'){var id='u'+Date.now().toString(36);UPG[id]={a:p.user?p.a:PKEY[c],n:Date.now(),s:+b.dataset.ls||0,c:UPC};stj('upg',UPG);go=id}
  else if(p.user){delete UPG[p.id];stj('upg',UPG);if(INK[p.id]){delete INK[p.id];saveInk()}go=p.a}
  if(typeof smData==='function')try{smData()}catch(x){}
  penFly(false);upgRebuild();var gi=byKey[go];if(gi!==undefined){var sc=$('scroller');sc.scrollTop=wraps[gi].offsetTop-10;onScroll()}
  railTip(b.dataset.up==='add'?'اتضافت صفحة فاضية':'الصفحة اتحذفت')});
/* add / remove the student's blank pages in place (owner, Nov 2026: no reload, the reader stays where it is):
   take the user pages out, put them back from UPG, then renumber everything that is indexed by reader position */
function upgSec(p,prev){var s=document.createElement('section');s.className='page upage ls'+(UPG[p.id]&&UPG[p.id].s!=null?UPG[p.id].s:1)+' pc'+((UPG[p.id]&&UPG[p.id].c)||'c');s.dataset.id=p.id;
  s.innerHTML='<div class="uph"><span>صفحتي · My notes</span><em>'+esc(prev?prev.label:'')+'</em></div><div class="upl"></div>';return s}
function upgRebuild(){
  for(var i=PAGES.length-1;i>=0;i--)if(PAGES[i].user){PAGES.splice(i,1);srcPages.splice(i,1);wraps[i].remove();wraps.splice(i,1)}
  var n0={};PAGES.forEach(function(p){var g=p.ex?'ex'+p.ch:p.topic;p._k=g?g+':'+(n0[g]=(n0[g]||0)+1):p.id});
  Object.keys(UPG).filter(function(id){return UPG[id]}).sort(function(x,y){return UPG[x].n-UPG[y].n}).forEach(function(id){
    var a=-1;for(var q=0;q<PAGES.length;q++)if(!PAGES[q].user&&PAGES[q]._k===UPG[id].a){a=q;break}
    if(a<0)return;var j=a+1;while(j<PAGES.length&&PAGES[j].user)j++;
    var np={id:id,user:1,label:PAGES[a].label+' · صفحتي',a:UPG[id].a},sec=upgSec(np,PAGES[j-1]);
    PAGES.splice(j,0,np);srcPages.splice(j,0,sec);
    var pw=document.createElement('div');pw.className='pw';var host=document.createElement('div');host.className='bk';host.appendChild(sec.cloneNode(true));pw.appendChild(host);
    pagesEl.insertBefore(pw,wraps[j]||null);wraps.splice(j,0,pw)});
  NP=PAGES.length;wraps.forEach(function(pw,i){pw.dataset.i=i;delete pw.dataset.dec});
  BIDX=[];PAGES.forEach(function(p,i){if(p.bn)BIDX[p.bn-1]=i});
  byId={};PAGES.forEach(function(p,i){byId[p.id]=i});
  PKEY=[];byKey={};KEYOF={};var n={};PAGES.forEach(function(p,i){var g=p.ex?'ex'+p.ch:p.topic,k=g?g+':'+(n[g]=(n[g]||0)+1):p.id;PKEY[i]=k;byKey[k]=i;KEYOF[p.id]=k});
  PTXT={};layout();PAGES.forEach(function(p,i){if(p.user||INK[PKEY[i]])inkRender(i)})}
$('zoomBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='z')penFly(false);else zoomFly()};
/* two-finger pinch on the pages zooms, also while the pen is on (owner, Nov 2026): once the fingers spread or close by > 8% it is a zoom, otherwise two fingers scroll */
var pin=null,pinF=0;function tdist(e){var a=e.touches[0],b=e.touches[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
$('scroller').addEventListener('touchstart',function(e){if(e.touches.length===2)pin={d:tdist(e),s:zscale()};else if(e.touches.length<2)pin=null},{passive:true});
$('scroller').addEventListener('touchmove',function(e){if(!pin||e.touches.length!==2)return;e.preventDefault();if(!pin.zoomed&&Math.abs(tdist(e)/pin.d-1)>.08)pin.zoomed=true;if((INKON||TXON)&&!pin.zoomed)return;var z=Math.round(Math.max(.3,Math.min(4,pin.s*tdist(e)/pin.d))*100)/100;
  if(pinF)return;pinF=requestAnimationFrame(function(){pinF=0;if(pin&&Math.abs(z-zscale())>=.02)setZoom(String(z))})},{passive:false});
$('scroller').addEventListener('touchend',function(e){if(e.touches.length<2)pin=null},{passive:true});
$('scroller').addEventListener('wheel',function(e){if(!e.ctrlKey||$('reader').hidden)return;e.preventDefault();zstep(e.deltaY<0?1.1:1/1.1)},{passive:false});
window.addEventListener('resize',function(){layout();fitCover()});
$('zoomLbl').textContent=zlabel();
function currentPage(){var sc=$('scroller'),mid=sc.scrollTop+sc.clientHeight*0.35,cur=0;for(var i=0;i<wraps.length;i++){if(wraps[i].offsetTop<=mid)cur=i}return cur}
var lastCur=-1;   // page in view (renderPage re-decorates pages near it)
function onScroll(){var c=currentPage();lastCur=c;decorateNear(c);updLis(c);updPr(c);fitRail();if(!$('pnum').classList.contains('ed'))$('pnum').textContent=PAGES[c].user?'✎ صفحتي':PAGES[c].bn+' / '+BOOKN;$('subtitle').textContent=PAGES[c].label;st('page',PKEY[c]);if(c!==lastSyncPg){lastSyncPg=c;if(typeof syncSoon==='function'&&SYNC)syncSoon()}}
/* page number: tap it, type a page and press Enter (owner, Nov 2026) */
(function(){var pn=$('pnum');if(!pn)return;pn.title='Go to page';pn.addEventListener('click',function(e){e.stopPropagation();if(pn.classList.contains('ed'))return;
  var cur=PAGES[currentPage()]||{},v=cur.bn||'';pn.classList.add('ed');
  pn.innerHTML='<input type="number" inputmode="numeric" min="1" max="'+BOOKN+'" value="'+v+'" aria-label="Page number"><span>/ '+BOOKN+'</span><button type="button" aria-label="Go">Go</button>';
  var inp=pn.querySelector('input'),done=false;inp.focus();inp.select();
  function fin(go){if(done)return;done=true;var n=parseInt(inp.value,10);pn.classList.remove('ed');if(go&&n>=1&&n<=BOOKN)goPage(n-1);onScroll()}
  inp.onkeydown=function(ev){if(ev.key==='Enter'){ev.preventDefault();fin(true)}else if(ev.key==='Escape')fin(false)};
  pn.querySelector('button').onmousedown=function(ev){ev.preventDefault()};pn.querySelector('button').onclick=function(ev){ev.stopPropagation();fin(true)};
  inp.onblur=function(){setTimeout(function(){fin(false)},150)}})})();
var lastSyncPg=-1;
/* page progress button: each tap moves Not read (red) → Done (blue) → Mastered (green) → Not read */
var PRS=[['ما قريتها','<circle cx="12" cy="12" r="8"/>'],['قريتها','<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'],['أتقنتها','<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>']];
/* the side rail never scrolls: when it is taller than the reader it is scaled down so every button shows */
function fitRail(){var r=$('rbar');if(!r||$('reader').hidden)return;railSpace()}   // tools bar sits along the top of the reader (owner, Nov 2026)
/* the open rail never covers the book: the pages get the space to its left; hidden = full width (show button in the top bar) */
/* full-page reading (owner, Nov 2026): scrolling down hides the top bar, the tools bar and the bottom bar; only a tap on the page brings them back */
var IMM=false,immY=0,immT=0;
function busyTools(){try{return INKON||TXON||penOn()||!$('penFly').hidden||(window.getSelection&&String(getSelection()))}catch(e){return false}}
function setImm(on){if(on===IMM)return;var sc=$('scroller'),a=sc.getBoundingClientRect().top;IMM=on;$('app').classList.toggle('imm',on);sc._rw=-1;railSpace();
  var b=sc.getBoundingClientRect().top;immT=Date.now();sc.scrollTop+=b-a;immY=sc.scrollTop}
$('scroller').addEventListener('scroll',function(){var sc=$('scroller'),y=sc.scrollTop;if(Date.now()-immT<350){immY=y;return}
  var d=y-immY;if(d>60&&y>120&&!busyTools()){setImm(true);immY=y}else if(d<0)immY=Math.max(immY+d,y);else if(Math.abs(d)>200)immY=y},{passive:true});
pagesEl.addEventListener('click',function(e){if(busyTools()||e.target.closest('a,button,[data-p],mark,span.nm,.gt,.gtip,input,textarea'))return;setImm(!IMM)});
function railSpace(){var r=$('rbar'),sc=$('scroller');if(!r||!sc)return;var w=(r.classList.contains('off')||IMM)?0:Math.ceil(r.offsetHeight);
  if(sc._rw===w)return;sc._rw=w;var cur=currentPage(),wp=wraps[cur],f=wp&&wp.offsetHeight?(sc.scrollTop-wp.offsetTop)/wp.offsetHeight:0;
  sc.style.top=w+'px';sc.style.right='0px';layout();if(wp)sc.scrollTop=wp.offsetTop+f*wp.offsetHeight}
window.addEventListener('resize',fitRail);
function updPr(c){var b=$('prBtn'),pg=PAGES[c]||{};b.hidden=!pg.topic;b.classList.toggle('soon',LOCKED&&!pageFree(c));var v=readSet[PKEY[c]]||0;b.className='pr'+v;b.querySelector('svg').innerHTML=PRS[v][1];$('prLbl').textContent=PRS[v][0]}
var actx=null;function chime(notes,type){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var t0=actx.currentTime+.02;
  notes.forEach(function(f,i){var o=actx.createOscillator(),g=actx.createGain(),t=t0+i*.09;o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.55);o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+.6)})}catch(e){}}
/* tapping the button opens a small panel with the three choices; each choice has its own sound */
$('prBtn').onclick=function(e){e.stopPropagation();var c=currentPage();if(LOCKED&&!pageFree(c)){railTip('هذه الصفحة للمشتركين: بعد الاشتراك يمكنك تعليمها «قرأتها» أو «أتقنتها»');return}
  var f=$('penFly');if(!f.hidden&&f.dataset.k==='p'){penFly(false);return}f.dataset.k='p';var v=readSet[PKEY[c]]||0;
  f.innerHTML='<b>الصفحة دي</b>'+PRS.map(function(x,n){return '<button type="button" class="propt p'+n+(n===v?' cur':'')+'" data-pv="'+n+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+x[1]+'</svg>'+x[0]+'</button>'}).join('');flyAt(f,$('prBtn'))};
function setProg(v){var c=currentPage(),k=PKEY[c];if(v)readSet[k]=v;else delete readSet[k];PROGU[k]=Date.now();saveRead();updPr(c);
  var b=$('prBtn');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
  if(v===0)chime([523.3,392],'sine');else if(v===1)chime([659.3,987.8],'sine');else chime([523.3,659.3,784,1046.5,1318.5],'triangle')}
$('scroller').addEventListener('scroll',onScroll,{passive:true});
function goPage(i){goIdx(BIDX[i]!=null?BIDX[i]:i)}
function goIdx(i){i=Math.max(0,Math.min(NP-1,i));show('reader');layout();$('scroller').scrollTop=wraps[i].offsetTop-10;onScroll()}
function lastPage(){var k=st('page');return k&&byKey[k]!==undefined?byKey[k]:0}
pagesEl.addEventListener('click',function(e){var rq=e.target.closest('table.rvtab tr.q');if(rq&&!e.target.closest('.gt')){rq.classList.toggle('open');return}var nm=e.target.closest('span.nm');if(nm){openNote(+nm.closest('.pw').dataset.i,+nm.dataset.k);return}
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
  termify(sec);fillPage(sec)}
/* owner (Nov 2026): when a page has spare room at the bottom, spread it inside the page (roomier table rows and list items,
   then wider gaps between the boxes) instead of leaving the content packed at the top */
function fillPage(sec){var m=sec.querySelector('.mzm'),ft=sec.querySelector('.ftr');if(!m||!ft||sec.classList.contains('ex'))return;
  // owner (Nov 2026): use spare room INSIDE the boxes (more line spacing, padding, bigger rows), not as gaps between boxes
  function free(){var sc=sec.getBoundingClientRect().height/sec.offsetHeight||1,b=0;[].forEach.call(m.children,function(c){var r=c.getBoundingClientRect();if(r.height)b=Math.max(b,r.bottom)});return (ft.getBoundingClientRect().top-b)/sc}
  if(free()<80)return;
  function set(t){sec.style.setProperty('--ft',t.toFixed(3))}
  sec.classList.add('fill');var lo=0,hi=2.2;set(hi);if(free()>=50){return}
  for(var k=0;k<7;k++){var mid=(lo+hi)/2;set(mid);if(free()>=50)lo=mid;else hi=mid}set(lo)}
function decorateNear(c){for(var i=Math.max(0,c-1);i<=Math.min(NP-1,c+2);i++)decorate(i)}

/* night */
/* book page look (owner): the top-bar button (shown in the reader) opens 3 choices: day (white pages, the default),
   eye comfort (warm, softer paper, less blue light) and night (dark pages). Saved in prr-bmode. */
var BMODES={day:{l:'نهار',d:'صفحات بيضاء',i:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'},
  eye:{l:'حماية العين',d:'لون دافي ومريح للقراية الطويلة',i:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'},
  night:{l:'ليلي',d:'صفحات غامقة',i:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'}};
var BMODE=BMODES[st('bmode')]?st('bmode'):'day';
function bmSvg(m){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+BMODES[m].i+'</svg>'}
/* flashcards and question bank have their own look (owner, Nov 2026): day, eye comfort or night (the dark default); saved in prr-smode */
var SMODE=BMODES[st('smode')]?st('smode'):'night',CURV='home';
function studyV(){return CURV==='cards'||CURV==='qbank'}
function setNight(){var r=$('reader');r.classList.toggle('night',BMODE==='night');r.classList.toggle('eye',BMODE==='eye');
  ['cards','qbank'].forEach(function(id){var v=$(id);if(v){v.classList.toggle('sday',SMODE==='day');v.classList.toggle('seye',SMODE==='eye')}});
  var m=studyV()?SMODE:BMODE,b=$('themeBtn');b.innerHTML=bmSvg(m);b.setAttribute('aria-label','Colour: '+m);b.title=BMODES[m].l}setNight();
var bmMenu=document.createElement('div');bmMenu.className='bmmenu';bmMenu.hidden=true;bmMenu.lang='ar';document.body.appendChild(bmMenu);
function bmOpen(){var sv=studyV(),cur=sv?SMODE:BMODE,SD={day:'خلفية فاتحة',eye:'لون دافئ مريح للعين',night:'خلفية غامقة'};bmMenu.innerHTML='<b>'+(sv?'لون الشاشة':'لون الصفحات')+'</b>'+Object.keys(BMODES).map(function(m){return '<button type="button" data-bm="'+m+'" class="'+(m===cur?'cur':'')+'">'+bmSvg(m)+'<span>'+BMODES[m].l+'<small>'+(sv?SD[m]:BMODES[m].d)+'</small></span></button>'}).join('');
  var r=$('themeBtn').getBoundingClientRect();bmMenu.style.top=(r.bottom+6)+'px';bmMenu.style.right=Math.max(8,innerWidth-r.right)+'px';bmMenu.hidden=false}
/* Home day / night colours (owner, Nov 2026): sun/moon button in the top bar on Home, saved in prr-hmode */
var HMODE=st('hmode')==='night'?'night':'day';
function setHm(){$('home').classList.toggle('dark',HMODE==='night');$('hmMode').innerHTML=HMODE==='night'?
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>':
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  $('hmMode').title=HMODE==='night'?'Day colours':'Night colours'}
$('hmMode').onclick=function(){HMODE=HMODE==='night'?'day':'night';st('hmode',HMODE);setHm()};setHm();
function toggleDark(){if(bmMenu.hidden)bmOpen();else bmMenu.hidden=true}
bmMenu.addEventListener('click',function(e){var b=e.target.closest('[data-bm]');if(!b)return;if(studyV()){SMODE=b.dataset.bm;st('smode',SMODE)}else{BMODE=b.dataset.bm;st('bmode',BMODE)}setNight();bmMenu.hidden=true});
document.addEventListener('click',function(e){if(!bmMenu.hidden&&!e.target.closest('.bmmenu,#themeBtn'))bmMenu.hidden=true});
/* hidden rail: its show button sits in the top bar (takes no room from the page and covers no text) */
function setRail(off){$('rbar').classList.toggle('off',off);$('rbShow').hidden=!off||$('reader').hidden;st('rail',off?'off':'on');setTimeout(railSpace,off?0:60)}setRail(st('rail')==='off');
$('rbHide').onclick=function(){setRail(true)};$('rbShow').onclick=function(){setRail(false)};

/* ---------- views ---------- */
var views=['home','reader','cards','search','qbank','lectures'];
function show(v){if(v!=='reader'&&typeof setImm==='function')setImm(false);views.forEach(function(x){$(x).hidden=x!==v});[].forEach.call($('tabs').children,function(b){b.classList.toggle('on',b.dataset.go===v)});
  $('backBtn').hidden=v==='home';$('hmMode').hidden=v!=='home';$('themeBtn').hidden=!(v==='reader'||v==='cards'||v==='qbank');CURV=v;setNight();bmMenu.hidden=true;$('rbShow').hidden=v!=='reader'||!$('rbar').classList.contains('off');hideBar();
  if(v==='home'){$('subtitle').textContent=META.edition;refreshHome()}
  if(v==='cards'){$('subtitle').textContent='Flashcards';if(!started)startDeck(curDeck)}
  if(v==='search'){$('subtitle').textContent='Search the book';setTimeout(function(){$('q').focus()},50)}
  if(v==='reader'){layout();onScroll()}
  if(v==='lectures'){$('subtitle').textContent='Audio lectures';renderLect()}
  if(v==='qbank'){if(CUR&&CUR.done&&CUR.review===undefined)CUR=null;CUR&&!CUR.done?renderQ():renderQB()}}
document.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(g&&!e.target.closest('.bk')){var v=g.dataset.go;if(v==='reader')goIdx(lastPage());else show(v)}
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
  function tile(k,n,of,cls,showPct){var v=pct(n,of);return '<div class="pt '+cls+'"><b>'+(showPct?v+'<small>%</small>':n+'<small> / '+of+'</small>')+'</b><span>'+k+'</span>'+(showPct?'<em>'+n+' / '+of+'</em>':'')+'<div class="pbar"><i style="width:'+v+'%"></i></div></div>'}
  $('prog').innerHTML='<div class="pts">'+tile('Pages read',tr,tp,'pdone',1)+tile('Pages mastered',tm,tp,'pmast',1)+tile('Flashcards known',tk,tc,'pcard',1)+tile('Topics finished',done,TOPICS.length,'ptop',0)+'</div>'+
    '<p class="prhint" dir="rtl" lang="ar">علّم كل صفحة بزر التقدّم في القارئ: ضغطة = <b class="c1">قريتها</b>، ضغطة تانية = <b class="c2">أتقنتها</b>، والتالتة بترجعها <b class="c0">ما قريتها</b>.</p>';
  // Home: parts → chapter cards (tap to open) → topic rows with progress
  var tById={};TOPICS.forEach(function(t){tById[t.id]=t});
  var cur=(PAGES[lastPage()]||{}).topic, curCh=cur&&tById[cur]?tById[cur].ch:null;
  var parts=[],PIMG=['part1','part2','part3','part4','part5'],PCLR=[];
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
    return '<details class="hpt"'+(curIn?' open':'')+'><summary class="shine" style="background-image:linear-gradient(90deg,rgba(6,27,36,.62) 0,rgba(6,27,36,.22) 42%,rgba(6,27,36,0) 62%),url(img/'+PIMG[pi]+'.jpg),linear-gradient(120deg,#08232f 0,'+(PCLR[pi]||'#13606b')+' 100%)">'+
      '<span class="pk">Part '+['I','II','III','IV','V','VI','VII','VIII'][pi]+'</span><b class="gtx">'+esc(pt.name)+'</b><small>'+pt.chs.length+' chapter'+(pt.chs.length>1?'s':'')+' · '+nt+' topic'+(nt>1?'s':'')+' · '+pct(pr,pn)+'% done</small>'+
      '<span class="hx">›</span><span class="tbar"><i style="width:'+pct(pr,pn)+'%"></i></span></summary><div class="hpb">'+inner+'</div></details>'}).join('');
  if(deckIds.length)refreshDaily();else $('dailyBtn').hidden=true;
  var nn=0;Object.keys(HL).forEach(function(k){HL[k].forEach(function(h){if(h.n)nn++})});
  var tparts=[];if(nn)tparts.push(nn+' note'+(nn>1?'s':''));if(nh)tparts.push(nh+' highlight'+(nh>1?'s':''));
  if($('toolHl'))$('toolHl').textContent=tparts.length?tparts.join(' · '):'Select text while reading';
}
$('pill').textContent=META.pill;
$('contBtn').onclick=function(){goIdx(lastPage())};
$('coverBtn').onclick=function(){goPage(0)};
if(LOCKED||INTRIAL){$('trialCard').hidden=false;var tcu=function(){$('trialCard').querySelector('b').textContent=INTRIAL?'الفترة التجريبية · '+trialTxt():TRIALNEW?'جرّب الكتاب كله · '+trialDur()+' مجانًا':'النسخة المجانية';$('trialTxt').innerHTML=INTRIAL?'الكتاب كله مفتوح لك الآن. بعد انتهاء الفترة يبقى '+esc(ACC.free_label||'جزء من الكتاب')+' مفتوحًا.':TRIALNEW?'الكتاب كله مع كل الأدوات مجانًا، أو اشترك في النسخة المدفوعة.':freeMsg()+' اشترك لتفتح الكتاب كاملًا.';$('trialCard').querySelector('i').textContent=TRIALNEW?'اضغط هنا للاختيار':'اضغط هنا للاشتراك'};tcu();if(INTRIAL)setInterval(tcu,30000)}else if(!REVIEW&&st('code')){var pg=$('prog');if(pg){pg.parentNode.insertBefore($('trialCard'),pg.nextSibling);$('trialCard').style.marginTop='16px'}$('trialCard').hidden=false;$('trialCard').classList.add('subd');$('trialCard').querySelector('b').textContent='أنت مشترك · الكتاب مفتوح كاملًا';$('trialTxt').innerHTML='الكود <bdi dir="ltr">'+esc(st('code'))+'</bdi> · لنقل الكتاب إلى جهاز آخر';$('trialCard').querySelector('i').textContent='إدارة الجهاز'}$('hmToc').onclick=function(){$('tocBtn').click()};
$('rrTool').onclick=function(){goPage(META.rr-1)};

/* ---------- sheet: contents and highlights ---------- */
/* MUST (owner, Nov 2026): on the first opening the student has to pick one of the choices; the sheet cannot be closed until then */
var MUST=false;function setMust(v){MUST=v;$('sheet').classList.toggle('must',v)}
function openSheet(title,html){$('sheetT').textContent=title;$('sheetBody').innerHTML=html;$('sheet').hidden=false;$('sheet').classList.toggle('must',MUST)}
function contentsHtml(){return META.contents.map(function(ch){
  return (ch.part?'<div class="partx">'+esc(ch.part)+'</div>':'')+'<div class="sh" style="margin:14px 0 4px"><h3><small>Chapter '+ch.no+'</small> · '+esc(ch.title)+'</h3></div>'+ch.topics.map(function(t){
    if(!t.p)return '<div class="trow soon c'+ch.no+'"><span class="n">'+esc(t.no)+'</span><span class="l">'+esc(t.title)+'<small>Coming soon</small></span><span class="p"></span></div>';
    var tt=TOPICS.filter(function(x){return x.id===t.id})[0],ok=tt&&topicRead(tt)===tt.pages.length;
    return '<button class="trow c'+ch.no+'" type="button" data-p="'+t.p+'"><span class="n">'+esc(t.no)+'</span><span class="l">'+esc(t.title)+'<small>'+esc(t.sub||'')+'</small></span><span class="p'+(ok?' ok':'')+'">'+(ok?'✓ ':'')+'p '+t.p+'</span></button>'}).join('')}).join('')+
  '<button class="trow rr" type="button" data-p="'+META.rr+'"><span class="n">RR</span><span class="l">Rapid review<small>Every clue → answer</small></span><span class="p">p '+META.rr+'</span></button>'}
$('tocBtn').onclick=function(){openSheet('Contents',contentsHtml())};
/* Notes and highlights are listed apart: tab Notes = everything with a note, tab Highlights = coloured highlights */
var HLTAB=st('hltab')==='h'?'h':'n';
function hlHtml(){var notes=[],hls=[];PAGES.forEach(function(p,i){(HL[PKEY[i]]||[]).forEach(function(h){var x={i:i,h:h};if(h.n)notes.push(x);if(h.c!=='n')hls.push(x)})});
  var list=HLTAB==='n'?notes:hls;
  var tabs='<div class="seg hltabs">'+[['n','Notes',notes.length],['h','Highlights',hls.length]].map(function(t){return '<button type="button" data-ht="'+t[0]+'" class="'+(HLTAB===t[0]?'on':'')+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></button>'}).join('')+'</div>';
  var empty=HLTAB==='n'?'No notes yet. In the reader, select text and tap <b>Note</b> to write one.':'No highlights yet. In the reader, select text and tap a colour.';
  return syncBar()+tabs+(list.length?list.map(function(x){var note=HLTAB==='n';return '<button class="hli'+(note?' isn':'')+'" type="button" data-pi="'+x.i+'"><i class="'+x.h.c+'"></i><span><b>p '+(PAGES[x.i].bn||'✎')+' · '+esc(PAGES[x.i].label)+'</b>'+
    (note?'<em class="hn">'+esc(x.h.n)+'</em><span class="hq">“'+esc(x.h.t)+'”</span>':'<span>'+esc(x.h.t)+'</span>'+(x.h.n?'<em class="hn">✎ note</em>':''))+'</span></button>'}).join(''):'<p class="empty">'+empty+'</p>')}
document.addEventListener('click',function(e){var b=e.target.closest('[data-ht]');if(!b)return;HLTAB=b.dataset.ht;st('hltab',HLTAB);$('sheetBody').innerHTML=hlHtml()});
if($('hlTool'))$('hlTool').onclick=function(){openSheet('Notes & highlights',hlHtml())};
$('sheetX').onclick=function(){if(MUST)return;$('sheet').hidden=true};
$('sheet').addEventListener('click',function(e){if(e.target===$('sheet')&&!MUST)$('sheet').hidden=true;var ri=e.target.closest('[data-pi]');if(ri){$('sheet').hidden=true;goIdx(+ri.dataset.pi);return}var r=e.target.closest('[data-p]');if(r){$('sheet').hidden=true;goPage(+r.dataset.p-1)}});

/* ---------- highlights ---------- */
function textNodes(sec){var w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode.closest('svg')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),a=[];while(w.nextNode())a.push(w.currentNode);return a}
function renderPage(i){var host=wraps[i].firstChild,sec=srcPages[i].cloneNode(true);host.innerHTML='';host.appendChild(sec);delete wraps[i].dataset.dec;
  (HL[PKEY[i]]||[]).forEach(function(h,k){if(!hlOk(i,h))return;wrapRange(sec,h.s,h.e,function(){var m=document.createElement('mark');m.className='uhl '+h.c+(h.uw?' uw'+h.uw:'')+(h.hs===2?' hs2':'')+(h.n?' hasn':'');m.dataset.k=k;return m});
    if(h.n){var ms=sec.querySelectorAll('mark.uhl[data-k="'+k+'"]'),last=ms[ms.length-1];if(last){var nm=document.createElement('span');nm.className='nm';nm.dataset.k=k;nm.title='Note';last.parentNode.insertBefore(nm,last.nextSibling)}}});if(Math.abs(i-lastCur)<=2)decorate(i)}
/* Highlights and notes are saved as text offsets on a page. When the book is re-laid out (new pages, moved boxes), the offsets
   can point at other words: the saved text (h.t) finds its place again in the same topic, and a highlight whose text is gone is not drawn. */
var PTXT={};function ptext(i){if(PTXT[i]===undefined){var raw=textNodes(srcPages[i]).map(function(n){return n.nodeValue}).join(''),nrm='',map=[],sp=true;
  for(var j=0;j<raw.length;j++){var c=raw[j];if(/\s/.test(c)){if(!sp){nrm+=' ';map.push(j);sp=true}}else{nrm+=c;map.push(j);sp=false}}PTXT[i]={raw:raw,n:nrm,map:map}}return PTXT[i]}
function hlOk(i,h){if(!h.t)return true;var P=ptext(i);return P.raw.slice(h.s,h.e).replace(/\s+/g,' ').trim()===h.t}
function hlFind(i,h){var P=ptext(i),t=h.t,full=!(t.length>=240&&h.e-h.s>240),best=-1,from=0,p,want=h.s||0;
  while((p=P.n.indexOf(t,from))>=0){if(best<0||Math.abs(p-want)<Math.abs(best-want))best=p;from=p+1}
  if(best<0)return null;var s=P.map[best],e=full?P.map[best+t.length-1]+1:s+(h.e-h.s);return {s:s,e:e}}
function reanchorHL(){var moved=false,now=Date.now(),before=hsnap();
  Object.keys(HL).forEach(function(k){var i=byKey[k];if(i===undefined)return;var keep=[];
    HL[k].forEach(function(h){if(hlOk(i,h)){keep.push(h);return}
      var g=k.slice(0,k.lastIndexOf(':')),cands=[i];for(var d=1;d<8;d++){[i-d,i+d].forEach(function(j){if(j>=0&&j<PKEY.length&&PKEY[j].slice(0,PKEY[j].lastIndexOf(':'))===g)cands.push(j)})}
      for(var c=0;c<cands.length;c++){var f=hlFind(cands[c],h);if(f){h.s=f.s;h.e=f.e;h.u=now;moved=true;if(cands[c]===i)keep.push(h);else{var k2=PKEY[cands[c]];(HL[k2]=HL[k2]||[]).push(h)}return}}
      keep.push(h)});  // text not found: kept (still listed in My notes) but not drawn
    HL[k]=keep});
  if(!moved)return false;var cur=hsnap();Object.keys(before).forEach(function(id){if(cur[id]===undefined)HLDEL[id]=now});Object.keys(cur).forEach(function(id){delete HLDEL[id]});
  HLPREV=cur;stj('hl',HL);stj('hldel',HLDEL);if(typeof syncSoon==='function')syncSoon();return true}
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
var HCOL=['y','g','b','p','o','v'],HST=+st('hst')===2?2:1,PCOL=HCOL.indexOf(st('pcol'))>=0?st('pcol'):'y',PEN=st('pen')==='1',NPEN=st('npen')==='1'&&st('pen')!=='1',FINE=window.matchMedia&&matchMedia('(pointer:fine)').matches,penDrag=null,penT=null,lastPT='';
/* the note pen works the same way: with it on, the text you select (or swipe / long-press) opens the note box at once.
   Only one pen is on at a time. */
/* underline: a third quick tool like the highlighter; it saves into the same highlights list with colours ur/uk/ub/uo */
var UCOLS=['ur','uk','ub','uo'],UHEX={ur:'#dc2626',uk:'#111827',ub:'#1d4ed8',uo:'#ea580c'},UCOL=UCOLS.indexOf(st('ucol'))>=0?st('ucol'):'ur',UW=Math.max(1,Math.min(3,+st('uw')||2)),UPEN=st('upen')==='1'&&!PEN&&!NPEN;
function isU(c){return c&&c.charAt(0)==='u'}
function penOn(){return PEN||NPEN||UPEN}
/* a touch selection longer than a few lines is not marked at once (owner, Nov 2026: a scroll could mark a whole page): the colour bar asks first */
var lastScroll=0;$('scroller').addEventListener('scroll',function(){lastScroll=Date.now()},{passive:true});
function penApply(o){if(!NPEN&&lastPT!=='mouse'&&o.t&&o.t.length>450){pending=o;showPalette();return}if(NPEN){window.getSelection().removeAllRanges();hideBar();openNote(o.i,null,o)}else addHL(o,UPEN?UCOL:PCOL)}
function setPens(h,n,u){PEN=h;NPEN=n;UPEN=!!u;st('pen',h?'1':'0');st('npen',n?'1':'0');st('upen',u?'1':'0');if((h||n||u)&&INKON)setInk(false);if((h||n||u)&&TXON)setTx(false);updPen()}
function updPen(){var b=$('hlPen');b.classList.toggle('on',PEN);b.dataset.pc=PCOL;$('penLbl').textContent=PEN?'تظليل ✓':'تظليل';
  $('rNotes').classList.toggle('on',NPEN);var ub=$('ulBtn');ub.classList.toggle('on',UPEN);ub.dataset.uc=UCOL;$('ulLbl').textContent=UPEN?'خط ✓':'خط';$('nLbl').textContent=NPEN?'ملاحظات ✓':'ملاحظات';$('reader').classList.toggle('penon',penOn())}
function flyAt(f,btn){var r=btn.getBoundingClientRect(),R=$('reader').getBoundingClientRect();f.hidden=false;f.style.top=(r.bottom-R.top+6)+'px';
  f.style.right='auto';f.style.left=Math.max(8,Math.min(r.left-R.left+r.width/2-f.offsetWidth/2,R.width-f.offsetWidth-8))+'px'}
function noteFly(){var f=$('penFly');f.dataset.k='n';
  f.innerHTML='<b>الملاحظات</b><button type="button" class="ptog'+(NPEN?' on':'')+'" data-npen="1">'+(NPEN?'قلم الملاحظات شغّال · اضغط لإيقافو':'شغّل قلم الملاحظات')+'</button>'+
    '<button type="button" class="ptog" data-list="1" style="margin-top:8px">عرض كل الملاحظات والتظليل</button>'+
    '<small>'+(NPEN?(FINE?'حدّد أي كلام بالماوس ويفتح ليك مربّع الملاحظة طوالي.':'اسحب صباعك بالعرض على السطر، أو اضغط مطوّل على كلمة، ويفتح مربّع الملاحظة طوالي.'):'القلم مقفول: لمّا تحدّد كلام اضغط ✎ Note في الشريط التحت.')+'</small>';flyAt(f,$('rNotes'))}
function penFly(open){var f=$('penFly');if(!open){f.hidden=true;return}f.dataset.k='h';
  f.innerHTML='<b>لون التظليل</b><div class="pdots">'+HCOL.map(function(c){return '<button type="button" class="dot'+(c===PCOL?' cur':'')+'" data-pc="'+c+'" aria-label="colour"></button>'}).join('')+'</div>'+
    '<div class="hst">'+[[1,'كامل'],[2,'نص سفلي']].map(function(x){return '<button type="button" class="'+(HST===x[0]?'cur':'')+'" data-hst="'+x[0]+'"><mark class="uhl '+PCOL+(x[0]===2?' hs2':'')+'">Aa</mark>'+x[1]+'</button>'}).join('')+'</div>'+
    '<button type="button" class="ptog'+(PEN?' on':'')+'" data-pen="1">'+(PEN?'التظليل السريع شغّال · اضغط لإيقافو':'شغّل التظليل السريع')+'</button>'+
    '<button type="button" class="ptog'+(INKON&&ITOOL==='h'?' on':'')+'" data-mk="1">🖍 ماركر حر: ظلّل أي حاجة، حتى كتابة القلم</button>'+
    '<div class="isz mks">'+MKW.map(function(w,n){return '<button type="button" class="'+(n+1===MSI?'cur':'')+'" data-msz="'+(n+1)+'" aria-label="marker size '+(n+1)+'"><i style="height:'+Math.round(w/2.2)+'px;background:'+MHEX[PCOL]+'"></i>'+(n+1)+'</button>'}).join('')+'</div>'+
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
$('penFly').addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('button');if(!b)return;if(b.dataset.upc||b.dataset.up)return;
  if(b.dataset.pv!=null){setProg(+b.dataset.pv);penFly(false);return}
  if(b.dataset.mc){PCOL=b.dataset.mc;st('pcol',PCOL);updPen();mkFly();return}
  if(b.dataset.msz){var inP=$('penFly').dataset.k==='i';MSI=+b.dataset.msz;st('msi',MSI);if(!(INKON&&ITOOL==='h')){ITOOL='h';st('itool','h');setInk(true)}if(inP)mkFly();else penFly(true);railTip('حجم الماركر '+MSI);return}
  if(b.dataset.mk){if(INKON&&ITOOL==='h'){setInk(false);penFly(false);railTip('الماركر الحر مقفول');return}ITOOL='h';st('itool','h');setInk(true);penFly(false);railTip('الماركر الحر شغّال بلون التظليل: ظلّل بإصبعك أو بالقلم فوق أي حاجة');return}
  if(b.dataset.hst){HST=+b.dataset.hst;st('hst',HST);penFly(true);return}
  if(b.dataset.ic){ICOL=b.dataset.ic;st('icol',ICOL);setInk(true);penFly(false);railTip('القلم شغّال: ارسم على الصفحة');return}
  if(b.dataset.isz){ISI=+b.dataset.isz;st('isz',ISI);if(!INKON)setInk(true);inkFly();return}
  if(b.dataset.ink){setInk(!INKON);penFly(false);railTip(INKON?'القلم شغّال: ارسم على الصفحة':'القلم مقفول');return}
  if(b.dataset.styl){setStyl(!STYL);inkFly();railTip(STYL?'الرسم بالقلم الإلكتروني بس: الأصابع بتقلّب الصفحة وكف اليد ما بيرسم':'الرسم بالصباع والقلم الإلكتروني');return}
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
function addHL(o,c){var id=PKEY[o.i],h={s:o.s,e:o.e,c:c,t:o.t.slice(0,240)};if(isU(c))h.uw=UW;else if(HST===2)h.hs=2;(HL[id]=HL[id]||[]).push(h);saveHL();window.getSelection().removeAllRanges();hideBar();renderPage(o.i)}
function caretAt(x,y){if(document.caretRangeFromPoint)return document.caretRangeFromPoint(x,y);var p=document.caretPositionFromPoint&&document.caretPositionFromPoint(x,y);if(!p)return null;var r=document.createRange();r.setStart(p.offsetNode,p.offset);return r}
document.addEventListener('pointerdown',function(e){lastPT=e.pointerType},true);
pagesEl.addEventListener('mouseup',function(){if(!penOn()||NOTE||lastPT!=='mouse')return;setTimeout(function(){var o=selOffsets();if(o)penApply(o)},10)});
/* two fingers (pinch zoom, two-finger scroll) never mark text: a second finger cancels the swipe, and nothing is marked
   until a moment after the fingers lift (mtUntil) */
var mtUntil=0;function multiTouch(){return Date.now()<mtUntil}
document.addEventListener('touchstart',function(e){if(e.touches.length>1){mtUntil=Date.now()+800;clearTimeout(penT);if(penDrag){penDrag=null;window.getSelection().removeAllRanges()}}},{capture:true,passive:true});
document.addEventListener('touchend',function(e){if(e.touches.length>0||multiTouch())mtUntil=Date.now()+800},{capture:true,passive:true});
pagesEl.addEventListener('pointerdown',function(e){if(!penOn()||NOTE||e.pointerType==='mouse'||!e.isPrimary||multiTouch()||Date.now()-lastScroll<350||e.target.closest('mark.uhl,span.nm,.lko'))return;var c=caretAt(e.clientX,e.clientY);if(!c)return;penDrag={x:e.clientX,y:e.clientY,a:c,on:false}});
pagesEl.addEventListener('pointermove',function(e){if(!penDrag||!e.isPrimary)return;if(multiTouch()){penDrag=null;window.getSelection().removeAllRanges();return}
  if(!penDrag.on){var dx=Math.abs(e.clientX-penDrag.x),dy=Math.abs(e.clientY-penDrag.y);if(dy>12&&dy*2>=dx){penDrag=null;return}   // up/down = scrolling, not marking
    if(dx<16||dx<2*dy)return;penDrag.on=true}
  else{var ddx=Math.abs(e.clientX-penDrag.x),ddy=Math.abs(e.clientY-penDrag.y);if(ddy>3*ddx+40){penDrag=null;window.getSelection().removeAllRanges();return}}   // turned into a scroll
  penXY=[e.clientX,e.clientY];if(penRaf)return;   // one caret lookup per frame keeps the swipe smooth
  penRaf=requestAnimationFrame(function(){penRaf=0;penSel(penDrag)})});
function penSel(d){if(!d||!d.on||!penXY)return;var c=caretAt(penXY[0],penXY[1]);if(!c)return;var a=d.a,r=document.createRange();
  try{if(a.compareBoundaryPoints(Range.START_TO_START,c)<=0){r.setStart(a.startContainer,a.startOffset);r.setEnd(c.startContainer,c.startOffset)}else{r.setStart(c.startContainer,c.startOffset);r.setEnd(a.startContainer,a.startOffset)}}catch(err){return}
  var s=getSelection();s.removeAllRanges();s.addRange(r)}
var penXY=null,penRaf=0;
pagesEl.addEventListener('pointerup',function(){var d=penDrag;penDrag=null;if(d&&d.on){if(penRaf){cancelAnimationFrame(penRaf);penRaf=0;penSel(d)}if(multiTouch()){window.getSelection().removeAllRanges();return}var o=selOffsets();if(o)penApply(o)}});
pagesEl.addEventListener('pointercancel',function(){penDrag=null});

/* ---------- drawing pen (قلم): free-hand ink on the page in red, black, blue or orange ----------
   Strokes are saved per page key in prr-ink as SVG points in page units (816 × 1152), so they scale with zoom.
   With the pen on: one finger / the mouse draws, two fingers scroll; links and words on the page do not react. */
var IMGU={},IMS=null,IDBP=null,imgAt0=null;   // pictures on pages (see the صورة block below)
var INK=stj('ink')||{},IHEX={r:'#dc2626',k:'#111827',b:'#1d4ed8',o:'#ea580c',g:'#15803d',v:'#7c3aed',y:'#facc15'},ICOLS=['k','b','r','g','v','o','y'],ICOL=ICOLS.indexOf(st('icol'))>=0?st('icol'):'r',INKON=false,ISZ=[1.6,2.6,4,6,9,13],ISI=Math.max(1,Math.min(6,+st('isz')||2)),inkS=null,inkPts={},inkPan=null;
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
function inkEl(x){var c=IHEX[x.c]||'#111827',w=x.w||3;if(x.t==='i')return imgEl(x);
  if(x.t==='t'){var fs=tfs(x.fs);return '<text data-id="'+x.id+'" x="'+x.x+'" y="'+x.y+'" font-size="'+fs+'" fill="'+c+'" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="600">'+String(x.txt||'').split('\n').map(function(l,n){return '<tspan x="'+x.x+'" dy="'+(n?Math.round(fs*1.25):0)+'">'+(esc(l)||' ')+'</tspan>'}).join('')+'</text>'}
  if(x.t==='a'){var q=x.p.split(' ').map(function(v){return v.split(',').map(Number)}),a=q[0],b=q[q.length-1],g=Math.atan2(b[1]-a[1],b[0]-a[0]),h=10+w*2.2,
      L=[b[0]-h*Math.cos(g-.45),b[1]-h*Math.sin(g-.45)],R=[b[0]-h*Math.cos(g+.45),b[1]-h*Math.sin(g+.45)],e=[b[0]-h*.7*Math.cos(g),b[1]-h*.7*Math.sin(g)],f=function(v){return v.map(function(n){return Math.round(n*10)/10}).join(',')};
    return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+f(e).split(',')[0]+'" y2="'+f(e).split(',')[1]+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"/><polygon points="'+f(b)+' '+f(L)+' '+f(R)+'" fill="'+c+'" stroke="'+c+'" stroke-width="1" stroke-linejoin="round"/>'}
  if(!x.t||x.t==='h'){var q=x.p.split(' ').map(function(v){return v.split(',').map(Number)});
    if(x.t==='h')return '<path class="mk" d="'+smoothD(q)+'" stroke="'+(MHEX[x.c]||c)+'" stroke-width="'+(x.mw||mkW(w))+'"/>';
    if(q[0].length>2)return '<path class="fl" d="'+outlineD(q,w)+'" fill="'+c+'"/>';
    return '<path d="'+smoothD(q)+'" stroke="'+c+'" stroke-width="'+w+'"/>'}
  return '<polyline points="'+x.p+'" stroke="'+c+'" stroke-width="'+w+'"'+(x.t==='u'?' stroke-linecap="butt" opacity=".85"':'')+'/>'}
/* a free-pen line is drawn as a smooth curve through the midpoints of its points (quadratic Béziers), so it never looks broken */
function r1(n){return Math.round(n*10)/10}
function smoothD(q){if(!q.length)return '';if(q.length<3)return 'M'+q.map(function(v){return r1(v[0])+','+r1(v[1])}).join(' L');
  var d='M'+r1(q[0][0])+','+r1(q[0][1]);for(var n=1;n<q.length-1;n++){var m=[(q[n][0]+q[n+1][0])/2,(q[n][1]+q[n+1][1])/2];d+=' Q'+r1(q[n][0])+','+r1(q[n][1])+' '+r1(m[0])+','+r1(m[1])}
  var z=q[q.length-1];return d+' L'+r1(z[0])+','+r1(z[1])}
/* marker (قلم تظليل): a wide see-through stroke, like a felt highlighter drawn by hand */
/* the marker takes the highlighter colour (owner, Nov 2026: a free highlighter that also covers pen writing) */
var MHEX={y:'#fde047',g:'#4ade80',b:'#60a5fa',p:'#f472b6',o:'#fb923c',v:'#a78bfa'};
var MKW=[12,18,26,36],MSI=Math.max(1,Math.min(4,+st('msi')||2));   // free-marker widths in page units (owner: choose the size)
function mkW(w){return Math.max(16,w*2.6+11)}
/* a pen line with pressure: each point carries a width factor f (stylus pressure, or speed for a finger / mouse);
   the outline is built from both edges of the line, smoothed, with round ends: it looks like real ink */
function outlineD(q,w){var n=q.length,L=[],R=[];if(n===1){var r0=w*(q[0][2]||1)/2;return 'M'+r1(q[0][0]-r0)+','+r1(q[0][1])+' a'+r1(r0)+','+r1(r0)+' 0 1,0 '+r1(2*r0)+',0 a'+r1(r0)+','+r1(r0)+' 0 1,0 '+r1(-2*r0)+',0'}
  for(var i=0;i<n;i++){var a=q[Math.max(0,i-1)],b=q[Math.min(n-1,i+1)],tx=b[0]-a[0],ty=b[1]-a[1],l=Math.hypot(tx,ty)||1,r=Math.max(.35,w*(q[i][2]||1)/2),nx=-ty/l*r,ny=tx/l*r;
    L.push([q[i][0]+nx,q[i][1]+ny]);R.push([q[i][0]-nx,q[i][1]-ny])}
  function cv(P){var d='';for(var k=1;k<P.length-1;k++)d+=' Q'+r1(P[k][0])+','+r1(P[k][1])+' '+r1((P[k][0]+P[k+1][0])/2)+','+r1((P[k][1]+P[k+1][1])/2);return d+' L'+r1(P[P.length-1][0])+','+r1(P[P.length-1][1])}
  var re=w*(q[n-1][2]||1)/2,rs=w*(q[0][2]||1)/2;R.reverse();
  return 'M'+r1(L[0][0])+','+r1(L[0][1])+cv(L)+' A'+r1(re)+','+r1(re)+' 0 0,0 '+r1(R[0][0])+','+r1(R[0][1])+cv(R)+' A'+r1(rs)+','+r1(rs)+' 0 0,0 '+r1(L[0][0])+','+r1(L[0][1])+'Z'}
/* width factor of a new point: stylus pressure when there is one; otherwise faster = thinner, like a real pen */
function inkF(e,prev,last,p){if(e.pointerType==='pen'&&e.pressure>0)return Math.max(.3,Math.min(1.7,.3+1.4*e.pressure));
  if(!last)return 1;var dt=Math.max(1,(e.timeStamp||0)-(prev.ts||0)),v=Math.hypot(p[0]-last[0],p[1]-last[1])/dt,f=Math.max(.62,Math.min(1.2,1.22-v*.22));return .75*(last[2]||1)+.25*f}
/* light smoothing of a finished stroke: removes the small hand tremor and finger jitter */
function inkSmooth(q){if(q.length<4)return q;var o=[q[0]];for(var n=1;n<q.length-1;n++)o.push(q[n].map(function(v,j){return (q[n-1][j]+2*v+q[n+1][j])/4}));o.push(q[q.length-1]);return o}
function inkRender(i){var L=INK[PKEY[i]],svg=inkSvg(wraps[i],L&&L.length);if(!svg)return;
  svg.innerHTML=(L||[]).filter(function(x){return x.t==='i'}).map(inkEl).join('')+(L||[]).filter(function(x){return x.t!=='i'}).map(inkEl).join('')+imgSelSvg(i)}
/* undo / redo: a history of this session's actions ({t:'add'|'del', k: page key, items}); every change still syncs */
var ITOOL=['p','h','a','u','e','i'].indexOf(st('itool'))>=0?st('itool'):'p',IHIST=[],IREDO=[];
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
function inkHit(x,p){if(x.t==='i')return p[0]>=x.x&&p[0]<=x.x+x.w&&p[1]>=x.y&&p[1]<=x.y+x.h;var r=10+(x.w||3)/2;if(x.t==='t'){var fs=tfs(x.fs),ls=String(x.txt).split('\n'),wd=Math.max.apply(0,ls.map(function(l){return l.length}))*fs*.56;
    return p[0]>=x.x-r&&p[0]<=x.x+wd+r&&p[1]>=x.y-fs-r&&p[1]<=x.y+fs*1.25*(ls.length-1)+r}
  var q=x.p.split(' ').map(function(v){return v.split(',').map(Number)});if(q.length===1)return Math.hypot(p[0]-q[0][0],p[1]-q[0][1])<r;
  for(var n=0;n<q.length-1;n++)if(segD(p,q[n],q[n+1])<r)return true;return false}
Object.keys(INK).forEach(function(k){if(byKey[k]!==undefined)inkRender(byKey[k])});
function updInk(){var b=$('inkBtn');b.classList.toggle('on',INKON);updInkBar();b.dataset.ic=ICOL;$('inkLbl').textContent=INKON?'قلم ✓':'قلم';$('reader').classList.toggle('inkon',INKON)}
function setInk(on){INKON=on;if(!on&&typeof imgSel==='function')imgSel(null);if(on&&(PEN||NPEN||UPEN))setPens(false,false);if(on&&TXON)setTx(false);updInk()}
/* tool bar shown while the pen is on: free pen, arrow, underline, text box, eraser · undo · redo · close */
var IB=document.createElement('div');IB.className='inkbar';IB.id='inkBar';IB.lang='ar';IB.hidden=true;$('reader').appendChild(IB);
var ITL=[['p','قلم','<path d="M17 3l4 4L8 20H4v-4z"/>'],['h','ماركر','<path d="M9 11l-5 5v3h3l5-5"/><path d="M9 11l7-7 4 4-7 7z"/>'],['a','سهم','<path d="M5 19L19 5M10 5h9v9"/>'],['u','خط تحت','<path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>'],['i','صورة','<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>'],['e','ممحاة','<path d="M20 20H9L4 15a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-7 7"/><path d="M8 11l6 6"/>']];
function updInkBar(){if(typeof IMB!=='undefined'&&IMB)updImgBar();IB.hidden=!INKON;if(!INKON)return;
  IB.innerHTML=ITL.map(function(x){return '<button type="button" class="'+(ITOOL===x[0]?'cur':'')+'" data-itl="'+x[0]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+x[2]+'</svg><span>'+x[1]+'</span></button>'}).join('')+
    '<i class="sep"></i><button type="button" data-iun="1"'+(GH.length?'':' disabled')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg><span>تراجع</span></button>'+
    '<button type="button" data-ire="1"'+(GR.length?'':' disabled')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></svg><span>إعادة</span></button>'+
    '<button type="button" class="ix" data-ix="1" aria-label="اقفل القلم">✕</button>'}
IB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.itl){if(b.dataset.itl==='h'&&ITOOL==='h'){e.stopPropagation();mkFly();return}ITOOL=b.dataset.itl;st('itool',ITOOL);inkTxt(false);imgSel(null);updInkBar();if(ITOOL==='i'){imgPick(null);return}railTip({p:'ارسم بحرّية · ثبّت القلم لحظة في آخر الخط عشان يبقى مستقيم',h:'ماركر: اضغطو تاني عشان تختار اللون والحجم',a:'اسحب عشان ترسم سهم',u:'اسحب على السطر عشان تخط تحتو',e:'امسح بالضغط أو السحب على الرسمة'}[ITOOL])}
  else if(b.dataset.iun)inkUndo();else if(b.dataset.ire)inkRedo();else if(b.dataset.ix){setInk(false);railTip('القلم مقفول')}});
/* ---------- text boxes (نص): a separate rail tool. With it on: tap the page to write; tap a text to edit, move or delete it
   (on a computer a text can also be dragged). Colour and size in its panel and in the writing box. Saved with the drawings. */
var TXON=false,TCOL=ICOLS.indexOf(st('tcol'))>=0?st('tcol'):'k',TSI=Math.max(1,Math.min(5,+st('tsz')||2)),TXP=null,TXMV=null;
function setTx(on){TXON=on;if(on&&(PEN||NPEN||UPEN))setPens(false,false);if(on&&INKON)setInk(false);if(!on){inkTxt(false);TXP=null;TXMV=null;$('reader').classList.remove('txsel')}updTx()}
function updTx(){var b=$('txtBtn');b.classList.toggle('on',TXON);b.dataset.ic=TCOL;$('txtLbl').textContent=TXON?'نص ✓':'نص';$('reader').classList.toggle('txon',TXON);updTxBar()}
function tdots(attr,cur){return ICOLS.map(function(c){return '<button type="button" class="dot'+(c===cur?' cur':'')+'" '+attr+'="'+c+'" style="background:'+IHEX[c]+'" aria-label="colour"></button>'}).join('')}
function tsizes(attr,cur){return '<div class="isz tsz">'+TFS.map(function(f,n){return '<button type="button" class="'+(n+1===cur?'cur':'')+'" '+attr+'="'+(n+1)+'"><b style="font-size:'+(9+n*3)+'px">ع</b>'+(n+1)+'</button>'}).join('')+'</div>'}
function txFly(){var f=$('penFly');f.dataset.k='x';
  f.innerHTML='<b>مربّع النص</b><div class="pdots">'+tdots('data-tc',TCOL)+'</div>'+tsizes('data-tsz',TSI)+
    '<button type="button" class="ptog'+(TXON?' on':'')+'" data-txon="1">'+(TXON?'النص شغّال · اضغط لإيقافو':'شغّل النص')+'</button>'+
    '<small>اضغط أي مكان في الصفحة واكتب. اضغط على نص مكتوب واسحبو لأي مكان، أو عدّلو أو امسحو.</small>';flyAt(f,$('txtBtn'))}
$('txtBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='x')penFly(false);else txFly()};
/* bar while the text tool is on: undo · redo · close, or for a tapped text: edit · move · delete */
var TB=document.createElement('div');TB.className='inkbar';TB.id='txBar';TB.lang='ar';TB.hidden=true;$('reader').appendChild(TB);
function tbtn(a,label,path,dis){return '<button type="button" data-tb="'+a+'"'+(dis?' disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg><span>'+label+'</span></button>'}
function updTxBar(){$('reader').classList.toggle('txsel',!!(TXP&&TXON));TB.hidden=!TXON;if(!TXON)return;
  TB.innerHTML=TXP?tbtn('edit','تعديل','<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')+tbtn('move','تحريك','<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>')+
      tbtn('del','حذف','<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>')+'<button type="button" class="ix" data-tb="x" aria-label="رجوع">✕</button>'
    :'<span class="tbl">'+(TXMV?'اضغط المكان الجديد للنص':'اضغط مكان النص')+'</span>'+tbtn('undo','تراجع','<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',!GH.length)+tbtn('redo','إعادة','<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',!GR.length)+
      '<button type="button" class="ix" data-tb="off" aria-label="اقفل النص">✕</button>'}
function txPick(i,it){TXP=it?{i:i,it:it}:null;TXMV=null;$('reader').classList.toggle('txsel',!!it);inkRender(i);if(it){var el=wraps[i].querySelector('svg.ink text[data-id="'+it.id+'"]');if(el)el.classList.add('sel')}updTxBar()}
TB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var a=b.dataset.tb,P=TXP;
  if(a==='undo')inkUndo();else if(a==='redo')inkRedo();else if(a==='off'){setTx(false);railTip('النص مقفول')}
  else if(a==='x')txPick(P.i,null);
  else if(a==='edit'){txPick(P.i,null);inkTxt({i:P.i,edit:P.it})}
  else if(a==='del'){txPick(P.i,null);inkDo({t:'del',k:PKEY[P.i],items:[P.it]})}
  else if(a==='move'){railTip('اسحب النص بإصبعك لأي مكان في الصفحة')}
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
function mkFly(){var f=$('penFly');f.dataset.k='i';
  f.innerHTML='<b>الماركر</b><div class="pdots">'+HCOL.map(function(c){return '<button type="button" class="dot'+(c===PCOL?' cur':'')+'" data-mc="'+c+'" style="background:'+MHEX[c]+'" aria-label="colour"></button>'}).join('')+'</div>'+
    '<div class="isz mks">'+MKW.map(function(w,n){return '<button type="button" class="'+(n+1===MSI?'cur':'')+'" data-msz="'+(n+1)+'" aria-label="marker size '+(n+1)+'"><i style="height:'+Math.round(w/2.2)+'px;background:'+MHEX[PCOL]+'"></i>'+(n+1)+'</button>'}).join('')+'</div>'+
    '<small>ظلّل بحرّية فوق الكلام أو كتابة القلم. اللون هو نفس لون التظليل.</small>';flyAt(f,$('inkBtn'))}
function inkFly(){if(INKON&&ITOOL==='h'){mkFly();return}var f=$('penFly');f.dataset.k='i';
  f.innerHTML='<b>القلم</b><div class="pdots">'+ICOLS.map(function(c){return '<button type="button" class="dot'+(c===ICOL?' cur':'')+'" data-ic="'+c+'" style="background:'+IHEX[c]+'" aria-label="colour"></button>'}).join('')+'</div>'+
    '<div class="isz">'+ISZ.map(function(w,n){return '<button type="button" class="'+(n+1===ISI?'cur':'')+'" data-isz="'+(n+1)+'" aria-label="size '+(n+1)+'"><i style="width:'+(w+3)+'px;height:'+(w+3)+'px;background:'+IHEX[ICOL]+'"></i>'+(n+1)+'</button>'}).join('')+'</div>'+
    '<button type="button" class="ptog'+(INKON?' on':'')+'" data-ink="1">'+(INKON?'القلم شغّال · اضغط لإيقافو':'شغّل القلم')+'</button>'+
    '<button type="button" class="ptog'+(STYL?' on':'')+'" data-styl="1" style="margin-top:6px">'+(STYL?'✓ الرسم بالقلم الإلكتروني بس (الأصابع للتقليب)':'الرسم بالقلم الإلكتروني بس (للتابات)')+'</button>'+
    '<div class="zrow" style="margin-top:8px"><button type="button" class="ptog" data-iu="1">↶ تراجع</button><button type="button" class="ptog" data-ir="1">↷ إعادة</button><button type="button" class="ptog" data-ic0="1">مسح الصفحة</button></div>'+
    '<small>'+(FINE?'اختار الأداة من الشريط التحت: قلم، سهم، خط تحت، نص أو ممحاة. اقفل القلم عشان تحدّد كلام أو تضغط الروابط.':(STYL?'ارسم بالقلم الإلكتروني، وقلّب الصفحة بصباع أو صباعين.':'اختار الأداة من الشريط التحت. ارسم بصباع واحد، وقلّب الصفحات بصباعين.'))+'</small>';flyAt(f,$('inkBtn'))}
$('inkBtn').onclick=function(e){e.stopPropagation();var f=$('penFly');if(!f.hidden&&f.dataset.k==='i')penFly(false);else inkFly()};
function inkXY(pw,e,r){r=r||pw.getBoundingClientRect();return [(e.clientX-r.left)*816/r.width,(e.clientY-r.top)*1152/r.height]}
function inkMid(){var a=Object.keys(inkPts).map(function(k){return inkPts[k]});return [(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2]}
/* stylus mode (palm rejection): once a stylus is used, only the stylus draws; fingers scroll the page (with momentum),
   and touches while the stylus is on or near the screen are ignored (the palm). Switch in the pen panel; saved in prr-styl. */
var STYL=st('styl')==='1',penAt=0,panPts={},panV=null,momRaf=0;
function setStyl(on){STYL=on;st('styl',on?'1':'0');$('reader').classList.toggle('styl',on)}
$('reader').classList.toggle('styl',STYL);
function momStop(){cancelAnimationFrame(momRaf);momRaf=0}
function momGo(vx,vy){momStop();var sc=$('scroller'),t0=performance.now();
  (function f(t){var dt=Math.min(40,t-t0);t0=t;sc.scrollTop-=vy*dt;sc.scrollLeft-=vx*dt;vx*=Math.pow(.995,dt);vy*=Math.pow(.995,dt);if(Math.abs(vx)+Math.abs(vy)>.02)momRaf=requestAnimationFrame(f);else momRaf=0})(t0)}
var inkRaf=0;function inkFrame(){if(inkRaf)return;inkRaf=requestAnimationFrame(function(){inkRaf=0;if(inkS&&inkS.el)inkPreview(inkS)})}
pagesEl.addEventListener('pointerdown',function(e){if(!INKON&&!TXON)return;var pw=e.target.closest('.pw');if(!pw||pw.classList.contains('lk'))return;if(INKON||e.pointerType==='mouse')e.preventDefault();
  if(e.pointerType==='pen'){penAt=Date.now();if(st('styl')===null){setStyl(true);railTip('القلم الإلكتروني اتعرّف: الرسم بالقلم بس، والأصابع للتقليب')}}
  if(e.isPrimary){inkPts={};panPts={};inkPan=null}   // a primary pointer means no other contact is down: drop any stale ones
  momStop();
  /* stylus mode: a finger still places a waiting picture and moves or resizes pictures */
  var fingerImg=ITOOL==='i'&&(IMPEND||(function(){var q=inkXY(pw,e);return (INK[PKEY[+pw.dataset.i]]||[]).some(function(x){return x.t==='i'&&inkHit(x,q)})||(IMS&&IMS.i===+pw.dataset.i)})());
  if(INKON&&STYL&&e.pointerType==='touch'&&!fingerImg){if(inkS||Date.now()-penAt<500)return;   // palm while writing
    panPts[e.pointerId]=[e.clientX,e.clientY,performance.now()];panV=[0,0];try{pw.setPointerCapture(e.pointerId)}catch(err){}return}
  inkPts[e.pointerId]=[e.clientX,e.clientY];try{pw.setPointerCapture(e.pointerId)}catch(err){}
  if(Object.keys(inkPts).length>=2){if(inkS){if(inkS.el)inkS.el.remove();if(inkS.t==='e')inkEraseEnd(inkS);inkS=null}if(INKON)inkPan=inkMid();return}
  var i=+pw.dataset.i,rc=pw.getBoundingClientRect(),p=inkXY(pw,e,rc),NS='http://www.w3.org/2000/svg';
  if(TXON){p=[Math.round(p[0]),Math.round(p[1])];var hitT=(INK[PKEY[i]]||[]).filter(function(x){return x.t==='t'&&inkHit(x,p)}).pop();
    inkS={t:'t',i:i,pw:pw,a:p,x:e.clientX,y:e.clientY,item:hitT,o:hitT?[hitT.x,hitT.y]:null,mouse:e.pointerType==='mouse',drag:!!(hitT&&TXP&&TXP.it.id===hitT.id)};return}
  if(ITOOL==='i'){imgDown(i,pw,rc,p);return}
  if(ITOOL==='e'){inkS={t:'e',i:i,pw:pw,rc:rc,items:[],p0:p,t0:Date.now()};return}   // erase only after a moment, so the first finger of a pinch erases nothing
  if(ITOOL==='p')p.push(inkF(e,{},null,p));
  var g=document.createElementNS(NS,'g');inkSvg(pw,true).appendChild(g);inkS={t:ITOOL,i:i,pw:pw,rc:rc,el:g,pts:[p],ts:e.timeStamp,dot:e.pointerType!=='touch'};inkPreview(inkS)});
function inkPreview(s){if((s.t==='p'||s.t==='h')&&!s.straight){if(!s.path){s.path=document.createElementNS('http://www.w3.org/2000/svg','path');
      if(s.t==='h'){s.path.setAttribute('class','mk');s.path.setAttribute('stroke',MHEX[PCOL]);s.path.setAttribute('stroke-width',MKW[MSI-1])}else{s.path.setAttribute('class','fl');s.path.setAttribute('fill',IHEX[ICOL])}s.el.appendChild(s.path)}
    s.path.setAttribute('d',s.t==='h'?smoothD(s.pts):outlineD(s.pts,ISZ[ISI-1]));return}
  if(s.straight){s.el.innerHTML=inkEl({t:s.t==='h'?'h':undefined,mw:s.t==='h'?MKW[MSI-1]:undefined,c:s.t==='h'?PCOL:ICOL,w:ISZ[ISI-1],p:[s.pts[0],s.pts[s.pts.length-1]].map(function(q){return q.slice(0,2).concat(s.t==='h'?[]:[q[2]||1]).join(',')}).join(' ')});return}
  var pts=[s.pts[0],s.pts[s.pts.length-1]];s.el.innerHTML=inkEl({t:s.t==='p'?undefined:s.t,c:ICOL,w:ISZ[ISI-1],p:pts.map(function(q){return q.join(',')}).join(' ')})}
function inkErase(s,p){var k=PKEY[s.i],hit=(INK[k]||[]).filter(function(x){return inkHit(x,p)});if(!hit.length)return;s.items=s.items.concat(hit);inkDel(k,hit.map(function(x){return x.id}));inkRender(s.i)}
function inkEraseEnd(s){if(!s.items.length)return;saveInk()}
pagesEl.addEventListener('pointermove',function(e){if(!INKON&&!TXON)return;
  var P=panPts[e.pointerId];if(P){if(Date.now()-penAt<500||inkS){delete panPts[e.pointerId];return}if(pin&&pin.zoomed){P[0]=e.clientX;P[1]=e.clientY;panV=[0,0];return}
    var n=Object.keys(panPts).length,dx=(e.clientX-P[0])/n,dy=(e.clientY-P[1])/n,now=performance.now(),dt=Math.max(1,now-P[2]),sc=$('scroller');
    sc.scrollTop-=dy;sc.scrollLeft-=dx;panV=[.8*dx/dt+.2*panV[0],.8*dy/dt+.2*panV[1]];panPts[e.pointerId]=[e.clientX,e.clientY,now];return}
  if(!inkPts[e.pointerId])return;inkPts[e.pointerId]=[e.clientX,e.clientY];
  if(inkPan&&Object.keys(inkPts).length>=2&&pin&&pin.zoomed){inkPan=inkMid();return}
  if(inkPan&&Object.keys(inkPts).length>=2){var m=inkMid(),sc2=$('scroller'),now2=performance.now(),dt2=Math.max(1,now2-(inkPan[2]||now2-16)),ddx=m[0]-inkPan[0],ddy=m[1]-inkPan[1];sc2.scrollTop-=ddy;sc2.scrollLeft-=ddx;
    var v=inkPan[3]||[0,0];inkPan=[m[0],m[1],now2,[.8*ddx/dt2+.2*v[0],.8*ddy/dt2+.2*v[1]]];return}
  if(!inkS)return;
  if(inkS.t==='t'){var pt=inkXY(inkS.pw,e);pt=[Math.round(pt[0]),Math.round(pt[1])];if(Math.abs(e.clientX-inkS.x)+Math.abs(e.clientY-inkS.y)>8)inkS.moved=true;
    if(inkS.item&&inkS.moved&&(inkS.mouse||inkS.drag)){inkS.item.x=inkS.o[0]+pt[0]-inkS.a[0];inkS.item.y=inkS.o[1]+pt[1]-inkS.a[1];inkRender(inkS.i)}return}
  var p=inkXY(inkS.pw,e,inkS.rc);
  if(inkS.t==='img'||inkS.t==='imgadd'){imgMove(inkS,p);return}
  if(inkS.t==='e'){if(Date.now()-inkS.t0<150)return;if(inkS.p0){inkErase(inkS,inkS.p0);inkS.p0=null}inkErase(inkS,p);return}
  if(inkS.t==='u')p[1]=inkS.pts[0][1];
  if(inkS.t==='p'||inkS.t==='h'){var S=inkS;
    if(S.straight){var z=S.pts[S.pts.length-1];S.pts=[S.pts[0],p.concat(S.t==='p'?[z[2]||1]:[])];inkFrame();return}
    var evs=e.getCoalescedEvents?e.getCoalescedEvents():[];if(!evs.length)evs=[e];
    evs.forEach(function(ev){var q=inkXY(S.pw,ev,S.rc),l=S.pts[S.pts.length-1];if(Math.abs(q[0]-l[0])+Math.abs(q[1]-l[1])<1.5)return;if(S.t==='p')q.push(inkF(ev,S,l,q));S.ts=ev.timeStamp;S.pts.push(q)});
    /* hold the pen still for a moment at the end of a line and it snaps straight */
    clearTimeout(S.hold);S.hold=setTimeout(function(){if(inkS!==S||S.pts.length<6)return;var a=S.pts[0],b=S.pts[S.pts.length-1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),dev=0;
      S.pts.forEach(function(q){dev=Math.max(dev,segD(q,a,b))});if(len<30||dev>len*.18)return;S.straight=true;if(S.path){S.path.remove();S.path=null}inkPreview(S);if(navigator.vibrate)try{navigator.vibrate(12)}catch(err){}},600)}
  else inkS.pts[1]=p;inkFrame()});
function inkEnd(e){if(panPts[e.pointerId]){var lone=Object.keys(panPts).length===1;delete panPts[e.pointerId];if(lone&&e.type==='pointerup'&&panV&&Date.now()-penAt>500)momGo(panV[0],panV[1]);return}
  if(!inkPts[e.pointerId])return;delete inkPts[e.pointerId];if(inkPan&&inkPan[3]&&Object.keys(inkPts).length===1&&e.type==='pointerup'){momGo(inkPan[3][0],inkPan[3][1]);inkPan[3]=null}if(!Object.keys(inkPts).length)inkPan=null;if(!inkS)return;var s=inkS;inkS=null;
  if(s.t==='img'||s.t==='imgadd'){imgUp(s,e);return}
  if(s.t==='t'){var it=s.item;
    if(it&&s.moved&&(s.mouse||s.drag)){var nx=it.x,ny=it.y;it.x=s.o[0];it.y=s.o[1];var nit=Object.assign({},it,{id:rid(),x:Math.round(nx),y:Math.round(ny)});TXP=null;inkDo({t:'mod',k:PKEY[s.i],del:[Object.assign({},it)],add:[nit]});if(s.drag)txPick(s.i,nit);return}
    if(s.moved||e.type!=='pointerup')return;
    if(TXMV){var M=TXMV,mi=M.it;TXMV=null;if(M.i!==s.i){railTip('حرّك النص جوّه نفس الصفحة');updTxBar();return}
      inkDo({t:'mod',k:PKEY[s.i],del:[mi],add:[Object.assign({},mi,{id:rid(),x:s.a[0],y:Math.round(s.a[1]+mi.fs*.8)})]});return}
    if(it){txPick(s.i,it);return}if(TXP){txPick(TXP.i,null);return}inkTxt({i:s.i,p:s.a});return}
  if(s.t==='e'){if(s.p0&&e.type==='pointerup')inkErase(s,s.p0);inkEraseEnd(s);return}
  clearTimeout(s.hold);var free=(s.t==='p'||s.t==='h')&&!s.straight,pts=free?inkSmooth(s.pts):[s.pts[0],s.pts[s.pts.length-1]];
  if(s.t==='p'&&free&&pts.length>3){pts[0][2]*=.75;pts[pts.length-1][2]*=.7}   // gentle taper at both ends
  pts=pts.map(function(q){return q.length>2?[r1(q[0]),r1(q[1]),Math.round(q[2]*100)/100]:[r1(q[0]),r1(q[1])]});var a=pts[0],b=pts[pts.length-1];s.el.remove();
  if(pts.length<2&&(s.t!=='p'||!s.dot)||(s.t!=='p'&&s.t!=='h'&&Math.hypot(b[0]-a[0],b[1]-a[1])<8)){inkRender(s.i);return}
  var it={id:rid(),c:s.t==='h'?PCOL:ICOL,w:ISZ[ISI-1],p:pts.map(function(q){return q.join(',')}).join(' ')};if(s.t==='h')it.mw=MKW[MSI-1];if(s.t!=='p')it.t=s.t;inkDo({t:'add',k:PKEY[s.i],items:[it]})}
/* ---------- pictures on the page (owner, Nov 2026): pen tool صورة. Tap an empty place (or choose the tool) to add a picture from the
   phone; tap a picture to select it: drag = move, corner dots = resize (keeps the shape), قص = crop by dragging the edges,
   تثبيت = fix it in place (no move, resize or crop until released), حذف = delete. The picture itself (made smaller, JPEG) lives on
   this device in IndexedDB 'prr-img'; the item {t:'i', src, x, y, w, h, cr:[cx,cy,cw,ch], lk} is saved and synced with the drawings,
   so a picture added on another device shows as a grey frame. */
/* (declared at the top with INK: drawings with pictures are drawn at start-up, before this block runs) */
function idb(){return IDBP||(IDBP=new Promise(function(res,rej){var r=indexedDB.open('prr-img',1);r.onupgradeneeded=function(){r.result.createObjectStore('img')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}))}
function idbDo(mode,f){return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction('img',mode),q=f(t.objectStore('img'));t.oncomplete=function(){res(q&&q.result)};t.onerror=function(){rej(t.error)}})})}
function imgUrl(id){var u=IMGU[id];if(u)return u==='l'?undefined:u==='n'?null:u;IMGU[id]='l';
  idbDo('readonly',function(o){return o.get(id)}).then(function(b){if(b){IMGU[id]=URL.createObjectURL(b);imgRedraw(id)}else imgFetch(id)}).catch(function(){imgFetch(id)});return undefined}
/* pictures travel between the devices of one code through the server (POST /img): each picture is uploaded once
   (prr-imgup), and a device that meets a picture it does not have downloads it */
var IMGUP=stj('imgup')||{},imgBusy=false;
function imgPost(body){body.code=st('code');body.dev=DEV;body.token=st('act');
  return fetch(SRV.replace(/\/$/,'')+'/img',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()})}
function imgFetch(id){if(typeof SYNC==='undefined'||!SYNC||navigator.onLine===false){IMGU[id]='n';imgRedraw(id);return}
  imgPost({op:'get',id:id}).then(function(j){if(!j||!j.ok)throw 0;return fetch(j.data).then(function(r){return r.blob()})})
    .then(function(b){return idbDo('readwrite',function(o){return o.put(b,id)}).then(function(){IMGUP[id]=1;stj('imgup',IMGUP);IMGU[id]=URL.createObjectURL(b);imgRedraw(id)})})
    .catch(function(){IMGU[id]='n';imgRedraw(id);setTimeout(function(){if(IMGU[id]==='n')delete IMGU[id]},60000)})}
function imgUpload(){if(typeof SYNC==='undefined'||!SYNC||imgBusy||navigator.onLine===false)return;var need={};
  Object.keys(INK).forEach(function(k){INK[k].forEach(function(x){if(x.src&&!IMGUP[x.src])need[x.src]=1})});var ids=Object.keys(need);if(!ids.length)return;imgBusy=true;
  var chain=Promise.resolve();ids.forEach(function(id){chain=chain.then(function(){return idbDo('readonly',function(o){return o.get(id)})}).then(function(b){if(!b)return;
    return new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(fr.result)};fr.onerror=function(){res(null)};fr.readAsDataURL(b)})
      .then(function(d){if(!d)return;return imgPost({op:'put',id:id,data:d}).then(function(j){if(j&&j.ok){IMGUP[id]=1;stj('imgup',IMGUP)}})})}).catch(function(){})});
  chain.then(function(){imgBusy=false})}
function imgRedraw(id){Object.keys(INK).forEach(function(k){if(byKey[k]!==undefined&&INK[k].some(function(x){return x.src===id}))inkRender(byKey[k])})}
function imgEl(x){var c=x.cr||[0,0,1,1],u=imgUrl(x.src),box=' x="'+r1(x.x)+'" y="'+r1(x.y)+'" width="'+r1(x.w)+'" height="'+r1(x.h)+'"';
  if(!u)return '<rect'+box+' fill="#eef2f7" stroke="#94a3b8" stroke-dasharray="6 4"/>'+(u===null?'<text x="'+r1(x.x+x.w/2)+'" y="'+r1(x.y+x.h/2)+'" text-anchor="middle" font-size="13" fill="#64748b" font-family="system-ui,sans-serif">'+(typeof SYNC!=='undefined'&&SYNC?'الصورة بتتحمّل لمّا يكون في نت':'الصورة محفوظة في جهاز تاني')+'</text>':'');
  var crop=IMS&&IMS.id===x.id&&IMS.crop,full='';
  if(crop){var fw=x.w/c[2],fh=x.h/c[3];full='<image href="'+u+'" x="'+r1(x.x-c[0]*fw)+'" y="'+r1(x.y-c[1]*fh)+'" width="'+r1(fw)+'" height="'+r1(fh)+'" preserveAspectRatio="none" opacity=".3"/>'}
  return full+'<svg'+box+' viewBox="'+c.join(' ')+'" preserveAspectRatio="none"><image href="'+u+'" x="0" y="0" width="1" height="1" preserveAspectRatio="none"/></svg>'}
function imgK(i){var r=wraps[i].getBoundingClientRect();return 816/(r.width||816)}   // page units per screen pixel
function imgItem(){if(!IMS)return null;return (INK[PKEY[IMS.i]]||[]).filter(function(x){return x.id===IMS.id})[0]||null}
function imgSelSvg(i){if(!IMS||IMS.i!==i)return '';var x=imgItem();if(!x)return '';var k=imgK(i),r=11*k,col=x.lk?'#64748b':IMS.crop?'#0ea5e9':'#c99a3b',o='';
  o+='<rect x="'+r1(x.x)+'" y="'+r1(x.y)+'" width="'+r1(x.w)+'" height="'+r1(x.h)+'" fill="none" stroke="'+col+'" stroke-width="'+r1(2.5*k)+'" stroke-dasharray="'+r1(7*k)+' '+r1(5*k)+'"/>';
  if(x.lk)return o+'<text x="'+r1(x.x+8*k)+'" y="'+r1(x.y+22*k)+'" font-size="'+r1(18*k)+'">🔒</text>';
  imgHandles(x).forEach(function(h){o+=IMS.crop&&h[0].length===1?'<rect x="'+r1(h[1]-r)+'" y="'+r1(h[2]-r*.55)+'" width="'+r1(2*r)+'" height="'+r1(1.1*r)+'" rx="'+r1(r*.4)+'" fill="#fff" stroke="'+col+'" stroke-width="'+r1(2.5*k)+'"'+(h[0]==='e'||h[0]==='w'?' transform="rotate(90 '+r1(h[1])+' '+r1(h[2])+')"':'')+'/>'
    :'<circle cx="'+r1(h[1])+'" cy="'+r1(h[2])+'" r="'+r1(r)+'" fill="#fff" stroke="'+col+'" stroke-width="'+r1(2.5*k)+'"/>'});return o}
function imgHandles(x){var a=[['nw',x.x,x.y],['ne',x.x+x.w,x.y],['sw',x.x,x.y+x.h],['se',x.x+x.w,x.y+x.h]];
  if(IMS&&IMS.crop)a=a.concat([['n',x.x+x.w/2,x.y],['s',x.x+x.w/2,x.y+x.h],['w',x.x,x.y+x.h/2],['e',x.x+x.w,x.y+x.h/2]]);return a}
function imgSel(sel){var old=IMS;IMS=sel;if(old&&byKey[PKEY[old.i]]!==undefined)inkRender(old.i);if(sel&&(!old||old.i!==sel.i))inkRender(sel.i);updImgBar()}
function imgDown(i,pw,rc,p){var x=imgItem(),k=imgK(i);
  if(x&&IMS.i===i&&!x.lk){var h=imgHandles(x).filter(function(h){return Math.hypot(p[0]-h[1],p[1]-h[2])<24*k})[0];
    if(h){inkS={t:'img',i:i,pw:pw,rc:rc,h:h[0],it:x,o:JSON.parse(JSON.stringify(x)),a:p};return}}
  var hit=(INK[PKEY[i]]||[]).filter(function(y){return y.t==='i'&&inkHit(y,p)}).pop();
  if(hit){if(!IMS||IMS.id!==hit.id)imgSel({i:i,id:hit.id,crop:false});inkS={t:'img',i:i,pw:pw,rc:rc,h:'m',it:hit,o:JSON.parse(JSON.stringify(hit)),a:p};return}
  inkS={t:'imgadd',i:i,pw:pw,rc:rc,a:p}}
var imgRaf=0;
function imgMove(S,p){var dx=p[0]-S.a[0],dy=p[1]-S.a[1];if(Math.hypot(dx,dy)>6*imgK(S.i))S.moved=true;if(S.t==='imgadd'||!S.moved)return;
  var it=S.it,o=S.o;if(it.lk)return;var h=S.h,MIN=30;
  if(h==='m'){it.x=o.x+dx;it.y=o.y+dy}
  else if(!IMS.crop){var sx=h.indexOf('e')>=0?dx:-dx,sy=h.indexOf('s')>=0?dy:-dy,sc=Math.max(MIN/Math.min(o.w,o.h),1+(Math.abs(sx/o.w)>Math.abs(sy/o.h)?sx/o.w:sy/o.h));
    it.w=o.w*sc;it.h=o.h*sc;it.x=h.indexOf('w')>=0?o.x+o.w-it.w:o.x;it.y=h.indexOf('n')>=0?o.y+o.h-it.h:o.y}
  else{var c=o.cr||[0,0,1,1],fw=o.w/c[2],fh=o.h/c[3],fx=o.x-c[0]*fw,fy=o.y-c[1]*fh,x0=o.x,y0=o.y,x1=o.x+o.w,y1=o.y+o.h;
    if(h.indexOf('w')>=0)x0=Math.max(fx,Math.min(x1-MIN,o.x+dx));if(h.indexOf('e')>=0)x1=Math.min(fx+fw,Math.max(x0+MIN,o.x+o.w+dx));
    if(h.indexOf('n')>=0)y0=Math.max(fy,Math.min(y1-MIN,o.y+dy));if(h.indexOf('s')>=0)y1=Math.min(fy+fh,Math.max(y0+MIN,o.y+o.h+dy));
    it.x=x0;it.y=y0;it.w=x1-x0;it.h=y1-y0;it.cr=[(x0-fx)/fw,(y0-fy)/fh,it.w/fw,it.h/fh]}
  if(!imgRaf)imgRaf=requestAnimationFrame(function(){imgRaf=0;inkRender(S.i)})}
function imgUp(S,e){if(e.type!=='pointerup'&&!S.moved){return}
  if(S.t==='imgadd'){if(S.moved)return;if(IMPEND){imgPlace({i:S.i,p:S.a});return}if(IMS){imgSel(null);return}imgPick({i:S.i,p:S.a});return}
  if(!S.moved)return;var it=S.it,o=S.o,nw=JSON.parse(JSON.stringify(it));['x','y','w','h'].forEach(function(f){nw[f]=r1(nw[f])});if(nw.cr)nw.cr=nw.cr.map(function(v){return Math.round(v*10000)/10000});
  Object.keys(it).forEach(function(f){delete it[f]});Object.assign(it,o);nw.id=rid();IMS.id=nw.id;inkDo({t:'mod',k:PKEY[S.i],del:[it],add:[nw]})}
var IMF=document.createElement('input');IMF.type='file';IMF.accept='image/*';IMF.hidden=true;document.body.appendChild(IMF);
/* adding: tap صورة → choose a picture → tap the place on the page (any page: book or your own); or, with the tool on,
   tap an empty place first → choose → it goes there. If the device store fails the picture still shows (kept in memory). */
var IMPEND=null;
function imgPick(at){if(at&&wraps[at.i]&&wraps[at.i].classList.contains('lk')){railTip('الصفحة دي مقفولة');return}imgAt0=at||null;IMF.value='';IMF.click()}
function imgPlace(at){var P=IMPEND;if(!P)return;IMPEND=null;var ar=P.ch/P.cw,w=Math.min(420,816-80),h=w*ar;if(h>560){h=560;w=h/ar}
  var x=Math.max(20,Math.min(816-20-w,at.p[0]-w/2)),y=Math.max(20,Math.min(1152-20-h,at.p[1]-h/2)),it={id:rid(),t:'i',src:P.sid,x:r1(x),y:r1(y),w:r1(w),h:r1(h),cr:[0,0,1,1]};
  inkDo({t:'add',k:PKEY[at.i],items:[it]});imgSel({i:at.i,id:it.id,crop:false});railTip('اسحب الصورة عشان تحرّكها، والنقط في الأركان عشان تكبّرها')}
IMF.onchange=function(){var f=IMF.files&&IMF.files[0],at=imgAt0;imgAt0=null;if(!f)return;railTip('بنجهّز الصورة…');
  var u=URL.createObjectURL(f),im=new Image();im.onload=function(){var M=1400,s=Math.min(1,M/Math.max(im.naturalWidth,im.naturalHeight)),cw=Math.max(1,Math.round(im.naturalWidth*s)),ch=Math.max(1,Math.round(im.naturalHeight*s)),cv=document.createElement('canvas');
    cv.width=cw;cv.height=ch;var g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cw,ch);g.drawImage(im,0,0,cw,ch);URL.revokeObjectURL(u);
    cv.toBlob(function(b){if(!b){railTip('ما قدرنا نقرا الصورة');return}var sid='im'+rid();IMGU[sid]=URL.createObjectURL(b);
      var done=function(){IMPEND={sid:sid,cw:cw,ch:ch};if(at)imgPlace(at);else railTip('📍 اضغط المكان في الصفحة اللي عايز تحط فيهو الصورة')};
      idbDo('readwrite',function(o){return o.put(b,sid)}).then(done,done)},'image/jpeg',.85)};
  im.onerror=function(){URL.revokeObjectURL(u);railTip('ما قدرنا نفتح الصورة')};im.src=u};
/* bar for a selected picture: crop · fix · delete · close */
var IMB=document.createElement('div');IMB.className='inkbar imb';IMB.lang='ar';IMB.hidden=true;$('reader').appendChild(IMB);
function updImgBar(){var x=imgItem();IMB.hidden=!(x&&INKON);if(IMB.hidden)return;
  IMB.innerHTML=(x.lk?'':(IMS.crop?'<button type="button" class="cur" data-im="crop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg><span>تم القص</span></button>'
      :tbtn2('crop','قص','<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>')))+
    tbtn2('lk',x.lk?'فك التثبيت':'تثبيت',x.lk?'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>':'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>')+
    (x.lk?'':tbtn2('full','الأصل','<path d="M3 9V3h6M21 15v6h-6M3 3l7 7M21 21l-7-7"/>'))+
    tbtn2('del','حذف','<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>')+'<button type="button" class="ix" data-im="x" aria-label="إلغاء التحديد">✕</button>'}
function tbtn2(a,label,path){return '<button type="button" data-im="'+a+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg><span>'+label+'</span></button>'}
IMB.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var a=b.dataset.im,x=imgItem();if(!x){imgSel(null);return}var k=PKEY[IMS.i];
  if(a==='x'){imgSel(null);return}
  if(a==='crop'){IMS.crop=!IMS.crop;inkRender(IMS.i);updImgBar();if(IMS.crop)railTip('اسحب الحواف أو الأركان عشان تقص الصورة');return}
  if(a==='del'){var i=IMS.i;IMS=null;inkDo({t:'del',k:k,items:[x]});updImgBar();inkRender(i);return}
  var nw=JSON.parse(JSON.stringify(x));nw.id=rid();
  if(a==='lk'){nw.lk=x.lk?undefined:1;if(!nw.lk)delete nw.lk;IMS.crop=false;railTip(nw.lk?'الصورة اتثبّتت في مكانها':'الصورة بقت تتحرّك')}
  if(a==='full'){var c=x.cr||[0,0,1,1],fw=x.w/c[2],fh=x.h/c[3];nw.x=r1(x.x-c[0]*fw);nw.y=r1(x.y-c[1]*fh);nw.w=r1(fw);nw.h=r1(fh);nw.cr=[0,0,1,1]}
  IMS.id=nw.id;inkDo({t:'mod',k:k,del:[x],add:[nw]});updImgBar()});
/* pictures no longer used by any page (after a delete, once undo is gone at the next start) are removed from the device */
setTimeout(function(){var used={};Object.keys(INK).forEach(function(k){INK[k].forEach(function(x){if(x.src)used[x.src]=1})});
  idbDo('readonly',function(o){return o.getAllKeys()}).then(function(keys){(keys||[]).forEach(function(id){if(!used[id])idbDo('readwrite',function(o){return o.delete(id)})})}).catch(function(){})},8000);
pagesEl.addEventListener('pointerup',inkEnd);pagesEl.addEventListener('pointercancel',inkEnd);pagesEl.addEventListener('lostpointercapture',inkEnd);
updInk();
updTx();
updPen();
function colDots(attr,list,cur){return (list||HCOL).map(function(c){return '<button class="dot'+(c===(cur||PCOL)?' cur':'')+'" type="button" '+attr+'="'+c+'" aria-label="colour"></button>'}).join('')}
function showPalette(){$('hlbar').innerHTML='<span class="lbl">Highlight</span>'+colDots('data-c')+'<button class="txt ul" type="button" data-ul="1"><u style="text-decoration-color:'+UHEX[UCOL]+'">U</u> خط</button><button class="txt nb" type="button" data-n="1">✎ Note</button><button class="txt" type="button" data-x="1">✕</button>';$('hlbar').hidden=false}
document.addEventListener('selectionchange',function(){if($('reader').hidden)return;clearTimeout(document._hs);document._hs=setTimeout(function(){var o=selOffsets();if(o){if(penOn()&&!NOTE){if(lastPT!=='mouse'&&!penDrag&&!multiTouch()){clearTimeout(penT);penT=setTimeout(function(){if(Date.now()-lastScroll<700){window.getSelection().removeAllRanges();return}var o2=selOffsets();if(o2&&!penDrag&&!NOTE&&!multiTouch())penApply(o2)},500)}return}if(picked)hideBar();pending=o;showPalette()}else if(pending){hideBar()}},250)});
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
try{if(reanchorHL())setTimeout(function(){PAGES.forEach(function(p,i){if(HL[PKEY[i]])renderPage(i)})},0)}catch(e){}
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
  HL=m.hl;HLDEL=m.del;HLPREV=hsnap();stj('hl',HL);stj('hldel',HLDEL);reanchorHL();
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
    .then(function(){st('synced',Date.now());imgUpload()})
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
var TSKIP='svg,script,style,.gt,.ftr,h1,.kicker,.toc-h,.mzh,.chcov,a,input,textarea';
var TSKIP_AB='script,style,.gt,.ftr,h1,.kicker,.toc-h,.mzh,.chcov,a,input,textarea,svg .nogt';
function termText(root,skip){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode.closest(skip)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),a=[];while(w.nextNode())a.push(w.currentNode);return a}
function termPass(root,skip,re,key,seen){if(!re)return;termText(root,skip).forEach(function(n){var t=n.nodeValue,m,last=0,frag=null;re.lastIndex=0;
  while((m=re.exec(t))){var k=key(m[2]);
    /* part of a chemical formula (PO4, CO2, HCO3 written with <sub>): not an abbreviation */
    if(k!==undefined&&m.index+m[0].length===t.length&&n.nextSibling&&/^(SUB|SUP)$/.test(n.nextSibling.nodeName))k=undefined;
    if(k===undefined){re.lastIndex=m.index+m[1].length+1;continue}
    if(seen&&seen[k]){re.lastIndex=m.index+m[0].length;continue}  /* already explained on this page: skip the whole phrase */if(seen)seen[k]=1;
    var st0=m.index+m[1].length,word=m[2]+m[3];frag=frag||document.createDocumentFragment();frag.appendChild(document.createTextNode(t.slice(last,st0)));
    var sp=n.parentNode.closest('svg')?document.createElementNS('http://www.w3.org/2000/svg','tspan'):document.createElement('span');sp.setAttribute('class','gt');sp.dataset.t=k;sp.textContent=word;frag.appendChild(sp);last=st0+word.length;re.lastIndex=last}
  if(frag){frag.appendChild(document.createTextNode(t.slice(last)));n.parentNode.replaceChild(frag,n)}})}
function termify(root,skip){if(!root||root.dataset.tm)return;root.dataset.tm='1';var extra=skip;skip=skip?TSKIP+','+skip:TSKIP;
  var askip=TSKIP_AB+(extra?','+extra:'');   // abbreviations are also defined inside diagrams and headings (owner, Nov 2026)
  termPass(root,askip,AB_RE,function(w){var v=TAB[w];return v===undefined?undefined:'a'+[].concat(v).join('.')},null);
  termPass(root,skip,GL_RE,function(w){var v=TGL[gnorm(w)];return v===undefined?undefined:'g'+v},{})}
var FRONT=/^(cover|authors|about|reviewers|howto|references|contents|abbr)/;
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
$('qchips').innerHTML=META.chips.map(function(c){return '<button class="chip" type="button">'+esc(c)+'</button>'+'<button type="button" class="chip" data-sub="1">Device</button>'}).join('');
$('qchips').onclick=function(e){var b=e.target.closest('.chip');if(b){$('q').value=b.textContent;runSearch()}};
function runSearch(){var q=$('q').value.trim();var out=$('results');if(q.length<2){out.innerHTML='<p class="empty">Type at least 2 letters. Every page of the book is searched.</p>';return}
  var ql=q.toLowerCase(),hits=[];TEXT.forEach(function(t,i){var tl=t.toLowerCase(),k=tl.indexOf(ql),n=0;if(k<0)return;var c=k;while(c>=0){n++;c=tl.indexOf(ql,c+1)}
    var a=Math.max(0,k-60),snip=(a?'…':'')+esc(t.slice(a,k))+'<mark>'+esc(t.slice(k,k+q.length))+'</mark>'+esc(t.slice(k+q.length,k+q.length+80))+'…';hits.push({i:i,n:n,snip:snip})});
  out.innerHTML=hits.length?'<div class="res">'+hits.map(function(h){return '<button class="ri" type="button" data-i="'+h.i+'"><span class="pn">p '+(PAGES[h.i].bn||'✎')+'</span><span><b>'+esc(PAGES[h.i].label)+' · '+h.n+'×</b><span>'+h.snip+'</span></span></button>'}).join('')+'</div>':'<p class="empty">No page mentions “'+esc(q)+'”.</p>'}
$('q').addEventListener('input',runSearch);runSearch();
$('results').onclick=function(e){var b=e.target.closest('.ri');if(!b)return;var i=+b.dataset.i;goIdx(i);markIn(i,$('q').value.trim())};
function markIn(i,q){[].forEach.call(document.querySelectorAll('.bk mark.hit'),function(m){m.replaceWith(document.createTextNode(m.textContent))});if(!q)return;
  var ql=q.toLowerCase(),first=null;textNodes(wraps[i]).forEach(function(n){var t=n.nodeValue,k=t.toLowerCase().indexOf(ql);if(k<0)return;var r=document.createRange();r.setStart(n,k);r.setEnd(n,k+q.length);var m=document.createElement('mark');m.className='hit';try{r.surroundContents(m);if(!first)first=m}catch(e){}});
  if(first){var sc=$('scroller');sc.scrollTop=first.getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop-120}}

/* ---------- flashcards (known cards are remembered) ---------- */
function cardKey(id,c){var s=c[1],h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return id+':'+(h>>>0).toString(36)}
var curDeck='all',deck=[],total=0,known=0,started=false;
var deckIds=Object.keys(DECKS);
$('toolCards').textContent=deckIds.reduce(function(a,k){return a+DECKS[k].cards.length},0)+' cards · '+deckIds.length+' topic'+(deckIds.length===1?'':'s');
/* flashcards (owner, Nov 2026): Today and All on top, then a chapter bar, then the topics of the chosen chapter only */
var DCH={};(META.topics||[]).forEach(function(t){DCH[t.id]=t.ch});
var fcChs=[];META.contents.forEach(function(c){if(deckIds.some(function(id){return DCH[id]===c.no}))fcChs.push(c)});
var FCH=+st('fcch')||(fcChs[0]&&fcChs[0].no)||1;
function chDecks(n){return deckIds.filter(function(id){return DCH[id]===n})}
function kn(ids){var a=0,b=0;ids.forEach(function(id){a+=deckKnown(id);b+=DECKS[id].cards.length});return [a,b]}
function chips(){if(/^ch:/.test(curDeck))FCH=+curDeck.slice(3);else if(DCH[curDeck])FCH=DCH[curDeck];
  var D=daily(),A=kn(deckIds),C=kn(chDecks(FCH)),cur=fcChs.filter(function(c){return c.no===FCH})[0];
  var h='<div class="fctop"><button type="button" data-d="daily" class="'+(curDeck==='daily'?'on':'')+'"><b>Today</b><small>'+D.done.length+' / '+D.keys.length+' cards</small></button>'+
    '<button type="button" data-d="all" class="'+(curDeck==='all'?'on':'')+'"><b>All topics</b><small>'+A[0]+' / '+A[1]+' known</small></button></div>';
  h+='<div class="fclab">Chapters</div><div class="fcchs">'+fcChs.map(function(c){var k=kn(chDecks(c.no));
    return '<button type="button" data-fch="'+c.no+'" class="'+(c.no===FCH?'on':'')+'" style="--qc:'+c.color+'"><span class="n">'+c.no+'</span><span class="l">'+esc(c.short||c.title)+'</span><small>'+k[0]+'/'+k[1]+'</small></button>'}).join('')+'</div>';
  h+='<div class="fclab">'+esc(cur?cur.title:'')+'</div><div class="chips fctops"><button class="chip'+(curDeck==='ch:'+FCH?' on':'')+'" type="button" data-d="ch:'+FCH+'">All of chapter '+FCH+'<small>'+C[0]+'/'+C[1]+'</small></button>'+
    chDecks(FCH).map(function(k){return '<button class="chip'+(k===curDeck?' on':'')+'" type="button" data-d="'+k+'">'+esc(DECKS[k].short)+'<small>'+deckKnown(k)+'/'+DECKS[k].cards.length+'</small></button>'}).join('')+'</div>'+
    (LOCKED?'<button class="chip lkc" type="button" data-sub="1" dir="rtl">🔒 اشترك لفتح كل البطاقات</button>':'');
  $('deckChips').innerHTML=h;var on=$('deckChips').querySelector('.fcchs .on');if(on&&on.scrollIntoView)try{on.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}
$('deckChips').onclick=function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.fch){FCH=+b.dataset.fch;st('fcch',FCH);curDeck='ch:'+FCH;startDeck(curDeck);return}
  if(b.dataset.d){curDeck=b.dataset.d;if(/^ch:/.test(curDeck)||DCH[curDeck])st('fcch',/^ch:/.test(curDeck)?curDeck.slice(3):DCH[curDeck]);startDeck(curDeck)}};
function startDeck(k,all){started=true;
  if(k==='daily'){var D=daily();deck=[];total=D.keys.length;known=D.done.length;D.keys.forEach(function(key){if(D.done.indexOf(key)<0){var x=CBYK[key];deck.push({key:key,t:DECKS[x.id].short,cat:x.c[0],q:x.c[1],a:x.c[2]})}});chips();renderCard();return}
  var src=k==='all'?deckIds:/^ch:/.test(k)?chDecks(+k.slice(3)):[k];deck=[];total=0;known=0;
  src.forEach(function(id){DECKS[id].cards.forEach(function(c){var key=cardKey(id,c);total++;if(KNOWN[key]&&!all){known++;return}deck.push({key:key,t:DECKS[id].short,cat:c[0],q:c[1],a:c[2]})})});
  if(all)known=0;
  for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=deck[i];deck[i]=deck[j];deck[j]=x}chips();renderCard()}
function renderCard(){$('fcProg').style.width=(total?known/total*100:0)+'%';$('fcScore').textContent=(curDeck==='daily'?'Done ':'Known ')+known+' / '+total;
  if(!deck.length&&curDeck==='daily'){var sk=streak();$('fcLeft').textContent='';$('fcScore').textContent='Today '+total+' / '+total;
    $('fcStage').innerHTML='<div class="done"><b class="gtx">Today\'s cards are done</b><span class="flame">🔥 '+sk+'-day streak</span><span class="muted">Come back tomorrow for '+DN+' new cards. Keep the streak going!</span><button class="btn" type="button" id="fcMore">Study all topics</button></div>';
    $('fcMore').onclick=function(){curDeck='all';startDeck('all')};return}
  if(!deck.length){$('fcLeft').textContent='';$('fcStage').innerHTML='<div class="done"><b>Deck finished</b><span class="muted">All '+total+' cards are marked as known. They stay known next time you open the app.</span><button class="btn" type="button" id="fcAll">Study all cards again</button><button class="chip" type="button" id="fcReset">Reset progress for this deck</button></div>';
    $('fcAll').onclick=function(){startDeck(curDeck,true)};
    $('fcReset').onclick=function(){var src=curDeck==='all'?deckIds:/^ch:/.test(curDeck)?chDecks(+curDeck.slice(3)):[curDeck];src.forEach(function(id){DECKS[id].cards.forEach(function(c){delete KNOWN[cardKey(id,c)]})});saveKnown();startDeck(curDeck)};return}
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
function chShort(n){var c=META.contents.filter(function(x){return x.no===n})[0];return c?(c.short||c.title):'Chapter '+n}
function chTitle(n){var c=META.contents.filter(function(x){return x.no===n})[0];return c?c.title:'Chapter '+n}
function inPool(q,pool){var u=QU[q.id];if(pool==='unused')return !u||u.c===undefined;if(pool==='incorrect')return u&&u.c===0;if(pool==='marked')return u&&u.m;return true}
function poolQs(){var any=Object.keys(qset.ch).some(function(k){return qset.ch[k]});
  return QS.filter(function(q){return (!any||qset.ch[QTOP[q[0]].ch])&&inPool(q,qset.pool)})}
function qbStats(){var used=0,ok=0,m=0;QS.forEach(function(q){var u=QU[q.id];if(u&&u.c!==undefined){used++;if(u.c)ok++}if(u&&u.m)m++});return {used:used,ok:ok,m:m}}
function renderQB(){if(CUR&&!CUR.done)return renderQ();$('subtitle').textContent='Question bank';
  var s=qbStats(),pool=poolQs(),max=pool.length,n=Math.min(qset.n,max);
  var h='<div class="qbst"><div><b>'+pct(s.ok,s.used)+'%</b><span>Correct</span></div><div><b>'+s.used+'<small> / '+QS.length+'</small></b><span>Used</span></div><div><b>'+(QS.length-s.used)+'</b><span>Unused</span></div><div><b>'+s.m+'</b><span>Marked</span></div></div>';
  if(LOCKED)h+='<button type="button" class="trial ar" dir="rtl" data-sub="1"><b>'+(TRIALNEW?'جرّب بنك الأسئلة كاملًا مجانًا':'النسخة المجانية · '+QS.length+' سؤال')+'</b><span>'+(TRIALNEW?'النسخة التجريبية ('+trialDur()+') تفتح كل الأسئلة':'اشترك لفتح بنك الأسئلة كاملًا')+'</span><i>اضغط هنا للاشتراك</i></button>';
  var any=Object.keys(qset.ch).some(function(k){return qset.ch[k]}),nsel=qchs.filter(function(c){return qset.ch[c]}).length;
  function step(no,t,r){return '<div class="qbl"><span class="qno">'+no+'</span>'+t+(r?'<em>'+r+'</em>':'')+'</div>'}
  h+='<div class="sh"><h3>Create a test</h3></div><div class="qbf">';
  h+=step(1,'Mode')+'<div class="seg" data-k="mode">'+[['tutor','Tutor','see the answer after each question'],['timed','Timed','like the exam · 1 min 15 s each']].map(function(o){return '<button type="button" data-v="'+o[0]+'" class="'+(qset.mode===o[0]?'on':'')+'"><b>'+o[1]+'</b><span>'+o[2]+'</span></button>'}).join('')+'</div>';
  h+=step(2,'Questions')+'<div class="qbpool" data-k="pool">'+[['unused','Unused'],['incorrect','Incorrect'],['marked','Marked'],['all','All']].map(function(o){
    var c=QS.filter(function(q){return inPool(q,o[0])}).length;return '<button type="button" class="'+(qset.pool===o[0]?'on':'')+'" data-v="'+o[0]+'"><b>'+c+'</b><span>'+o[1]+'</span></button>'}).join('')+'</div>';
  h+=step(3,'Chapters',any?nsel+' selected · <button type="button" class="qblink" id="qbAll">clear</button>':'all chapters')+'<div class="qbparts">'+(function(ps){var o=[];ps.forEach(function(p){var l=o[o.length-1];if(p[1].length===1&&l&&l.one){l[0]+=' · '+chShort(p[1][0]);l[1]=l[1].concat(p[1])}else{var q=[p[1].length===1?chShort(p[1][0]):p[0],p[1].slice()];q.one=p[1].length===1;o.push(q)}});return o})(QB.parts||[['',qchs]]).map(function(p){
    var cs=p[1].filter(function(n){return qchs.indexOf(n)>=0});if(!cs.length)return '';
    var allOn=cs.every(function(n){return qset.ch[n]}),pc=cs.reduce(function(a,n){return a+QS.filter(function(q){return QTOP[q[0]].ch===n}).length},0);
    return '<button type="button" class="qbpt'+(allOn?' on':'')+'" data-part="'+cs.join(',')+'"><span>'+esc(p[0]||'Chapters')+'</span><small>'+pc+' questions · '+(allOn?'selected':'select all')+'</small></button><div class="qbch">'+cs.map(function(n){var c=QS.filter(function(q){return QTOP[q[0]].ch===n}).length;
      return '<button type="button" class="qx'+n+(qset.ch[n]?' on':'')+'" data-ch="'+n+'" title="'+esc(chTitle(n))+'"><span class="n">'+n+'</span><span class="l">'+esc(chShort(n))+'</span><small>'+c+'</small></button>'}).join('')+'</div>'}).join('')+'</div>';
  h+=step(4,'Number of questions',max+' available')+'<div class="qbnq">'+[10,20,40,max].filter(function(v,ix,a){return v>0&&v<=max&&a.indexOf(v)===ix}).map(function(v){return '<button type="button" data-qn="'+v+'" class="'+(n===v?'on':'')+'">'+(v===max&&v>40?'All '+v:v)+'</button>'}).join('')+'</div>'+
    '<div class="qbn"><input type="range" id="qbN" min="1" max="'+Math.max(1,Math.min(max,100))+'" value="'+Math.max(1,n)+'"'+(max?'':' disabled')+'><b id="qbNv">'+n+'</b></div></div>';
  h+='<div class="qbbar"><button class="btn qbgo" type="button" id="qbGo"'+(max?'':' disabled')+'>'+(max?'Start test<small id="qbGoS">'+n+' questions · '+(qset.mode==='timed'?'Timed':'Tutor')+'</small>':'No questions match')+'</button></div>';
  if(QT.length){h+='<div class="sh"><h3>Previous tests</h3><span>Tap to review</span></div><div class="qbprev">'+QT.slice().reverse().map(function(t,i){var j=QT.length-1-i,sc=pct(t.ok,t.ids.length);
    return '<button type="button" data-t="'+j+'"><span class="sc '+(sc>=70?'g':sc>=50?'m':'b')+'">'+sc+'%</span><span class="l"><b>'+t.ok+' / '+t.ids.length+' correct</b><small>'+(t.mode==='timed'?'Timed':'Tutor')+' · '+new Date(t.d).toLocaleDateString(undefined,{day:'numeric',month:'short'})+'</small></span><span class="go">›</span></button>'}).join('')+'</div>'+
    '<button class="chip qbreset" type="button" id="qbReset">Reset all question-bank progress</button>'}
  var qk=$('qbank'),qy=qk?qk.scrollTop:0;$('qbWrap').innerHTML=h;if(qk)qk.scrollTop=renderQB.keep?qy:0;renderQB.keep=0}
$('qbWrap').addEventListener('input',function(e){if(e.target.id==='qbN'){qset.n=+e.target.value;$('qbNv').textContent=e.target.value;var gs=$('qbGoS');if(gs)gs.textContent=e.target.value+' questions · '+(qset.mode==='timed'?'Timed':'Tutor');[].forEach.call($('qbWrap').querySelectorAll('[data-qn]'),function(x){x.classList.toggle('on',+x.dataset.qn===qset.n)});saveQB()}});
$('qbWrap').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!$('qbWrap').contains(b))return;
  var g=b.parentNode.dataset&&b.parentNode.dataset.k;
  if(g&&b.dataset.v){qset[g]=b.dataset.v;saveQB();renderQB.keep=1;renderQB();return}
  if(b.dataset.ch){qset.ch[b.dataset.ch]=!qset.ch[b.dataset.ch];saveQB();renderQB.keep=1;renderQB();return}
  if(b.dataset.qn){qset.n=+b.dataset.qn;saveQB();renderQB.keep=1;renderQB();return}
  if(b.id==='qbAll'){qset.ch={};saveQB();renderQB.keep=1;renderQB();return}
  if(b.dataset.part){var ns=b.dataset.part.split(','),on=ns.every(function(n){return qset.ch[n]});ns.forEach(function(n){qset.ch[n]=!on});saveQB();renderQB.keep=1;renderQB();return}
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
function updLis(c){var b=$('lisBtn');if(!b||!AUP)return;var a=AUP[(PAGES[c]||{}).bn-1],pg=PAGES[c]||{};b.classList.toggle('soon',!a);if(!a){b.classList.remove('on');$('lisLbl').textContent='Listen';return}var on=PL&&PL.g===a[0]&&!aud.paused;
  b.classList.toggle('on',!!on);$('lisLbl').innerHTML=on?'<i class="eq"><i></i><i></i><i></i></i>Playing':'Listen'}
var lisT=null;function lisSoon(){railTip('The audio lecture for this page is coming soon')}
function railTip(msg){var t=$('lisTip');if(!t){t=document.createElement('div');t.id='lisTip';t.className='listip';$('reader').appendChild(t)}
  t.textContent=msg;t.classList.add('on');clearTimeout(lisT);lisT=setTimeout(function(){t.classList.remove('on')},2600)}
$('lisBtn').onclick=function(){if($('reader').hidden){show('lectures');return}var c=currentPage(),a=AUP&&AUP[(PAGES[c]||{}).bn-1];if(!a){if(!(PAGES[c]||{}).topic){show('lectures');return}lisSoon();return}if(PL&&PL.g===a[0]&&PL.k===a[1]){aud.paused?aud.play().catch(function(){}):aud.pause();return}playPart(a[0],a[1],0)};
/* Lectures screen */
function lectRow(g,t,c){if(!g)return '<div class="lr soon lc'+c+'"><span class="n">'+esc(t.no)+'</span><span class="l"><b>'+esc(t.title)+'</b><small>Recording soon</small></span><span class="tag">SOON</span></div>';
  var free=gFree(g),hv=gHave(g),dl=DLING[g.g],on=PL&&PL.g===g&&!aud.paused;
  return '<div class="lr lc'+c+(PL&&PL.g===g?' cur':'')+'" data-g="'+g.g+'"><span class="n">'+esc(g.no)+'</span><span class="l"><b>'+esc(g.title)+'</b><small>'+mins(g.sec)+' · '+g.parts.length+' page'+(g.parts.length>1?'s':'')+(g.parts.length<g.n?' of '+g.n:'')+' · '+mb(g.bytes)+(hv?' · downloaded ✓':dl?' · downloading…':'')+'</small></span>'+
    (!free?'<button type="button" class="lk" data-sub="1" aria-label="للمشتركين">🔒</button>':
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
  if(LOCKED)h+='<p class="muted" style="text-align:center;margin:0">النسخة المجانية تفتح محاضرات المواضيع المجانية فقط. اشترك لفتح كل المحاضرات.</p>';
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
  page:{get:function(){var p=st('page');return p?{p:p}:{}},set:function(v){if(v.p)st('page',v.p)}},
  upg:{get:function(){return UPG},set:function(v){var o={};Object.keys(v).forEach(function(k){if(v[k])o[k]=v[k]});UPG=o;stj('upg',UPG)}}};
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
/* Welcome card on opening the app (owner, Nov 2026): "Welcome, Doctor"; a subscribed student sees their name, signed with their code */
function welcomeTitle(){var n=(!LOCKED&&st('code')&&st('name'))||'';if(!n)return 'Welcome, Doctor';return 'Welcome, '+(/^(dr\.?|doctor|د\.?|دكتور)\s/i.test(n)?n:'Dr. '+n)}
function welcomeName(){var t=document.querySelector('#welc .wt');if(t)t.textContent=welcomeTitle()}
(function(){if((TRIALNEW&&!st('chz'))||(TRIALEND&&TRIAL&&!TRIAL.seen))return;   // owner: when the opening choice is due it shows at once, without the welcome card
  var code=!LOCKED&&st('code');var w=document.createElement('div');w.id='welc';w.setAttribute('role','dialog');
  w.innerHTML='<div class="wcard"><img src="img/logo.webp" alt=""><div class="wt" dir="auto"></div>'+
    (code?'<div class="wsig"><span class="wln"></span><span class="wc">Code <b dir="ltr">'+esc(code)+'</b></span></div>':'<div class="ws">Pediatrics Master Review · 1st edition</div>')+'</div>';
  document.body.appendChild(w);welcomeName();
  function close(){if(!w.parentNode)return;w.classList.add('out');setTimeout(function(){if(w.parentNode)w.parentNode.removeChild(w)},450)}
  w.addEventListener('click',close);setTimeout(close,1500)})();
/* start */
GLAST=gsnap();updUR();
refreshHome();
if(LINKCODE&&(LOCKED||INTRIAL))openSub(LINKCODE);else if((TRIALNEW&&!st('chz'))||(TRIALEND&&!TRIAL.seen)){if(TRIALNEW)setMust(true);if(TRIALEND){TRIAL.seen=1;try{localStorage.setItem('prr-trial',JSON.stringify(TRIAL))}catch(e){}}setTimeout(openChoose,250)}   // owner: on opening, choose the 24-hour trial or the paid version
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){navigator.serviceWorker.register('sw.js').catch(function(){})}
})();


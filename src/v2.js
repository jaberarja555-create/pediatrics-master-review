/* ===== Pediatric Master Review in the new app design (owner, 11 Nov 2026: "make them as the new Obstetrics design") =====
   Same layout as the Obstetrics app in the book's own green: five places (Home · Chapters · Practice · Resources · Settings),
   the old screens (reader, cards, question bank, search, lectures, subscription) keep working inside it.
   Built only for the preview (PRR_V2=1) until the owner approves. Keys: prr-mode, prr-myname, prr-photo, prr-pseg. */
(function(){
var P={chat:'<path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z"/>',send:'<path d="M20.5 4.5L3.5 11l5 1.8 1.8 5.7 2.8-3.4 4.4 3.4z"/><path d="M8.5 12.8l8-5.3-6.2 6.9"/>',home:'<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
 book:'<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.500-.5 6.500 0 8.500 1.500 2-1.500 5-2 8.500-1.500V5C17 4.500 14 5 12 6.500z"/><path d="M12 6.500v13"/>',
 clip:'<rect x="5" y="4.500" width="14" height="16" rx="2"/><path d="M9 4.500V3.500h6v1M9 10h6M9 14h4"/>',
 layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.500l9 5 9-5M3 16.500l9 5 9-5"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13.500a7.500 7.500 0 0 0 0-3l2-1.500-2-3.500-2.400 1a7.500 7.500 0 0 0-2.600-1.500L14 2.500h-4l-.4 2.500A7.500 7.500 0 0 0 7 6.500l-2.400-1-2 3.500 2 1.500a7.500 7.500 0 0 0 0 3l-2 1.500 2 3.500 2.400-1a7.500 7.500 0 0 0 2.600 1.500l.4 2.500h4l.4-2.500a7.500 7.500 0 0 0 2.600-1.500l2.400 1 2-3.500z"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',chev:'<path d="M9 6l6 6-6 6"/>',up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
 q:'<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.500l5 3.500-5 3.500z"/>',
 slides:'<rect x="3" y="4" width="18" height="12" rx="1.500"/><path d="M12 16v4M8 20h8M9 9h6M9 12h3"/>',
 bars:'<path d="M5 20v-6M10 20V9M15 20v-9M20 20V5"/>',flame:'<path d="M12 3c1 3.500 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.500 1.500 2 2 2-1-3 0-6 1-8z"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',bm:'<path d="M7 4h10v16l-5-4-5 4z"/>',
 bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',pill:'<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
 steth:'<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>',pen:'<path d="M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
 moon:'<path d="M21 12.800A9 9 0 1 1 11.200 3a7 7 0 0 0 9.800 9.800z"/>',auto:'<circle cx="12" cy="12" r="9"/><path d="M9 16l3-8 3 8M10 13.500h4"/>',
 crown:'<path d="M4 18h16l1-10-5 4-4-7-4 7-5-4z"/>',sync:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4"/>',
 dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.500 7 2.500 7h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500h.01"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 check:'<path d="M5 12.500l4.500 4.500L19 7.500"/>',mon:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 2-2s-.5-1.500-.5-2.500 1-1.500 2-1.500H18a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.500" r="1"/><circle cx="16" cy="10" r="1"/>'};
function I(n,c){return '<svg class="v2ic'+(c?' '+c:'')+'" viewBox="0 0 24 24">'+P[n].replace(/\.(\d)00\b/g,'.$1')+'</svg>'}
document.body.classList.add('v2');
var root=document.documentElement,INFO=window.PED_INFO||{},CHI={};(INFO.chimg||[]).forEach(function(n){CHI[n]=1});
function X(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function pc(a,b){return b?Math.round(a/b*100):0}

/* ---------- look: day / night / automatic (the book pages keep their own day / eye / night) ---------- */
var MODE=st('mode')||'day',MQ=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):{matches:false};
function isDark(){return MODE==='night'||(MODE==='auto'&&MQ.matches)}
function applyLook(){root.setAttribute('data-pal','peds');root.setAttribute('data-theme',isDark()?'dark':'light');$('v2th').innerHTML=I(isDark()?'moon':'sun');
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content=isDark()?'#101C16':'#F0F7F3'}
if(MQ.addEventListener)MQ.addEventListener('change',function(){if(MODE==='auto')applyLook()});
$('v2th').onclick=function(){MODE=isDark()?'day':'night';st('mode',MODE);applyLook();if(CURV==='v2settings')R.v2settings()};

/* ---------- profile ---------- */
function myName(){return (st('myname')||(st('act')&&st('name'))||'').trim()}
function greet(){var n=(myName()||'').replace(/^\s*(د\s*\.|د\s*\/|دكتور|دكتورة|dr\.?|doctor)\s*/i,'');return n?'مرحب بك يا د. <bdi>'+X(n)+'</bdi>':'مرحب بك يا دكتور'}
function avatar(el){if(!el)return;var ph=st('photo'),n=myName();el.style.backgroundImage=ph?'url('+ph+')':'';el.innerHTML=ph?'':(n?X(n.replace(/^(dr\.?|د\.?)\s*/i,'').slice(0,1).toUpperCase()):I('user'))}
function header(){avatar($('v2av'));$('v2nm').textContent=myName()||'Doctor'}

/* ---------- access ---------- */
function access(){if(REVIEW||(!LOCKED&&!INTRIAL))return 'paid';if(INTRIAL)return 'trial';return TRIALEND?'expired':'free'}
function isFree(){var a=access();return a==='free'||a==='expired'}
function locked(t){return LOCKED&&!FREE[t.id]}

/* ---------- data ---------- */
var tById={};TOPICS.forEach(function(t){tById[t.id]=t});
var CHS=(META.contents||[]).filter(function(c){return c.topics.some(function(x){return tById[x.id]})});
function chap(n){for(var i=0;i<CHS.length;i++)if(CHS[i].no===n)return CHS[i];return {no:n,title:'',topics:[]}}
function chTopics(c){return c.topics.map(function(x){return tById[x.id]}).filter(Boolean)}
function chImg(n){return CHI[n]?'img/chcover_'+n+'.jpg':'img/cover5.jpg'}
function tPct(t){return pc(topicRead(t),t.pages.length)}
function chStat(c){var ts=chTopics(c),np=0,nr=0,nm=0;ts.forEach(function(t){np+=t.pages.length;nr+=topicRead(t);nm+=topicMast(t)});return {ts:ts,np:np,nr:nr,nm:nm,pr:pc(nr,np)}}
function overall(){var tp=0,tr=0;TOPICS.forEach(function(t){tp+=t.pages.length;tr+=topicRead(t)});return pc(tr,tp)}
function cTot(){var n=0;deckIds.forEach(function(id){n+=DECKS[id].cards.length});return n}
function cKnown(){var n=0;deckIds.forEach(function(id){n+=deckKnown(id)});return n}
function qStat(){var a=0,ok=0,m=0;QS.forEach(function(q){var s=QU[q.id];if(s){if('c' in s){a++;if(s.c)ok++}if(s.m)m++}});return {a:a,ok:ok,m:m}}
function dueToday(){try{var D=daily();return Math.max(0,D.keys.length-D.done.length)}catch(e){return 0}}
function topicAt(i){var p=PAGES[i]||{};return p.topic?tById[p.topic]:null}
function ring(p,sz){var r=15.5,c=2*Math.PI*r;return '<svg class="rg" viewBox="0 0 36 36" width="'+sz+'" height="'+sz+'"><circle cx="18" cy="18" r="'+r+'" fill="none" stroke="var(--sel)" stroke-width="4"/>'+(p>0?'<circle cx="18" cy="18" r="'+r+'" fill="none" stroke="var(--pri)" stroke-width="4" stroke-linecap="round" stroke-dasharray="'+(c*p/100).toFixed(1)+' '+c.toFixed(1)+'" transform="rotate(-90 18 18)"/>':'')+'</svg>'}
function bar(v){return '<span class="v2bar"><i style="width:'+v+'%"></i></span>'}
function title(t,back,crumb){return '<div class="v2pt" lang="ar">'+(back?'<button type="button" class="v2bk" data-v="'+back+'" aria-label="رجوع">'+I('arrow')+'</button>':'')+'<h2>'+t+'</h2>'+(crumb?'<span class="v2crumb">'+crumb+'</span>':'')+'</div>'}
function openTopic(t){if(locked(t)){openSub();return}goPage(t.p-1)}

/* ---------- navigation: five places; the old screens (reader, cards, question bank, search, lectures) open inside the new app ---------- */
var V2=['v2home','v2chapters','v2chapter','v2practice','v2resources','v2settings','v2profile','v2notif','v2contact'],R={},RET='v2home';
var NAV=[['v2home','Home','home'],['v2chapters','Chapters','book'],['v2practice','Practice','clip'],['v2resources','Resources','layers'],['v2settings','Settings','gear']];
function tabOf(v){return {v2chapter:'v2chapters',reader:'v2chapters',cards:'v2practice',qbank:'v2practice',lectures:'v2resources',v2profile:'v2settings',v2contact:'v2settings',search:'v2home',v2notif:'v2home'}[v]||v}
var _show=show;
function go(v){if(v==='home')v='v2home';var was=CURV;
  if(V2.indexOf(v)>=0){try{if(typeof setImm==='function')setImm(false)}catch(e){}views.forEach(function(x){$(x).hidden=true});V2.forEach(function(x){$(x).hidden=x!==v});CURV=v;try{hideBar();bmMenu.hidden=true}catch(e){}R[v]();if(v!==was)window.scrollTo(0,0)}
  else{V2.forEach(function(x){$(x).hidden=true});if(v==='reader'&&was!=='reader')RET=V2.indexOf(was)>=0?was:RET;_show(v)}
  $('app').classList.toggle('rd',v==='reader');var t=tabOf(v);
  [].forEach.call(document.querySelectorAll('#v2nav button,#v2sn button'),function(b){b.classList.toggle('on',b.dataset.v===t)});header()}
show=go;
$('backBtn').onclick=function(){go(RET||'v2home')};
var nb=NAV.map(function(n){return '<button type="button" data-v="'+n[0]+'">'+I(n[2])+'<span>'+n[1]+'</span></button>'}).join('');$('v2nav').innerHTML=nb;$('v2sn').innerHTML=nb;
document.addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(b&&(V2.indexOf(b.dataset.v)>=0||views.indexOf(b.dataset.v)>=0)){go(b.dataset.v);return}
  b=e.target.closest('[data-act]');if(b&&ACT[b.dataset.act])ACT[b.dataset.act](b,e)});
$('v2sb').onclick=function(){go('search')};$('v2me').onclick=function(){go('v2profile')};$('v2bell').onclick=function(){go('v2notif')};
$('v2q').addEventListener('input',function(){if(CURV!=='search')go('search');$('q').value=this.value;runSearch()});

/* ---------- Home ---------- */
R.v2home=function(){var a=access(),lp=lastPage(),has=!!st('page')&&lp>0,t=has?topicAt(lp):TOPICS[0],sk=0;try{sk=streak()}catch(e){}
  var acc={free:['النسخة المجانية','الموضوع الأول من كل فصل مفتوح مجانًا','اشترك','crown'],trial:['الفترة التجريبية','الكتاب كله مفتوح حتى تنتهي الفترة','اشترك','crown'],
    paid:['النسخة الكاملة','هذا الجهاز مفعّل والكتاب مفتوح كاملًا','الاشتراك','crown'],expired:['انتهت الفترة التجريبية','الموضوع الأول من كل فصل ما زال مفتوحًا','اشترك','crown']}[a];
  var c=t?chap(t.ch):null,qs=qStat();
  var ct='<div class="cb cbt">'+(t?'<em>Chapter '+t.ch+'</em><div><b>'+X(c.title)+'</b><small>'+X(t.title)+'</small></div>':'<div><b>'+X((PAGES[lp]||{}).label||'')+'</b></div>')+'</div>'+
    '<div class="cb cbb"><div class="cp">'+(t?'<b>'+tPct(t)+'%</b>'+bar(tPct(t)):'')+'</div>';
  $('v2homeW').innerHTML='<div class="hgr"><div class="l"><b>Pediatric Master Review</b><span>1st Edition · 2026</span></div><h2 lang="ar" dir="rtl">'+greet()+'</h2><p>Pediatric Master Review</p></div>'+
   '<div class="v2c hacc" lang="ar">'+I('book')+'<div><b>'+acc[0]+'</b><small>'+acc[1]+'</small></div><button type="button" class="v2btn sm" data-act="sub">'+I(acc[3])+acc[2]+'</button></div>'+
   '<div class="hgrid"><div>'+
    '<div class="v2c hcont hc2"><div class="ph"'+(t?' style="background-image:url('+chImg(t.ch)+')"':'')+'></div>'+ct+'<button type="button" class="v2btn" data-act="cont" lang="ar">'+(has?'تابع القراءة':'ابدأ القراءة')+I('arrow')+'</button></div></div>'+
    '<div class="v2c hbook"><img src="img/cover5.jpg" alt="Book cover"><div><h3>Pediatric Master Review</h3><span class="ed">1st Edition</span>'+
      '<div class="ct"><div><b>'+CHS.length+'</b><span>chapters</span></div><div><b>'+TOPICS.length+'</b><span>topics</span></div><div><b>'+(INFO.cards||cTot())+'</b><span>flashcards</span></div><div><b>'+(INFO.qs||QS.length)+'</b><span>questions</span></div></div>'+
      '<button type="button" class="v2btn ol" data-act="cover" lang="ar">'+I('book')+'افتح الكتاب كاملًا</button></div></div>'+
   '</div><div>'+
    '<div class="hsm2" lang="ar"><button type="button" class="v2c" data-act="prog"><span class="ic fl">'+I('flame')+'</span><span class="tx"><b><bdi>'+sk+'</bdi> '+(sk===1?'يوم':'أيام')+'</b><small>'+(sk?'سلسلة المراجعة اليومية':'ابدأ سلسلتك اليوم')+'</small></span></button>'+
     '<button type="button" class="v2c" data-act="prog"><span class="ic">'+ring(overall(),34)+'</span><span class="tx"><b><bdi>'+overall()+'%</bdi></b><small>التقدم الكلي</small></span></button></div>'+
    '<div class="hst" lang="ar"><button type="button" class="v2c" data-act="cards"><span class="t">'+I('layers')+'بطاقات اليوم</span><span class="n">'+(dueToday()?dueToday()+' بطاقات':'اكتملت ✓')+'</span><span class="a">ابدأ المراجعة'+I('back')+'</span></button>'+
      '<button type="button" class="v2c" data-v="qbank"><span class="t">'+I('q')+'بنك الأسئلة</span><span class="n">'+(INFO.qs||QS.length)+' سؤال</span><span class="a">ابدأ التدريب'+I('back')+'</span></button></div>'+
    '<div class="hq" lang="ar"><button type="button" class="v2c" data-act="rr">'+I('bolt')+'<span>المراجعة السريعة<small>Rapid Review</small></span>'+I('chev','cv')+'</button>'+
      '<button type="button" class="v2c" data-act="dr">'+I('pill')+'<span>أدوية الأطفال<small>Pediatric drugs</small></span>'+I('chev','cv')+'</button>'+
      '<button type="button" class="v2c" data-v="lectures">'+I('play')+'<span>المحاضرات<small>Lectures</small></span>'+I('chev','cv')+'</button></div>'+
   '</div></div>'};

/* ---------- Chapters ---------- */
var CHF='all',CHQ='',CH=1,CHRET='v2chapters';
R.v2chapters=function(){var q=CHQ.trim().toLowerCase(),part='';
  var rows=CHS.map(function(c){var s=chStat(c);
    if(CHF==='prog'&&!(s.nr>0&&s.pr<100))return '';
    if(q&&c.title.toLowerCase().indexOf(q)<0&&!s.ts.some(function(t){return t.title.toLowerCase().indexOf(q)>=0}))return '';
    var ph=c.part&&c.part!==part?'<p class="shd chp" lang="en">'+X(c.part)+'</p>':'';if(c.part)part=c.part;
    return ph+'<button type="button" class="v2c chr" data-act="ch" data-n="'+c.no+'"><span class="im" style="background-image:url('+chImg(c.no)+')"></span><span><b>Chapter '+c.no+' · '+X(c.title)+'</b><small>'+I('book')+s.ts.length+' topics'+bar(s.pr)+s.pr+'%</small></span>'+I('chev')+'</button>'}).join('');
  var keep=document.activeElement&&document.activeElement.id==='chQ';
  $('v2chaptersW').innerHTML=title('الفصول')+'<label class="chs2" lang="ar">'+I('book')+'<input id="chQ" type="search" placeholder="ابحث في الفصول أو الموضوعات…" value="'+X(CHQ)+'" dir="auto"></label>'+
    '<div class="chf" lang="ar">'+[['all','الكل'],['prog','قيد القراءة']].map(function(f){return '<button type="button" data-act="chf" data-f="'+f[0]+'" class="'+(CHF===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>'+
    '<div class="chl">'+(rows||'<div class="v2emp" lang="ar">'+I('book')+'<br>لا توجد فصول مطابقة.</div>')+'</div>';
  var el=$('chQ');el.oninput=function(){CHQ=this.value;R.v2chapters()};if(keep){el.focus();el.setSelectionRange(CHQ.length,CHQ.length)}};
R.v2chapter=function(){var c=chap(CH),s=chStat(c),fr=isFree();
  $('v2chapterW').innerHTML='<div class="v2pt" lang="ar"><button type="button" class="v2bk" data-v="'+CHRET+'" aria-label="رجوع">'+I('arrow')+'</button><span class="v2crumb" style="flex:1;text-align:right">'+(CHRET==='v2resources'?'المصادر':'الفصول')+' ‹ <bdi>Chapter '+c.no+'</bdi></span></div>'+
   '<div class="v2c chd"><div class="ph" style="background-image:url('+chImg(c.no)+')"></div><em>Chapter '+c.no+'</em><h3>'+X(c.title)+'</h3><small>'+s.ts.length+' topics · '+s.np+' pages · '+s.pr+'% read</small></div>'+
   '<div class="tpl">'+s.ts.map(function(t){var lk=locked(t),n=t.pages.length,p=tPct(t);
     return '<div class="v2c tpr'+(lk?' lk':'')+'"><span class="li">'+I(lk?'lock':'book')+'</span><button type="button" class="tmn" data-act="topic" data-id="'+t.id+'"><b>'+X(t.no)+' '+X(t.title)+'</b>'+(fr&&!lk?'<span class="fr">FREE</span>':'')+
       '<small>'+n+' page'+(n===1?'':'s')+'</small><span class="pr">'+bar(p)+p+'%</span></button></div>'}).join('')+'</div>'+
   '<div class="cha" lang="ar"><button type="button" class="v2btn" data-act="chread">ابدأ القراءة'+I('back')+'</button><button type="button" class="v2btn ol" data-v="qbank">'+I('q')+'بنك الأسئلة</button><button type="button" class="v2btn ol" data-act="chc">'+I('layers')+'بطاقات الفصل</button></div>'};

/* ---------- Practice ---------- */
var PSEG=st('pseg')==='c'?'c':'q';
R.v2practice=function(){var fr=isFree(),wide=window.matchMedia&&matchMedia('(min-width:760px)').matches;
  function qp(){var s=qStat();return '<div class="pstat" lang="ar"><div class="v2c"><b>'+QS.length+'</b><span>سؤال'+(fr&&INFO.qs?' من '+INFO.qs:'')+'</span></div><div class="v2c"><b>'+s.a+'</b><span>تمت الإجابة</span></div><div class="v2c"><b>'+(s.a?pc(s.ok,s.a)+'%':'–')+'</b><span>إجابات صحيحة</span></div></div>'+
      '<button type="button" class="v2btn" data-v="qbank" lang="ar" style="height:50px">'+I('play')+'ابدأ التدريب</button>'+
      '<button type="button" class="v2c hrow" data-v="qbank" lang="ar"><span class="ii">'+I('clip')+'</span><span><b>إنشاء اختبار</b><small>تدريب أو امتحان بالوقت · اختيار الفصول وعدد الأسئلة · '+s.m+' سؤال محفوظ</small></span>'+I('chev')+'</button>'}
  function cp(){return '<div class="pstat" lang="ar"><div class="v2c"><b>'+cTot()+'</b><span>بطاقة'+(fr&&INFO.cards?' من '+INFO.cards:'')+'</span></div><div class="v2c"><b>'+cKnown()+'</b><span>عرفتها</span></div><div class="v2c"><b>'+dueToday()+'</b><span>مستحق اليوم</span></div></div>'+
      '<button type="button" class="v2btn" data-act="cards" lang="ar" style="height:50px">'+I('play')+'ابدأ مراجعة اليوم</button>'+
      '<button type="button" class="v2c hrow" data-act="allcards" lang="ar"><span class="ii">'+I('layers')+'</span><span><b>كل البطاقات</b><small>حسب الفصل والموضوع</small></span>'+I('chev')+'</button>'}
  var h=title('الممارسة والتقييم','','Practice');
  if(wide)h+='<div class="pgrid"><div class="ppane"><h3 lang="ar">'+I('layers')+'البطاقات</h3>'+cp()+'</div><div class="ppane"><h3 lang="ar">'+I('q')+'الأسئلة</h3>'+qp()+'</div></div>';
  else h+='<div class="v2c pseg" lang="ar"><button type="button" data-act="pseg" data-s="q" class="'+(PSEG==='q'?'on':'')+'">'+I('q')+'الأسئلة</button><button type="button" data-act="pseg" data-s="c" class="'+(PSEG==='c'?'on':'')+'">'+I('layers')+'البطاقات</button></div>'+(PSEG==='q'?qp():cp());
  if(wide)h+='<div class="ppane"><h3 lang="ar">'+I('book')+'البطاقات حسب الفصل</h3><div class="pchs">'+CHS.map(function(c){
    return '<div class="v2c pch"><b>Chapter '+c.no+'</b><span>'+X(c.title)+'</span><div lang="ar"><button type="button" class="v2btn sm ol" data-act="pc" data-n="'+c.no+'">'+I('layers')+'بطاقات</button></div></div>'}).join('')+'</div></div>';
  if(fr)h+='<button type="button" class="v2c hacc" data-act="sub" lang="ar">'+I('lock')+'<div><b>النسخة المجانية</b><small>الأسئلة والبطاقات هنا من الموضوع الأول في كل فصل. اشترك لفتح الكل.</small></div></button>';
  $('v2practiceW').innerHTML=h};
window.addEventListener('resize',function(){if(CURV==='v2practice')R.v2practice()});

/* ---------- Resources ---------- */
R.v2resources=function(){var nn=0;Object.keys(HL||{}).forEach(function(k){(HL[k]||[]).forEach(function(x){if(x.n)nn++})});
  function row(act,ic,a,b,attr){return '<button type="button" class="v2c hrow" '+(attr||'data-act="'+act+'"')+'><span class="ii">'+I(ic)+'</span><span><b>'+a+'</b><small>'+b+'</small></span>'+I('chev')+'</button>'}
  var osce=chap(15);
  $('v2resourcesW').innerHTML=title('المصادر')+'<div class="hub" lang="ar">'+
    row('rr','bolt','المراجعة السريعة','Rapid Review · بطاقة امتحان لكل موضوع')+(META.dr?row('dr','pill','أدوية الأطفال','Pediatric drugs · الجرعات حسب الوزن'):'')+
    row('osce','steth','السريري OSCE','Clinical & OSCE · '+chTopics(osce).length+' محطة')+row('','play','المحاضرات','Audio lectures','data-v="lectures"')+
    row('notes','pen','ملاحظاتي','Notes & highlights'+(nn?' · '+nn:''))+row('toc','book','فهرس الكتاب','Contents')+'</div>'};

/* ---------- Settings, profile, help, notifications ---------- */
var HPS=[['د. عبدالجليل ارجا','0116984258','249116984258'],['د. العباس عبدالرحمن','0965859782','249965859782']];
R.v2settings=function(){var a=access();
  function row(act,ic,t,em,attr){return '<button type="button" class="srow" '+(attr||'data-act="'+act+'"')+'>'+I(ic)+'<span>'+t+'</span>'+(em?'<em>'+em+'</em>':'')+I('chev')+'</button>'}
  $('v2settingsW').innerHTML=title('الإعدادات')+'<div class="sgrid" lang="ar"><div>'+
   '<button type="button" class="v2c hrow" data-v="v2profile"><span class="v2av" id="setAv" style="width:44px;height:44px"></span><span><b>'+X(myName()||'الملف الشخصي')+'</b><small>الاسم والصورة</small></span>'+I('chev')+'</button>'+
   '<div class="v2c sgrp"><h4>'+I('mon')+'المظهر</h4><div class="sseg">'+[['day','نهاري','sun'],['night','ليلي','moon'],['auto','تلقائي','auto']].map(function(m){return '<button type="button" data-act="mode" data-m="'+m[0]+'" class="'+(MODE===m[0]?'on':'')+'" aria-pressed="'+(MODE===m[0])+'">'+I(m[2])+m[1]+'</button>'}).join('')+'</div></div>'+
   '</div><div><div class="v2c">'+
    row('sub','crown','الاشتراك',{free:'النسخة المجانية',trial:'فترة تجريبية',paid:'مفعّل',expired:'انتهت التجربة'}[a])+
    row('notes','sync','الملاحظات والمزامنة','بين أجهزتك')+row('prog','bars','تقدّمي',overall()+'%')+row('','bell','الإشعارات','','data-v="v2notif"')+
    row('','help','المساعدة','واتساب · تيليجرام · اتصال','data-v="v2contact"')+
   '</div></div></div>';avatar($('setAv'))};
R.v2profile=function(){$('v2profileW').innerHTML=title('الملف الشخصي','v2settings','Profile')+
  '<div class="v2c ppf" lang="ar" style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:22px"><label for="pfPh" style="cursor:pointer;position:relative"><span class="v2av" id="pfAv" style="width:120px;height:120px;font-size:42px"></span></label>'+
  '<label class="v2btn sm ol" for="pfPh">'+I('cam')+'اختر صورة</label><input type="file" id="pfPh" accept="image/*" hidden>'+
  '<div style="align-self:stretch"><b style="display:block;margin-bottom:6px">الاسم</b><input id="pfNm" class="v2in" dir="auto" maxlength="40" placeholder="اسمك" value="'+X(st('myname')||'')+'" style="width:100%;height:46px;border-radius:12px;border:1px solid var(--bd);background:var(--sf2);color:var(--tx);padding:0 14px;font:inherit"></div>'+
  '<small style="color:var(--sub)">يُحفظ على هذا الجهاز فقط.</small></div>';
  avatar($('pfAv'));$('pfNm').oninput=function(){var v=this.value.trim();if(v)st('myname',v);else localStorage.removeItem('prr-myname');header()};
  $('pfPh').onchange=function(){var f=this.files&&this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var im=new Image();im.onload=function(){var s=256,c=document.createElement('canvas');c.width=c.height=s;var k=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-k)/2,(im.height-k)/2,k,k,0,0,s,s);try{st('photo',c.toDataURL('image/jpeg',.85))}catch(e){}avatar($('pfAv'));header()};im.src=rd.result};rd.readAsDataURL(f)}};
R.v2notif=function(){$('v2notifW').innerHTML=title('الإشعارات','v2home','Notifications')+'<div class="v2emp" lang="ar">'+I('bell')+'<br>لا توجد إشعارات.</div>'};
R.v2contact=function(){var ph='<svg class="v2ic" viewBox="0 0 24 24"><path d="M8.6 4.5l1.6 3.6-1.5 1.6c.9 2 2.6 3.7 4.6 4.6l1.6-1.5 3.6 1.6v2.7c0 .8-.7 1.4-1.5 1.4C10.6 18.5 5.5 13.4 5.5 6c0-.8.6-1.5 1.4-1.5z"/></svg>';
  $('v2contactW').innerHTML=title('المساعدة','v2settings','Help')+
  '<div class="v2c hcd" lang="ar"><img src="img/logo3.webp" alt=""><p>للاستفسار عن الكتاب أو الاشتراك، أو للإبلاغ عن خطأ، تواصل مع أحد المؤلفين بالطريقة التي تناسبك.</p></div>'+
  '<div class="hpp" lang="ar">'+HPS.map(function(h){return '<div class="v2c hpc"><h3>'+h[0]+'</h3><a class="hph" href="tel:+'+h[2]+'" dir="ltr">'+h[1]+'</a><div class="hcg">'+
    '<a class="hco wa" href="https://wa.me/'+h[2]+'" target="_blank" rel="noopener"><span>'+I('chat')+'</span><b>واتساب</b></a>'+
    '<a class="hco tg" href="https://t.me/+'+h[2]+'" target="_blank" rel="noopener"><span>'+I('send')+'</span><b>تيليجرام</b></a>'+
    '<a class="hco cl" href="tel:+'+h[2]+'"><span>'+ph+'</span><b>اتصال</b></a></div></div>'}).join('')+'</div>'};

/* ---------- actions ---------- */
var ACT={sub:function(){openSub()},cont:function(){if(st('page')&&lastPage()>0)goIdx(lastPage());else goPage(0)},cover:function(){goPage(0)},
  cards:function(){curDeck='daily';started=false;go('cards')},allcards:function(){curDeck='all';started=false;go('cards')},
  rr:function(){if(META.rr)goPage(META.rr-1)},dr:function(){if(META.dr)goPage(META.dr-1)},osce:function(){CH=15;CHRET='v2resources';go('v2chapter')},
  notes:function(){openSheet('Notes & highlights',hlHtml())},toc:function(){tocDrawer()},
  ch:function(b){CH=+b.dataset.n;CHRET='v2chapters';go('v2chapter')},chf:function(b){CHF=b.dataset.f;R.v2chapters()},
  topic:function(b){var t=tById[b.dataset.id];if(t)openTopic(t)},chread:function(){var ts=chTopics(chap(CH));for(var i=0;i<ts.length;i++)if(!locked(ts[i])){openTopic(ts[i]);return}openSub()},
  chc:function(){curDeck='ch:'+CH;started=false;go('cards')},pc:function(b){curDeck='ch:'+b.dataset.n;started=false;go('cards')},
  pseg:function(b){PSEG=b.dataset.s;st('pseg',PSEG);R.v2practice()},mode:function(b){MODE=b.dataset.m;st('mode',MODE);applyLook();R.v2settings()},
  prog:function(){var tp=0,tr=0,tm=0,td=0;TOPICS.forEach(function(t){var n=t.pages.length,r=topicRead(t);tp+=n;tr+=r;tm+=topicMast(t);if(n&&r>=n)td++});
    var s=qStat(),sk=0;try{sk=streak()}catch(e){}
    function tile(ic,a,b,l){return '<div class="v2c ptl"><span class="ic">'+I(ic)+'</span><b><bdi>'+a+'</bdi>'+(b!==''?'<small> / <bdi>'+b+'</bdi></small>':'')+'</b><span>'+l+'</span></div>'}
    $('v2pbody').innerHTML='<div class="v2c ptop" lang="ar"><span class="pr">'+ring(overall(),120)+'<b><bdi>'+overall()+'%</bdi></b></span><div><h4>التقدم الكلي</h4><p>نسبة الصفحات التي علّمتها «قرأتها» أو «أتقنتها» من كل صفحات الكتاب.</p></div></div>'+
      '<div class="ptg" lang="ar">'+tile('book',tr,tp,'صفحات مقروءة')+tile('check',tm,tp,'صفحات متقنة')+tile('layers',cKnown(),cTot(),'بطاقات معروفة')+tile('q',s.a,QS.length,'أسئلة محلولة')+tile('bars',(s.a?pc(s.ok,s.a):0)+'%','','إجابات صحيحة')+tile('flame',sk,'','أيام متتالية')+'</div>'+
      '<p class="shd" lang="ar">التقدم في كل فصل</p><div class="v2c pch">'+CHS.map(function(c){var x=chStat(c);return '<div><span><b>Chapter '+c.no+'</b> '+X(c.title)+'</span><em><bdi>'+x.pr+'%</bdi></em>'+bar(x.pr)+'</div>'}).join('')+'</div>';
    $('v2psheet').hidden=false}};
$('v2psx').onclick=function(){$('v2psheet').hidden=true};$('v2psheet').addEventListener('click',function(e){if(e.target===this)this.hidden=true});

/* ---------- welcome on every opening ---------- */
$('v2welT').innerHTML=greet();
$('v2welGo').onclick=function(){var w=$('v2wel');w.classList.add('go');setTimeout(function(){w.hidden=true},380)};

applyLook();go('v2home');
})();

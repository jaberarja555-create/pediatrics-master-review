/* ===== Book adapter, end of the closure (src/v2.book.js has the start) ===== */
var _ur2=upgRebuild;upgRebuild=function(){_ur2.apply(this,arguments);v2names();v2tp()};
/* sync status for Settings → «المزامنة» (the Obstetrics code asks window.__obsSync) */
window.__obsSync={act:function(){return !!SYNC},on:function(){return !!SYNC}};window.__obsSyncNow=function(){return syncNow()};
/* About the book (owner, 12 Nov 2026): the front pages are in the poster design (tools/frontpages.py); each tile opens its page as a
   poster picture (content/img/ab_<name>.jpg made by tools/frontshots.js, or the owner's own poster), as in Obstetrics */
ABOUT=[['authors','مؤلفا الكتاب','p'],['reviewers','فريق المراجعة','p'],['edition','عن هذه الطبعة','p'],
  ['howto','كيف تستخدم الكتاب','p'],['tools','أدوات الدراسة','p'],['refs','مراجع الكتاب','p'],
  ['contents','محتويات الكتاب','v2chapters'],['rr','المراجعة السريعة','pg:rr'],['rights','حقوق النشر وشروط الاستخدام','p']].map(function(a){a.push((BK.aboutImg||{})[a[0]]||BK.cover);return a});
var _ab=R.v2about;R.v2about=function(){_ab();[].forEach.call(document.querySelectorAll('#v2aboutW .abt'),function(b){var a=ABOUT.filter(function(x){return x[0]===b.dataset.k})[0];var im=b.querySelector('.im');if(a&&a[3]&&im)im.style.backgroundImage='url('+a[3]+')'})};
var _aba=ACT.about;ACT.about=function(b){var a=ABOUT.filter(function(x){return x[0]===b.dataset.k})[0];
  if(a&&a[2].indexOf('pg:')===0){var id=a[2].slice(3),i=id==='rr'?(META.rr||1)-1:-1;if(i<0)for(var k=0;k<PAGES.length;k++)if(PAGES[k].id===id&&!PAGES[k].user){i=k;break}if(i>=0)goIdx(i);return}
  _aba(b)};
/* the user manual has no poster pages here; it opens with the steps and the screenshots of this app (content/img/help_*.jpg, tools/help_shots.js) */
UG5=[];
/* bookmarks of the new app sync with the rest (as in Obstetrics: SM key bm) */
if(typeof SM!=='undefined'&&!SM.bm){SM.bm={get:function(){return stj('bm')||{}},set:function(v){stj('bm',v);if(window.__bmSet)window.__bmSet(v)}};try{SMU.bm=SMU.bm||{};SMP.bm=smSnap('bm')}catch(e){}}
/* a page size saved by the old design of this book (pinch or ×1.5 …) is reset once, so the page fits the screen in the new reader (owner, 12 Nov 2026) */
if(!st('v2z')){st('v2z','1');if(st('zoom')){try{localStorage.removeItem(BK.prefix+'-zoom')}catch(e){}if(typeof ZM!=='undefined')ZM='auto'}}

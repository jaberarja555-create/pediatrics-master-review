/* ===== Book adapter, end of the closure (src/v2.book.js has the start) ===== */
var _ur2=upgRebuild;upgRebuild=function(){_ur2.apply(this,arguments);v2names();v2tp()};
/* sync status for Settings → «المزامنة» (the Obstetrics code asks window.__obsSync) */
window.__obsSync={act:function(){return !!SYNC},on:function(){return !!SYNC}};window.__obsSyncNow=function(){return syncNow()};
/* About the book: this book has no posters; each tile opens its own page in the book or a place of the app */
ABOUT=[['authors','مؤلفا الكتاب','pg:authors'],['reviewers','مراجعو الكتاب','pg:reviewers'],['edition','عن هذه الطبعة','pg:about'],
  ['howto','كيف تستخدم الكتاب','help:0'],['tools','أدوات الدراسة','help:2'],['refs','مراجع الكتاب','pg:references'],
  ['contents','محتويات الكتاب','v2chapters'],['rr','المراجعة السريعة','pg:rr'],['rights','حقوق النشر وشروط الاستخدام','pg:about']].map(function(a){a.push((BK.aboutImg||{})[a[0]]||BK.cover);return a});
var _ab=R.v2about;R.v2about=function(){_ab();[].forEach.call(document.querySelectorAll('#v2aboutW .abt'),function(b){var a=ABOUT.filter(function(x){return x[0]===b.dataset.k})[0];var im=b.querySelector('.im');if(a&&a[3]&&im)im.style.backgroundImage='url('+a[3]+')'})};
var _aba=ACT.about;ACT.about=function(b){var a=ABOUT.filter(function(x){return x[0]===b.dataset.k})[0];
  if(a&&a[2].indexOf('pg:')===0){var id=a[2].slice(3),i=id==='rr'?(META.rr||1)-1:-1;if(i<0)for(var k=0;k<PAGES.length;k++)if(PAGES[k].id===id&&!PAGES[k].user){i=k;break}if(i>=0)goIdx(i);return}
  _aba(b)};
/* the user manual has no poster pages here; it opens with the steps and the screenshots of this app (content/img/help_*.jpg, tools/help_shots.js) */
UG5=[];

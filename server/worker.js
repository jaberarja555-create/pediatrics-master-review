import { DurableObject } from 'cloudflare:workers';
// Pediatrics Master Review · activation server (Cloudflare Worker + Durable Object)
// Like Dr. Arja Master Note: the authors make codes (PMR-XXXX-XXXX) on /admin and send one to each buyer;
// the student types it in the app, which activates itself (one code = up to 2 devices).
// Routes: GET  /admin      control page (password)
//         /api/*           control API (Authorization: Bearer <ADMIN_PASSWORD>)
//         POST /activate   public: { code, dev } → signed token for this device
//         GET  /check      public: is this code still on for this device?
//         POST /sync       device of a code: { code, dev, token, ver?, data? } → highlights and notes shared by the code's devices
//         anything else    the book app (static files from docs/)
const MSG = 'PMR|pediatrics|1|', MAX_DEV = 2;
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEV = /^[A-Z2-9]{8}$/, CODE = /^PMR[A-Z2-9]{8}$/;

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const norm = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const fmt = c => c.slice(0, 3) + '-' + c.slice(3, 7) + '-' + c.slice(7);   // PMRABCD2345 → PMR-ABCD-2345
const now = () => new Date().toISOString();
function newCode() { const r = new Uint8Array(8); crypto.getRandomValues(r); return 'PMR' + [...r].map(x => AB[x % 32]).join('') }
function kindOf(req) {
  const ua = req.headers.get('user-agent') || '';
  return /Android/.test(ua) ? 'Android phone' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows computer' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux computer' : 'Device';
}

// The codes live in one SQLite-backed Durable Object (strongly consistent: a switch-off or delete shows at once).
// db(env) gives the rest of this file a small D1-style API (prepare → bind → run / first / all) on top of it.
const SCHEMA = 'CREATE TABLE IF NOT EXISTS codes (code TEXT PRIMARY KEY, note TEXT NOT NULL DEFAULT \'\', created TEXT NOT NULL, activated TEXT, active INTEGER NOT NULL DEFAULT 1, devices TEXT NOT NULL DEFAULT \'[]\')';
const SYNC_SCHEMA = 'CREATE TABLE IF NOT EXISTS sync (code TEXT PRIMARY KEY, ver INTEGER NOT NULL, data TEXT NOT NULL, updated TEXT NOT NULL)';
export class CodesDB extends DurableObject {
  constructor(ctx, env) { super(ctx, env); ctx.storage.sql.exec(SCHEMA); ctx.storage.sql.exec(SYNC_SCHEMA); }
  q(sql, params, mode) {
    const cur = this.ctx.storage.sql.exec(sql, ...params), rows = cur.toArray();
    return mode === 'first' ? rows[0] || null : mode === 'all' ? { results: rows } : { ok: true, changes: cur.rowsWritten };
  }
}
async function db(env) {
  const stub = env.CODES.get(env.CODES.idFromName('codes'));
  return { prepare: sql => { const st = { p: [], bind(...a) { st.p = a; return st }, run: () => stub.q(sql, st.p, 'run'), first: () => stub.q(sql, st.p, 'first'), all: () => stub.q(sql, st.p, 'all') }; return st } };
}
const row = r => r && { code: fmt(r.code), note: r.note, created: r.created, activated: r.activated, on: !!r.active, devices: JSON.parse(r.devices || '[]') };
async function one(env, code) { return (await db(env)).prepare('SELECT * FROM codes WHERE code = ?').bind(code).first() }
async function all(env) { return (await (await db(env)).prepare('SELECT * FROM codes ORDER BY created DESC, code').all()).results.map(row) }
async function setDevices(env, code, devs) { await (await db(env)).prepare('UPDATE codes SET devices = ? WHERE code = ?').bind(JSON.stringify(devs), code).run() }

async function sign(env, dev) {
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.PRIVATE_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(MSG + dev));
  return dev + '.' + b64u(sig);
}

// Control page API. Every change answers with the full, fresh list so the page always shows the real state.
async function api(req, env, path) {
  if (!env.ADMIN_PASSWORD || (req.headers.get('authorization') || '') !== 'Bearer ' + env.ADMIN_PASSWORD) return json({ error: 'Wrong password' }, 401);
  if (path === '/api/codes' && req.method === 'GET') return json({ codes: await all(env) });
  if (req.method !== 'POST') return json({ error: 'Unknown' }, 404);
  const body = await req.json().catch(() => ({}));
  const D = await db(env);
  if (path === '/api/codes') {
    const n = Math.min(Math.max(parseInt(body.count, 10) || 1, 1), 50), note = String(body.note || '').trim().slice(0, 200), made = [];
    for (let i = 0; i < n; i++) {
      const c = newCode();
      await D.prepare('INSERT OR IGNORE INTO codes (code, note, created) VALUES (?, ?, ?)').bind(c, note, now()).run();
      made.push(fmt(c));
    }
    return json({ made, codes: await all(env) });
  }
  const m = path.match(/^\/api\/codes\/([A-Za-z0-9-]+)\/(off|on|reset|note|delete)$/);
  if (!m) return json({ error: 'Unknown' }, 404);
  const code = norm(m[1]);
  if (!await one(env, code)) return json({ error: 'This code no longer exists.', codes: await all(env) }, 404);
  if (m[2] === 'off' || m[2] === 'on') await D.prepare('UPDATE codes SET active = ? WHERE code = ?').bind(m[2] === 'on' ? 1 : 0, code).run();
  if (m[2] === 'reset') await D.prepare('UPDATE codes SET devices = \'[]\', activated = NULL WHERE code = ?').bind(code).run();
  if (m[2] === 'note') await D.prepare('UPDATE codes SET note = ? WHERE code = ?').bind(String(body.note || '').trim().slice(0, 200), code).run();
  if (m[2] === 'delete') { await D.prepare('DELETE FROM codes WHERE code = ?').bind(code).run(); await D.prepare('DELETE FROM sync WHERE code = ?').bind(code).run() }
  return json({ codes: await all(env) });
}

// The student types the code in the app: bind this device (max 2 per code) and send back its signed token.
async function activate(req, env) {
  const body = await req.json().catch(() => ({}));
  const code = norm(body.code), dev = norm(body.dev);
  if (!DEV.test(dev)) return json({ ok: false, reason: 'device' }, 400);
  if (!CODE.test(code)) return json({ ok: false, reason: 'unknown' });
  if (!env.PRIVATE_KEY) return json({ ok: false, reason: 'server' }, 500);
  const r = row(await one(env, code));
  if (!r) return json({ ok: false, reason: 'unknown' });
  if (!r.on) return json({ ok: false, reason: 'off' });
  const t = now(), d = r.devices.find(x => x.dev === dev);
  if (d) d.last = t;
  else if (r.devices.length >= MAX_DEV) return json({ ok: false, reason: 'full' });
  else r.devices.push({ dev, kind: kindOf(req), first: t, last: t });
  await (await db(env)).prepare('UPDATE codes SET devices = ?, activated = COALESCE(activated, ?) WHERE code = ?').bind(JSON.stringify(r.devices), t, code).run();
  return json({ ok: true, code: r.code, token: await sign(env, dev) });
}

// The app asks this when online. A code that is switched off, deleted or reset locks the device again.
async function check(req, env, url) {
  const dev = norm(url.searchParams.get('dev')), code = norm(url.searchParams.get('code'));
  if (!DEV.test(dev) || !CODE.test(code)) return json({ ok: false, reason: 'device' });
  const r = row(await one(env, code));
  if (!r) return json({ ok: false, reason: 'unknown' });
  if (!r.on) return json({ ok: false, reason: 'off' });
  const d = r.devices.find(x => x.dev === dev);
  if (!d) return json({ ok: false, reason: 'reset' });
  if (Date.now() - Date.parse(d.last) > 3600e3) { d.last = now(); d.kind = kindOf(req); await setDevices(env, code, r.devices) }
  return json({ ok: true });
}

// Highlights and notes, shared by the devices of one code. The device proves itself with its signed token.
// The app merges (newest change of each highlight wins, deletions remembered) and writes back with the version it read;
// a write on an old version is refused ('stale') so the app merges again instead of overwriting the other device.
async function tokenOk(env, dev, token) {
  const [d, sig] = String(token || '').split('.');
  if (d !== dev || !sig || !env.PRIVATE_KEY) return false;
  const { d: _, key_ops, ...pub } = JSON.parse(env.PRIVATE_KEY);
  try {
    const key = await crypto.subtle.importKey('jwk', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const raw = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, raw, new TextEncoder().encode(MSG + dev));
  } catch (e) { return false }
}
async function sync(req, env) {
  const body = await req.json().catch(() => ({}));
  const code = norm(body.code), dev = norm(body.dev);
  if (!DEV.test(dev) || !CODE.test(code)) return json({ ok: false, reason: 'device' }, 400);
  if (!await tokenOk(env, dev, body.token)) return json({ ok: false, reason: 'token' }, 403);
  const r = row(await one(env, code));
  if (!r) return json({ ok: false, reason: 'unknown' });
  if (!r.on) return json({ ok: false, reason: 'off' });
  if (!r.devices.find(x => x.dev === dev)) return json({ ok: false, reason: 'reset' });
  const D = await db(env), cur = await D.prepare('SELECT ver, data FROM sync WHERE code = ?').bind(code).first();
  const ver = cur ? cur.ver : 0, data = cur ? JSON.parse(cur.data) : null;
  if (body.data === undefined) return json({ ok: true, ver, data });
  const txt = JSON.stringify(body.data);
  if (txt.length > 2e6) return json({ ok: false, reason: 'big' }, 413);
  const w = (body.ver | 0) !== ver ? { changes: 0 } : ver === 0
    ? await D.prepare('INSERT OR IGNORE INTO sync (code, ver, data, updated) VALUES (?, 1, ?, ?)').bind(code, txt, now()).run()
    : await D.prepare('UPDATE sync SET ver = ver + 1, data = ?, updated = ? WHERE code = ? AND ver = ?').bind(txt, now(), code, ver).run();
  if (!w.changes) { const c2 = await D.prepare('SELECT ver, data FROM sync WHERE code = ?').bind(code).first(); return json({ ok: false, reason: 'stale', ver: c2 ? c2.ver : 0, data: c2 ? JSON.parse(c2.data) : null }) }
  return json({ ok: true, ver: ver + 1 });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    try {
      if (path === '/activate' && req.method === 'POST') return await activate(req, env);
      if (path === '/check') return await check(req, env, url);
      if (path === '/sync' && req.method === 'POST') return await sync(req, env);
      if (path.startsWith('/api/')) return await api(req, env, path);
    } catch (e) { return json({ error: 'Server error: ' + e.message, reason: 'server' }, 500) }
    if (path === '/admin' || path === '/admin/') return new Response(PAGE(env, url.origin + '/'), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    if (env.ASSETS) return env.ASSETS.fetch(req);  // the book app
    return new Response('Not found', { status: 404 });
  }
};

const PAGE = (env, origin) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Activation Codes</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..900&display=swap">
<style>
:root{--bg:#f4efe7;--card:#fff;--line:#e8dfd1;--ink:#1d1916;--muted:#6f655a;--gold:#c0892b;--ok:#0f7a55;--ok-soft:#c9f2e1;--off:#b42318;--off-soft:#fde2df;--new:#6f655a;--new-soft:#eee7dc;--field:#f4efe7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15120f;--card:#1f1b17;--line:#352d25;--ink:#f3ede4;--muted:#b3a796;--field:#2a241e;--ok-soft:#123b2c;--off-soft:#3d1714;--new:#b3a796;--new-soft:#2d2620}}
:root[data-theme="dark"]{--bg:#15120f;--card:#1f1b17;--line:#352d25;--ink:#f3ede4;--muted:#b3a796;--field:#2a241e;--ok-soft:#123b2c;--off-soft:#3d1714;--new:#b3a796;--new-soft:#2d2620}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Inter,system-ui,sans-serif}
header{background:#1d1916;color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
header b{font:900 17px Inter;letter-spacing:2.5px}header b span{color:#e8b54d}header small{display:block;color:#e8d7b8;font-size:13px}
button{font:700 14px Inter;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:8px 12px;cursor:pointer}
button:disabled{opacity:.5;cursor:wait}button.pri{background:var(--gold);border-color:var(--gold);color:#1d1916;padding:11px 18px}
button.red{color:var(--off)}button.sure{background:var(--off);border-color:var(--off);color:#fff}header button{background:transparent;color:#fff;border-color:#4a4038}
main{max-width:1040px;margin:0 auto;padding:18px 16px 60px;display:flex;flex-direction:column;gap:18px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stats div{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px}
.stats b{display:block;font:900 26px Inter}.stats span{font:700 12px Inter;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px}
h2{font:900 13px Inter;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);margin:0 0 8px}
.muted{color:var(--muted)}input{font:inherit;background:var(--field);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:11px 12px;width:100%;min-width:0}
.form{display:grid;grid-template-columns:1fr 90px auto;gap:10px;margin-top:10px}
@media(max-width:700px){.stats{grid-template-columns:repeat(2,1fr)}.stats b{font-size:22px}.form{grid-template-columns:1fr 70px}.form button{grid-column:1/-1}}
.made{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px}.made button{font-family:ui-monospace,Menlo,monospace}
.head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.head input{max-width:420px}
.row{padding:14px 0;border-top:1px solid var(--line)}.row:first-child{border-top:0}
.top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.code{font:800 16px ui-monospace,Menlo,monospace;letter-spacing:1px}
.badge{font:800 11.5px Inter;letter-spacing:1.4px;padding:3px 9px;border-radius:999px;margin-left:8px;vertical-align:2px}
.b-act{background:var(--ok-soft);color:var(--ok)}.b-off{background:var(--off-soft);color:var(--off)}.b-new{background:var(--new-soft);color:var(--new)}
.row .muted{font-size:14px;margin:3px 0}.acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.ed{display:flex;gap:8px;margin:6px 0}
.msg{min-height:1.4em;font-weight:700;margin:8px 0 0}.msg.err{color:var(--off)}.msg.ok{color:var(--ok)}
#login{max-width:420px;margin:60px auto}.hide{display:none!important}
#toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#1d1916;color:#fff;padding:10px 16px;border-radius:12px;font-weight:700;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw}#toast.show{opacity:1}#toast.err{background:var(--off)}
</style></head><body>
<header><div><b>PEDIATRICS <span>MASTER REVIEW</span></b><small>Activation codes</small></div><button id="out" class="hide">Sign out</button></header>
<div id="login" class="card"><h2>Sign in</h2><p class="muted">Control page for the authors.</p><input id="pw" type="password" placeholder="Password"><p></p><button class="pri" id="go">Sign in</button><p class="msg err" id="lmsg"></p></div>
<main id="app" class="hide">
<div class="stats"><div><b id="sAll">0</b><span>Codes</span></div><div><b id="sAct">0</b><span>Activated</span></div><div><b id="sNew">0</b><span>Unused</span></div><div><b id="sOff">0</b><span>Switched off</span></div></div>
<div class="card"><h2>New codes</h2><p class="muted" style="margin:0">Make one code per buyer. Write their name or phone in the note so you can find them later. One code opens 2 devices.</p>
<div class="form"><input id="note" placeholder="Note, e.g. Ahmed · 0912 345 678"><input id="count" type="number" min="1" max="50" value="1"><button class="pri" id="make">Create</button></div>
<p class="msg" id="mmsg"></p><div class="made" id="made"></div></div>
<div class="card"><div class="head"><h2 style="margin:0">All codes</h2><input id="q" placeholder="Search code, note or device"></div><div id="list"></div></div>
</main><div id="toast"></div>
<script>
var APP_URL=${JSON.stringify(env.APP_URL || origin)};
var $=function(i){return document.getElementById(i)},PW='',ALL=[],EDIT=null;
try{PW=localStorage.getItem('pmr-admin')||''}catch(e){}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function toast(t,err){var o=$('toast');o.textContent=t;o.className='show'+(err?' err':'');clearTimeout(toast.t);toast.t=setTimeout(function(){o.className=''},2200)}
function call(path,body){return fetch(path,{method:body?'POST':'GET',cache:'no-store',headers:{authorization:'Bearer '+PW,'content-type':'application/json'},body:body?JSON.stringify(body):undefined})
  .then(function(r){return r.json().catch(function(){return {error:'Server error ('+r.status+')'}}).then(function(j){if(j&&j.codes){ALL=j.codes;draw()}if(!r.ok)throw new Error(j.error||'Error');return j})})}
function day(t){return t?new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):''}
function status(r){return !r.on?['b-off','SWITCHED OFF']:r.devices.length?['b-act','ACTIVATED']:['b-new','UNUSED']}
function message(r){return 'السلام عليكم 🌷\\nشكراً على اشتراكك في Pediatrics Master Review.\\n\\nالـ activation code بتاعك:\\n*'+r.code+'*\\n\\nافتح الكتاب من اللينك دا ودوس "افتح الكتاب كامل"، اكتب الكود ودوس Activate:\\n'+APP_URL+'\\n\\nأو دوس على اللينك دا وبيتفعّل براه:\\n'+APP_URL+'#code='+r.code+'\\n\\nالكود الواحد بيفتح جهازين (الموبايل واللابتوب). ما ترسله لزول تاني.'}
function copy(t,what){function ok(){toast(what+' copied')}
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,function(){fallback(t)?ok():toast('Could not copy',1)});else fallback(t)?ok():toast('Could not copy',1)}
function fallback(t){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();var k=false;try{k=document.execCommand('copy')}catch(e){}a.remove();return k}
function draw(){var q=$('q').value.trim().toUpperCase().replace(/[^A-Z0-9\\u0600-\\u06FF ]/g,'');
  $('sAll').textContent=ALL.length;$('sAct').textContent=ALL.filter(function(r){return r.on&&r.devices.length}).length;
  $('sNew').textContent=ALL.filter(function(r){return r.on&&!r.devices.length}).length;$('sOff').textContent=ALL.filter(function(r){return !r.on}).length;
  var l=ALL.filter(function(r){return !q||(r.code.replace(/-/g,'')+' '+r.code+' '+r.note+' '+r.devices.map(function(d){return d.dev+' '+d.kind}).join(' ')).toUpperCase().indexOf(q)>=0});
  $('list').innerHTML=l.length?l.map(function(r){var s=status(r);return '<div class="row" data-c="'+r.code+'"><div class="top"><div><span class="code">'+r.code+'</span><span class="badge '+s[0]+'">'+s[1]+'</span></div><span class="muted">'+day(r.created)+'</span></div>'+
    (EDIT===r.code?'<div class="ed"><input id="edIn" value="'+esc(r.note)+'" placeholder="Name · phone"><button class="pri" data-a="save">Save</button><button data-a="cancel">Cancel</button></div>'
      :'<div class="muted">'+(r.note?esc(r.note):'<i>No note</i>')+(r.activated?' · activated '+day(r.activated):'')+'</div>')+
    '<div class="muted">Devices: '+(r.devices.length?r.devices.map(function(d){return esc(d.kind)+' (since '+day(d.first)+', last '+day(d.last)+')'}).join(' · ')+' &nbsp;['+r.devices.length+'/2]':'none yet')+'</div>'+
    '<div class="acts"><button data-a="code">Copy code</button><button data-a="msg">Copy message</button><button data-a="edit">Edit note</button>'+
    (r.devices.length?'<button data-a="reset">Reset devices</button>':'')+(r.on?'<button class="red" data-a="off">Switch off</button>':'<button data-a="on">Switch on</button>')+'<button class="red" data-a="delete">Delete</button></div></div>'}).join('')
    :'<p class="muted">'+(ALL.length?'Nothing matches.':'No codes yet. Make the first one above.')+'</p>';
  if(EDIT&&$('edIn')){$('edIn').focus();$('edIn').onkeydown=function(e){if(e.key==='Enter')saveNote();if(e.key==='Escape'){EDIT=null;draw()}}}}
function saveNote(){var c=EDIT,v=$('edIn').value;EDIT=null;call('/api/codes/'+c+'/note',{note:v}).then(function(){toast('Note saved')}).catch(function(e){toast(e.message,1)})}
var SURE={reset:'Sure? Reset',delete:'Sure? Delete',off:'Sure? Switch off'},DONE={on:'Switched on',off:'Switched off',reset:'Devices reset: the code can be used on 2 new devices',delete:'Deleted'};
$('list').onclick=function(e){var b=e.target.closest('button');if(!b||b.disabled)return;var c=b.closest('.row').dataset.c,r=ALL.filter(function(x){return x.code===c})[0],a=b.dataset.a;if(!r)return;
  if(a==='code')return copy(r.code,'Code');if(a==='msg')return copy(message(r),'Message');
  if(a==='edit'){EDIT=c;return draw()}if(a==='cancel'){EDIT=null;return draw()}if(a==='save')return saveNote();
  if(SURE[a]&&!b.classList.contains('sure')){b.dataset.t=b.textContent;b.textContent=SURE[a];b.classList.add('sure');setTimeout(function(){if(b.isConnected){b.textContent=b.dataset.t;b.classList.remove('sure')}},3000);return}
  b.disabled=true;call('/api/codes/'+c+'/'+a,{}).then(function(){toast(DONE[a])}).catch(function(e){b.disabled=false;toast(e.message,1)})};
$('make').onclick=function(){var b=this;b.disabled=true;$('mmsg').className='msg';$('mmsg').textContent='…';
  call('/api/codes',{note:$('note').value,count:$('count').value}).then(function(j){b.disabled=false;$('note').value='';$('count').value=1;
    $('mmsg').className='msg ok';$('mmsg').textContent=j.made.length>1?j.made.length+' codes ready. Tap a code to copy it.':'Code ready. Tap it to copy, or use Copy message below.';
    $('made').innerHTML=j.made.map(function(c){return '<button data-c="'+c+'">'+c+'</button>'}).join('')}).catch(function(e){b.disabled=false;$('mmsg').className='msg err';$('mmsg').textContent=e.message})};
$('made').onclick=function(e){var b=e.target.closest('button');if(b)copy(b.dataset.c,'Code')};
$('q').oninput=draw;
function enter(){call('/api/codes').then(function(){try{localStorage.setItem('pmr-admin',PW)}catch(e){}$('login').classList.add('hide');$('app').classList.remove('hide');$('out').classList.remove('hide')})
  .catch(function(e){$('lmsg').textContent=PW?e.message:'';PW=''})}
$('go').onclick=function(){PW=$('pw').value;enter()};$('pw').onkeydown=function(e){if(e.key==='Enter')$('go').click()};
$('out').onclick=function(){try{localStorage.removeItem('pmr-admin')}catch(e){}location.reload()};
if(PW)enter();
</script></body></html>`;

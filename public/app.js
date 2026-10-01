'use strict';
/* =========================================================
   DropShop — واجهة Telegram Mini App
   ========================================================= */
const tg = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) ? Telegram.WebApp : null;
const QS = new URLSearchParams(location.search);
const DEV_AS = QS.get('as');
const D = 864e5;
const haptic = t => { try { tg && tg.HapticFeedback.notificationOccurred(t); } catch (e) {} };

const ST = { new: { t: 'جديد', c: 'info' }, accepted: { t: 'تم القبول', c: 'vio' }, production: { t: 'قيد الإنتاج', c: 'warn' }, ready: { t: 'تم التجهيز', c: 'warn' }, shipping: { t: 'خرج للتوصيل', c: 'pri' }, delivered: { t: 'تم التسليم', c: 'ok' }, returned: { t: 'مرتجع', c: 'bad' }, rejected: { t: 'مرفوض', c: 'bad' } };
const FLOW = ['new', 'accepted', 'production', 'ready', 'shipping', 'delivered'];
const ACTIVE = ['new', 'accepted', 'production', 'ready', 'shipping'];
const GROUPS = { all: { t: 'الكل', s: null }, new: { t: 'جديد', s: ['new'] }, work: { t: 'قيد التنفيذ', s: ['accepted', 'production', 'ready'] }, ship: { t: 'بالتوصيل', s: ['shipping'] }, done: { t: 'تم التسليم', s: ['delivered'] }, back: { t: 'مرتجع / مرفوض', s: ['returned', 'rejected'] } };
const MNOTIF = [['new', 'طلب جديد'], ['accepted', 'تم قبول الطلب'], ['production', 'بدأ الإنتاج'], ['ready', 'تم التجهيز'], ['shipping', 'خرج للتوصيل'], ['delivered', 'تم التسليم'], ['returned', 'مرتجع'], ['rejected', 'تم رفض الطلب']];
const ANOTIF = [['newOrder', 'طلب جديد'], ['lowStock', 'مخزون منخفض'], ['late', 'طلب متأخر'], ['subReq', 'طلب اشتراك جديد'], ['highAmt', 'مبلغ تحصيل مرتفع'], ['problem', 'مشكلة في الطلب']];
const PRESETS = [['أزرق', '#4170ff', '#7b4dff'], ['بنفسجي', '#7c3aed', '#db2777'], ['أخضر', '#059669', '#0ea5e9'], ['برتقالي', '#ea580c', '#e11d48'], ['وردي', '#db2777', '#9333ea'], ['سماوي', '#0891b2', '#2563eb'], ['ذهبي', '#ca8a04', '#ea580c'], ['أحمر', '#dc2626', '#7c2d12'], ['رصاصي', '#475569', '#1e293b']];

const ICP = { home: 'M3 11l9-8 9 8M5 10v10h14V10', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', plus: 'M12 5v14M5 12h14', chart: 'M3 3v18h18M7 15l4-4 3 3 5-6', user: 'M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z', bell: 'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4', box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8', users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8', wallet: 'M3 7h18v13H3zM3 7l3-4h12l3 4M16 14h2', gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .3-1.5-1.5L17 5l-3-1-1 2h-2L10 4 7 5l.5 2.3L6 8.8 4 8.3 3 11l2 1-2 1 1 3 2-.3 1.5 1.5L7 19l3 1 1-2h2l1 2 3-1-.5-2.3 1.5-1.5 2 .5 1-3z', back: 'M9 18l6-6-6-6', fwd: 'M15 18l-6-6 6-6', img: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01', file: 'M14 3H6v18h12V7zM14 3v4h4', x: 'M18 6L6 18M6 6l12 12', check: 'M20 6L9 17l-5-5', alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', ig: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zM16 11.4A4 4 0 1112.6 8 4 4 0 0116 11.4zM17.5 6.5h.01', clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2', down: 'M12 3v12M7 10l5 5 5-5M5 21h14', palette: 'M12 22a10 10 0 110-20c5.5 0 10 4 10 9 0 3-2.5 5-5 5h-2a2 2 0 00-1.5 3.3A2 2 0 0112 22zM7.5 11h.01M10.5 7h.01M15.5 8h.01' };
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICP[n]}"/></svg>`;

let S = null, W = null, ASK = null, gid = 0, lastSig = '', busyN = 0, themeT = null;
let UI = { tab: 'home', order: null, success: null, editReg: false, mf: { g: 'all', q: '' }, af: { g: 'all', mid: 'all', q: '', flag: '' }, period: 'week', fin: { from: '', to: '', mid: 'all', set: 'unsettled', sel: {} } };

/* ---------- أدوات ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsq = s => esc(String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
const fmtN = n => Math.round(n || 0).toLocaleString('en-US');
const fmt = n => `<span class="num">${fmtN(n)}</span> د.ع`;
const pad = n => String(n).padStart(2, '0');
const fdate = t => { const d = new Date(t); return `${d.getDate()}/${d.getMonth() + 1} - ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fday = t => { const d = new Date(t); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
const ago = t => { const m = Math.floor((Date.now() - t) / 6e4); if (m < 1) return 'الآن'; if (m < 60) return `منذ ${m} د`; const h = Math.floor(m / 60); if (h < 24) return `منذ ${h} س`; return `منذ ${Math.floor(h / 24)} يوم`; };
const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };
const isAdmin = () => S && S.me.admin;
const curM = () => S.me.merchant;
const mer = id => (S.merchants || []).find(m => m.id === id) || (curM() && curM().id === id ? curM() : null);
const byId = code => (S.orders || []).find(o => o.id === code);
const pcs = o => o.prints.reduce((a, p) => a + (+p.qty || 0), 0);
const badge = s => `<span class="badge b-${ST[s].c}">${ST[s].t}</span>`;
const colorHex = n => ((S.inventory && S.inventory.colors.find(c => c.name === n)) || {}).hex || '#888888';
const isLate = o => ACTIVE.includes(o.status) && Date.now() - o.createdAt > ((S.cfg && S.cfg.lateDays) || 3) * D;
const sw = (on, fn) => `<label class="sw"><input type="checkbox" ${on ? 'checked' : ''} onchange="${fn}"><i></i></label>`;
const isImg = f => f && (typeof f === 'string' || /^image\//.test(f.mime || ''));
function calc(o) {
  const q = pcs(o), p = o.price; const base = o.total - p.delivery - q * p.sale;
  let m = base, a = q * ((p.sale || 0) - (p.cost || 0)), real = false;
  if (o.status === 'delivered') real = true;
  else if (o.status === 'returned') { m = -p.returnFee; a = p.returnFee - q * (p.cost || 0); real = true; }
  else if (o.status === 'rejected') { m = 0; a = 0; }
  return { q, merchant: m, admin: a, real, base };
}
function mState(m) { return ({ pending: ['بانتظار التفعيل', 'info'], active: ['فعّال', 'ok'], suspended: ['موقوف', 'bad'], rejected: ['مرفوض', 'bad'] })[m.status] || ['—', 'info']; }

function toast(t, k) { const el = $('#toast'); el.innerHTML = `<div class="toast ${k || ''}">${esc(t)}</div>`; clearTimeout(toast.t); toast.t = setTimeout(() => el.innerHTML = '', 3000); }
function busy(on) { busyN += on ? 1 : -1; $('#busy').classList.toggle('on', busyN > 0); }
function openSheet(h) { $('#modal').innerHTML = `<div class="sheet-bg" onclick="if(event.target===this)closeSheet()"><div class="sheet" role="dialog">${h}</div></div>`; tgBack(); }
function closeSheet() { $('#modal').innerHTML = ''; tgBack(); }
function askText(title, ph, cb) {
  ASK = cb;
  openSheet(`<h3>${title}</h3><textarea id="askv" class="in" rows="3" placeholder="${ph}"></textarea><div class="row mt"><button class="btn" onclick="askOk()">تأكيد</button><button class="btn ghost" onclick="closeSheet()">إلغاء</button></div>`);
  setTimeout(() => { const a = $('#askv'); a && a.focus(); }, 60);
}
function askOk() { const v = $('#askv').value.trim(); if (!v) return; const f = ASK; closeSheet(); f(v); }
function copyText(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('تم النسخ ✓')).catch(() => openSheet(`<h3>انسخ النص</h3><textarea class="in" rows="10">${esc(t)}</textarea>`)); }

/* ---------- الاتصال بالخادم ---------- */
async function api(path, opt = {}) {
  const h = { Accept: 'application/json' };
  if (tg) h['X-Init-Data'] = tg.initData; else if (DEV_AS) h['X-Dev-User'] = DEV_AS;
  if (opt.body && !(opt.body instanceof FormData)) { h['Content-Type'] = 'application/json'; opt.body = JSON.stringify(opt.body); }
  let r;
  try { r = await fetch(path, { ...opt, headers: h }); } catch (e) { throw new Error('تعذر الاتصال بالخادم. تحقق من الإنترنت.'); }
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(j.error || 'حدث خطأ، حاول مرة أخرى');
  return j;
}
async function run(promise, ok) {
  busy(true);
  try { const r = await promise; if (ok) toast(ok); haptic('success'); await reload(); return r; }
  catch (e) { toast(e.message, 'bad'); haptic('error'); }
  finally { busy(false); }
}
async function reload(silent) {
  try {
    const d = await api('/api/bootstrap');
    const sig = JSON.stringify(d);
    if (silent && sig === lastSig) return;
    lastSig = sig; S = d; applyTheme(S.prefs.theme, true);
    if (silent) { const a = document.activeElement; if ((a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) || $('#modal').innerHTML || (UI.tab === 'new' && W)) return; }
    render();
  } catch (e) { if (!S) renderError(e.message); else if (!silent) toast(e.message, 'bad'); }
}
function renderError(msg) {
  $('#app').innerHTML = `<div class="lock"><div class="logo">🛍️</div><div class="h1">DropShop</div><p class="mut mt">${esc(msg)}</p><button class="btn mt2" onclick="location.reload()">إعادة المحاولة</button></div>`;
}

/* ---------- الألوان والمظهر ---------- */
function applyTheme(t, noSave) {
  t = t || {}; const r = document.documentElement;
  t.accent ? r.style.setProperty('--pri', t.accent) : r.style.removeProperty('--pri');
  t.accent2 ? r.style.setProperty('--pri2', t.accent2) : r.style.removeProperty('--pri2');
  const m = t.mode || 'auto';
  r.dataset.theme = m !== 'auto' ? m : (tg ? tg.colorScheme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  r.dataset.bg = t.bg || 'navy';
  try { localStorage.setItem('ds_theme', JSON.stringify(t)); } catch (e) {}
  if (tg) { try { const bg = getComputedStyle(r).getPropertyValue('--bg').trim(); tg.setHeaderColor(bg); tg.setBackgroundColor(bg); if (tg.setBottomBarColor) tg.setBottomBarColor(bg); } catch (e) {} }
}
function setTheme(patch, live) {
  const t = patch === null ? {} : Object.assign({}, S.prefs.theme || {}, patch);
  S.prefs.theme = t; applyTheme(t);
  if (!live) render();
  clearTimeout(themeT);
  themeT = setTimeout(() => api('/api/prefs', { method: 'PUT', body: { theme: t } }).catch(e => toast(e.message, 'bad')), 600);
}
function themeCard() {
  const t = S.prefs.theme || {}, mode = t.mode || 'auto', bg = t.bg || 'navy';
  return `<div class="sec">المظهر والألوان</div><div class="card">
  <div class="preview"><div class="av">${ic('palette', 20)}</div><div class="f1"><b>معاينة</b><div class="mut xs">تتغير الواجهة مباشرة عند اختيار اللون</div></div><span class="badge b-pri">مثال</span></div>
  <div class="field"><label>الوضع</label><div class="chips">${[['auto', 'تلقائي'], ['dark', 'داكن'], ['light', 'فاتح']].map(([k, l]) => `<button class="chip ${mode === k ? 'on' : ''}" onclick="setTheme({mode:'${k}'})">${l}</button>`).join('')}</div></div>
  <div class="field"><label>اللون الرئيسي</label><div class="swatches">${PRESETS.map(([n, a, b]) => `<button class="swatch ${t.accent === a && t.accent2 === b ? 'on' : ''}" style="background:linear-gradient(135deg,${a},${b})" onclick="setTheme({accent:'${a}',accent2:'${b}'})" aria-label="${n}" title="${n}"></button>`).join('')}</div></div>
  <div class="field g2"><label class="cpick">لون مخصص 1<input type="color" value="${esc(t.accent || '#4170ff')}" oninput="setTheme({accent:this.value},true)" onchange="render()"></label><label class="cpick">لون مخصص 2<input type="color" value="${esc(t.accent2 || '#7b4dff')}" oninput="setTheme({accent2:this.value},true)" onchange="render()"></label></div>
  <div class="field"><label>خلفية الوضع الداكن</label><div class="chips">${[['navy', 'كحلي'], ['black', 'أسود'], ['slate', 'رمادي']].map(([k, l]) => `<button class="chip ${bg === k ? 'on' : ''}" onclick="setTheme({bg:'${k}'})">${l}</button>`).join('')}</div></div>
  <button class="btn ghost sm" onclick="setTheme(null)">استعادة الألوان الافتراضية</button></div>`;
}

/* ---------- الإشعارات ---------- */
function openNotifs() {
  const l = S.notifs || [];
  openSheet(`<div class="row between"><h3>الإشعارات</h3><button class="btn sm ghost" onclick="closeSheet()">إغلاق</button></div>` +
    (l.length ? l.map(n => `<div class="notif ${n.read ? '' : 'unr'}" ${n.code ? `onclick="closeSheet();openOrder('${jsq(n.code)}')"` : ''}><div>${esc(n.text)}</div><div class="mut xs">${ago(n.at)}</div></div>`).join('')
      : `<div class="empty">لا توجد إشعارات بعد. ستظهر هنا تحديثات الطلبات حسب إعداداتك.</div>`));
  if (l.some(n => !n.read)) { l.forEach(n => n.read = 1); api('/api/notifications/read', { method: 'POST' }).catch(() => {}); const b = document.querySelector('.dotn'); b && b.remove(); }
}
function setNotif(k, v) { S.prefs.notif[k] = v; api('/api/prefs', { method: 'PUT', body: { notif: { [k]: v } } }).catch(e => toast(e.message, 'bad')); }

/* ---------- التنقل ---------- */
function go(t) { UI.tab = t; UI.order = null; if (t !== 'new') UI.success = null; render(); scrollTo(0, 0); }
function openOrder(id) { if (!byId(id)) return toast('الطلب غير موجود', 'bad'); UI.order = id; render(); scrollTo(0, 0); }
function closeOrder() { UI.order = null; render(); }
function goBack() { if ($('#modal').innerHTML) { closeSheet(); return; } if (UI.order) { closeOrder(); return; } if (W && W.step > 1 && UI.tab === 'new') { W.step--; render(); return; } go(isAdmin() ? 'dash' : 'home'); }
function tgBack() { if (!tg || !S) return; try { const need = $('#modal').innerHTML || UI.order || (W && W.step > 1 && UI.tab === 'new') || !['home', 'dash'].includes(UI.tab); need ? tg.BackButton.show() : tg.BackButton.hide(); } catch (e) {} }

/* ---------- رسوم بيانية ---------- */
function last7(list, fn) { const v = [], l = []; for (let i = 6; i >= 0; i--) { const s = dayStart(Date.now()) - i * D, e = s + D; v.push(list.filter(o => o.createdAt >= s && o.createdAt < e).reduce((a, o) => a + fn(o), 0)); const d = new Date(s); l.push(d.getDate() + '/' + (d.getMonth() + 1)); } return [v, l]; }
function areaChart(vals, labels, color) {
  color = color || 'var(--pri)'; const Wd = 320, H = 120, p = 12, max = Math.max(1, ...vals), id = 'g' + (++gid);
  const pts = vals.map((v, i) => [p + i * (Wd - 2 * p) / (vals.length - 1), H - 26 - (v / max) * (H - 44)]);
  const line = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${Wd} ${H}" class="chart" role="img"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${color};stop-opacity:.4"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>
  <path d="${line} L${pts.at(-1)[0]} ${H - 26} L${pts[0][0]} ${H - 26} Z" fill="url(#${id})"/><path d="${line}" fill="none" style="stroke:${color}" stroke-width="2.5" stroke-linejoin="round"/>
  ${pts.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="3" style="fill:${color}"/>`).join('')}
  ${labels.map((t, i) => `<text x="${pts[i][0]}" y="${H - 6}" text-anchor="middle" font-size="10" style="fill:var(--muted)">${t}</text>`).join('')}</svg>`;
}
function donut(parts) {
  const tot = parts.reduce((a, p) => a + p.v, 0) || 1, r = 42, C = 2 * Math.PI * r; let off = 0;
  return `<svg viewBox="0 0 110 110" width="110" height="110" style="flex:none"><circle cx="55" cy="55" r="${r}" fill="none" style="stroke:var(--card2)" stroke-width="14"/>${parts.map(p => { const len = p.v / tot * C, s = `<circle cx="55" cy="55" r="${r}" fill="none" style="stroke:${p.c}" stroke-width="14" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 55 55)"/>`; off += len; return s; }).join('')}<text x="55" y="61" text-anchor="middle" font-size="18" font-weight="700" style="fill:var(--text)">${parts.reduce((a, p) => a + p.v, 0)}</text></svg>`;
}

/* ---------- عناصر مشتركة ---------- */
function head(title, sub, letter) {
  const n = (S.notifs || []).filter(x => !x.read).length;
  return `<div class="top"><div class="row"><div class="av">${esc(letter)}</div><div><div class="mut">${sub}</div><div class="h1">${esc(title)}</div></div></div><button class="ibtn" onclick="openNotifs()" aria-label="الإشعارات">${ic('bell')}${n ? `<span class="dotn">${n}</span>` : ''}</button></div>`;
}
function thumb(o) { const s = o.prints[0] && o.prints[0].mockups[0]; return s ? `<img src="${esc(s)}" alt="" loading="lazy">` : `<span class="ph"></span>`; }
function oRow(o, showM) {
  const c = calc(o), pr = o.problem && !o.problem.resolved;
  return `<div class="oi" onclick="openOrder('${jsq(o.id)}')">${thumb(o)}<div class="f1"><div class="row between"><b class="num">#${esc(o.id)}</b>${badge(o.status)}</div><div class="mut xs">${esc(o.customer.name)} - ${esc(o.customer.gov)} - ${c.q} قطعة${showM ? ' - ' + esc((mer(o.mid) || {}).name || '') : ''}</div><div class="row between"><b>${fmt(o.total)}</b><span class="row" style="gap:4px">${pr ? '<span class="badge b-bad">مشكلة</span>' : ''}${isLate(o) ? '<span class="badge b-warn">متأخر</span>' : ''}<span class="mut xs">${ago(o.createdAt)}</span></span></div></div></div>`;
}
function bnav(items, cur) {
  return `<nav class="bnav"><div class="iw">${items.map(([k, n, l]) => k === 'fab' ? `<button class="nb" onclick="go('new')" aria-label="${l}"><span class="fab">${ic('plus', 26)}</span>${l}</button>` : `<button class="nb ${cur === k ? 'on' : ''}" onclick="go('${k}')">${ic(n, 22)}${l}</button>`).join('')}</div></nav>`;
}

/* ---------- تفاصيل الطلب ---------- */
function orderDetail(o, role) {
  const c = calc(o), hist = {}; o.history.forEach(h => hist[h.s] = h);
  const term = ['rejected', 'returned'].includes(o.status), curIdx = FLOW.indexOf(o.status), code = jsq(o.id);
  let tl = FLOW.map(s => { const h = hist[s]; const cls = h ? (s === o.status && s !== 'delivered' && !term ? 'cur' : 'done') : ''; return { s, html: `<li class="${cls}"><span class="tdot">${h ? ic('check', 12) : ''}</span><div class="f1 row between"><span>${ST[s].t}</span><span class="mut xs num">${h ? fdate(h.at) : ''}</span></div></li>` }; });
  if (term) tl = tl.filter(x => hist[x.s]);
  tl = tl.map(x => x.html);
  if (term) { const h = hist[o.status]; tl.push(`<li class="term"><span class="tdot">${ic('x', 12)}</span><div class="f1"><div class="row between"><span>${ST[o.status].t}</span><span class="mut xs num">${h ? fdate(h.at) : ''}</span></div>${h && h.note ? `<div class="mut xs">السبب: ${esc(h.note)}</div>` : ''}</div></li>`); }
  const prints = o.prints.map((p, i) => `<div class="pcard"><h4><span class="pn">${i + 1}</span>الطبعة ${i + 1}<span class="mut xs" style="margin-inline-start:auto"><span class="cdot" style="background:${esc(colorHex(p.color))}"></span> ${esc(p.color)} - ${esc(p.size)} - ${p.qty} قطعة</span></h4>
   <div class="thumbs">${p.mockups.map((s, k) => `<figure onclick="viewImg('${code}',${i},'mockups',${k})"><img src="${esc(s)}" alt="موكاب ${k + 1}" loading="lazy"><figcaption>موكاب ${k + 1}</figcaption></figure>`).join('')}
   ${p.files.map((f, k) => `<figure onclick="viewImg('${code}',${i},'files',${k})">${isImg(f) ? `<img src="${esc(f.url)}" alt="ملف طباعة ${k + 1}" style="background:#fff" loading="lazy">` : `<span class="fileph">${ic('file', 28)}</span>`}<figcaption>ملف طباعة ${k + 1}</figcaption></figure>`).join('')}</div></div>`).join('');
  const p = o.price;
  const fin = `<div class="kv"><span>المبلغ مع التوصيل</span><b>${fmt(o.total)}</b></div><div class="kv"><span>أجور التوصيل</span><span>- ${fmt(p.delivery)}</span></div><div class="kv"><span>سعر الجملة (${c.q} × ${fmtN(p.sale)})</span><span>- ${fmt(c.q * p.sale)}</span></div>` +
    (o.status === 'returned' ? `<div class="kv"><span>رسوم المرتجع</span><span>- ${fmt(p.returnFee)}</span></div>` : '') +
    `<div class="kv tot"><span>${role === 'admin' ? 'ربح التاجر' : 'ربحك'} ${c.real ? '' : '(متوقع)'}</span><span style="color:${c.merchant < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmt(o.status === 'rejected' ? 0 : c.merchant)}</span></div>` +
    (role === 'admin' ? `<div class="kv"><span>تكلفة القطع (${c.q} × ${fmtN(p.cost)})</span><span>${fmt(c.q * p.cost)}</span></div><div class="kv tot"><span>ربح الإدارة</span><span style="color:var(--ok)">${fmt(c.admin)}</span></div>` : '') +
    (c.real ? `<div class="mut xs mt">${o.settled ? '✓ تمت تسوية هذا الطلب (' + esc(o.settled) + ')' : 'لم تتم تسويته بعد'}</div>` : '');
  const pr = o.problem;
  let acts = '';
  if (role === 'merchant') {
    if (o.status === 'new') acts += `<button class="btn ghost" onclick="askText('سبب إلغاء الطلب','مثال: الزبون ألغى الطلب',v=>setStatus('${code}','rejected',v))">إلغاء الطلب</button>`;
    if (!term && o.status !== 'delivered' && !(pr && !pr.resolved)) acts += `<button class="btn ghost mt" onclick="askText('الإبلاغ عن مشكلة','اكتب المشكلة بوضوح',v=>reportProblem('${code}',v))">${ic('alert', 18)} الإبلاغ عن مشكلة</button>`;
  } else if (!o.settled) {
    if (curIdx >= 0 && curIdx < FLOW.length - 1) { const nx = FLOW[curIdx + 1]; acts += `<button class="btn" onclick="setStatus('${code}','${nx}')">نقل إلى: ${ST[nx].t}</button>`; }
    acts += `<div class="g2 mt">`;
    if (['new', 'accepted', 'production', 'ready'].includes(o.status)) acts += `<button class="btn bad" onclick="askText('سبب رفض الطلب','مثال: رقم الهاتف غير صحيح',v=>setStatus('${code}','rejected',v))">رفض الطلب</button>`;
    if (['shipping', 'delivered'].includes(o.status)) acts += `<button class="btn bad" onclick="askText('سبب الإرجاع','مثال: الزبون لم يستلم',v=>setStatus('${code}','returned',v))">تسجيل مرتجع</button>`;
    acts += `<select class="in" aria-label="تعيين حالة" onchange="if(this.value)setStatus('${code}',this.value)"><option value="">تعيين حالة محددة…</option>${Object.keys(ST).filter(s => s !== o.status).map(s => `<option value="${s}">${ST[s].t}</option>`).join('')}</select></div>`;
  }
  acts += `<button class="btn ghost mt" onclick="copyText(orderText('${code}'))">${ic('copy', 18)} نسخ ملخص الطلب</button>`;
  return `<div class="top"><button class="ibtn" onclick="closeOrder()" aria-label="رجوع">${ic('back')}</button><div class="f1"><div class="h1 num" style="text-align:right">#${esc(o.id)}</div><div class="mut xs">${fdate(o.createdAt)}${role === 'admin' ? ' - ' + esc((mer(o.mid) || {}).name || '') : ''}</div></div>${badge(o.status)}</div>
  ${pr ? `<div class="card" style="border-color:${pr.resolved ? 'var(--line)' : 'var(--bad)'}"><div class="row between"><b style="color:${pr.resolved ? 'var(--muted)' : 'var(--bad)'}">${ic('alert', 16)} ${pr.resolved ? 'مشكلة محلولة' : 'مشكلة في الطلب'}</b><span class="mut xs">${ago(pr.at)}</span></div><div class="mt">${esc(pr.text)}</div>${pr.reply ? `<div class="mut mt">رد الإدارة: ${esc(pr.reply)}</div>` : ''}${role === 'admin' && !pr.resolved ? `<button class="btn sm ok mt" onclick="askText('الرد وحل المشكلة','اكتب الإجراء المتخذ',v=>resolveProblem('${code}',v))">الرد وإغلاق المشكلة</button>` : ''}</div>` : ''}
  <div class="card"><b>حالة الطلب</b><ul class="tl mt">${tl.join('')}</ul></div>
  <div class="card"><b>بيانات الزبون</b><div class="mt"><div class="kv"><span>الاسم</span><span>${esc(o.customer.name)}</span></div><div class="kv"><span>الهاتف</span><a class="num" href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></div><div class="kv"><span>المحافظة</span><span>${esc(o.customer.gov)}</span></div><div class="kv"><span>العنوان</span><span style="text-align:left">${esc(o.customer.addr)}</span></div>${o.note ? `<div class="kv"><span>ملاحظات</span><span>${esc(o.note)}</span></div>` : ''}</div></div>
  <div class="sec">الطبعات (${o.prints.length})</div>${prints}
  <div class="card"><b>الحساب</b><div class="mt">${fin}</div></div>
  <div class="mt">${acts}</div>`;
}
function viewImg(code, pi, kind, k) {
  const o = byId(code), item = o.prints[pi][kind][k], isF = kind === 'files', url = isF ? item.url : item, name = isF ? item.name : 'mockup';
  openSheet(`<div class="row between"><h3>${isF ? 'ملف الطباعة' : 'صورة الموكاب'} - الطبعة ${pi + 1}</h3><button class="btn sm ghost" onclick="closeSheet()">إغلاق</button></div>
  ${isImg(item) ? `<img src="${esc(url)}" alt="" style="width:100%;border-radius:14px;background:${isF ? '#fff' : 'transparent'}">` : `<div class="empty">${ic('file', 40)}<div class="mt">${esc(name)}</div></div>`}
  <button class="btn mt" onclick="downloadFile('${jsq(url)}','${jsq(code + '-' + (pi + 1) + '-' + name)}')">${ic('down', 18)} تحميل الملف الأصلي</button>`);
}
function downloadFile(url, name) {
  const abs = location.origin + url;
  if (tg) {
    try { if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.downloadFile) { tg.downloadFile({ url: abs, file_name: name.replace(/[^\w.\-\u0600-\u06FF]/g, '_') + (abs.match(/\.[a-z0-9]+$/i) || [''])[0] }); return; } } catch (e) {}
    tg.openLink(abs); return;
  }
  window.open(abs, '_blank');
}
function orderText(id) { const o = byId(id); return `طلب #${o.id}\nالزبون: ${o.customer.name}\nالهاتف: ${o.customer.phone}\nالعنوان: ${o.customer.gov} - ${o.customer.addr}\n` + o.prints.map((p, i) => `الطبعة ${i + 1}: ${p.color} / ${p.size} × ${p.qty}`).join('\n') + `\nالمبلغ مع التوصيل: ${fmtN(o.total)} د.ع\nالحالة: ${ST[o.status].t}`; }
const setStatus = (code, st, note) => run(api(`/api/orders/${encodeURIComponent(code)}/status`, { method: 'POST', body: { status: st, note: note || '' } }), 'تم تحديث الحالة: ' + ST[st].t);
const reportProblem = (code, text) => run(api(`/api/orders/${encodeURIComponent(code)}/problem`, { method: 'POST', body: { text } }), 'تم إرسال المشكلة للإدارة');
const resolveProblem = (code, reply) => run(api(`/api/orders/${encodeURIComponent(code)}/resolve`, { method: 'POST', body: { reply } }), 'تم إغلاق المشكلة');

/* =========================================================
   واجهة التاجر
   ========================================================= */
function merchantView() {
  const m = curM();
  let h = head(m.name, 'مرحباً،', (m.name || '?')[0].toUpperCase());
  if (UI.order) { const o = byId(UI.order); if (o) return h + orderDetail(o, 'merchant') + mNav(); }
  h += ({ home: mHome, orders: mOrders, new: mNew, stats: mStats, account: mAccount }[UI.tab] || mHome)();
  return h + mNav();
}
const mNav = () => bnav([['home', 'home', 'الرئيسية'], ['orders', 'list', 'الطلبات'], ['fab', '', 'طلب جديد'], ['stats', 'chart', 'الإحصائيات'], ['account', 'user', 'حسابي']], UI.tab);

function lockScreen(m) {
  const st = m ? m.status : 'new';
  const form = `<div class="field mt"><label for="rname">اسم المتجر</label><input id="rname" class="in" value="${esc(m ? m.name : '')}" placeholder="مثال: DAJJA"></div>
  <div class="field"><label for="rig">معرّف إنستغرام</label><input id="rig" class="in num" placeholder="@your.store" value="${esc(m ? m.ig : '')}" style="text-align:left"></div>
  <button class="btn" onclick="register()">${ic('ig', 18)} إرسال طلب التفعيل</button>`;
  let body;
  if (st === 'pending' && !UI.editReg) body = `<p class="mt">تم إرسال طلب التفعيل للمتجر <b>${esc(m.name)}</b> بالمعرّف <b class="num">@${esc(m.ig)}</b>.</p><p class="mut mt">سيصلك إشعار من البوت فور موافقة الإدارة.</p><div class="g2 mt"><button class="btn ghost" onclick="reload()">تحديث الحالة</button><button class="btn ghost" onclick="UI.editReg=true;render()">تعديل البيانات</button></div>`;
  else if (st === 'suspended') body = `<p class="mt">تم إيقاف حسابك مؤقتاً. تواصل مع الإدارة لإعادة التفعيل.</p>`;
  else body = `<p class="mut mt">${st === 'rejected' ? 'لم تتم الموافقة على طلبك السابق. يمكنك تعديل البيانات وإرسال الطلب مجدداً.' : 'لبدء استخدام النظام، أرسل طلب تفعيل باسم متجرك ومعرّف حسابك على إنستغرام.'}</p>${form}`;
  if (st === 'pending' && UI.editReg) body = form;
  return `<div class="lock"><div class="logo">🛍️</div><div class="h1">DropShop</div><p class="mut">إدارة طلبات متجرك من مكان واحد</p>
  <div class="card mt2" style="text-align:right"><div class="row between"><b>حالة الحساب</b>${m ? `<span class="badge b-${mState(m)[1]}">${mState(m)[0]}</span>` : '<span class="badge b-info">غير مسجل</span>'}</div>${body}</div></div>`;
}
function register() {
  const name = $('#rname').value.trim(), ig = $('#rig').value.trim();
  if (name.length < 2) return toast('اكتب اسم المتجر', 'bad');
  if (!/^@?[a-zA-Z0-9._]{2,30}$/.test(ig)) return toast('اكتب معرّف إنستغرام صحيحاً، مثل: my.store', 'bad');
  UI.editReg = false;
  run(api('/api/register', { method: 'POST', body: { name, ig } }), 'تم إرسال طلب التفعيل');
}

function mHome() {
  const os = S.orders, now = Date.now(), t0 = dayStart(now), month = os.filter(o => o.createdAt >= now - 30 * D);
  const realized = month.filter(o => calc(o).real).reduce((a, o) => a + calc(o).merchant, 0);
  const due = os.filter(o => calc(o).real && !o.settled).reduce((a, o) => a + calc(o).merchant, 0);
  const expected = os.filter(o => ACTIVE.includes(o.status)).reduce((a, o) => a + calc(o).base, 0);
  const [v, l] = last7(os.filter(o => o.status !== 'rejected'), o => o.total);
  return `<div class="card hero"><div class="mut">صافي الأرباح - آخر 30 يوماً</div><div class="big">${fmt(realized)}</div><div class="row between mt" style="position:relative;z-index:1"><span class="mut">غير مُسوّى: <b style="color:#fff">${fmt(due)}</b></span><span class="mut">متوقع: <b style="color:#fff">${fmt(expected)}</b></span></div></div>
  <div class="g3 mt"><div class="stat"><div class="n">${os.filter(o => o.createdAt >= t0).length}</div><div class="l">طلبات اليوم</div></div><div class="stat"><div class="n" style="color:var(--warn)">${os.filter(o => ACTIVE.includes(o.status)).length}</div><div class="l">قيد التنفيذ</div></div><div class="stat"><div class="n" style="color:var(--ok)">${month.filter(o => o.status === 'delivered').length}</div><div class="l">تم التسليم خلال 30 يوماً</div></div></div>
  <div class="card mt"><div class="row between"><b>المبيعات - آخر 7 أيام</b><span class="mut xs">${fmt(v.reduce((a, b) => a + b, 0))}</span></div>${areaChart(v, l)}</div>
  <button class="btn mt" onclick="go('new')">${ic('plus', 18)} تثبيت طلب جديد</button>
  <div class="sec">آخر الطلبات <a onclick="go('orders')">عرض الكل</a></div>
  ${os.length ? os.slice(0, 5).map(o => oRow(o)).join('') : `<div class="empty">لا توجد طلبات بعد. ثبّت أول طلب من زر «طلب جديد».</div>`}`;
}

function mFiltered() { const g = GROUPS[UI.mf.g].s, q = UI.mf.q.trim().toLowerCase(); return S.orders.filter(o => (!g || g.includes(o.status)) && (!q || (o.id + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.gov).toLowerCase().includes(q))); }
const mRows = () => { const l = mFiltered(); return l.length ? l.map(o => oRow(o)).join('') : `<div class="empty">لا توجد طلبات بهذا التصنيف.</div>`; };
function mOrders() {
  return `<div class="h1" style="margin-bottom:10px">طلباتي</div>
  <input class="in" placeholder="ابحث برقم الطلب أو الاسم أو الهاتف" value="${esc(UI.mf.q)}" oninput="UI.mf.q=this.value;$('#olist').innerHTML=mRows()">
  <div class="chips mt">${Object.entries(GROUPS).map(([k, g]) => `<button class="chip ${UI.mf.g === k ? 'on' : ''}" onclick="UI.mf.g='${k}';render()">${g.t} (${S.orders.filter(o => !g.s || g.s.includes(o.status)).length})</button>`).join('')}</div>
  <div id="olist" class="mt">${mRows()}</div>`;
}

/* --- معالج تثبيت الطلب --- */
const newPrint = () => ({ color: -1, size: -1, qty: 1, mockups: [], files: [] });
function newW() { W = { step: 1, c: { name: '', phone: '', gov: '', addr: '' }, total: '', note: '', prints: [newPrint()] }; }
function mNew() {
  if (UI.success) {
    const o = byId(UI.success);
    if (o) return `<div class="success"><div class="ok-c">${ic('check', 44)}</div><div class="h1">تم تثبيت الطلب</div><div class="big num mt" style="font-size:24px">#${esc(o.id)}</div><div class="big" style="font-size:26px">${fmt(o.total)}</div><p class="mut">${esc(o.customer.gov)} - ${pcs(o)} قطعة - ${o.prints.length} طبعة</p><button class="btn mt2" onclick="openOrder('${jsq(o.id)}')">عرض تفاصيل الطلب</button><button class="btn ghost mt" onclick="UI.success=null;newW();render()">تثبيت طلب آخر</button><button class="btn ghost mt" onclick="go('home')">العودة للرئيسية</button></div>`;
  }
  if (!W) newW();
  const inv = S.inventory;
  const steps = `<div class="row between"><div class="h1">طلب جديد</div><span class="mut num">${W.step}/3</span></div><div class="steps mt">${[1, 2, 3].map(i => `<i class="${i <= W.step ? 'on' : ''}"></i>`).join('')}</div>`;
  if (W.step === 1) return steps + `<div class="card"><b>بيانات الزبون</b><div class="mt">
   <div class="field"><label for="cn">اسم الزبون</label><input id="cn" class="in" value="${esc(W.c.name)}" oninput="W.c.name=this.value" placeholder="الاسم الكامل"></div>
   <div class="field"><label for="cp">رقم الهاتف</label><input id="cp" class="in num" inputmode="tel" value="${esc(W.c.phone)}" oninput="W.c.phone=this.value" placeholder="07XXXXXXXXX" style="text-align:left"></div>
   <div class="field"><label for="cg">المحافظة</label><select id="cg" class="in" onchange="W.c.gov=this.value"><option value="">اختر المحافظة</option>${S.govs.map(g => `<option ${W.c.gov === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
   <div class="field"><label for="ca">العنوان الدقيق</label><textarea id="ca" class="in" rows="2" oninput="W.c.addr=this.value" placeholder="المنطقة - الشارع - أقرب نقطة دالة">${esc(W.c.addr)}</textarea></div></div></div>
   <div class="card"><b>السعر</b><div class="mt"><div class="field"><label for="ct">السعر الكلي مع التوصيل (د.ع)</label><input id="ct" class="in num" inputmode="numeric" value="${esc(W.total)}" oninput="W.total=this.value.replace(/[^0-9]/g,'');this.value=W.total" placeholder="مثال: 30000" style="text-align:left"></div>
   <div class="field"><label for="cno">ملاحظات (اختياري)</label><input id="cno" class="in" value="${esc(W.note)}" oninput="W.note=this.value" placeholder="مثال: الاتصال قبل التوصيل"></div></div></div>
   <button class="btn mt" onclick="wNext()">التالي: الطبعات</button>`;
  if (W.step === 2) return steps + `<div class="card row between"><div><b>عدد الطبعات</b><div class="mut xs">لكل طبعة تصميم مستقل بصوره وملفاته</div></div><div class="stepper"><button onclick="setPrints(-1)" aria-label="إنقاص">−</button><span class="num">${W.prints.length}</span><button onclick="setPrints(1)" aria-label="زيادة">+</button></div></div>
   <div class="mt">${W.prints.map((p, i) => `<div class="pcard"><h4><span class="pn">${i + 1}</span>الطبعة ${i + 1}</h4>
    <div class="field"><label>لون التيشيرت</label><div class="chips wrapf">${inv.colors.map((c, ci) => `<button class="chip ${p.color === ci ? 'on' : ''}" onclick="W.prints[${i}].color=${ci};W.prints[${i}].size=-1;render()"><span class="cdot" style="background:${esc(c.hex)}"></span> ${esc(c.name)}</button>`).join('')}</div></div>
    <div class="field"><label>القياس ${p.color < 0 ? '<span class="xs">(اختر اللون أولاً)</span>' : ''}</label><div class="chips wrapf">${inv.sizes.map((s, si) => { const q = p.color < 0 ? 0 : (inv.stock[inv.colors[p.color].name + '|' + s] || 0); return `<button class="chip ${p.size === si ? 'on' : ''}" ${p.color < 0 || q < 1 ? 'disabled' : ''} onclick="W.prints[${i}].size=${si};render()">${esc(s)} <span class="xs">(${q})</span></button>`; }).join('')}</div></div>
    <div class="field row between"><label style="margin:0">عدد القطع</label><div class="stepper"><button onclick="setQty(${i},-1)" aria-label="إنقاص">−</button><span class="num">${p.qty}</span><button onclick="setQty(${i},1)" aria-label="زيادة">+</button></div></div>
    <div class="field"><label>صورة التصميم على الموكاب (1-2)</label><div class="slots">${[0, 1].map(k => slot(i, 'mockups', k, p.mockups[k])).join('')}</div></div>
    <div class="field" style="margin:0"><label>ملف الطباعة المفرغ (1-2) — PNG أو PDF بجودة كاملة</label><div class="slots">${[0, 1].map(k => slot(i, 'files', k, p.files[k])).join('')}</div></div></div>`).join('')}</div>
   <div class="g2"><button class="btn ghost" onclick="W.step=1;render()">السابق</button><button class="btn" onclick="wNext()">مراجعة الطلب</button></div>`;
  const q = W.prints.reduce((a, p) => a + p.qty, 0), pr = S.price, profit = +W.total - pr.delivery - q * pr.sale;
  return steps + `<div class="card"><b>الزبون</b><div class="mt"><div class="kv"><span>الاسم</span><span>${esc(W.c.name)}</span></div><div class="kv"><span>الهاتف</span><span class="num">${esc(W.c.phone)}</span></div><div class="kv"><span>العنوان</span><span>${esc(W.c.gov)} - ${esc(W.c.addr)}</span></div>${W.note ? `<div class="kv"><span>ملاحظات</span><span>${esc(W.note)}</span></div>` : ''}</div></div>
  <div class="card"><b>الطبعات</b><div class="mt">${W.prints.map((p, i) => { const c = inv.colors[p.color]; return `<div class="li"><img src="${esc(p.mockups.find(x => typeof x === 'string'))}" alt="" style="width:52px;height:52px;border-radius:10px;object-fit:cover"><div class="f1"><b>الطبعة ${i + 1}</b><div class="mut xs"><span class="cdot" style="background:${esc(c.hex)}"></span> ${esc(c.name)} - ${esc(inv.sizes[p.size])} - ${p.mockups.filter(Boolean).length} موكاب - ${p.files.filter(Boolean).length} ملف</div></div><b class="num">×${p.qty}</b></div>`; }).join('')}</div></div>
  <div class="card"><b>الحساب</b><div class="mt"><div class="kv"><span>إجمالي القطع</span><b class="num">${q}</b></div><div class="kv"><span>السعر مع التوصيل</span><b>${fmt(W.total)}</b></div><div class="kv"><span>أجور التوصيل</span><span>- ${fmt(pr.delivery)}</span></div><div class="kv"><span>سعر الجملة (${q} × ${fmtN(pr.sale)})</span><span>- ${fmt(q * pr.sale)}</span></div><div class="kv tot"><span>ربحك المتوقع</span><span style="color:${profit < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmt(profit)}</span></div></div>${profit < 0 ? '<div class="mut xs mt" style="color:var(--bad)">تنبيه: السعر أقل من التكلفة، الربح سالب.</div>' : ''}</div>
  <div class="g2 mt"><button class="btn ghost" onclick="W.step=2;render()">السابق</button><button class="btn ok" id="subBtn" onclick="submitOrder()">${ic('check', 18)} تأكيد الطلب</button></div>`;
}
function slot(i, kind, k, v) {
  const isF = kind === 'files';
  let inner;
  if (v && v.loading) inner = `<div class="spin"></div><span>جارٍ الرفع…</span>`;
  else if (v) {
    const url = isF ? v.url : v;
    inner = (isImg(v) ? `<img src="${esc(url)}" alt="">` : `${ic('file', 28)}<span>${esc(v.name)}</span>`) + `<button class="x" onclick="event.preventDefault();W.prints[${i}].${kind}[${k}]=null;render()" aria-label="حذف">${ic('x', 14)}</button>`;
  } else inner = `${ic(isF ? 'file' : 'img', 24)}<span>${isF ? 'ملف طباعة' : 'موكاب'} ${k + 1}${k ? ' (اختياري)' : ''}</span>`;
  return `<label class="slot ${v ? 'has' : ''} ${isF ? 'chk' : 'mk'}">${inner}${v && v.loading ? '' : `<input type="file" accept="${isF ? 'image/png,image/jpeg,image/webp,application/pdf' : 'image/*'}" onchange="pickImg(this,${i},'${kind}',${k})">`}</label>`;
}
function setPrints(d) { const n = Math.min(10, Math.max(1, W.prints.length + d)); while (W.prints.length < n) W.prints.push(newPrint()); W.prints.length = n; render(); }
function setQty(i, d) { W.prints[i].qty = Math.min(50, Math.max(1, W.prints[i].qty + d)); render(); }
function shrink(file, max) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const sc = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc); const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); cv.toBlob(b => b ? res(b) : rej(), 'image/jpeg', .85); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(); };
    im.src = url;
  });
}
async function pickImg(inp, i, kind, k) {
  const f = inp.files[0]; if (!f) return;
  const isF = kind === 'files';
  if (!isF && !/^image\//.test(f.type)) return toast('صورة الموكاب يجب أن تكون صورة', 'bad');
  if (isF && !/^(image\/(png|jpeg|webp)|application\/pdf)$/.test(f.type)) return toast('ملف الطباعة يجب أن يكون PNG أو JPG أو WEBP أو PDF', 'bad');
  if (f.size > 25 * 1024 * 1024) return toast('الحد الأقصى لحجم الملف 25MB', 'bad');
  const p = W.prints[i]; p[kind][k] = { loading: true, name: f.name }; render();
  try {
    let blob = f, name = f.name;
    if (!isF) { try { blob = await shrink(f, 1400); name = 'mockup.jpg'; } catch (e) { blob = f; } }
    const fd = new FormData(); fd.append('file', blob, name);
    const r = await api('/api/upload', { method: 'POST', body: fd });
    if (W && W.prints[i] === p) p[kind][k] = isF ? { url: r.url, name: f.name, mime: r.mime } : r.url;
  } catch (e) { if (W && W.prints[i] === p) p[kind][k] = null; toast(e.message, 'bad'); }
  if (UI.tab === 'new') render();
}
function wNext() {
  if (W.step === 1) {
    const c = W.c; c.phone = c.phone.replace(/\s/g, '');
    if (c.name.trim().length < 3) return toast('اكتب اسم الزبون', 'bad');
    if (!/^07\d{9}$/.test(c.phone)) return toast('رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقماً', 'bad');
    if (!c.gov) return toast('اختر المحافظة', 'bad');
    if (c.addr.trim().length < 5) return toast('اكتب العنوان الدقيق', 'bad');
    if (!(+W.total > 0)) return toast('اكتب السعر الكلي مع التوصيل', 'bad');
    W.step = 2;
  } else if (W.step === 2) {
    const inv = S.inventory, need = {};
    for (let i = 0; i < W.prints.length; i++) {
      const p = W.prints[i], n = `الطبعة ${i + 1}: `;
      if (p.color < 0) return toast(n + 'اختر اللون', 'bad');
      if (p.size < 0) return toast(n + 'اختر القياس', 'bad');
      if ([...p.mockups, ...p.files].some(x => x && x.loading)) return toast('انتظر اكتمال رفع الملفات', 'bad');
      if (!p.mockups.some(x => typeof x === 'string')) return toast(n + 'ارفع صورة موكاب واحدة على الأقل', 'bad');
      if (!p.files.some(x => x && x.url)) return toast(n + 'ارفع ملف طباعة واحداً على الأقل', 'bad');
      const key = inv.colors[p.color].name + '|' + inv.sizes[p.size]; need[key] = (need[key] || 0) + p.qty;
    }
    const miss = Object.entries(need).find(([k, q]) => (inv.stock[k] || 0) < q);
    if (miss) return toast(`الكمية غير متوفرة: ${miss[0].replace('|', ' / ')} (المتوفر ${inv.stock[miss[0]] || 0})`, 'bad');
    W.step = 3;
  }
  render(); scrollTo(0, 0);
}
async function submitOrder() {
  const b = $('#subBtn'); if (b) b.disabled = true;
  const inv = S.inventory;
  const body = {
    customer: { ...W.c }, total: +W.total, note: W.note.trim(),
    prints: W.prints.map(p => ({ color: inv.colors[p.color].name, size: inv.sizes[p.size], qty: p.qty, mockups: p.mockups.filter(x => typeof x === 'string'), files: p.files.filter(x => x && x.url) }))
  };
  const r = await run(api('/api/orders', { method: 'POST', body }));
  if (r && r.code) { W = null; UI.success = r.code; render(); scrollTo(0, 0); }
  else if (b) b.disabled = false;
}

function mStats() {
  const per = { day: 'اليوم', week: 'أسبوع', month: 'شهر', all: 'الكل' }, now = Date.now(), p = UI.period;
  const from = p === 'all' ? 0 : p === 'day' ? dayStart(now) : now - (p === 'week' ? 7 : 30) * D;
  const os = S.orders.filter(o => o.createdAt >= from), cnt = s => os.filter(o => o.status === s).length;
  const del = cnt('delivered'), ret = cnt('returned'), rej = cnt('rejected'), fin = del + ret;
  const valid = os.filter(o => o.status !== 'rejected');
  const profit = os.filter(o => calc(o).real).reduce((a, o) => a + calc(o).merchant, 0);
  const prod = {}; valid.forEach(o => o.prints.forEach(x => { const k = x.color + ' / ' + x.size; prod[k] = (prod[k] || 0) + x.qty; }));
  const top = Object.entries(prod).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top[0] ? top[0][1] : 1;
  const parts = [{ v: cnt('new'), c: 'var(--info)', t: 'جديد' }, { v: os.filter(o => ['accepted', 'production', 'ready'].includes(o.status)).length, c: 'var(--warn)', t: 'قيد التنفيذ' }, { v: cnt('shipping'), c: 'var(--pri)', t: 'بالتوصيل' }, { v: del, c: 'var(--ok)', t: 'تم التسليم' }, { v: ret + rej, c: 'var(--bad)', t: 'مرتجع / مرفوض' }];
  return `<div class="h1" style="margin-bottom:10px">الإحصائيات</div><div class="chips">${Object.entries(per).map(([k, t]) => `<button class="chip ${p === k ? 'on' : ''}" onclick="UI.period='${k}';render()">${t}</button>`).join('')}</div>
  <div class="card hero mt"><div class="mut">صافي الربح المحقق (${per[p]})</div><div class="big">${fmt(profit)}</div><div class="mut">من ${del} طلب مُسلّم${ret ? ` و${ret} مرتجع` : ''}</div></div>
  <div class="g2 mt"><div class="stat"><div class="l">نسبة التسليم</div><div class="n" style="color:var(--ok)">${fin ? Math.round(del / fin * 100) : 0}%</div></div><div class="stat"><div class="l">نسبة الرفض</div><div class="n" style="color:var(--bad)">${os.length ? Math.round(rej / os.length * 100) : 0}%</div></div>
  <div class="stat"><div class="l">متوسط قيمة الطلب</div><div class="n" style="font-size:17px">${fmt(valid.length ? valid.reduce((a, o) => a + o.total, 0) / valid.length : 0)}</div></div><div class="stat"><div class="l">متوسط القطع بالطلب</div><div class="n">${valid.length ? (valid.reduce((a, o) => a + pcs(o), 0) / valid.length).toFixed(1) : 0}</div></div></div>
  <div class="card mt"><b>توزيع الطلبات</b><div class="row mt" style="gap:16px">${donut(parts)}<div class="f1">${parts.map(x => `<div class="row between xs" style="padding:3px 0"><span class="row" style="gap:6px"><span class="cdot" style="background:${x.c};border:0"></span>${x.t}</span><b class="num">${x.v}</b></div>`).join('')}</div></div></div>
  <div class="card"><b>المنتجات الأكثر طلباً</b><div class="mt">${top.length ? top.map(([k, v]) => `<div style="margin-bottom:10px"><div class="row between xs"><span>${esc(k)}</span><b class="num">${v}</b></div><div class="bar"><i style="width:${v / mx * 100}%"></i></div></div>`).join('') : '<div class="mut">لا توجد بيانات لهذه الفترة.</div>'}</div></div>`;
}

/* --- حسابي + المحفظة --- */
function walletCard() {
  const os = S.orders, un = os.filter(o => calc(o).real && !o.settled);
  const bal = un.reduce((a, o) => a + calc(o).merchant, 0);
  const pend = os.filter(o => ACTIVE.includes(o.status)).reduce((a, o) => a + calc(o).base, 0);
  const paid = (S.settlements || []).reduce((a, s) => a + s.amt, 0);
  return `<div class="card hero"><div class="row between" style="position:relative;z-index:1"><b class="row" style="gap:6px">${ic('wallet', 18)} المحفظة</b><span class="mut xs">${un.length} طلب غير مُسوّى</span></div>
  <div class="mut mt">الرصيد المستحق (أرباح الطلبات غير المسوّاة)</div><div class="big">${fmt(bal)}</div>
  <div class="g2 mt"><div class="in-box"><div class="mut xs">أرباح طلبات قيد التنفيذ</div><b>${fmt(pend)}</b></div><div class="in-box"><div class="mut xs">إجمالي ما تمت تسويته</div><b>${fmt(paid)}</b></div></div>
  <div class="g2 mt" style="position:relative;z-index:1"><button class="btn sm glass" style="width:100%" onclick="walletOrders()">الطلبات غير المسوّاة</button><button class="btn sm glass" style="width:100%" onclick="walletHistory()">سجل التسويات</button></div></div>`;
}
function walletOrders() {
  const un = S.orders.filter(o => calc(o).real && !o.settled);
  openSheet(`<div class="row between"><h3>طلبات غير مسوّاة (${un.length})</h3><button class="btn sm ghost" onclick="closeSheet()">إغلاق</button></div>` +
    (un.length ? un.map(o => { const c = calc(o); return `<div class="li" style="cursor:pointer" onclick="closeSheet();openOrder('${jsq(o.id)}')"><div class="f1"><b class="num">#${esc(o.id)}</b> ${badge(o.status)}<div class="mut xs">${esc(o.customer.name)} - ${fday(o.createdAt)}</div></div><b style="color:${c.merchant < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmt(c.merchant)}</b></div>`; }).join('') : '<div class="empty">كل طلباتك المسلّمة تمت تسويتها.</div>'));
}
function walletHistory() {
  const l = S.settlements || [];
  openSheet(`<div class="row between"><h3>سجل التسويات</h3><button class="btn sm ghost" onclick="closeSheet()">إغلاق</button></div>` +
    (l.length ? l.map(s => `<div class="li"><div class="f1"><b class="num">${esc(s.code)}</b><div class="mut xs">${fdate(s.at)} - ${s.count} طلب</div></div><b>${fmt(s.amt)}</b></div>`).join('') : '<div class="empty">لا توجد تسويات بعد.</div>'));
}
function mAccount() {
  const m = curM(), st = mState(m), n = S.prefs.notif || {};
  return `<div class="h1" style="margin-bottom:10px">حسابي</div>
  ${walletCard()}
  <div class="card mt"><div class="row"><div class="av" style="width:54px;height:54px;font-size:22px">${esc((m.name || '?')[0].toUpperCase())}</div><div class="f1"><b>${esc(m.name)}</b><div class="mut num" style="text-align:right">@${esc(m.ig)}</div></div><span class="badge b-${st[1]}">${st[0]}</span></div>
  <div class="mt"><div class="kv"><span>الاشتراك</span><span>مفعّل بدون مدة محددة</span></div>${m.activated_at ? `<div class="kv"><span>تاريخ التفعيل</span><span>${fday(m.activated_at)}</span></div>` : ''}<div class="kv"><span>إجمالي الطلبات</span><span class="num">${S.orders.length}</span></div><div class="kv"><span>معرّف تيليجرام</span><span class="num">${esc(S.me.tg)}</span></div></div></div>
  ${themeCard()}
  <div class="sec">الإشعارات</div><div class="card"><div class="mut xs" style="margin-bottom:4px">اختر التحديثات التي يرسلها لك البوت</div>${MNOTIF.map(([k, t]) => `<div class="li"><span class="f1">${t}</span>${sw(n[k] !== false, `setNotif('${k}',this.checked)`)}</div>`).join('')}</div>`;
}

/* =========================================================
   واجهة الإدارة
   ========================================================= */
function adminView() {
  let h = head('لوحة الإدارة', 'DropShop', (S.me.name || 'A')[0].toUpperCase());
  if (UI.order) { const o = byId(UI.order); if (o) return h + orderDetail(o, 'admin') + aNav(); }
  if (UI.tab === 'home') UI.tab = 'dash';
  h += ({ dash: aDash, orders: aOrders, stock: aStock, merchants: aMerchants, finance: aFinance, settings: aSettings }[UI.tab] || aDash)();
  return h + aNav();
}
const aNav = () => bnav([['dash', 'home', 'الرئيسية'], ['orders', 'list', 'الطلبات'], ['stock', 'box', 'المخزون'], ['merchants', 'users', 'التجار'], ['finance', 'wallet', 'المالية'], ['settings', 'gear', 'الإعدادات']], UI.tab);
function aGo(g, flag) { UI.af = { g: g || 'all', mid: 'all', q: '', flag: flag || '' }; go('orders'); }

function aDash() {
  const now = Date.now(), t0 = dayStart(now), all = S.orders, today = all.filter(o => o.createdAt >= t0), month = all.filter(o => o.createdAt >= now - 30 * D);
  const adminP = month.filter(o => calc(o).real).reduce((a, o) => a + calc(o).admin, 0);
  const due = all.filter(o => calc(o).real && !o.settled).reduce((a, o) => a + calc(o).merchant, 0);
  const [v, l] = last7(all, () => 1);
  const late = all.filter(isLate), probs = all.filter(o => o.problem && !o.problem.resolved), low = Object.entries(S.inventory.stock).filter(([k, q]) => q <= S.cfg.lowStock), pend = S.merchants.filter(m => m.status === 'pending');
  const al = [];
  pend.forEach(m => al.push([`طلب اشتراك: ${esc(m.name)} (@${esc(m.ig)})`, 'info', 'ig', "go('merchants')"]));
  probs.forEach(o => al.push([`مشكلة في الطلب ${esc(o.id)}: ${esc(o.problem.text)}`, 'bad', 'alert', `openOrder('${jsq(o.id)}')`]));
  late.forEach(o => al.push([`الطلب ${esc(o.id)} متأخر منذ ${Math.floor((now - o.createdAt) / D)} أيام`, 'warn', 'clock', `openOrder('${jsq(o.id)}')`]));
  low.forEach(([k, q]) => al.push([`مخزون منخفض: ${esc(k.replace('|', ' / '))} — متبقي ${q}`, 'warn', 'box', "go('stock')"]));
  const rank = S.merchants.map(m => [m, month.filter(o => o.mid === m.id && o.status !== 'rejected').length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const g = (k, t, c) => `<div class="stat" style="cursor:pointer" onclick="aGo('${k}')"><div class="n" style="color:var(--${c})">${all.filter(o => GROUPS[k].s.includes(o.status)).length}</div><div class="l">${t}</div></div>`;
  return `<div class="card hero"><div class="mut">الطلبات الواردة اليوم</div><div class="big">${today.length}</div><div class="mut" style="position:relative;z-index:1">المبيعات: <b style="color:#fff">${fmt(today.filter(o => o.status !== 'rejected').reduce((a, o) => a + o.total, 0))}</b></div></div>
  <div class="g2 mt"><div class="stat"><div class="l">أرباح الإدارة - 30 يوماً</div><div class="n" style="font-size:17px;color:var(--ok)">${fmt(adminP)}</div></div><div class="stat"><div class="l">مستحقات التجار غير المسوّاة</div><div class="n" style="font-size:17px;color:var(--warn)">${fmt(due)}</div></div></div>
  <div class="g4 mt">${g('new', 'جديد', 'info')}${g('work', 'قيد التنفيذ', 'warn')}${g('ship', 'بالتوصيل', 'pri')}${g('done', 'تم التسليم', 'ok')}</div>
  <div class="sec">تنبيهات تحتاج إجراء <span class="badge b-${al.length ? 'bad' : 'ok'}">${al.length}</span></div>
  ${al.length ? al.slice(0, 10).map(([t, c, i, a]) => `<div class="al" onclick="${a}"><span class="ii b-${c}">${ic(i, 17)}</span><span class="f1">${t}</span>${ic('fwd', 16)}</div>`).join('') : `<div class="card empty">لا توجد تنبيهات. كل شيء يسير كما يجب.</div>`}
  <div class="card mt"><div class="row between"><b>الطلبات - آخر 7 أيام</b><span class="mut xs num">${v.reduce((a, b) => a + b, 0)}</span></div>${areaChart(v, l, 'var(--vio)')}</div>
  <div class="card"><b>أنشط التجار - آخر 30 يوماً</b><div class="mt">${rank.length ? rank.map(([m, n]) => `<div style="margin-bottom:10px"><div class="row between xs"><span>${esc(m.name)}</span><b class="num">${n} طلب</b></div><div class="bar"><i style="width:${n / rank[0][1] * 100}%"></i></div></div>`).join('') : '<div class="mut">لا توجد طلبات خلال آخر 30 يوماً.</div>'}</div></div>`;
}

function aFiltered() { const f = UI.af, g = GROUPS[f.g].s, q = f.q.trim().toLowerCase(); return S.orders.filter(o => (!g || g.includes(o.status)) && (f.mid === 'all' || o.mid === +f.mid) && (f.flag !== 'late' || isLate(o)) && (f.flag !== 'prob' || (o.problem && !o.problem.resolved)) && (!q || (o.id + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.gov).toLowerCase().includes(q))); }
const aRows = () => { const l = aFiltered(); return l.length ? l.map(o => oRow(o, true)).join('') : `<div class="empty">لا توجد طلبات مطابقة للتصفية.</div>`; };
function aOrders() {
  const f = UI.af;
  return `<div class="h1" style="margin-bottom:10px">جميع الطلبات</div>
  <input class="in" placeholder="ابحث برقم الطلب أو الاسم أو الهاتف" value="${esc(f.q)}" oninput="UI.af.q=this.value;$('#olist').innerHTML=aRows()">
  <div class="g2 mt"><select class="in" aria-label="التاجر" onchange="UI.af.mid=this.value;render()"><option value="all">كل التجار</option>${S.merchants.filter(m => m.status !== 'pending').map(m => `<option value="${m.id}" ${String(f.mid) === String(m.id) ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
  <select class="in" aria-label="تصفية إضافية" onchange="UI.af.flag=this.value;render()"><option value="">بدون تصفية إضافية</option><option value="late" ${f.flag === 'late' ? 'selected' : ''}>المتأخرة فقط</option><option value="prob" ${f.flag === 'prob' ? 'selected' : ''}>فيها مشكلة</option></select></div>
  <div class="chips mt">${Object.entries(GROUPS).map(([k, g]) => `<button class="chip ${f.g === k ? 'on' : ''}" onclick="UI.af.g='${k}';render()">${g.t} (${S.orders.filter(o => !g.s || g.s.includes(o.status)).length})</button>`).join('')}</div>
  <div id="olist" class="mt">${aRows()}</div>`;
}

function aStock() {
  const inv = S.inventory, p = S.price; let tot = 0, val = 0, low = 0;
  Object.values(inv.stock).forEach(q => { tot += q; val += q * p.cost; if (q <= S.cfg.lowStock) low++; });
  const pf = (k, t) => `<div class="field"><label for="p_${k}">${t}</label><input id="p_${k}" class="in num" inputmode="numeric" value="${p[k]}" style="text-align:left"></div>`;
  return `<div class="h1" style="margin-bottom:10px">المخزون والأسعار</div>
  <div class="card"><b>الأسعار</b><div class="g2 mt">${pf('cost', 'سعر القطعة (التكلفة)')}${pf('sale', 'سعر البيع للتاجر')}${pf('delivery', 'سعر التوصيل')}${pf('returnFee', 'رسوم المرتجع على التاجر')}</div>
  <div class="mut xs" style="margin-bottom:10px">ربح الإدارة لكل قطعة: <b>${fmt(p.sale - p.cost)}</b>. الأسعار الجديدة تُطبّق على الطلبات الجديدة فقط.</div><button class="btn" onclick="savePrices()">حفظ الأسعار</button></div>
  <div class="g3 mt"><div class="stat"><div class="n num">${fmtN(tot)}</div><div class="l">قطعة بالمخزن</div></div><div class="stat"><div class="n" style="font-size:15px">${fmt(val)}</div><div class="l">قيمة المخزون</div></div><div class="stat"><div class="n" style="color:var(--bad)">${low}</div><div class="l">صنف منخفض</div></div></div>
  <div class="card mt"><div class="row between"><b>الكميات حسب اللون والقياس</b><span class="mut xs">الحد الأدنى: ${S.cfg.lowStock}</span></div>
  <div class="mut xs mt">عدّل الرقم ثم اضغط خارج الخانة للحفظ. اضغط دائرة اللون لتغييره.</div>
  <div class="tblw mt"><table><thead><tr><th>اللون</th>${inv.sizes.map((s, si) => `<th>${esc(s)}<br><button class="btn sm ghost" style="padding:1px 6px;font-size:11px" onclick="delSize(${si})" aria-label="حذف القياس">×</button></th>`).join('')}<th>المجموع</th></tr></thead><tbody>
  ${inv.colors.map((c, ci) => `<tr><td><span class="row" style="gap:6px"><button class="btn sm ghost" style="padding:1px 6px;font-size:11px" onclick="delColor(${ci})" aria-label="حذف اللون">×</button><input type="color" class="tcol" value="${esc(c.hex)}" onchange="invOp({op:'colorHex',name:S.inventory.colors[${ci}].name,hex:this.value})" aria-label="لون ${esc(c.name)}">${esc(c.name)}</span></td>${inv.sizes.map((s, si) => { const q = inv.stock[c.name + '|' + s] || 0; return `<td><input class="qin num ${q <= S.cfg.lowStock ? 'low' : ''}" inputmode="numeric" value="${q}" onchange="setStock(${ci},${si},this)" aria-label="${esc(c.name)} ${esc(s)}"></td>`; }).join('')}<td><b class="num">${inv.sizes.reduce((a, s) => a + (inv.stock[c.name + '|' + s] || 0), 0)}</b></td></tr>`).join('')}</tbody></table></div>
  <div class="g2 mt"><div class="row"><input id="nc" class="in" placeholder="لون جديد"><input id="nch" type="color" class="tcol" value="#888888" aria-label="درجة اللون"><button class="btn sm" onclick="addColor()">إضافة</button></div><div class="row"><input id="ns" class="in" placeholder="قياس جديد"><button class="btn sm" onclick="addSize()">إضافة</button></div></div></div>`;
}
function savePrices() {
  const n = {};
  for (const k of ['cost', 'sale', 'delivery', 'returnFee']) { const v = $('#p_' + k).value.replace(/[^0-9]/g, ''); if (v === '') return toast('أدخل جميع الأسعار', 'bad'); n[k] = +v; }
  if (n.sale < n.cost) toast('تنبيه: سعر البيع أقل من التكلفة', 'bad');
  run(api('/api/settings/price', { method: 'PUT', body: n }), 'تم حفظ الأسعار');
}
const invOp = body => run(api('/api/inventory', { method: 'POST', body }));
function setStock(ci, si, el) { const inv = S.inventory, v = Math.max(0, parseInt(el.value.replace(/[^0-9]/g, '')) || 0); el.value = v; invOp({ op: 'set', key: inv.colors[ci].name + '|' + inv.sizes[si], qty: v }); }
function addColor() { const v = $('#nc').value.trim(); if (!v) return toast('اكتب اسم اللون', 'bad'); run(api('/api/inventory', { method: 'POST', body: { op: 'addColor', name: v, hex: $('#nch').value } }), 'تمت إضافة اللون'); }
function addSize() { const v = $('#ns').value.trim(); if (!v) return toast('اكتب القياس', 'bad'); run(api('/api/inventory', { method: 'POST', body: { op: 'addSize', name: v } }), 'تمت إضافة القياس'); }
function delColor(ci) { const c = S.inventory.colors[ci].name; ASK = () => run(api('/api/inventory', { method: 'POST', body: { op: 'delColor', name: c } }), 'تم الحذف'); confirmSheet(`حذف اللون «${c}»؟`, 'ستُحذف كمياته من المخزون. الطلبات السابقة لن تتأثر.'); }
function delSize(si) { const s = S.inventory.sizes[si]; ASK = () => run(api('/api/inventory', { method: 'POST', body: { op: 'delSize', name: s } }), 'تم الحذف'); confirmSheet(`حذف القياس «${s}»؟`, 'ستُحذف كمياته من المخزون. الطلبات السابقة لن تتأثر.'); }
function confirmSheet(title, text, label) { openSheet(`<h3>${esc(title)}</h3><p class="mut">${esc(text)}</p><div class="g2 mt"><button class="btn bad" onclick="const f=ASK;closeSheet();f()">${label || 'حذف'}</button><button class="btn ghost" onclick="closeSheet()">إلغاء</button></div>`); }

function aMerchants() {
  const ms = S.merchants, pend = ms.filter(m => m.status === 'pending'), rest = ms.filter(m => m.status !== 'pending');
  const due = m => S.orders.filter(o => o.mid === m.id && calc(o).real && !o.settled).reduce((a, o) => a + calc(o).merchant, 0);
  return `<div class="h1" style="margin-bottom:10px">التجار والاشتراكات</div>
  <div class="card"><b class="row" style="gap:6px">${ic('ig', 18)} تفعيل اشتراك عبر إنستغرام</b><div class="mt">
  <div class="field"><label for="aig">معرّف إنستغرام</label><input id="aig" class="in num" placeholder="@store.name" style="text-align:left"></div>
  <div class="field"><label for="anm">اسم المتجر (اختياري)</label><input id="anm" class="in" placeholder="مثال: STORE X"></div>
  <button class="btn" onclick="activateIG($('#aig').value,$('#anm').value)">تفعيل الاشتراك</button>
  <div class="mut xs mt">الاشتراك مفتوح بدون مدة، ويبقى فعّالاً حتى تقوم بإيقافه. إذا لم يكن التاجر قد فتح البوت بعد، يُفعَّل حسابه تلقائياً عند تسجيله بنفس المعرّف.</div></div></div>
  ${pend.length ? `<div class="sec">طلبات تفعيل جديدة <span class="badge b-info">${pend.length}</span></div>${pend.map(m => `<div class="card"><div class="row between"><div><b>${esc(m.name)}</b><div class="mut xs num" style="text-align:right">@${esc(m.ig)}${m.tg_username ? ' — تيليجرام: @' + esc(m.tg_username) : ''}</div></div><span class="mut xs">${ago(m.requested_at || m.created_at)}</span></div><div class="g2 mt"><button class="btn ok sm" style="width:100%" onclick="mStatus(${m.id},'active')">تفعيل</button><button class="btn ghost sm" style="width:100%" onclick="mStatus(${m.id},'rejected')">رفض</button></div></div>`).join('')}` : ''}
  <div class="sec">جميع التجار (${rest.length})</div>
  ${rest.length ? rest.map(m => { const st = mState(m), n = S.orders.filter(o => o.mid === m.id).length; return `<div class="card"><div class="row"><div class="av">${esc((m.name || '?')[0].toUpperCase())}</div><div class="f1"><div class="row between"><b>${esc(m.name)}</b><span class="badge b-${st[1]}">${st[0]}</span></div><div class="mut xs num" style="text-align:right">@${esc(m.ig)}</div></div></div>
   <div class="g3 mt"><div><div class="mut xs">تيليجرام</div><b class="xs">${m.linked ? 'مرتبط ✓' : 'لم يفتح البوت بعد'}</b></div><div><div class="mut xs">الطلبات</div><b class="num">${n}</b></div><div><div class="mut xs">غير مُسوّى</div><b class="xs">${fmt(due(m))}</b></div></div>
   <div class="row mt wrapf">${m.status === 'active' ? `<button class="btn sm ghost" onclick="ASK=()=>mStatus(${m.id},'suspended');confirmSheet('إيقاف ${jsq(m.name)}؟','لن يستطيع تثبيت طلبات جديدة حتى تعيد تفعيله.','إيقاف')">إيقاف</button>` : `<button class="btn sm ok" onclick="mStatus(${m.id},'active')">تفعيل</button>`}<button class="btn sm ghost" onclick="UI.af={g:'all',mid:'${m.id}',q:'',flag:''};go('orders')">طلباته</button><button class="btn sm ghost" onclick="UI.fin.mid='${m.id}';UI.fin.sel={};go('finance')">التسوية</button></div></div>`; }).join('') : '<div class="empty">لا يوجد تجار بعد. فعّل أول تاجر من الأعلى.</div>'}`;
}
function activateIG(ig, name) {
  ig = String(ig || '').trim(); if (!/^@?[a-zA-Z0-9._]{2,30}$/.test(ig)) return toast('اكتب معرّف إنستغرام صحيحاً', 'bad');
  run(api('/api/merchants/activate', { method: 'POST', body: { ig, name } }).then(r => { toast(r.linked ? 'تم التفعيل وإبلاغ التاجر' : 'تم التفعيل. سيُربط الحساب عند فتح التاجر للبوت'); return r; }));
}
const mStatus = (id, st) => run(api(`/api/merchants/${id}/status`, { method: 'POST', body: { status: st } }), { active: 'تم التفعيل', suspended: 'تم الإيقاف', rejected: 'تم رفض الطلب' }[st]);

function aFinFiltered() {
  const f = UI.fin, from = f.from ? +new Date(f.from + 'T00:00') : 0, to = f.to ? +new Date(f.to + 'T23:59:59') : Infinity;
  return S.orders.filter(o => calc(o).real && o.createdAt >= from && o.createdAt <= to && (f.mid === 'all' || o.mid === +f.mid) && (f.set === 'all' || (f.set === 'settled') === !!o.settled));
}
function aFinance() {
  const f = UI.fin, list = aFinFiltered(), selIds = list.filter(o => f.sel[o.id]).map(o => o.id), base = selIds.length ? list.filter(o => f.sel[o.id]) : list;
  const sum = k => base.reduce((a, o) => a + k(o), 0), canSettle = list.some(o => f.sel[o.id] && !o.settled);
  return `<div class="h1" style="margin-bottom:10px">المالية وتسوية الأرباح</div>
  <div class="card"><div class="g2"><div class="field"><label for="ff">من تاريخ</label><input id="ff" type="date" class="in" value="${f.from}" onchange="UI.fin.from=this.value;UI.fin.sel={};render()"></div><div class="field"><label for="ft">إلى تاريخ</label><input id="ft" type="date" class="in" value="${f.to}" onchange="UI.fin.to=this.value;UI.fin.sel={};render()"></div></div>
  <div class="g2"><select class="in" aria-label="التاجر" onchange="UI.fin.mid=this.value;UI.fin.sel={};render()"><option value="all">كل التجار</option>${S.merchants.filter(m => m.status !== 'pending').map(m => `<option value="${m.id}" ${String(f.mid) === String(m.id) ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
  <select class="in" aria-label="حالة التسوية" onchange="UI.fin.set=this.value;UI.fin.sel={};render()"><option value="unsettled" ${f.set === 'unsettled' ? 'selected' : ''}>غير مسوّاة</option><option value="settled" ${f.set === 'settled' ? 'selected' : ''}>مسوّاة</option><option value="all" ${f.set === 'all' ? 'selected' : ''}>الكل</option></select></div>
  <div class="mut xs mt">تشمل التسوية الطلبات المسلّمة والمرتجعة فقط.</div></div>
  <div class="card hero mt"><div class="mut">${selIds.length ? `ملخص ${selIds.length} طلب محدد` : `ملخص ${list.length} طلب`}</div>
  <div class="g2 mt" style="position:relative;z-index:1"><div><div class="mut xs">المبالغ المحصّلة</div><b>${fmt(sum(o => o.status === 'delivered' ? o.total : 0))}</b></div><div><div class="mut xs">أجور التوصيل</div><b>${fmt(sum(o => o.status === 'delivered' ? o.price.delivery : 0))}</b></div><div><div class="mut xs">أرباح الإدارة</div><b>${fmt(sum(o => calc(o).admin))}</b></div><div><div class="mut xs">مستحق للتجار</div><b>${fmt(sum(o => calc(o).merchant))}</b></div></div></div>
  <div class="row mt wrapf"><button class="btn sm ghost" onclick="${selIds.length ? 'UI.fin.sel={}' : `aFinFiltered().forEach(o=>UI.fin.sel[o.id]=1)`};render()">${selIds.length ? 'إلغاء التحديد' : 'تحديد الكل'}</button><button class="btn sm ok" ${canSettle ? '' : 'disabled'} onclick="settle()">تسوية المحدد (${selIds.length})</button><button class="btn sm ghost" onclick="copyText(finCSV())">${ic('copy', 15)} نسخ CSV</button></div>
  <div class="mt">${list.length ? list.map(o => { const c = calc(o); return `<label class="oi"><input type="checkbox" class="ck" ${f.sel[o.id] ? 'checked' : ''} onchange="UI.fin.sel['${jsq(o.id)}']=this.checked?1:0;render()"><div class="f1"><div class="row between"><b class="num">#${esc(o.id)}</b>${badge(o.status)}</div><div class="mut xs">${esc((mer(o.mid) || {}).name || '')} - ${fday(o.createdAt)} - ${c.q} قطعة ${o.settled ? '- مسوّى ' + esc(o.settled) : ''}</div><div class="row between xs"><span>التاجر: <b style="color:${c.merchant < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmt(c.merchant)}</b></span><span>الإدارة: <b>${fmt(c.admin)}</b></span></div></div></label>`; }).join('') : '<div class="empty">لا توجد طلبات ضمن هذه التصفية.</div>'}</div>
  ${(S.settlements || []).length ? `<div class="sec">سجل التسويات</div>${S.settlements.slice(0, 15).map(s => `<div class="card"><div class="row between"><b class="num">${esc(s.code)}</b><span class="mut xs">${fdate(s.at)}</span></div><div class="mut xs">${s.count} طلب - ${esc(s.names)}</div><div class="row between mt"><span>للتجار: <b>${fmt(s.merchantAmt)}</b></span><span>للإدارة: <b>${fmt(s.adminAmt)}</b></span></div></div>`).join('')}` : ''}`;
}
function settle() {
  const f = UI.fin, os = aFinFiltered().filter(o => f.sel[o.id] && !o.settled); if (!os.length) return;
  const mA = os.reduce((a, o) => a + calc(o).merchant, 0), aA = os.reduce((a, o) => a + calc(o).admin, 0), names = [...new Set(os.map(o => (mer(o.mid) || {}).name))].join('، ');
  openSheet(`<h3>تأكيد التسوية</h3><div class="kv"><span>عدد الطلبات</span><b class="num">${os.length}</b></div><div class="kv"><span>التجار</span><span>${esc(names)}</span></div><div class="kv tot"><span>المبلغ المستحق للتجار</span><span>${fmt(mA)}</span></div><div class="kv"><span>أرباح الإدارة</span><span>${fmt(aA)}</span></div><div class="g2 mt"><button class="btn ok" onclick="doSettle()">تأكيد التسوية</button><button class="btn ghost" onclick="closeSheet()">إلغاء</button></div>`);
}
async function doSettle() {
  const codes = aFinFiltered().filter(o => UI.fin.sel[o.id] && !o.settled).map(o => o.id);
  closeSheet();
  const r = await run(api('/api/settle', { method: 'POST', body: { codes } }));
  if (r) { UI.fin.sel = {}; toast('تمت التسوية ✓ ' + r.code); render(); }
}
function finCSV() {
  const f = UI.fin, l = aFinFiltered(), b = l.some(o => f.sel[o.id]) ? l.filter(o => f.sel[o.id]) : l;
  return ['رقم الطلب,التاجر,التاريخ,الحالة,القطع,المبلغ,التوصيل,ربح التاجر,ربح الإدارة,التسوية'].concat(b.map(o => { const c = calc(o); return [o.id, (mer(o.mid) || {}).name, fday(o.createdAt), ST[o.status].t, c.q, o.total, o.price.delivery, c.merchant, c.admin, o.settled || 'لا'].join(','); })).join('\n');
}

function aSettings() {
  const c = S.cfg, n = S.prefs.notif || {};
  const inp = (k, t, suf) => `<div class="field"><label for="c_${k}">${t}</label><div class="row"><input id="c_${k}" class="in num" inputmode="numeric" value="${c[k]}" style="text-align:left"><span class="mut xs" style="white-space:nowrap">${suf}</span></div></div>`;
  return `<div class="h1" style="margin-bottom:10px">الإعدادات</div>
  <div class="sec">إشعارات الإدارة</div><div class="card"><div class="mut xs" style="margin-bottom:4px">اختر التنبيهات التي يرسلها لك البوت</div>${ANOTIF.map(([k, t]) => `<div class="li"><span class="f1">${t}</span>${sw(n[k] !== false, `setNotif('${k}',this.checked)`)}</div>`).join('')}</div>
  <div class="sec">حدود التنبيه</div><div class="card"><div class="g2">${inp('lowStock', 'مخزون منخفض عند', 'قطعة أو أقل')}${inp('lateDays', 'الطلب متأخر بعد', 'يوم')}</div>${inp('highAmt', 'مبلغ تحصيل مرتفع من', 'د.ع')}<button class="btn" onclick="saveCfg()">حفظ الحدود</button></div>
  ${themeCard()}`;
}
function saveCfg() {
  const b = {}; for (const k of ['lowStock', 'lateDays', 'highAmt']) { const v = $('#c_' + k).value.replace(/[^0-9]/g, ''); if (v === '') return toast('أدخل جميع القيم', 'bad'); b[k] = +v; }
  run(api('/api/settings/cfg', { method: 'PUT', body: b }), 'تم الحفظ');
}

/* ---------- العرض ---------- */
function render() {
  if (!S) return;
  const app = $('#app');
  if (S.me.admin) app.innerHTML = adminView();
  else { const m = curM(); app.innerHTML = (m && m.status === 'active') ? merchantView() : lockScreen(m); }
  tgBack();
}

(async function init() {
  if (tg) { try { tg.ready(); tg.expand(); tg.BackButton.onClick(goBack); if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {} }
  else if (!DEV_AS) { /* خارج تيليجرام: الخادم سيرد برسالة توضيحية */ }
  await reload();
  const oc = QS.get('order');
  if (oc && S && byId(oc)) openOrder(oc);
  setInterval(() => { if (!document.hidden) reload(true); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) reload(true); });
})();

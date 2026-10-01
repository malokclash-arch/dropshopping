// DropShop — الخادم الرئيسي
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { db, getS, setS, getPrefs, setPrefs, UPLOAD_DIR } = require('./db');
const { verifyInitData } = require('./auth');
const bot = require('./bot');

const PORT = Number(process.env.PORT) || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const DEV_MODE = process.env.DEV_MODE === 'true';
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const ORDERS_CHAT_ID = (process.env.ORDERS_CHAT_ID || '').trim();
const D = 864e5;

if (!BOT_TOKEN && !DEV_MODE) { console.error('❌ BOT_TOKEN غير موجود في ملف .env'); process.exit(1); }
if (!ADMIN_IDS.length) console.warn('⚠️ ADMIN_IDS فارغ — لن يستطيع أحد دخول لوحة الإدارة');

const GOVS = ['بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء', 'بابل', 'ذي قار', 'الأنبار', 'ديالى', 'كركوك', 'صلاح الدين', 'واسط', 'ميسان', 'المثنى', 'القادسية', 'دهوك', 'السليمانية', 'حلبجة'];
const STATUSES = ['new', 'accepted', 'production', 'ready', 'shipping', 'delivered', 'returned', 'rejected'];
const ACTIVE = ['new', 'accepted', 'production', 'ready', 'shipping'];
const MSG = {
  accepted: '✅ تم قبول طلبك', production: '🖨️ بدأ إنتاج طلبك', ready: '📦 تم تجهيز طلبك',
  shipping: '🚚 طلبك خرج للتوصيل', delivered: '🎉 تم تسليم طلبك', returned: '↩️ طلبك مرتجع',
  rejected: '❌ تم رفض طلبك', new: 'طلبك أصبح بحالة جديد'
};
const MERCHANT_KEYS = ['new', 'accepted', 'production', 'ready', 'shipping', 'delivered', 'returned', 'rejected'];
const ADMIN_KEYS = ['newOrder', 'lowStock', 'late', 'subReq', 'highAmt', 'problem'];

/* ---------- أدوات ---------- */
const fmtT = n => Math.round(n || 0).toLocaleString('en-US') + ' د.ع';
function bad(msg, status = 400) { const e = new Error(msg); e.status = status; e.expose = true; throw e; }
function str(v, min, max, label) {
  const s = String(v ?? '').trim();
  if (s.length < min) bad(`${label} مطلوب`);
  if (s.length > max) bad(`${label} طويل جداً`);
  return s;
}
function normIg(v) {
  const ig = String(v || '').trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9._]{2,30}$/.test(ig)) bad('اكتب معرّف إنستغرام صحيحاً، مثل: my.store');
  return ig;
}
const isUp = u => typeof u === 'string' && /^\/uploads\/[a-f0-9]{24}\.[a-z0-9]{1,5}$/.test(u) && fs.existsSync(path.join(UPLOAD_DIR, path.basename(u)));
const mById = id => db.prepare('SELECT * FROM merchants WHERE id=?').get(id);
const pubM = m => m && ({
  id: m.id, name: m.name, ig: m.ig, status: m.status, linked: !!m.tg_id, tg_username: m.tg_username || '',
  created_at: m.created_at, activated_at: m.activated_at, requested_at: m.requested_at
});

function calc(o) {
  const q = o.prints.reduce((a, p) => a + p.qty, 0), p = o.price;
  let m = o.total - p.delivery - q * p.sale, a = q * (p.sale - p.cost), real = false;
  if (o.status === 'delivered') real = true;
  else if (o.status === 'returned') { m = -p.returnFee; a = p.returnFee - q * p.cost; real = true; }
  else if (o.status === 'rejected') { m = 0; a = 0; }
  return { q, merchant: m, admin: a, real };
}

function loadOrders(where, params, hideCost) {
  const sub = `SELECT id FROM orders ${where} ORDER BY id DESC LIMIT 3000`;
  const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY id DESC LIMIT 3000`).all(...params);
  if (!rows.length) return [];
  const P = {}, H = {};
  db.prepare(`SELECT * FROM prints WHERE order_id IN (${sub}) ORDER BY idx`).all(...params)
    .forEach(p => (P[p.order_id] = P[p.order_id] || []).push({ color: p.color, size: p.size, qty: p.qty, mockups: JSON.parse(p.mockups), files: JSON.parse(p.files) }));
  db.prepare(`SELECT * FROM history WHERE order_id IN (${sub}) ORDER BY at, id`).all(...params)
    .forEach(h => (H[h.order_id] = H[h.order_id] || []).push({ s: h.status, at: h.at, note: h.note || '' }));
  return rows.map(r => {
    const price = JSON.parse(r.price);
    if (hideCost) delete price.cost;
    return {
      id: r.code, mid: r.merchant_id,
      customer: { name: r.cust_name, phone: r.phone, gov: r.gov, addr: r.addr },
      total: r.total, note: r.note || '', prints: P[r.id] || [], status: r.status, history: H[r.id] || [],
      createdAt: r.created_at, price, settled: r.settlement || null, problem: r.problem ? JSON.parse(r.problem) : null
    };
  });
}
const orderByCode = code => loadOrders('WHERE code=?', [code])[0] || null;

/* ---------- الإشعارات ---------- */
function pushNotif(tg, key, text, code) {
  const p = getPrefs(tg);
  if (key !== 'system' && p.notif[key] === false) return;
  db.prepare('INSERT INTO notifications(to_tg,text,order_code,at) VALUES(?,?,?,?)').run(String(tg), text, code || null, Date.now());
  bot.send(tg, text, code ? 'order=' + encodeURIComponent(code) : '');
}
const notifyAdmins = (key, text, code) => ADMIN_IDS.forEach(id => pushNotif(id, key, '🔔 ' + text, code));
const notifyMerchant = (m, key, text, code) => { if (m && m.tg_id) pushNotif(m.tg_id, key, text, code); };
const mark = key => db.prepare('INSERT OR IGNORE INTO alerted(key,at) VALUES(?,?)').run(key, Date.now()).changes > 0;

function runChecks() {
  try {
    const cfg = getS('cfg'), now = Date.now();
    db.prepare(`SELECT code,created_at FROM orders WHERE status IN ('new','accepted','production','ready','shipping') AND created_at<?`)
      .all(now - cfg.lateDays * D)
      .forEach(o => { if (mark('late:' + o.code)) notifyAdmins('late', `⏰ الطلب ${o.code} متأخر منذ ${Math.floor((now - o.created_at) / D)} أيام`, o.code); });
    // المخزون المنخفض: رسالة واحدة مجمّعة بدل رسالة لكل صنف
    const inv = getS('inventory'), fresh = [];
    for (const [k, q] of Object.entries(inv.stock)) {
      const key = 'low:' + k;
      if (q <= cfg.lowStock) { if (mark(key)) fresh.push(`${k.replace('|', ' / ')}: ${q}`); }
      else db.prepare('DELETE FROM alerted WHERE key=?').run(key);
    }
    if (fresh.length) notifyAdmins('lowStock', fresh.length === 1 ? `📉 مخزون منخفض — ${fresh[0]}` :
      `📉 مخزون منخفض في ${fresh.length} صنف:\n` + fresh.slice(0, 30).join('\n') + (fresh.length > 30 ? `\n… و${fresh.length - 30} صنف آخر` : ''));
  } catch (e) { console.error('checks', e); }
}

async function sendOrderToChat(code) {
  if (!ORDERS_CHAT_ID) return;
  const o = orderByCode(code); if (!o) return;
  const m = mById(o.mid) || {};
  await bot.call('sendMessage', {
    chat_id: ORDERS_CHAT_ID,
    text: `🆕 طلب جديد ${o.id}\nالتاجر: ${m.name}\nالزبون: ${o.customer.name} — ${o.customer.phone}\nالعنوان: ${o.customer.gov} - ${o.customer.addr}\n` +
      o.prints.map((p, i) => `الطبعة ${i + 1}: ${p.color} / ${p.size} × ${p.qty}`).join('\n') +
      `\nالمبلغ مع التوصيل: ${fmtT(o.total)}${o.note ? '\nملاحظات: ' + o.note : ''}`
  });
  for (const [i, p] of o.prints.entries()) {
    for (const u of p.mockups) await bot.sendFile(ORDERS_CHAT_ID, path.join(UPLOAD_DIR, path.basename(u)), path.basename(u), `${o.id} — موكاب الطبعة ${i + 1} (${p.color} / ${p.size} × ${p.qty})`, true);
    for (const f of p.files) await bot.sendFile(ORDERS_CHAT_ID, path.join(UPLOAD_DIR, path.basename(f.url)), `${o.id}-print${i + 1}-${f.name}`, `${o.id} — ملف طباعة الطبعة ${i + 1}`, false);
  }
}

/* ---------- التطبيق ---------- */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', index: false }));
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));
app.get('/health', (req, res) => res.json({ ok: true }));

const h = fn => async (req, res) => {
  try { const r = await fn(req, res); if (!res.headersSent) res.json(r || { ok: true }); }
  catch (e) {
    if (!e.expose) console.error(e);
    res.status(e.status || 500).json({ error: e.expose ? e.message : 'حدث خطأ في الخادم، حاول مرة أخرى' });
  }
};

function auth(req, res, next) {
  let user = null;
  const init = req.get('X-Init-Data');
  if (init) user = verifyInitData(init, BOT_TOKEN);
  else if (DEV_MODE && req.get('X-Dev-User')) user = { id: req.get('X-Dev-User'), first_name: 'Dev' };
  if (!user || !user.id) return res.status(401).json({ error: 'افتح التطبيق من داخل بوت تيليجرام' });
  req.tg = String(user.id);
  req.tgUser = user;
  req.isAdmin = ADMIN_IDS.includes(req.tg);
  req.merchant = db.prepare('SELECT * FROM merchants WHERE tg_id=?').get(req.tg) || null;
  next();
}
const adminOnly = (req, res, next) => req.isAdmin ? next() : res.status(403).json({ error: 'هذه العملية للإدارة فقط' });
const merchantOnly = (req, res, next) => (req.merchant && req.merchant.status === 'active') ? next() : res.status(403).json({ error: 'اشتراكك غير مفعّل' });

/* --- البيانات الأولية --- */
app.get('/api/bootstrap', auth, h(req => {
  const out = {
    me: { tg: req.tg, name: req.tgUser.first_name || '', username: req.tgUser.username || '', admin: req.isAdmin, merchant: pubM(req.merchant) },
    prefs: getPrefs(req.tg), govs: GOVS
  };
  if (req.isAdmin) {
    Object.assign(out, {
      price: getS('price'), cfg: getS('cfg'), inventory: getS('inventory'),
      orders: loadOrders('', []),
      merchants: db.prepare('SELECT * FROM merchants ORDER BY id DESC').all().map(pubM),
      settlements: db.prepare('SELECT * FROM settlements ORDER BY id DESC LIMIT 100').all()
        .map(s => ({ code: s.code, at: s.at, merchantAmt: s.merchant_amt, adminAmt: s.admin_amt, count: JSON.parse(s.orders).length, names: s.names }))
    });
  } else if (req.merchant && req.merchant.status === 'active') {
    const p = getS('price'), mid = String(req.merchant.id);
    Object.assign(out, {
      price: { sale: p.sale, delivery: p.delivery, returnFee: p.returnFee },
      inventory: getS('inventory'), cfg: { lateDays: getS('cfg').lateDays },
      orders: loadOrders('WHERE merchant_id=?', [req.merchant.id], true),
      settlements: db.prepare('SELECT * FROM settlements ORDER BY id DESC LIMIT 300').all()
        .map(s => { const b = JSON.parse(s.breakdown || '{}')[mid]; return b && { code: s.code, at: s.at, amt: b.amt, count: b.count }; })
        .filter(Boolean)
    });
  }
  out.notifs = db.prepare('SELECT id,text,order_code AS code,at,read FROM notifications WHERE to_tg=? ORDER BY id DESC LIMIT 100').all(req.tg);
  return out;
}));

/* --- التفضيلات: الألوان والإشعارات --- */
app.put('/api/prefs', auth, h(req => {
  const cur = getPrefs(req.tg), b = req.body || {};
  if (b.theme && typeof b.theme === 'object') {
    const t = {}, hex = v => /^#[0-9a-f]{6}$/i.test(v);
    if (hex(b.theme.accent)) t.accent = b.theme.accent;
    if (hex(b.theme.accent2)) t.accent2 = b.theme.accent2;
    if (['auto', 'dark', 'light'].includes(b.theme.mode)) t.mode = b.theme.mode;
    if (['navy', 'black', 'slate'].includes(b.theme.bg)) t.bg = b.theme.bg;
    cur.theme = t;
  }
  if (b.notif && typeof b.notif === 'object') {
    const keys = req.isAdmin ? ADMIN_KEYS : MERCHANT_KEYS;
    keys.forEach(k => { if (typeof b.notif[k] === 'boolean') cur.notif[k] = b.notif[k]; });
  }
  setPrefs(req.tg, cur);
  return { prefs: cur };
}));

app.post('/api/notifications/read', auth, h(req => {
  db.prepare('UPDATE notifications SET read=1 WHERE to_tg=? AND read=0').run(req.tg);
}));

/* --- تسجيل التاجر وطلب التفعيل --- */
app.post('/api/register', auth, h(req => {
  if (req.isAdmin) bad('حساب الإدارة لا يحتاج تسجيلاً');
  const ig = normIg(req.body.ig), name = str(req.body.name, 2, 60, 'اسم المتجر'), now = Date.now();
  const me = req.merchant, uname = req.tgUser.username || '';
  if (me && me.status === 'suspended') bad('حسابك موقوف، تواصل مع الإدارة', 403);
  if (me && me.status === 'active') return { ok: true };
  const ex = db.prepare('SELECT * FROM merchants WHERE ig=?').get(ig);
  if (ex && ex.tg_id && ex.tg_id !== req.tg) bad('هذا المعرّف مرتبط بحساب تيليجرام آخر');

  if (ex && !ex.tg_id) {
    // معرّف أضافته الإدارة مسبقاً: نربطه بهذا الحساب
    db.transaction(() => {
      if (me) {
        if (db.prepare('SELECT COUNT(*) c FROM orders WHERE merchant_id=?').get(me.id).c) bad('لا يمكن تغيير المعرّف، تواصل مع الإدارة');
        db.prepare('DELETE FROM merchants WHERE id=?').run(me.id);
      }
      db.prepare(`UPDATE merchants SET tg_id=?, tg_username=?, name=CASE WHEN name='' OR name=ig THEN ? ELSE name END,
        status=CASE WHEN status='active' THEN 'active' ELSE 'pending' END, requested_at=? WHERE id=?`).run(req.tg, uname, name, now, ex.id);
    })();
    const m = mById(ex.id);
    if (m.status === 'active') { notifyMerchant(m, 'system', '✅ تم تفعيل حسابك في DropShop. يمكنك الآن تثبيت الطلبات.'); return { ok: true, active: true }; }
  } else if (me) {
    db.prepare(`UPDATE merchants SET ig=?, name=?, tg_username=?, status='pending', requested_at=? WHERE id=?`).run(ig, name, uname, now, me.id);
  } else {
    db.prepare(`INSERT INTO merchants(tg_id,tg_username,name,ig,status,created_at,requested_at) VALUES(?,?,?,?,'pending',?,?)`).run(req.tg, uname, name, ig, now, now);
  }
  notifyAdmins('subReq', `طلب اشتراك جديد: ${name} (@${ig})`);
  return { ok: true };
}));

/* --- رفع الصور والملفات --- */
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/heic': '.heic', 'image/heif': '.heif', 'image/tiff': '.tif', 'application/pdf': '.pdf' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + (EXT[f.mimetype] || '.bin'))
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (req, f, cb) => cb(null, !!EXT[f.mimetype])
});
app.post('/api/upload', auth, merchantOnly, (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'الحد الأقصى لحجم الملف 25MB' : 'تعذر رفع الملف' });
    if (!req.file) return res.status(400).json({ error: 'صيغة الملف غير مدعومة. استخدم PNG أو JPG أو WEBP أو PDF' });
    res.json({ url: '/uploads/' + req.file.filename, mime: req.file.mimetype, size: req.file.size });
  });
});

/* --- الطلبات --- */
app.post('/api/orders', auth, merchantOnly, h(req => {
  const b = req.body || {}, c = b.customer || {}, inv = getS('inventory');
  const name = str(c.name, 3, 80, 'اسم الزبون');
  const phone = String(c.phone || '').replace(/\s/g, '');
  if (!/^07\d{9}$/.test(phone)) bad('رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقماً');
  if (!GOVS.includes(c.gov)) bad('اختر المحافظة');
  const addr = str(c.addr, 5, 300, 'العنوان');
  const total = Math.round(Number(b.total));
  if (!(total > 0 && total < 1e9)) bad('السعر غير صحيح');
  const note = String(b.note || '').trim().slice(0, 300);
  const prints = Array.isArray(b.prints) ? b.prints : [];
  if (!prints.length || prints.length > 10) bad('عدد الطبعات يجب أن يكون بين 1 و 10');
  const need = {};
  const clean = prints.map((p, i) => {
    const n = `الطبعة ${i + 1}: `;
    if (!inv.colors.some(x => x.name === p.color)) bad(n + 'اللون غير متوفر');
    if (!inv.sizes.includes(p.size)) bad(n + 'القياس غير متوفر');
    const qty = Math.round(Number(p.qty));
    if (!(qty >= 1 && qty <= 50)) bad(n + 'عدد القطع غير صحيح');
    const mk = (p.mockups || []).filter(isUp).slice(0, 2);
    if (!mk.length) bad(n + 'ارفع صورة موكاب واحدة على الأقل');
    const fl = (p.files || []).filter(f => f && isUp(f.url)).slice(0, 2)
      .map(f => ({ url: f.url, name: String(f.name || 'print').slice(0, 120), mime: String(f.mime || '').slice(0, 60) }));
    if (!fl.length) bad(n + 'ارفع ملف طباعة واحداً على الأقل');
    const k = p.color + '|' + p.size; need[k] = (need[k] || 0) + qty;
    return { color: p.color, size: p.size, qty, mockups: mk, files: fl };
  });
  for (const [k, q] of Object.entries(need)) if ((inv.stock[k] || 0) < q) bad(`الكمية غير متوفرة: ${k.replace('|', ' / ')} (المتوفر ${inv.stock[k] || 0})`);

  const now = Date.now(), price = getS('price'), m = req.merchant;
  const code = db.transaction(() => {
    const r = db.prepare(`INSERT INTO orders(merchant_id,cust_name,phone,gov,addr,total,note,status,price,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,'new',?,?,?)`).run(m.id, name, phone, c.gov, addr, total, note, JSON.stringify(price), now, now);
    const id = Number(r.lastInsertRowid), code = 'DR-' + (1000 + id);
    db.prepare('UPDATE orders SET code=? WHERE id=?').run(code, id);
    const ip = db.prepare('INSERT INTO prints(order_id,idx,color,size,qty,mockups,files) VALUES(?,?,?,?,?,?,?)');
    clean.forEach((p, i) => ip.run(id, i, p.color, p.size, p.qty, JSON.stringify(p.mockups), JSON.stringify(p.files)));
    db.prepare('INSERT INTO history(order_id,status,note,at) VALUES(?,?,?,?)').run(id, 'new', '', now);
    return code;
  })();
  notifyMerchant(m, 'new', `🆕 تم تثبيت الطلب ${code} بنجاح — ${fmtT(total)}`, code);
  notifyAdmins('newOrder', `طلب جديد ${code} من ${m.name} — ${fmtT(total)}`, code);
  if (total >= getS('cfg').highAmt) notifyAdmins('highAmt', `💰 مبلغ تحصيل مرتفع ${fmtT(total)} في الطلب ${code}`, code);
  sendOrderToChat(code).catch(e => console.warn('orders chat', e.message));
  return { code };
}));

app.post('/api/orders/:code/status', auth, h(req => {
  const st = req.body.status, note = String(req.body.note || '').trim().slice(0, 300);
  if (!STATUSES.includes(st)) bad('حالة غير صحيحة');
  const row = db.prepare('SELECT * FROM orders WHERE code=?').get(req.params.code);
  if (!row) bad('الطلب غير موجود', 404);
  const byMerchant = !req.isAdmin;
  if (byMerchant) {
    if (!req.merchant || req.merchant.id !== row.merchant_id || req.merchant.status !== 'active') bad('غير مسموح', 403);
    if (!(row.status === 'new' && st === 'rejected')) bad('يمكنك إلغاء الطلب فقط عندما يكون بحالة «جديد»');
  }
  if (row.settlement) bad('لا يمكن تغيير حالة طلب تمت تسويته');
  if (row.status === st) return { ok: true };

  db.transaction(() => {
    const inv = getS('inventory');
    const prints = db.prepare('SELECT * FROM prints WHERE order_id=?').all(row.id);
    let taken = row.stock_taken;
    if (!taken && ['accepted', 'production', 'ready', 'shipping', 'delivered'].includes(st)) {
      const need = {};
      prints.forEach(p => { const k = p.color + '|' + p.size; need[k] = (need[k] || 0) + p.qty; });
      for (const [k, q] of Object.entries(need)) if ((inv.stock[k] || 0) < q) bad(`المخزون غير كافٍ: ${k.replace('|', ' / ')} (المتوفر ${inv.stock[k] || 0})`);
      for (const [k, q] of Object.entries(need)) inv.stock[k] -= q;
      taken = 1; setS('inventory', inv);
    }
    if (taken && st === 'rejected' && ['accepted', 'production', 'ready'].includes(row.status)) {
      prints.forEach(p => { const k = p.color + '|' + p.size; inv.stock[k] = (inv.stock[k] || 0) + p.qty; });
      taken = 0; setS('inventory', inv);
    }
    db.prepare('UPDATE orders SET status=?, stock_taken=?, updated_at=? WHERE id=?').run(st, taken, Date.now(), row.id);
    db.prepare('DELETE FROM history WHERE order_id=? AND status=?').run(row.id, st);
    db.prepare('INSERT INTO history(order_id,status,note,at) VALUES(?,?,?,?)').run(row.id, st, note, Date.now());
  })();
  if (!byMerchant) notifyMerchant(mById(row.merchant_id), st, `${MSG[st]} ${row.code}${note ? ' — ' + note : ''}`, row.code);
  runChecks();
  return { ok: true };
}));

app.post('/api/orders/:code/problem', auth, merchantOnly, h(req => {
  const text = str(req.body.text, 3, 500, 'وصف المشكلة');
  const row = db.prepare('SELECT * FROM orders WHERE code=? AND merchant_id=?').get(req.params.code, req.merchant.id);
  if (!row) bad('الطلب غير موجود', 404);
  db.prepare('UPDATE orders SET problem=?, updated_at=? WHERE id=?').run(JSON.stringify({ text, at: Date.now(), resolved: false }), Date.now(), row.id);
  notifyAdmins('problem', `⚠️ مشكلة في الطلب ${row.code}: ${text}`, row.code);
}));

app.post('/api/orders/:code/resolve', auth, adminOnly, h(req => {
  const reply = str(req.body.reply, 2, 500, 'الرد');
  const row = db.prepare('SELECT * FROM orders WHERE code=?').get(req.params.code);
  if (!row || !row.problem) bad('لا توجد مشكلة لهذا الطلب', 404);
  const p = JSON.parse(row.problem); p.resolved = true; p.reply = reply; p.resolvedAt = Date.now();
  db.prepare('UPDATE orders SET problem=? WHERE id=?').run(JSON.stringify(p), row.id);
  notifyMerchant(mById(row.merchant_id), 'system', `✅ تم حل مشكلة الطلب ${row.code}: ${reply}`, row.code);
}));

/* --- الأسعار والإعدادات والمخزون (إدارة) --- */
app.put('/api/settings/price', auth, adminOnly, h(req => {
  const n = {};
  for (const k of ['cost', 'sale', 'delivery', 'returnFee']) {
    const v = Math.round(Number(req.body[k]));
    if (!(v >= 0 && v < 1e9)) bad('أدخل أرقاماً صحيحة للأسعار');
    n[k] = v;
  }
  setS('price', n); return { price: n };
}));
app.put('/api/settings/cfg', auth, adminOnly, h(req => {
  const c = getS('cfg');
  for (const k of ['lowStock', 'lateDays', 'highAmt']) if (req.body[k] !== undefined) {
    const v = Math.round(Number(req.body[k])); if (!(v >= 0 && v < 1e9)) bad('قيمة غير صحيحة'); c[k] = v;
  }
  setS('cfg', c); runChecks(); return { cfg: c };
}));
app.post('/api/inventory', auth, adminOnly, h(req => {
  const b = req.body || {}, inv = getS('inventory'), hex = v => /^#[0-9a-f]{6}$/i.test(v);
  switch (b.op) {
    case 'set': {
      const k = String(b.key); if (!(k in inv.stock)) bad('الصنف غير موجود');
      inv.stock[k] = Math.max(0, Math.min(1e6, Math.round(Number(b.qty)) || 0)); break;
    }
    case 'addColor': {
      const n = str(b.name, 1, 30, 'اسم اللون').replace(/\|/g, '');
      if (inv.colors.some(c => c.name === n)) bad('هذا اللون موجود');
      inv.colors.push({ name: n, hex: hex(b.hex) ? b.hex : '#888888' });
      inv.sizes.forEach(s => { inv.stock[n + '|' + s] = 0; }); break;
    }
    case 'colorHex': { const c = inv.colors.find(c => c.name === b.name); if (c && hex(b.hex)) c.hex = b.hex; break; }
    case 'delColor': {
      inv.colors = inv.colors.filter(c => c.name !== b.name);
      for (const k of Object.keys(inv.stock)) if (k.startsWith(b.name + '|')) delete inv.stock[k]; break;
    }
    case 'addSize': {
      const n = str(b.name, 1, 10, 'القياس').replace(/\|/g, '').toUpperCase();
      if (inv.sizes.includes(n)) bad('هذا القياس موجود');
      inv.sizes.push(n); inv.colors.forEach(c => { inv.stock[c.name + '|' + n] = 0; }); break;
    }
    case 'delSize': {
      inv.sizes = inv.sizes.filter(s => s !== b.name);
      for (const k of Object.keys(inv.stock)) if (k.endsWith('|' + b.name)) delete inv.stock[k]; break;
    }
    default: bad('عملية غير معروفة');
  }
  setS('inventory', inv); runChecks(); return { inventory: inv };
}));

/* --- التجار والاشتراكات (إدارة) — الاشتراك مفتوح بلا مدة --- */
app.post('/api/merchants/activate', auth, adminOnly, h(req => {
  const ig = normIg(req.body.ig), name = String(req.body.name || '').trim().slice(0, 60), now = Date.now();
  const ex = db.prepare('SELECT * FROM merchants WHERE ig=?').get(ig);
  if (ex) db.prepare(`UPDATE merchants SET status='active', activated_at=?, name=CASE WHEN ?<>'' THEN ? ELSE name END WHERE id=?`).run(now, name, name, ex.id);
  else db.prepare(`INSERT INTO merchants(name,ig,status,created_at,activated_at) VALUES(?,?,'active',?,?)`).run(name || ig, ig, now, now);
  const m = db.prepare('SELECT * FROM merchants WHERE ig=?').get(ig);
  notifyMerchant(m, 'system', '✅ تم تفعيل اشتراكك في DropShop. يمكنك الآن تثبيت الطلبات.');
  return { ok: true, linked: !!m.tg_id };
}));
app.post('/api/merchants/:id/status', auth, adminOnly, h(req => {
  const st = req.body.status;
  if (!['active', 'suspended', 'rejected'].includes(st)) bad('حالة غير صحيحة');
  const m = mById(Number(req.params.id)); if (!m) bad('التاجر غير موجود', 404);
  db.prepare('UPDATE merchants SET status=?, activated_at=CASE WHEN ?=\'active\' THEN ? ELSE activated_at END WHERE id=?').run(st, st, Date.now(), m.id);
  const txt = { active: '✅ تم تفعيل اشتراكك في DropShop.', suspended: '⛔ تم إيقاف حسابك مؤقتاً. تواصل مع الإدارة.', rejected: 'لم تتم الموافقة على طلب الاشتراك. تواصل مع الإدارة للتفاصيل.' }[st];
  notifyMerchant(m, 'system', txt);
}));

/* --- التسويات المالية (إدارة) --- */
app.post('/api/settle', auth, adminOnly, h(req => {
  const codes = Array.isArray(req.body.codes) ? req.body.codes.map(String).slice(0, 2000) : [];
  const os = codes.map(orderByCode).filter(o => o && !o.settled && calc(o).real);
  if (!os.length) bad('لا توجد طلبات قابلة للتسوية (المسلّمة أو المرتجعة وغير المسوّاة فقط)');
  const br = {}; let mA = 0, aA = 0;
  os.forEach(o => { const c = calc(o); mA += c.merchant; aA += c.admin; const x = br[o.mid] = br[o.mid] || { count: 0, amt: 0 }; x.count++; x.amt += c.merchant; });
  const names = Object.keys(br).map(id => (mById(Number(id)) || {}).name).join('، ');
  const code = db.transaction(() => {
    const r = db.prepare('INSERT INTO settlements(at,merchant_amt,admin_amt,orders,breakdown,names) VALUES(?,?,?,?,?,?)')
      .run(Date.now(), mA, aA, JSON.stringify(os.map(o => o.id)), JSON.stringify(br), names);
    const code = 'ST-' + String(r.lastInsertRowid).padStart(4, '0');
    db.prepare('UPDATE settlements SET code=? WHERE id=?').run(code, r.lastInsertRowid);
    const u = db.prepare('UPDATE orders SET settlement=? WHERE code=?');
    os.forEach(o => u.run(code, o.id));
    return code;
  })();
  Object.entries(br).forEach(([id, x]) => notifyMerchant(mById(Number(id)), 'system', `💰 تمت تسوية ${x.count} طلب بمبلغ ${fmtT(x.amt)} (${code})`));
  return { code };
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'غير موجود' }));

app.listen(PORT, () => {
  console.log(`✅ DropShop يعمل على المنفذ ${PORT}${DEV_MODE ? ' (وضع التجربة)' : ''}`);
  bot.start();
  runChecks();
  setInterval(runChecks, 30 * 60 * 1000);
});

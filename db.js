// قاعدة البيانات (SQLite) — ملف واحد داخل مجلد DATA_DIR
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'dropshop.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prefs(tg_id TEXT PRIMARY KEY, data TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS merchants(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id TEXT UNIQUE,
  tg_username TEXT,
  name TEXT NOT NULL DEFAULT '',
  ig TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | active | suspended | rejected
  created_at INTEGER NOT NULL,
  activated_at INTEGER,
  requested_at INTEGER
);
CREATE TABLE IF NOT EXISTS orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  cust_name TEXT, phone TEXT, gov TEXT, addr TEXT,
  total INTEGER NOT NULL, note TEXT,
  status TEXT NOT NULL,
  price TEXT NOT NULL,                          -- نسخة من الأسعار وقت إنشاء الطلب
  stock_taken INTEGER NOT NULL DEFAULT 0,
  settlement TEXT,                              -- رمز التسوية إن تمت
  problem TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS prints(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  idx INTEGER, color TEXT, size TEXT, qty INTEGER,
  mockups TEXT, files TEXT
);
CREATE TABLE IF NOT EXISTS history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT, note TEXT, at INTEGER
);
CREATE TABLE IF NOT EXISTS settlements(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT, at INTEGER,
  merchant_amt INTEGER, admin_amt INTEGER,
  orders TEXT, breakdown TEXT, names TEXT
);
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_tg TEXT NOT NULL, text TEXT, order_code TEXT,
  at INTEGER, read INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS alerted(key TEXT PRIMARY KEY, at INTEGER);
CREATE INDEX IF NOT EXISTS ix_notif ON notifications(to_tg, at);
CREATE INDEX IF NOT EXISTS ix_orders_m ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS ix_prints_o ON prints(order_id);
CREATE INDEX IF NOT EXISTS ix_hist_o ON history(order_id);
`);

const DEF = {
  price: { cost: 9000, sale: 15000, delivery: 5000, returnFee: 5000 },
  cfg: { lowStock: 5, lateDays: 3, highAmt: 100000 },
  inventory: {
    colors: [
      { name: 'أسود', hex: '#16181d' }, { name: 'أبيض', hex: '#f5f5f5' },
      { name: 'رمادي', hex: '#8d939c' }, { name: 'بيج', hex: '#d9c7a7' }, { name: 'كحلي', hex: '#1d2a4f' }
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    stock: {}
  }
};
DEF.inventory.colors.forEach(c => DEF.inventory.sizes.forEach(s => { DEF.inventory.stock[c.name + '|' + s] = 0; }));

function getS(k) {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(k);
  return r ? JSON.parse(r.value) : JSON.parse(JSON.stringify(DEF[k]));
}
function setS(k, v) {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, JSON.stringify(v));
}
function getPrefs(tg) {
  const r = db.prepare('SELECT data FROM prefs WHERE tg_id=?').get(String(tg));
  const p = r ? JSON.parse(r.data) : {};
  return { theme: p.theme || {}, notif: p.notif || {} };
}
function setPrefs(tg, p) {
  db.prepare('INSERT INTO prefs(tg_id,data) VALUES(?,?) ON CONFLICT(tg_id) DO UPDATE SET data=excluded.data').run(String(tg), JSON.stringify(p));
}

module.exports = { db, getS, setS, getPrefs, setPrefs, DATA_DIR, UPLOAD_DIR };

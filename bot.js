// بوت تيليجرام: يستقبل /start و /id ويرسل الإشعارات والملفات
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = (process.env.APP_URL || '').replace(/\/+$/, '');
const API = `https://api.telegram.org/bot${TOKEN}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(method, body) {
  if (!TOKEN) return null;
  try {
    const r = await fetch(`${API}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.ok) console.warn('[bot]', method, j.description);
    return j;
  } catch (e) { console.warn('[bot]', method, e.message); return null; }
}

function appButton(text, query) {
  if (!APP_URL.startsWith('https://')) return undefined;
  return { inline_keyboard: [[{ text, web_app: { url: APP_URL + '/' + (query ? '?' + query : '') } }]] };
}

function send(chatId, text, query) {
  return call('sendMessage', { chat_id: chatId, text, reply_markup: appButton(query ? 'فتح الطلب' : 'فتح DropShop', query) });
}

async function sendFile(chatId, filePath, fileName, caption, asPhoto) {
  if (!TOKEN || !fs.existsSync(filePath)) return;
  try {
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    if (caption) fd.append('caption', caption.slice(0, 1000));
    fd.append(asPhoto ? 'photo' : 'document', new Blob([fs.readFileSync(filePath)]), fileName);
    const r = await fetch(`${API}/${asPhoto ? 'sendPhoto' : 'sendDocument'}`, { method: 'POST', body: fd });
    const j = await r.json();
    if (!j.ok) console.warn('[bot] file', j.description);
  } catch (e) { console.warn('[bot] file', e.message); }
}

async function handle(u) {
  const m = u.message;
  if (!m || !m.text) return;
  const t = m.text.trim();
  if (t.startsWith('/start')) {
    await send(m.chat.id, `أهلاً ${m.from.first_name || ''} 👋\nهذا بوت DropShop لإدارة طلبات الدروبشيبنغ.\nاضغط الزر بالأسفل لفتح التطبيق.`);
  } else if (t === '/id') {
    await call('sendMessage', { chat_id: m.chat.id, text: `رقم حسابك: ${m.from.id}\nرقم هذه المحادثة: ${m.chat.id}` });
  }
}

let offset = 0;
async function poll() {
  for (;;) {
    try {
      const r = await fetch(`${API}/getUpdates?timeout=50&offset=${offset}`);
      const j = await r.json();
      if (j.ok) { for (const u of j.result) { offset = u.update_id + 1; await handle(u); } }
      else { console.warn('[bot] getUpdates', j.description); await sleep(5000); }
    } catch (e) { await sleep(5000); }
  }
}

async function start() {
  if (!TOKEN) { console.log('[bot] لا يوجد BOT_TOKEN — البوت متوقف'); return; }
  await call('deleteWebhook', {});
  await call('setMyCommands', { commands: [{ command: 'start', description: 'فتح التطبيق' }, { command: 'id', description: 'معرفة رقم حسابك' }] });
  if (APP_URL.startsWith('https://')) {
    await call('setChatMenuButton', { menu_button: { type: 'web_app', text: 'DropShop', web_app: { url: APP_URL + '/' } } });
  } else console.warn('[bot] APP_URL غير مضبوط أو لا يبدأ بـ https — زر فتح التطبيق لن يظهر');
  console.log('[bot] يعمل ✓');
  poll();
}

module.exports = { start, send, sendFile, call };

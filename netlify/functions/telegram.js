// ─── Fonction Netlify : pont Telegram pour l'agent DAF ──────────────
// Sert à 2 choses :
//   1) GET /api/telegram?action=chatid  → récupère TON chat_id
//      (après avoir écrit un message au bot, ça te le donne)
//   2) GET /api/telegram?action=test    → t'envoie un message de test
//
// Le TOKEN du bot n'est JAMAIS dans le code : il est lu depuis la
// variable d'environnement Netlify TELEGRAM_BOT_TOKEN.
//   Netlify → Site settings → Environment variables :
//     TELEGRAM_BOT_TOKEN = le token donné par BotFather
//     TELEGRAM_CHAT_ID   = ton chat_id (obtenu via action=chatid)

const https = require('https');

function tg(method, payload) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return resolve({ ok: false, error: 'TELEGRAM_BOT_TOKEN manquant sur Netlify' });
    const body = payload ? JSON.stringify(payload) : null;
    const req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + token + '/' + method,
      method: payload ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {},
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ ok: false, error: d.slice(0, 200) }); } });
    });
    req.on('error', (e) => resolve({ ok: false, error: String(e) }));
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  });

  // ── Webhook : Telegram appelle ici quand tu tapes un bouton ──
  // (Configure une fois : /api/telegram?action=setwebhook)
  if (event.httpMethod === 'POST') {
    let upd = {};
    try { upd = JSON.parse(event.body || '{}'); } catch (e) { /* ignore */ }
    const cq = upd.callback_query;
    if (cq && cq.data) {
      const [verb, id] = cq.data.split(':');
      const decision = verb === 'ok' ? '✅ APPROUVÉ' : '❌ REFUSÉ';
      // accuse réception + édite le message pour figer la décision
      await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Décision enregistrée : ' + decision });
      if (cq.message) {
        await tg('editMessageText', {
          chat_id: cq.message.chat.id,
          message_id: cq.message.message_id,
          text: (cq.message.text || '') + '\n\n➡️ <b>' + decision + '</b> par Driss',
          parse_mode: 'HTML',
        });
      }
    }
    return json(200, { ok: true });
  }

  const p = event.queryStringParameters || {};
  const action = p.action || 'chatid';

  // Configure le webhook pour recevoir les clics de boutons
  if (action === 'setwebhook') {
    const base = 'https://' + (event.headers.host || '') + '/api/telegram';
    const r = await tg('setWebhook', { url: base });
    return json(200, { ok: !!(r && r.ok), url: base, telegram: r });
  }

  if (action === 'chatid') {
    // Récupère le chat_id du dernier message reçu par le bot.
    const upd = await tg('getUpdates');
    let chatId = null, who = null;
    if (upd && upd.ok && Array.isArray(upd.result) && upd.result.length) {
      const last = upd.result[upd.result.length - 1];
      const msg = last.message || last.edited_message || (last.callback_query && last.callback_query.message) || {};
      if (msg.chat) { chatId = msg.chat.id; who = msg.chat.first_name || msg.chat.title || ''; }
    }
    return json(200, chatId
      ? { ok: true, chat_id: chatId, qui: who, aide: 'Mets ce chat_id dans la variable Netlify TELEGRAM_CHAT_ID.' }
      : { ok: false, aide: 'Écris d\'abord un message à ton bot sur Telegram, puis recharge cette page.' });
  }

  if (action === 'test') {
    const chatId = p.chat_id || process.env.TELEGRAM_CHAT_ID;
    if (!chatId) return json(200, { ok: false, error: 'TELEGRAM_CHAT_ID manquant' });
    const r = await tg('sendMessage', { chat_id: chatId, text: '✅ CreaJit DAF connecté à Telegram. Tu recevras ici les demandes de sortie d\'argent.', parse_mode: 'HTML' });
    return json(200, r);
  }

  return json(400, { ok: false, error: 'action inconnue (chatid | test)' });
};

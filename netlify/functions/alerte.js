// ─── Fonction Netlify : notifie Driss sur TELEGRAM ──────────────────
// TOUT est centralisé sur Telegram. À chaque demande / décision de sortie
// d'argent, l'agent DAF (ou la page comptable) appelle /api/alerte et on
// envoie un message Telegram à Driss, avec des boutons « ✅ Approuver » et
// « ❌ Refuser » directement dans le chat.
//
// Le TOKEN n'est JAMAIS dans le code. Variables Netlify :
//   TELEGRAM_BOT_TOKEN = token donné par BotFather
//   TELEGRAM_CHAT_ID   = ton chat_id (via /api/telegram?action=chatid)

const https = require('https');

function tg(method, payload) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return resolve({ ok: false, error: 'TELEGRAM_BOT_TOKEN manquant' });
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + token + '/' + method,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ ok: false, error: d.slice(0, 200) }); } });
    });
    req.on('error', (e) => resolve({ ok: false, error: String(e) }));
    req.write(body);
    req.end();
  });
}

const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  });

  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'POST only' });

  let p = {};
  try { p = JSON.parse(event.body || '{}'); } catch (e) { /* ignore */ }

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return json(200, { ok: false, reason: 'TELEGRAM_CHAT_ID non configuré sur Netlify' });

  const montant = (Number(p.montant) || 0).toLocaleString('fr-FR');
  const action = p.action || 'NOUVELLE DEMANDE';
  const emoji = /APPROUV/i.test(action) ? '✅' : /REFUS/i.test(action) ? '❌' : '💸';

  const texte =
    `${emoji} <b>${esc(action)}</b>\n\n` +
    `🧾 <b>${esc(p.poste || 'Sortie d\'argent')}</b>\n` +
    (p.fournisseur ? `🏭 Bénéficiaire : ${esc(p.fournisseur)}\n` : '') +
    `💰 Montant : <b>${montant} DH</b>\n` +
    (p.categorie ? `📂 ${esc(p.categorie)}\n` : '') +
    (p.echeance ? `📅 Échéance : ${esc(p.echeance)}\n` : '') +
    `👤 Demandé par : ${esc(p.demandeur || '-')}\n` +
    (p.note ? `📝 ${esc(p.note)}\n` : '') +
    `\n🛡️ <i>Aucun centime ne sort sans ton accord.</i>`;

  // Boutons d'action seulement pour une nouvelle demande en attente
  const payload = { chat_id: chatId, text: texte, parse_mode: 'HTML' };
  if (/NOUVELLE|ATTENTE|DEMANDE/i.test(action)) {
    const id = p.id || Date.now();
    payload.reply_markup = {
      inline_keyboard: [[
        { text: '✅ Approuver', callback_data: 'ok:' + id },
        { text: '❌ Refuser', callback_data: 'no:' + id },
      ]],
    };
  }

  const r = await tg('sendMessage', payload);
  return json(200, { ok: !!(r && r.ok), telegram: r && r.ok ? 'envoyé' : (r && r.error) });
};

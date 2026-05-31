// ─── Fonction Netlify : notifie Driss d'une sortie d'argent ──────────
// L'agent DAF appelle /api/alerte à chaque demande / décision de sortie
// d'argent. On relaie vers un webhook Make.com (scénario qui envoie un
// EMAIL + crée un ÉVÉNEMENT Google Agenda). Le navigateur n'a jamais
// l'URL du webhook : elle reste cachée côté serveur dans la variable
// d'environnement MAKE_WEBHOOK_URL.
//
// Sur Netlify : Site settings → Environment variables → MAKE_WEBHOOK_URL
//   = l'URL du webhook de ton scénario Make (ex: https://hook.eu2.make.com/xxxx)
// Tant que la variable n'est pas configurée, la fonction répond ok:false
// (et l'app continue de marcher : la demande reste visible dans le cockpit).

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(obj),
  })

  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true })
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'POST only' })

  let p = {}
  try { p = JSON.parse(event.body || '{}') } catch (e) { /* ignore */ }

  // Charge utile normalisée envoyée à Make (email + Google Agenda)
  const payload = {
    type: p.type || 'sortie_argent',
    action: p.action || 'NOUVELLE DEMANDE',
    objet: p.poste || '',
    beneficiaire: p.fournisseur || '',
    montant: Number(p.montant) || 0,
    demandeur: p.demandeur || '',
    date: p.date || new Date().toISOString().slice(0, 10),
    email: p.email || 'driss@salle91.com',
    // texte prêt à l'emploi pour l'email / l'agenda
    titre: `💸 ${p.action || 'Demande'} — ${p.poste || 'sortie'} : ${Number(p.montant) || 0} DH`,
    message:
      `Sortie d'argent à valider.\n` +
      `Objet : ${p.poste || '-'}\n` +
      `Bénéficiaire : ${p.fournisseur || '-'}\n` +
      `Montant : ${Number(p.montant) || 0} DH\n` +
      `Demandé par : ${p.demandeur || '-'}\n` +
      `Statut : ${p.action || 'EN ATTENTE'}\n` +
      `→ À approuver dans le cockpit IA (agent DAF).`,
  }

  const hook = process.env.MAKE_WEBHOOK_URL
  if (!hook) {
    // Pas encore branché : on le dit, sans casser l'app.
    return json(200, {
      ok: false,
      reason: 'MAKE_WEBHOOK_URL non configurée sur Netlify.',
      payload,
    })
  }

  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return json(200, { ok: r.ok, status: r.status })
  } catch (e) {
    return json(200, { ok: false, error: String(e).slice(0, 160), payload })
  }
}

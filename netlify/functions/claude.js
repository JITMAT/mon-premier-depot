// ─── Serveur sécurisé pour parler à Claude (Netlify Function) ────
// Les pages des agents appellent CETTE fonction (jamais Claude directement).
// La clé API reste cachée ici, lue depuis la variable d'environnement
// ANTHROPIC_API_KEY (à configurer sur Netlify : Site settings → Environment
// variables). Elle n'est JAMAIS dans le code ni dans le navigateur.

const MODELES_OK = {
  // on accepte les anciens identifiants et on les ramène vers un modèle valide
  'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-opus-4-8': 'claude-opus-4-8',
  'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
}

exports.handler = async (event) => {
  // Réponse JSON pratique
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  })

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Méthode non autorisée' })
  }

  const cle = process.env.ANTHROPIC_API_KEY
  if (!cle) {
    // Message clair et lisible directement dans le chat de l'agent
    return json(200, {
      content: [{ type: 'text', text: "⚠️ L'assistant IA n'est pas encore activé : la clé API n'est pas configurée sur le serveur (Netlify → Environment variables → ANTHROPIC_API_KEY)." }],
    })
  }

  let corps
  try {
    corps = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Corps de requête invalide' })
  }

  const model = MODELES_OK[corps.model] || 'claude-sonnet-4-6'
  const payload = {
    model,
    max_tokens: corps.max_tokens || 1000,
    messages: corps.messages || [],
  }
  if (corps.system) payload.system = corps.system

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': cle,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    return json(r.status, data)
  } catch (e) {
    return json(200, {
      content: [{ type: 'text', text: "⚠️ Impossible de joindre Claude pour le moment. Réessaie dans un instant." }],
    })
  }
}

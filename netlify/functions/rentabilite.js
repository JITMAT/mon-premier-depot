// ─── Fonction Netlify : pont vers la page RENTABILITÉ / DISPATCH du MES ──
// Récupère les données de rentabilité depuis creajit-mes-v1 (l'autre app
// Netlify) côté serveur. Le navigateur appelle /api/rentabilite et reçoit
// du JSON propre, sans blocage CORS ni 403.
//
// On essaie plusieurs endpoints candidats (dispatch / rentabilite /
// profitability...) car la donnée peut être exposée sous différents noms.
// Le premier qui répond du JSON exploitable gagne.

const MES = process.env.MES_BASE || 'https://creajit-mes-v1.netlify.app'

// Endpoints candidats, dans l'ordre de préférence
const CANDIDATS = [
  '/api/creajit/dispatch',
  '/api/creajit/rentabilite',
  '/api/creajit/rentability',
  '/api/creajit/profitability',
  '/api/dispatch',
  '/api/rentabilite',
  '/.netlify/functions/dispatch',
  '/.netlify/functions/rentabilite',
  '/api/creajit/orders', // repli : on recalcule la marge depuis les commandes
]

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(obj),
  })

  const cle = process.env.CREAJIT_TOKEN || process.env.CREAJIT_API_KEY
  const headers = { Accept: 'application/json' }
  if (cle) headers['Authorization'] = `Bearer ${cle}`

  // Si l'appelant impose un endpoint précis : /api/rentabilite?path=/api/creajit/xxx
  const forced = (event.queryStringParameters || {}).path
  const liste = forced ? [forced] : CANDIDATS

  const tries = []
  for (const path of liste) {
    const url = MES + path
    try {
      const r = await fetch(url, { headers })
      const ct = r.headers.get('content-type') || ''
      tries.push({ path, status: r.status, ct })
      if (!r.ok) continue
      if (!ct.includes('json')) continue // on veut du JSON, pas du HTML
      const data = await r.json()
      const arr = Array.isArray(data)
        ? data
        : data.items || data.data || data.orders || data.rows || null
      return json(200, {
        ok: true,
        source: path,
        data: arr || data, // tableau si trouvé, sinon l'objet brut
        tries,
      })
    } catch (e) {
      tries.push({ path, error: String(e).slice(0, 120) })
    }
  }

  // Rien trouvé : on le dit clairement (le navigateur basculera sur le
  // recalcul local de la marge à partir des commandes déjà chargées).
  return json(200, {
    ok: false,
    reason: 'Aucun endpoint rentabilité/dispatch JSON trouvé sur le MES.',
    mesBase: MES,
    tries,
  })
}

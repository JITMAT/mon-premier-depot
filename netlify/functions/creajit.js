// ─── Fonction serveur : récupère commandes + produits depuis creajit.ma ───
// Le serveur Netlify A INTERNET (contrairement à l'environnement de dev),
// donc c'est LUI qui appelle creajit.ma et renvoie les données au site.
//
// Config sur Netlify → Site settings → Environment variables :
//   CREAJIT_BASE   = https://creajit.ma           (ou l'URL de l'API)
//   CREAJIT_TOKEN  = <clé/API token de creajit.ma>  (si nécessaire)
//
// Appels depuis le site : /api/creajit?resource=orders | products | order&ref=XXXX

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  });

  const BASE = process.env.CREAJIT_BASE || 'https://creajit.ma';
  const TOKEN = process.env.CREAJIT_TOKEN || '';
  const p = event.queryStringParameters || {};
  const resource = p.resource || 'orders';

  // Chemins d'API à ajuster selon ce qu'expose creajit.ma/admin.
  // (À confirmer avec Driss : routes exactes + format d'auth.)
  const ROUTES = {
    orders:   '/api/orders',
    products: '/api/products',
    order:    '/api/orders/' + encodeURIComponent(p.ref || ''),
  };
  const path = ROUTES[resource];
  if (!path) return json(400, { error: 'resource inconnue', resources: Object.keys(ROUTES) });

  const headers = { 'Accept': 'application/json' };
  if (TOKEN) {
    headers['Authorization'] = 'Bearer ' + TOKEN;
    headers['x-api-key'] = TOKEN; // selon le type d'auth de creajit.ma
  }

  try {
    const r = await fetch(BASE + path, { headers });
    const txt = await r.text();
    let data; try { data = JSON.parse(txt); } catch { data = { raw: txt }; }
    return json(r.status, {
      ok: r.ok,
      source: BASE + path,
      data,
      note: r.ok ? undefined : 'Vérifier CREAJIT_BASE / CREAJIT_TOKEN et la route API dans creajit.js',
    });
  } catch (e) {
    return json(200, { ok: false, error: String(e), source: BASE + path,
      note: "Le serveur n'a pas pu joindre creajit.ma — vérifier l'URL/clé dans les variables Netlify." });
  }
};

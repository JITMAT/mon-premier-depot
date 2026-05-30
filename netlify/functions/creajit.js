// ─── Fonction serveur Netlify : pont vers creajit.ma (le serveur a internet) ──
// La page settings ne montre que la clé (pas d'URL d'API) → cette fonction
// ESSAIE PLUSIEURS adresses/styles d'auth courants et garde celle qui répond.
//
// Variables Netlify (Site settings → Environment variables) :
//   CREAJIT_TOKEN = la clé cj_live_...    (déjà configurée)
//   CREAJIT_BASE  = https://creajit.ma     (optionnel, défaut)
//
// Appels du site :
//   /api/creajit?resource=orders
//   /api/creajit?resource=products
//   /api/creajit?resource=order&ref=26040019
//   /api/creajit?resource=discover         (diagnostic : quelles routes répondent)

const TOKEN = process.env.CREAJIT_TOKEN || '';
const BASE = (process.env.CREAJIT_BASE || 'https://creajit.ma').replace(/\/+$/, '');

// Combinaisons d'en-têtes d'auth à tester
function authHeaderSets() {
  return [
    { 'Authorization': 'Bearer ' + TOKEN },
    { 'x-api-key': TOKEN },
    { 'X-API-KEY': TOKEN },
    { 'api-key': TOKEN },
    { 'Authorization': TOKEN },
    { 'X-Auth-Token': TOKEN },
  ];
}

// Chemins candidats par ressource
function candidatePaths(resource, ref) {
  const r = encodeURIComponent(ref || '');
  if (resource === 'order') {
    return [`/api/orders/${r}`, `/api/v1/orders/${r}`, `/api/order/${r}`,
            `/admin/api/orders/${r}`, `/api/commandes/${r}`, `/api/orders?ref=${r}`];
  }
  if (resource === 'products') {
    return ['/api/products', '/api/v1/products', '/api/produits', '/admin/api/products',
            '/api/catalog', '/api/articles', '/api/items', '/products.json'];
  }
  // orders (défaut)
  return ['/api/orders', '/api/v1/orders', '/api/commandes', '/admin/api/orders',
          '/api/sales', '/api/orders.json', '/orders.json'];
}

async function tryFetch(url, headers) {
  try {
    const r = await fetch(url, { headers: Object.assign({ 'Accept': 'application/json' }, headers) });
    const txt = await r.text();
    let data; let isJson = false;
    try { data = JSON.parse(txt); isJson = true; } catch { data = txt.slice(0, 300); }
    return { ok: r.ok, status: r.status, isJson, data };
  } catch (e) {
    return { ok: false, status: 0, error: String(e) };
  }
}

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  });

  if (!TOKEN) return json(200, { ok: false, error: 'CREAJIT_TOKEN absent (Netlify env)' });

  const p = event.queryStringParameters || {};
  const resource = p.resource || 'orders';

  // Mode diagnostic : teste tout et renvoie ce qui marche
  if (resource === 'discover') {
    const report = [];
    for (const res of ['orders', 'products']) {
      for (const path of candidatePaths(res)) {
        const h = authHeaderSets()[0]; // Bearer d'abord
        const out = await tryFetch(BASE + path, h);
        report.push({ resource: res, url: BASE + path, status: out.status, json: out.isJson });
        if (out.ok && out.isJson) break;
      }
    }
    return json(200, { base: BASE, tokenPresent: !!TOKEN, report });
  }

  // Mode normal : on cherche la 1re combinaison (chemin × auth) qui renvoie du JSON 200
  const paths = candidatePaths(resource, p.ref);
  const auths = authHeaderSets();
  let lastTried = [];
  for (const path of paths) {
    for (const h of auths) {
      const out = await tryFetch(BASE + path, h);
      lastTried.push({ url: BASE + path, status: out.status });
      if (out.ok && out.isJson) {
        return json(200, { ok: true, source: BASE + path, data: out.data });
      }
    }
  }
  return json(200, {
    ok: false,
    note: "Aucune route API n'a répondu en JSON. Ouvre /api/creajit?resource=discover pour le diagnostic, ou indique l'URL exacte de l'API CreaJit.",
    triedCount: lastTried.length,
    sample: lastTried.slice(0, 6),
  });
};

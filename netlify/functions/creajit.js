// ─── Fonction serveur Netlify : pont vers l'API creajit.ma ───────
// Le serveur Netlify A INTERNET (contrairement à l'env de dev), donc c'est lui
// qui appelle creajit.ma et renvoie commandes / produits / livraisons au site.
//
// Routes confirmées (Driss) :
//   /api/sales         → liste des commandes (auth Bearer)
//   /api/products-all  → catalogue complet
//   /api/deliveries    → livraisons
//
// Variables Netlify (Site settings → Environment variables) :
//   CREAJIT_TOKEN = clé Bearer (cj_live_… ou JWT du localStorage)   [secret]
//   CREAJIT_BASE  = https://creajit.ma                              [optionnel]
//
// Appels du site :
//   /api/creajit?resource=orders      → commandes normalisées (avec articles + photos)
//   /api/creajit?resource=products    → catalogue normalisé
//   /api/creajit?resource=deliveries  → livraisons
//   /api/creajit?resource=raw&path=/api/sales  → debug : réponse brute

const TOKEN = process.env.CREAJIT_TOKEN || '';
const BASE = (process.env.CREAJIT_BASE || 'https://creajit.ma').replace(/\/+$/, '');

const ROUTES = {
  orders:     '/api/sales',
  products:   '/api/products-all',
  deliveries: '/api/deliveries',
};

function authHeaders() {
  // Bearer en priorité, avec fallbacks au cas où.
  return [
    { 'Authorization': 'Bearer ' + TOKEN },
    { 'Authorization': TOKEN },
    { 'x-api-key': TOKEN },
  ];
}

async function fetchJson(url) {
  for (const h of authHeaders()) {
    try {
      const r = await fetch(url, { headers: Object.assign({ 'Accept': 'application/json' }, h) });
      const txt = await r.text();
      let data; try { data = JSON.parse(txt); } catch { data = null; }
      if (r.ok && data != null) return { ok: true, status: r.status, data };
      // si 401/403 on tente l'auth suivante, sinon on renvoie l'erreur
      if (r.status !== 401 && r.status !== 403) return { ok: false, status: r.status, data: data || txt.slice(0, 300) };
    } catch (e) {
      return { ok: false, status: 0, error: String(e) };
    }
  }
  return { ok: false, status: 401, error: 'auth refusée (vérifier CREAJIT_TOKEN)' };
}

const photoUrl = (img) => {
  if (!img || !String(img).trim()) return '';
  const s = String(img).trim();
  return s.startsWith('http') ? s : BASE + (s.startsWith('/') ? s : '/' + s);
};

// Normalise une commande de /api/sales vers le format attendu par l'app
function normOrder(o) {
  const items = o.items || o.articles || o.lines || [];
  return {
    ref: o.documentNumber || o.ref || o.reference || o.number || String(o.id || ''),
    date: (o.date || o.createdAt || '').slice(0, 10),
    client: (o.customer && (o.customer.name || o.customer.fullName)) || o.client || o.customerName || '',
    vendeur: (o.user && o.user.name) || o.commercial || o.seller || '',
    statut: o.status || o.statut || 'confirmed',
    total: o.total || o.amount || 0,
    paye: o.paid || o.paye || 0,
    reste: o.remaining || o.reste || (o.total != null && o.paid != null ? o.total - o.paid : 0),
    articles: (items || []).map((i, idx) => ({
      nom: i.name || i.nom || i.label || ('Article ' + (idx + 1)),
      qty: i.quantity || i.qty || i.qte || '',
      pu: i.price || i.pu || i.unitPrice || '',
      photo: photoUrl(i.image || (Array.isArray(i.images) ? i.images[0] : '')),
    })),
  };
}

function normProduct(p) {
  return {
    nom: p.name || p.nom || p.label || '',
    prix: p.price || p.prix || (p.actualPriceRange && p.actualPriceRange.minValue && p.actualPriceRange.minValue.amount) || 0,
    stock: (p.stock != null ? (p.stock > 0 ? 'ok' : 'rupture') : (p.availabilityStatus === 'OUT_OF_STOCK' ? 'rupture' : 'ok')),
    photo: photoUrl(p.image || (p.media && p.media.main && p.media.main.image && p.media.main.image.url) || (Array.isArray(p.images) ? p.images[0] : '')),
  };
}

function asArray(d) {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  if (d && Array.isArray(d.items)) return d.items;
  if (d && Array.isArray(d.results)) return d.results;
  if (d && Array.isArray(d.sales)) return d.sales;
  if (d && Array.isArray(d.products)) return d.products;
  return [];
}

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  });

  if (!TOKEN) return json(200, { ok: false, error: 'CREAJIT_TOKEN absent dans les variables Netlify' });

  const p = event.queryStringParameters || {};
  const resource = p.resource || 'orders';

  // Debug : réponse brute d'un chemin
  if (resource === 'raw') {
    const out = await fetchJson(BASE + (p.path || '/api/sales'));
    return json(200, out);
  }

  const path = ROUTES[resource];
  if (!path) return json(400, { error: 'resource inconnue', resources: Object.keys(ROUTES) });

  const out = await fetchJson(BASE + path);
  if (!out.ok) return json(200, { ok: false, source: BASE + path, status: out.status, error: out.error || out.data });

  const arr = asArray(out.data);
  let data;
  if (resource === 'orders') data = arr.map(normOrder);
  else if (resource === 'products') data = arr.map(normProduct);
  else data = arr;

  return json(200, { ok: true, source: BASE + path, count: data.length, data });
};

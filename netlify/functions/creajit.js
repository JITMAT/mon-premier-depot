// ─── Fonction serveur Netlify : pont vers l'API creajit.ma ───────
// Le serveur Netlify A INTERNET, donc c'est lui qui appelle creajit.ma
// et renvoie commandes / produits / livraisons au site.
//
// AUTH (méthode qui marche, reprise du MES creajit-mes-v1) :
//   On NE dépend PAS d'un token figé. On se connecte avec email+mot de passe
//   pour obtenir un token frais (mis en cache 4h), puis on appelle l'API.
//
// Variables Netlify (Site settings → Environment variables) :
//   CJ_EMAIL      = email du compte API creajit.ma  (ex: driss@salle91.com)
//   CJ_PASSWORD   = mot de passe du compte API
//   CREAJIT_TOKEN = (optionnel) token figé qui court-circuite le login
//   CREAJIT_BASE  = (optionnel) défaut https://creajit.ma
//
// Appels du site :
//   /api/creajit?resource=orders      → commandes normalisées (avec articles + photos)
//   /api/creajit?resource=products    → catalogue normalisé
//   /api/creajit?resource=deliveries  → livraisons
//   /api/creajit?resource=raw&path=/api/commercial  → debug : réponse brute

const https = require('https');

const BASE = (process.env.CREAJIT_BASE || 'https://creajit.ma').replace(/\/+$/, '');
const ENV_TOKEN = process.env.CREAJIT_TOKEN || '';

// Route confirmée (MES qui marche) : les commandes sont sur /api/commercial
const ROUTES = {
  orders:     '/api/commercial',
  products:   '/api/products-all',
  deliveries: '/api/deliveries',
};

// ─── Cache token (par cold start Lambda) + backoff rate-limit ────
let CACHED_TOKEN = null;
let CACHED_AT = 0;
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4h
let RATE_LIMITED_UNTIL = 0;

// Connexion creajit.ma → renvoie un token frais
function loginCJ() {
  return new Promise((resolve, reject) => {
    const email = process.env.CJ_EMAIL;
    const password = process.env.CJ_PASSWORD;
    if (!email || !password) return reject(new Error('Missing CJ_EMAIL or CJ_PASSWORD env vars'));
    if (Date.now() < RATE_LIMITED_UNTIL) return reject(new Error('RATE_LIMITED'));
    const body = JSON.stringify({ email, password });
    const req = https.request({
      hostname: 'creajit.ma',
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.token) return resolve(parsed.token);
          const msg = (parsed && parsed.message) || '';
          if (msg.indexOf('Trop de tentatives') !== -1) RATE_LIMITED_UNTIL = Date.now() + 16 * 60 * 1000;
          reject(new Error('No token: ' + data.slice(0, 200)));
        } catch (e) { reject(new Error('Invalid login response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getToken() {
  if (ENV_TOKEN && ENV_TOKEN.length > 20) return ENV_TOKEN; // override optionnel
  const now = Date.now();
  if (CACHED_TOKEN && (now - CACHED_AT) < TOKEN_TTL_MS) return CACHED_TOKEN;
  CACHED_TOKEN = await loginCJ();
  CACHED_AT = now;
  return CACHED_TOKEN;
}

// Appel GET authentifié vers creajit.ma
function fetchJson(path) {
  return new Promise(async (resolve) => {
    let token;
    try { token = await getToken(); }
    catch (e) { return resolve({ ok: false, status: 401, error: 'login échoué : ' + e.message }); }
    const req = https.request({
      hostname: 'creajit.ma',
      path,
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token },
    }, (res) => {
      let txt = '';
      res.on('data', d => txt += d);
      res.on('end', () => {
        if (res.statusCode === 401) { CACHED_TOKEN = null; CACHED_AT = 0; } // invalide le cache
        let data; try { data = JSON.parse(txt); } catch { data = null; }
        if (res.statusCode >= 200 && res.statusCode < 300 && data != null) {
          resolve({ ok: true, status: res.statusCode, data });
        } else {
          resolve({ ok: false, status: res.statusCode, error: (data && data.message) || txt.slice(0, 300) });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: String(e) }));
    req.end();
  });
}

const photoUrl = (img) => {
  if (!img || !String(img).trim()) return '';
  const s = String(img).trim();
  return s.startsWith('http') ? s : BASE + (s.startsWith('/') ? s : '/' + s);
};

// Normalise une commande /api/commercial vers le format RAW attendu par
// l'app (window.CJ_COMMANDES_REELLES → creajit-orders.js).
function normOrder(o) {
  const items = o.items || o.articles || o.lines || [];
  const total = Number(o.total) || 0;
  const paid = Number(o.paidAmount != null ? o.paidAmount : o.paid) || 0;
  // statut paiement : direct sinon déduit du payé
  const payStatus = o.paymentStatus || (paid >= total && total > 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID'));
  return {
    id:               String(o.id || o.uuid || ''),
    ref:              o.documentNumber || o.ref || o.reference || o.number || '',
    date:             String(o.date || o.createdAt || '').slice(0, 10),
    client:           (o.customer && (o.customer.name || o.customer.fullName)) || o.client || o.customerName || '',
    telephone:        (o.customer && o.customer.phone) || o.telephone || o.tel || '',
    vendeur:          (o.user && o.user.name) || o.commercial || o.vendeur || o.seller || '',
    total:            total,
    paidAmount:       paid,
    productionStatus: o.productionStatus || '',
    deliveryStatus:   o.deliveryStatus || '',
    paymentStatus:    payStatus,
    plannedDeliveryDate: o.plannedDeliveryDate || o.deliveryDate || null,
    articles: (items || []).map((i, idx) => ({
      nom:    i.name || i.nom || i.label || ('Article ' + (idx + 1)),
      qte:    i.quantity || i.qty || i.qte || 1,
      prix:   i.price || i.pu || i.unitPrice || 0,
      photo:  photoUrl(i.image || (Array.isArray(i.images) ? i.images[0] : '')),
      photos: [],
      productionStatus: i.productionStatus || '',
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
  if (d && Array.isArray(d.commercial)) return d.commercial;
  if (d && Array.isArray(d.products)) return d.products;
  return [];
}

exports.handler = async (event) => {
  const json = (code, obj) => ({
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(obj),
  });

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };

  if (!process.env.CJ_EMAIL && !ENV_TOKEN) {
    return json(200, { ok: false, error: 'Config manquante : définir CJ_EMAIL + CJ_PASSWORD (ou CREAJIT_TOKEN) dans les variables Netlify' });
  }

  const p = event.queryStringParameters || {};
  const resource = p.resource || 'orders';

  // Debug : réponse brute d'un chemin
  if (resource === 'raw') {
    const out = await fetchJson(p.path || '/api/commercial');
    return json(200, out);
  }

  const path = ROUTES[resource];
  if (!path) return json(400, { error: 'resource inconnue', resources: Object.keys(ROUTES) });

  const out = await fetchJson(path);
  if (!out.ok) return json(200, { ok: false, source: BASE + path, status: out.status, error: out.error });

  const arr = asArray(out.data);
  let data;
  if (resource === 'orders') data = arr.map(normOrder);
  else if (resource === 'products') data = arr.map(normProduct);
  else data = arr;

  return json(200, { ok: true, source: BASE + path, count: data.length, data });
};

/* ============================================================
   CREAJIT IA — Client API. Remplit window.CJ_COMMANDES_REELLES et
   window.CJ_CATALOGUE avec les VRAIES données, puis re-render.

   2 sources, dans l'ordre :
   1) /api/creajit  → la fonction Netlify de CE site (si CJ_EMAIL/CJ_PASSWORD
      sont configurés sur ce site)
   2) Repli : le MES déployé creajit-mes-v1 (qui s'authentifie déjà tout seul
      et autorise le CORS) → garantit des données même sans config locale.

   Ne fonctionne que sur un site DÉPLOYÉ (pas en glisser-dépose local).
   ============================================================ */
(function () {
  var MES = 'https://creajit-mes-v1.netlify.app';

  // Adapte une commande du MES (format court cl/com/tot…) vers le format RAW
  // attendu par l'app (window.CJ_COMMANDES_REELLES → creajit-orders.js).
  function fromMES(o) {
    var total = Number(o.tot) || 0;
    var paid  = Number(o.paid) || 0;
    return {
      id: String(o.uuid || o.id || ''),
      ref: o.ref || '',
      date: String(o.date || '').slice(0, 10),
      client: o.cl || '',
      telephone: o.tel || '',
      vendeur: o.com || '',
      total: total,
      paidAmount: paid,
      productionStatus: o.pst || '',
      deliveryStatus: o.dst || '',
      paymentStatus: (paid >= total && total > 0) ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID'),
      plannedDeliveryDate: o.liv || null,
      articles: (o.articles || []).map(function (a, i) {
        return {
          nom: a.nom || ('Article ' + (i + 1)),
          qte: a.q || a.qte || 1,
          prix: a.prix || 0,
          photo: a.photo || '',
          photos: [],
          productionStatus: a.fab || '',
        };
      }),
    };
  }

  // Source 1 : fonction Netlify locale
  async function chargerLocal(resource) {
    try {
      var r = await fetch('/api/creajit?resource=' + resource);
      var j = await r.json();
      if (j && j.ok && Array.isArray(j.data) && j.data.length) return j.data;
    } catch (e) {}
    return null;
  }

  // Source 2 : MES déployé (repli) — uniquement pour les commandes
  async function chargerMES() {
    try {
      var r = await fetch(MES + '/api/creajit/orders');
      var arr = await r.json();
      if (Array.isArray(arr) && arr.length) return arr.map(fromMES);
    } catch (e) {}
    return null;
  }

  async function init() {
    // Commandes réelles (locale, sinon repli MES)
    var orders = await chargerLocal('orders');
    if (!orders) orders = await chargerMES();
    if (orders && orders.length) {
      window.CJ_COMMANDES_REELLES = orders;
      window.CJ_DATA_SOURCE = 'live';
      if (typeof window.render === 'function') window.render();
      // Re-construit les helpers CJ_ORDERS si le script est déjà chargé
      if (window.CJ_ORDERS && typeof window.CJ_REBUILD_ORDERS === 'function') window.CJ_REBUILD_ORDERS();
    }
    // Catalogue réel (locale uniquement)
    var products = await chargerLocal('products');
    if (products && products.length) {
      window.CJ_CATALOGUE = products;
      if (typeof window.render === 'function') window.render();
    }
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();

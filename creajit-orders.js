/* ============================================================
   CREAJIT IA — Accès commun aux VRAIES commandes (186, avec photos)
   Lit window.CJ_COMMANDES_REELLES (fichier creajit-commandes-reelles.js)
   et fournit des helpers normalisés à toutes les pages.
   ============================================================ */
(function () {
  var RAW = window.CJ_COMMANDES_REELLES || [];

  function photo(a) {
    if (!a) return '';
    if (a.photo && /^https?:/.test(a.photo)) return a.photo;
    if (Array.isArray(a.photos) && a.photos[0]) return /^https?:/.test(a.photos[0]) ? a.photos[0] : ('https://creajit.ma' + a.photos[0]);
    return '';
  }

  var LIB_PROD = { IN_PROGRESS: 'En fabrication', PENDING: 'En attente', COMPLETED: 'Terminé' };
  var LIB_PAY  = { PAID: 'Payé', UNPAID: 'Impayé', PARTIAL: 'Partiel' };
  var LIB_DEL  = { PENDING: 'À livrer', DELIVERED: 'Livré', PARTIAL: 'Partiel' };

  var ORDERS = RAW.map(function (o) {
    return {
      id: o.id, ref: o.ref || '', date: o.date || '', client: o.client || '', tel: o.telephone || '',
      vendeur: o.vendeur || '', total: o.total || 0,
      prod: o.productionStatus || '', paie: o.paymentStatus || '', livr: o.deliveryStatus || '',
      prodLib: LIB_PROD[o.productionStatus] || o.productionStatus || '',
      paieLib: LIB_PAY[o.paymentStatus] || o.paymentStatus || '',
      livrLib: LIB_DEL[o.deliveryStatus] || o.deliveryStatus || '',
      articles: (o.articles || []).map(function (a, i) {
        return { id: (o.ref || o.id || 'cmd') + '_a' + i, nom: a.nom || a.name || ('Article ' + (i + 1)),
                 qte: a.qte || a.qty || a.quantity || 1, prix: a.prix || a.pu || a.price || 0, photo: photo(a) };
      }),
    };
  });

  window.CJ_ORDERS = {
    all: function () { return ORDERS; },
    count: function () { return ORDERS.length; },
    byProd: function (s) { return ORDERS.filter(function (o) { return o.prod === s; }); },
    byDelivery: function (s) { return ORDERS.filter(function (o) { return o.livr === s; }); },
    vendeurs: function () { return Array.from(new Set(ORDERS.map(function (o) { return o.vendeur; }).filter(Boolean))); },
    stats: function () {
      var s = { total: 0, paye: 0, reste: 0, nbArticles: 0, nbPhotos: 0,
                enFab: 0, termine: 0, aLivrer: 0, livre: 0, impaye: 0 };
      ORDERS.forEach(function (o) {
        s.total += o.total;
        if (o.paie === 'PAID') s.paye += o.total; else s.reste += o.total;
        if (o.prod === 'IN_PROGRESS') s.enFab++;
        if (o.prod === 'COMPLETED') s.termine++;
        if (o.livr === 'DELIVERED') s.livre++; else s.aLivrer++;
        if (o.paie !== 'PAID') s.impaye++;
        (o.articles || []).forEach(function (a) { s.nbArticles++; if (a.photo) s.nbPhotos++; });
      });
      return s;
    },
  };
})();

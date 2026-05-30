/* ============================================================
   CREAJIT IA — Accès commun aux VRAIES commandes (186, avec photos)
   Lit window.CJ_COMMANDES_REELLES (fichier creajit-commandes-reelles.js)
   et fournit des helpers normalisés à toutes les pages.
   ============================================================ */
(function () {
  function photo(a) {
    if (!a) return '';
    if (a.photo && /^https?:/.test(a.photo)) return a.photo;
    if (Array.isArray(a.photos) && a.photos[0]) return /^https?:/.test(a.photos[0]) ? a.photos[0] : ('https://creajit.ma' + a.photos[0]);
    return '';
  }

  var LIB_PROD = { IN_PROGRESS: 'En fabrication', PENDING: 'En attente', COMPLETED: 'Terminé' };
  var LIB_PAY  = { PAID: 'Payé', UNPAID: 'Impayé', PARTIAL: 'Partiel' };
  var LIB_DEL  = { PENDING: 'À livrer', DELIVERED: 'Livré', PARTIAL: 'Partiel' };

  // ORDERS est reconstruit depuis window.CJ_COMMANDES_REELLES (statique au départ,
  // remplacé par les vraies données live via creajit-api.js → CJ_REBUILD_ORDERS).
  var ORDERS = [];
  function build() {
    var RAW = window.CJ_COMMANDES_REELLES || [];
    ORDERS = RAW.map(function (o) {
      var dateLiv = o.plannedDeliveryDate || '';
      var retard = (dateLiv && o.deliveryStatus !== 'DELIVERED') ? (Date.now() > new Date(dateLiv).getTime()) : false;
      var joursRetard = retard ? Math.floor((Date.now() - new Date(dateLiv).getTime()) / 86400000) : 0;
      var tot = o.total || 0;
      // Montant payé : direct si dispo, sinon déduit du statut de paiement (données figées)
      var paye;
      if (o.paidAmount != null) paye = o.paidAmount;
      else if (o.paymentStatus === 'PAID') paye = tot;
      else paye = 0; // UNPAID ou PARTIAL inconnu → prudent
      return {
        id: o.id, ref: o.ref || '', date: o.date || '', client: o.client || '', tel: o.telephone || '',
        vendeur: o.vendeur || '', total: tot,
        paye: paye, reste: Math.max(0, tot - paye),
        prod: o.productionStatus || '', paie: o.paymentStatus || '', livr: o.deliveryStatus || '',
        dateLiv: dateLiv, retard: retard, joursRetard: joursRetard,
        prodLib: LIB_PROD[o.productionStatus] || o.productionStatus || '',
        paieLib: LIB_PAY[o.paymentStatus] || o.paymentStatus || '',
        livrLib: LIB_DEL[o.deliveryStatus] || o.deliveryStatus || '',
        articles: (o.articles || []).map(function (a, i) {
          return { id: (o.id || o.ref || 'cmd') + '_a' + i, nom: a.nom || a.name || ('Article ' + (i + 1)),
                   qte: a.qte || a.qty || a.quantity || 1, prix: a.prix || a.pu || a.price || 0, photo: photo(a) };
        }),
      };
    });
    return ORDERS;
  }
  build();

  // Permet à creajit-api.js de recharger les helpers après l'arrivée des vraies données
  window.CJ_REBUILD_ORDERS = function () { build(); if (typeof window.render === 'function') window.render(); };

  window.CJ_ORDERS = {
    all: function () { return ORDERS; },
    count: function () { return ORDERS.length; },
    byProd: function (s) { return ORDERS.filter(function (o) { return o.prod === s; }); },
    byDelivery: function (s) { return ORDERS.filter(function (o) { return o.livr === s; }); },
    enRetard: function () { return ORDERS.filter(function (o) { return o.retard; }); },
    vendeurs: function () { return Array.from(new Set(ORDERS.map(function (o) { return o.vendeur; }).filter(Boolean))); },
    // Perf par commercial : [{vendeur, nb, ca, reste}] trié par CA décroissant
    parVendeur: function () {
      var m = {};
      ORDERS.forEach(function (o) {
        var v = o.vendeur || '—';
        if (!m[v]) m[v] = { vendeur: v, nb: 0, ca: 0, reste: 0 };
        m[v].nb++; m[v].ca += o.total; m[v].reste += o.reste;
      });
      return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.ca - a.ca; });
    },
    stats: function () {
      var s = { total: 0, paye: 0, reste: 0, nbArticles: 0, nbPhotos: 0,
                enFab: 0, enAttente: 0, termine: 0, aLivrer: 0, livre: 0, impaye: 0, enRetard: 0 };
      ORDERS.forEach(function (o) {
        s.total += o.total;
        s.paye += o.paye; s.reste += o.reste;
        if (o.prod === 'IN_PROGRESS') s.enFab++;
        if (o.prod === 'PENDING') s.enAttente++;
        if (o.prod === 'COMPLETED') s.termine++;
        if (o.livr === 'DELIVERED') s.livre++; else s.aLivrer++;
        if (o.paie !== 'PAID') s.impaye++;
        if (o.retard) s.enRetard++;
        (o.articles || []).forEach(function (a) { s.nbArticles++; if (a.photo) s.nbPhotos++; });
      });
      return s;
    },
  };
})();

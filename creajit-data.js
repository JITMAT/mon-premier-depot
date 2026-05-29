/* ============================================================
   CREAJIT IA — Socle de données partagées (Module A)
   ------------------------------------------------------------
   Le « cerveau commun » de toutes les pages (cockpit, Hanane,
   ouvrier, Mohamed, Fatima…). Tout est stocké dans le navigateur
   (localStorage) et SYNCHRONISÉ en temps réel entre les pages
   ouvertes (événement « storage »).

   Plus tard (Module J), on remplacera le stockage navigateur par
   une vraie base partagée multi-appareils, sans changer les écrans.
   ============================================================ */
(function () {
  const CLE = 'creajit_etat_v1';

  // ---- État initial (vide) ----
  const ETAT_VIDE = {
    commandes: {},      // ref -> { ref, client, commercial, statut, livraison, joursRetard, total, paye, restant, notes, articles:[...] , fiche:{} }
    affectations: {},   // articleId -> { ouvrierId, atelierCode, ordre, verifie, statut }
    chronos: {},        // articleId -> { sessions:[{debut,fin,pauseMs,motif}], statut }
    bons: {},           // bonId -> { id, ouvrierId, articleRef, lignes:[], statut:'envoye'|'commande'|'recu', t0, tRecu, pour }
    qc: {},             // articleId:etape -> { ok, par, obs, anomalies:[], date }
    consignes: [],      // { id, cible:'tous'|ouvrierId, texte, par, date }
    evenements: [],     // fil d'actualité { id, type, qui, texte, route, date }
    maj: null,
  };

  // ---- Chargement / sauvegarde ----
  function charger() {
    try { return Object.assign(structuredClone(ETAT_VIDE), JSON.parse(localStorage.getItem(CLE) || '{}')); }
    catch { return structuredClone(ETAT_VIDE); }
  }
  let etat = charger();

  function sauver() {
    etat.maj = new Date().toISOString();
    localStorage.setItem(CLE, JSON.stringify(etat));
    notifier();
  }

  // ---- Abonnement temps réel (même page + autres onglets) ----
  const abonnes = [];
  function notifier() { abonnes.forEach(cb => { try { cb(etat); } catch (e) {} }); }
  window.addEventListener('storage', (e) => { if (e.key === CLE) { etat = charger(); notifier(); } });

  const uid = (p) => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---- API publique ----
  const CJ = {
    etat: () => etat,
    recharger: () => { etat = charger(); return etat; },
    sauver,
    abonner: (cb) => { abonnes.push(cb); return () => { const i = abonnes.indexOf(cb); if (i >= 0) abonnes.splice(i, 1); }; },
    reset: () => { etat = structuredClone(ETAT_VIDE); sauver(); },

    // Fil d'événements (cockpit)
    evenement: (type, qui, texte, route) => {
      etat.evenements.unshift({ id: uid('ev'), type, qui, texte, route: route || '', date: new Date().toISOString() });
      etat.evenements = etat.evenements.slice(0, 200);
      sauver();
    },

    // Commandes / articles
    commandes: () => Object.values(etat.commandes),
    article: (id) => {
      for (const c of Object.values(etat.commandes)) for (const a of (c.articles || [])) if (a.id === id) return { article: a, commande: c };
      return null;
    },

    // Hanane affecte une étape à un ouvrier
    affecter: (articleId, ouvrierId, atelierCode, ordre) => {
      etat.affectations[articleId] = { ouvrierId, atelierCode, ordre: ordre || 1, verifie: true, statut: 'affecte' };
      sauver();
    },
    articlesDeLOuvrier: (ouvrierId) => {
      const res = [];
      for (const [aid, af] of Object.entries(etat.affectations)) {
        if (af.ouvrierId === ouvrierId) { const x = CJ.article(aid); if (x) res.push({ ...x, affectation: af }); }
      }
      return res;
    },

    // Consignes patron -> agents
    consigne: (cible, texte, par) => {
      etat.consignes.unshift({ id: uid('cs'), cible: cible || 'tous', texte, par: par || 'Driss', date: new Date().toISOString() });
      etat.consignes = etat.consignes.slice(0, 100);
      sauver();
    },
    consignesPour: (ouvrierId) => etat.consignes.filter(c => c.cible === 'tous' || c.cible === ouvrierId),

    // Bons de matière
    bon: (b) => { const id = b.id || uid('bon'); etat.bons[id] = Object.assign({ id, statut: 'envoye', t0: Date.now() }, b); sauver(); return id; },
    majBon: (id, ch) => { if (etat.bons[id]) { Object.assign(etat.bons[id], ch); sauver(); } },

    // Données de référence (chargées par les autres fichiers)
    matieres: () => window.CJ_MATIERES || [],
    ateliers: () => window.CJ_ATELIERS || [],

    // Amorçage des vraies commandes CreaJit (si vide) — instantané 29/05/2026
    amorcer: () => {
      if (Object.keys(etat.commandes).length) return;
      const cmds = [
        { ref:'26040019', client:'2A WEDDING', commercial:'Ikram Benaddi', statut:'confirmed', livraison:'2026-05-05', joursRetard:24, total:95000, paye:40016, restant:54984,
          notes:'Le prix des tables inclut uniquement le socle. Délai 05/05.',
          articles:[
            { id:'a_cartel', nom:'Chaise Cartel',  qte:75, prix:730 },
            { id:'a_t12080', nom:'Tableau 120/80', qte:25, prix:730 },
            { id:'a_t4040',  nom:'Tableau 40/40',  qte:40, prix:550 },
          ] },
        { ref:'26040026', client:'Mr Soufiane',         statut:'ready',     livraison:'2026-05-04', joursRetard:25, articles:[] },
        { ref:'26040045', client:'Mr Yazid',            statut:'ready',     livraison:'2026-05-04', joursRetard:25, articles:[] },
        { ref:'26040052', client:'Mr Benjamin',         statut:'ready',     livraison:'2026-05-08', joursRetard:21, articles:[] },
        { ref:'26040048', client:'Azzozi Relax Houses', statut:'ready',     livraison:'2026-05-08', joursRetard:21, articles:[] },
        { ref:'26040053', client:'Expresse Beuty',      statut:'confirmed', livraison:'2026-05-08', joursRetard:21, articles:[] },
        { ref:'26040008', client:'Mr Youssef Ajdir',    statut:'ready',     livraison:'2026-05-09', joursRetard:20, articles:[] },
        { ref:'26040022', client:'Mme Ilhame',          statut:'ready',     livraison:'2026-05-15', joursRetard:14, articles:[] },
        { ref:'26040024', client:'Mme Anisa Guerroumi', statut:'ready',     livraison:'2026-05-16', joursRetard:13, articles:[] },
        { ref:'26050019', client:'Mme Nazha',           statut:'ready',     livraison:'2026-05-18', joursRetard:11, articles:[] },
      ];
      cmds.forEach(c => { c.fiche = c.fiche || {}; etat.commandes[c.ref] = c; });
      CJ.evenement('info', 'Système', 'Commandes CreaJit chargées chez Hanane (' + cmds.length + ').');
      sauver();
    },
  };

  window.CJ = CJ;
  CJ.amorcer();
})();

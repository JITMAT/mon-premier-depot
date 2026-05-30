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
    bons: {},           // bonId -> { id, ref, client, lignes:[], statut:'envoye'|'commande'|'recu', t0, tRecu, par }
    fiches: {},         // ref -> { dimensions, tissu, accoudoirs, coutures, notes, dessinValide }
    articlesSaisis: {}, // ref -> [ { id, nm, qty, pu, photo(base64) } ] saisis par Hanane
    qc: {},             // articleId -> { ok, par, obs, date }
    livraisons: {},     // ref -> { ref, date, par }
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

  // Résolution de noms (pour le fil d'actualité du cockpit)
  function nomOuvrier(id) {
    const all = [].concat(window.CJ_OUVRIERS || [], window.CJ_DIRECTION || []);
    const w = all.find(x => x.id === id);
    return w ? w.nm : id;
  }
  function libArticle(articleId) { const x = CJ.article(articleId); return (x && x.article && x.article.nom) || 'article'; }
  function clientDe(articleId) { const x = CJ.article(articleId); return (x && x.commande && x.commande.client) ? ' (' + x.commande.client + ')' : ''; }

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
    majAffectation: (articleId, ch) => { if (etat.affectations[articleId]) { Object.assign(etat.affectations[articleId], ch); sauver(); } },
    // Affectation avec détails de l'article (utilisée par l'écran Hanane existant)
    affecterDetail: (d) => {
      etat.affectations[d.articleId] = {
        ouvrierId: d.ouvrierId, atelierCode: d.atelierCode, ordre: d.ordre || 1,
        verifie: true, statut: 'affecte',
        nom: d.nom, qty: d.qty, pu: d.pu, ref: d.ref, client: d.client,
      };
      sauver();
    },

    // Consignes patron -> agents
    consigne: (cible, texte, par) => {
      etat.consignes.unshift({ id: uid('cs'), cible: cible || 'tous', texte, par: par || 'Driss', date: new Date().toISOString() });
      etat.consignes = etat.consignes.slice(0, 100);
      sauver();
    },
    consignesPour: (ouvrierId) => etat.consignes.filter(c => c.cible === 'tous' || c.cible === ouvrierId),

    // ===== ANALYSE INTELLIGENTE : l'agent détecte tous les problèmes =====
    // Renvoie la liste des anomalies de l'atelier, triée par gravité.
    problemes: () => {
      const res = [];
      const add = (gravite, cat, texte, route) => res.push({ gravite, cat, texte, route: route || '' });
      const heures = (t0) => t0 ? Math.floor((Date.now() - t0) / 3600000) : 0;
      const aff = etat.affArt || {};
      Object.keys(aff).forEach(aid => {
        const liste = aff[aid] || []; if (!liste.length) return;
        const x = CJ.article(aid);
        const nom = (liste[0] && liste[0].nom) || (x && x.article && x.article.nom) || aid;
        const client = (x && x.commande && x.commande.client) || (liste[0] && liste[0].client) || '';
        const ref = client ? (client + (x && x.commande ? ' · ' + (x.commande.ref || '') : '')) : '';
        const enPause = liste.filter(o => o.statut === 'pause');
        const tousFinis = liste.every(o => o.statut === 'fini');
        const aucunDemarre = liste.every(o => o.statut === 'affecte');
        const fa = (etat.fichesArt && etat.fichesArt[aid]) || {};
        if (enPause.length) add('haute', 'pause', `« ${nom} » (${ref}) EN PAUSE : ${enPause.map(o => o.motif || 'sans motif').join(', ')}`, '→ atelier');
        if (tousFinis && !etat.qc[aid]) add('moyenne', 'qc', `« ${nom} » (${ref}) terminé mais PAS encore contrôlé (QC).`, '→ Fatima');
        if (aucunDemarre) add('info', 'attente', `« ${nom} » (${ref}) affecté mais travail PAS commencé.`, '→ atelier');
        if (!fa.dessinValide && !tousFinis) add('moyenne', 'fiche', `« ${nom} » (${ref}) : dessin/fiche PAS validé avant production (risque de retour).`, '→ Hanane');
      });
      // QC en anomalie non corrigée
      Object.keys(etat.qc || {}).forEach(aid => {
        const q = etat.qc[aid]; if (q && q.ok === false) {
          const x = CJ.article(aid); const nom = (x && x.article && x.article.nom) || aid;
          add('haute', 'anomalie', `ANOMALIE QUALITÉ non corrigée sur « ${nom} » : ${q.obs || 'voir Fatima'}.`, '→ atelier');
        }
      });
      // Bons matière en attente trop longtemps
      Object.values(etat.bons || {}).forEach(b => {
        if (b.statut !== 'recu') { const h = heures(b.t0); if (h >= 24) add('moyenne', 'matiere', `Bon matière ${b.client || ''} en attente depuis ${h} h [${b.statut}].`, '→ Mohamed magasin'); }
      });
      // Commandes réelles en retard (si chargées)
      try {
        const ord = window.CJ_ORDERS;
        if (ord && ord.all) {
          const today = new Date();
          const late = ord.all().filter(o => o.deliveryStatus !== 'DELIVERED' && o.date && new Date(o.date) < today);
          if (late.length) add('haute', 'retard', `${late.length} commande(s) en RETARD de livraison.`, '→ Fatima / planning');
        }
      } catch (e) {}
      const ordre = { haute: 0, moyenne: 1, info: 2 };
      return res.sort((a, b) => ordre[a.gravite] - ordre[b.gravite]);
    },
    resumeProblemes: () => {
      const p = CJ.problemes();
      if (!p.length) return 'Aucun problème détecté.';
      const ic = { haute: '🔴', moyenne: '🟡', info: '🔵' };
      return p.map(x => `${ic[x.gravite] || '•'} ${x.texte}${x.route ? ' ' + x.route : ''}`).join('\n');
    },

    // Contexte temps réel injecté dans CHAQUE agent IA → ils sont « connectés »
    contexteIA: () => {
      const aff = Object.entries(etat.affectations).map(([id, a]) => `${a.nom || id} → ${a.ouvrierId} (atelier ${a.atelierCode}, ${a.statut})`);
      const bons = Object.values(etat.bons).map(b => `${b.client || ''} ${b.ref || ''}: ${(b.lignes || []).length} matière(s) [${b.statut}]`);
      const evs = (etat.evenements || []).slice(0, 12).map(x => `• ${x.texte}${x.route ? ' ' + x.route : ''}`);
      const cons = (etat.consignes || []).slice(0, 6).map(c => `• [${c.cible}] ${c.texte}`);
      return [
        '--- ÉTAT PARTAGÉ TEMPS RÉEL DE L\'ATELIER CREAJIT ---',
        'Tu es un agent CREAJIT IA, CONNECTÉ aux autres agents (Hanane, ouvriers, Mohamed magasin, Hassan réception, Fatima). Tu vois ce qu\'ils font ci-dessous et tu peux y faire référence, anticiper, calculer et proposer des actions concrètes.',
        'Affectations en cours : ' + (aff.join(' ; ') || 'aucune'),
        'Bons de matière : ' + (bons.join(' ; ') || 'aucun'),
        'Consignes du patron : ' + (cons.join('  ') || 'aucune'),
        'Derniers événements : ' + (evs.join('  ') || 'aucun'),
        'PROBLÈMES DÉTECTÉS (à analyser et résoudre en priorité) :\n' + CJ.resumeProblemes(),
        '--- fin état partagé ---',
      ].join('\n');
    },

    // Bons de matière
    bon: (b) => { const id = b.id || uid('bon'); etat.bons[id] = Object.assign({ id, statut: 'envoye', t0: Date.now() }, b); sauver(); return id; },
    majBon: (id, ch) => { if (etat.bons[id]) { Object.assign(etat.bons[id], ch); sauver(); } },
    bons: () => Object.values(etat.bons).sort((a, b) => (b.t0 || 0) - (a.t0 || 0)),
    // Fiche technique d'une commande (stockée par référence)
    fiche: (ref, data) => { etat.fiches[ref] = Object.assign({}, etat.fiches[ref], data); sauver(); },
    ficheDe: (ref) => etat.fiches[ref] || {},

    // ===== PAR ARTICLE (multi-ouvriers, fiche, achats) =====
    // Plusieurs ouvriers/étapes par article
    affArticle: (articleId) => (etat.affArt && etat.affArt[articleId]) ? etat.affArt[articleId] : [],
    ajouterAffArticle: (articleId, ouvrierId, atelierCode, nom) => {
      etat.affArt = etat.affArt || {};
      const liste = etat.affArt[articleId] = etat.affArt[articleId] || [];
      if (!liste.some(x => x.ouvrierId === ouvrierId)) liste.push({ ouvrierId, atelierCode: atelierCode || '', nom: nom || '', statut: 'affecte' });
      sauver();
    },
    retirerAffArticle: (articleId, ouvrierId) => {
      if (etat.affArt && etat.affArt[articleId]) { etat.affArt[articleId] = etat.affArt[articleId].filter(x => x.ouvrierId !== ouvrierId); sauver(); }
    },
    // Fiche technique par article
    ficheArticle: (articleId, data) => { etat.fichesArt = etat.fichesArt || {}; etat.fichesArt[articleId] = Object.assign({}, etat.fichesArt[articleId], data); sauver(); },
    ficheArticleDe: (articleId) => (etat.fichesArt && etat.fichesArt[articleId]) || {},
    // Bons matière par article
    bonsArticle: (articleId) => Object.values(etat.bons).filter(b => b.articleId === articleId).sort((a, b) => (b.t0 || 0) - (a.t0 || 0)),

    // ===== TRAVAIL OUVRIER PAR ARTICLE (chrono + statut, remonte partout) =====
    // Liste des tâches d'un ouvrier (lues depuis les affectations par article)
    tachesOuvrier: (ouvrierId) => {
      const res = [];
      const aff = etat.affArt || {};
      Object.keys(aff).forEach(aid => {
        (aff[aid] || []).forEach(o => {
          if (o.ouvrierId === ouvrierId) {
            const x = CJ.article(aid);
            res.push({ articleId: aid, nom: o.nom || (x && x.article.nom) || aid, atelierCode: o.atelierCode || '',
              client: x ? x.commande.client : (o.client || ''), ref: x ? x.commande.ref : '',
              qte: x ? (x.article.qte || x.article.qty || 1) : 1, prix: x ? (x.article.prix || x.article.pu || 0) : 0,
              statut: o.statut || 'affecte', t0: o.t0 || null, elapsedMs: o.elapsedMs || 0, motif: o.motif || '' });
          }
        });
      });
      return res;
    },
    // Met à jour l'état de travail d'un (article, ouvrier)
    majTravail: (articleId, ouvrierId, ch) => {
      const liste = (etat.affArt || {})[articleId]; if (!liste) return;
      const o = liste.find(x => x.ouvrierId === ouvrierId); if (!o) return;
      Object.assign(o, ch); sauver();
    },
    demarrerTravail: (articleId, ouvrierId) => {
      const liste = (etat.affArt || {})[articleId]; if (!liste) return;
      const o = liste.find(x => x.ouvrierId === ouvrierId); if (!o) return;
      o.statut = 'encours'; o.t0 = Date.now(); o.motif = ''; sauver();
      CJ.evenement('info', nomOuvrier(ouvrierId), `🔧 démarre « ${o.nom || libArticle(articleId)} »${clientDe(articleId)}.`, 'Atelier ' + (o.atelierCode || ''));
    },
    pauserTravail: (articleId, ouvrierId, motif) => {
      const liste = (etat.affArt || {})[articleId]; if (!liste) return;
      const o = liste.find(x => x.ouvrierId === ouvrierId); if (!o) return;
      if (o.t0) { o.elapsedMs = (o.elapsedMs || 0) + (Date.now() - o.t0); o.t0 = null; }
      o.statut = 'pause'; o.motif = motif || ''; sauver();
      CJ.evenement('warn', nomOuvrier(ouvrierId), `⏸️ pause sur « ${o.nom || libArticle(articleId)} »${motif ? ' — ' + motif : ''}.`, 'Atelier ' + (o.atelierCode || ''));
    },
    finirTravail: (articleId, ouvrierId) => {
      const liste = (etat.affArt || {})[articleId]; if (!liste) return;
      const o = liste.find(x => x.ouvrierId === ouvrierId); if (!o) return;
      if (o.t0) { o.elapsedMs = (o.elapsedMs || 0) + (Date.now() - o.t0); o.t0 = null; }
      o.statut = 'fini'; sauver();
      CJ.evenement('ok', nomOuvrier(ouvrierId), `✅ termine « ${o.nom || libArticle(articleId)} »${clientDe(articleId)}.`, 'Atelier ' + (o.atelierCode || ''));
    },
    // Articles saisis par Hanane (fiche technique) — le connecteur ne donne que le nombre
    ajouterArticle: (ref, art) => { (etat.articlesSaisis[ref] = etat.articlesSaisis[ref] || []).push(Object.assign({ id: ref + '_m' + Date.now().toString(36) }, art)); sauver(); },
    articlesSaisis: (ref) => etat.articlesSaisis[ref] || [],
    supprimerArticle: (ref, id) => { etat.articlesSaisis[ref] = (etat.articlesSaisis[ref] || []).filter(a => a.id !== id); sauver(); },

    // Livraisons (agent Fatima — logistique)
    livrer: (ref, info) => { etat.livraisons[ref] = Object.assign({ ref, date: Date.now() }, info || {}); sauver(); },
    estLivree: (ref) => !!etat.livraisons[ref],
    // Contrôle qualité (Fatima) — avec photo obligatoire (preuve / traçabilité)
    qcSet: (articleId, ok, obs, par, photo) => { etat.qc[articleId] = { ok: !!ok, obs: obs || '', par: par || 'Fatima', photo: photo || '', date: Date.now() }; sauver(); },
    qcDe: (articleId) => etat.qc[articleId] || null,
    // Articles prêts pour le contrôle qualité : finis via l'ancien système OU
    // dans le nouveau (par article : tous les ouvriers de l'article ont terminé).
    articlesFinis: () => {
      const res = [];
      for (const [aid, af] of Object.entries(etat.affectations)) if (af.statut === 'fini') res.push({ id: aid, af });
      const aff = etat.affArt || {};
      Object.keys(aff).forEach(aid => {
        const liste = aff[aid] || [];
        if (liste.length && liste.every(o => o.statut === 'fini') && !res.some(r => r.id === aid)) {
          const x = CJ.article(aid);
          const nom = (liste[0] && liste[0].nom) || (x && x.article && x.article.nom) || aid;
          const client = (x && x.commande && x.commande.client) || (liste[0] && liste[0].client) || '';
          const ref = (x && x.commande && x.commande.ref) || '';
          // coût main d'œuvre total de l'article (heures × coût horaire chargé)
          const moTot = liste.reduce((s, o) => {
            const th = (window.coutHoraire ? window.coutHoraire(o.atelierCode) : 60);
            const ms = (o.elapsedMs || 0) + (o.t0 ? (Date.now() - o.t0) : 0);
            return s + (ms / 3600000) * th;
          }, 0);
          res.push({ id: aid, af: { nom, client, ref, ouvrierId: (liste.map(o => o.ouvrierId).join(', ')), moTot } });
        }
      });
      return res;
    },

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

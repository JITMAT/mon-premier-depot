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
    parcours: {},       // articleId -> [ { dept, statut, ouvrierId, heures, valideLe } ] chaîne de départements
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
      const add = (gravite, cat, texte, route, action) => res.push({ gravite, cat, texte, route: route || '', action: action || null });
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
        const w1 = (liste[0] && liste[0].ouvrierId) || 'tous';
        if (enPause.length) add('haute', 'pause', `« ${nom} » (${ref}) EN PAUSE : ${enPause.map(o => o.motif || 'sans motif').join(', ')}`, '→ atelier',
          { label: '📦 Commander la matière', cible: 'mohamedmag', texte: `Commander d'urgence la matière manquante pour « ${nom} » (${ref}).` });
        if (tousFinis && !etat.qc[aid]) add('moyenne', 'qc', `« ${nom} » (${ref}) terminé mais PAS encore contrôlé (QC).`, '→ Fatima',
          { label: '🔎 Demander le contrôle', cible: 'fatima', texte: `Contrôler la qualité de « ${nom} » (${ref}) — article prêt.` });
        if (aucunDemarre) add('info', 'attente', `« ${nom} » (${ref}) affecté mais travail PAS commencé.`, '→ atelier',
          { label: '▶️ Relancer l\'atelier', cible: w1, texte: `Démarrer « ${nom} » (${ref}) — en attente.` });
        if (!fa.dessinValide && !tousFinis) add('moyenne', 'fiche', `« ${nom} » (${ref}) : dessin/fiche PAS validé avant production (risque de retour).`, '→ Hanane',
          { label: '📝 Demander la fiche', cible: 'hanane', texte: `Valider la fiche technique + dessin client de « ${nom} » avant production (${ref}).` });
      });
      // QC en anomalie non corrigée
      Object.keys(etat.qc || {}).forEach(aid => {
        const q = etat.qc[aid]; if (q && q.ok === false) {
          const x = CJ.article(aid); const nom = (x && x.article && x.article.nom) || aid;
          add('haute', 'anomalie', `ANOMALIE QUALITÉ non corrigée sur « ${nom} » : ${q.obs || 'voir Fatima'}.`, '→ atelier',
            { label: '🔧 Faire corriger', cible: 'tous', texte: `Corriger l'anomalie qualité sur « ${nom} » : ${q.obs || ''}.` });
        }
      });
      // Bons matière en attente trop longtemps
      Object.values(etat.bons || {}).forEach(b => {
        if (b.statut !== 'recu') { const h = heures(b.t0); if (h >= 24) add('moyenne', 'matiere', `Bon matière ${b.client || ''} en attente depuis ${h} h [${b.statut}].`, '→ Mohamed magasin',
          { label: '📦 Relancer le magasin', cible: 'mohamedmag', texte: `Relancer le bon matière en attente (${b.client || ''}) — ${h} h.` }); }
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
    // meta = { photo, qty, pu, client, ref } : ce que Hanane a préparé, voyage avec l'affectation
    ajouterAffArticle: (articleId, ouvrierId, atelierCode, nom, meta) => {
      etat.affArt = etat.affArt || {};
      etat.artMeta = etat.artMeta || {};
      if (meta) etat.artMeta[articleId] = Object.assign({}, etat.artMeta[articleId], meta);
      if (nom) { etat.artMeta[articleId] = etat.artMeta[articleId] || {}; if (!etat.artMeta[articleId].nom) etat.artMeta[articleId].nom = nom; }
      const liste = etat.affArt[articleId] = etat.affArt[articleId] || [];
      if (!liste.some(x => x.ouvrierId === ouvrierId)) liste.push({ ouvrierId, atelierCode: atelierCode || '', nom: nom || '', statut: 'affecte' });
      sauver();
    },
    artMetaDe: (articleId) => (etat.artMeta && etat.artMeta[articleId]) || {},

    // Tout ce qu'un ouvrier a sur sa table : ses articles affectés, l'état, le temps, le coût.
    affectationsOuvrier: (ouvrierId) => {
      const aff = etat.affArt || {}, res = [];
      Object.keys(aff).forEach(articleId => {
        (aff[articleId] || []).forEach(o => {
          if (o.ouvrierId !== ouvrierId) return;
          const meta = (etat.artMeta && etat.artMeta[articleId]) || {};
          const ms = (o.elapsedMs || 0) + (o.t0 ? (Date.now() - o.t0) : 0);
          const cout = CJ.coutArticle ? CJ.coutArticle(articleId) : null;
          res.push({ articleId, ouvrierId, statut: o.statut || 'affecte', motif: o.motif || '',
            nom: o.nom || meta.nom || 'article', client: meta.client || '', ref: meta.ref || '',
            photo: meta.photo || '', qty: meta.qty || 1, pu: meta.pu || 0,
            t0: o.t0 || null, debutLe: o.debutLe || null, elapsedMs: o.elapsedMs || 0, msVivant: ms,
            heures: Math.round((ms / 3600000) * 10) / 10, coutRevient: cout ? cout.total : 0, cout });
        });
      });
      return res;
    },

    // Stats RÉELLES par ouvrier (depuis le vrai travail) — pour le classement du cockpit.
    statsOuvriers: () => {
      const aff = etat.affArt || {}, par = {};
      const get = (id) => par[id] || (par[id] = { ouvrierId: id, faits: 0, enCours: 0, affectes: 0, pauses: 0, rapporte: 0, coutMO: 0, heures: 0, statut: 'idle' });
      Object.keys(aff).forEach(articleId => {
        const meta = (etat.artMeta && etat.artMeta[articleId]) || {};
        const cout = CJ.coutArticle ? CJ.coutArticle(articleId) : null;
        (aff[articleId] || []).forEach(o => {
          const s = get(o.ouvrierId);
          const ms = (o.elapsedMs || 0) + (o.t0 ? (Date.now() - o.t0) : 0);
          s.heures += ms / 3600000;
          const th = window.coutHoraire ? window.coutHoraire(o.atelierCode) : 60;
          s.coutMO += (ms / 3600000) * th;
          if (o.statut === 'fini') { s.faits++; s.rapporte += (meta.qty || 1) * (meta.pu || 0); }
          else if (o.statut === 'encours') { s.enCours++; s.statut = 'work'; }
          else if (o.statut === 'pause') { s.pauses++; if (s.statut === 'idle') s.statut = 'pause'; }
          else s.affectes++;
        });
      });
      Object.values(par).forEach(s => { s.heures = Math.round(s.heures * 10) / 10; s.coutMO = Math.round(s.coutMO); });
      return par; // { ouvrierId: stats }
    },
    // Définit / lit la chaîne de départements qu'un article traverse.
    setParcours: (articleId, codesDept) => {
      etat.parcours = etat.parcours || {};
      etat.parcours[articleId] = (codesDept || []).map(code => {
        const existant = (etat.parcours[articleId] || []).find(e => e.dept === code);
        return existant || { dept: code, statut: 'attente', ouvrierId: '', heures: 0, valideLe: null };
      });
      sauver();
    },
    parcoursDe: (articleId) => (etat.parcours && etat.parcours[articleId]) || [],
    // Valide une étape : enregistre les heures réelles -> le coût de l'étape est figé.
    validerEtape: (articleId, deptCode, heures, ouvrierId) => {
      const p = (etat.parcours || {})[articleId]; if (!p) return;
      const e = p.find(x => x.dept === deptCode); if (!e) return;
      e.heures = +heures || 0; e.ouvrierId = ouvrierId || e.ouvrierId; e.statut = 'valide'; e.valideLe = Date.now();
      sauver();
      const d = window.cjDept ? window.cjDept(deptCode) : null;
      CJ.evenement('ok', (d && d.chef) || 'Atelier', `✅ Étape ${deptCode} validée (${e.heures} h) — « ${libArticle(articleId)} »${clientDe(articleId)}.`, 'Atelier ' + (d ? d.atelier : ''));
    },
    majEtape: (articleId, deptCode, ch) => {
      const p = (etat.parcours || {})[articleId]; if (!p) return;
      const e = p.find(x => x.dept === deptCode); if (!e) return;
      Object.assign(e, ch); sauver();
    },
    // Coût de revient COMPLET d'un article : main d'œuvre (somme des étapes) + matière + charges fixes.
    coutArticle: (articleId, opts) => {
      opts = opts || {};
      const p = (etat.parcours || {})[articleId] || [];
      const etapes = p.map(e => {
        const cH = window.cjCoutDept ? window.cjCoutDept(e.dept) : 60;
        const d = window.cjDept ? window.cjDept(e.dept) : null;
        return { dept: e.dept, nom: d ? d.nom : e.dept, atelier: d ? d.atelier : '', chef: d ? d.chef : '',
                 statut: e.statut, heures: e.heures || 0, coutH: cH, cout: (e.heures || 0) * cH };
      });
      const mo = etapes.reduce((s, e) => s + e.cout, 0);
      // matière : somme des bons de cet article, prix réel (ligne, sinon référentiel 559)
      const refMat = window.CJ_MATIERES || [];
      const prixMat = (l) => {
        if (l.pu || l.puTTC) return l.pu || l.puTTC;
        const m = refMat.find(x => x.ref === l.ref || x.nom === l.nom); return m ? (m.puTTC || m.puHT || 0) : 0;
      };
      const bons = Object.values(etat.bons).filter(b => b.articleId === articleId);
      const matiere = bons.reduce((s, b) => s + (b.lignes || []).reduce((ss, l) => ss + ((l.qty || 0) * prixMat(l)), 0), 0);
      const chargesFixes = opts.chargesFixes != null ? opts.chargesFixes : 3935; // §5 cahier des charges
      const total = mo + matiere + chargesFixes;
      return { etapes, mo, matiere, chargesFixes, total,
               etapesValidees: etapes.filter(e => e.statut === 'valide').length, etapesTotal: etapes.length };
    },

    // Coût agrégé par atelier (pour la vue direction)
    coutParAtelier: () => {
      const par = {};
      const pc = etat.parcours || {};
      Object.keys(pc).forEach(aid => {
        (pc[aid] || []).forEach(e => {
          const d = window.cjDept ? window.cjDept(e.dept) : null; if (!d) return;
          const cH = window.cjCoutDept ? window.cjCoutDept(e.dept) : 60;
          par[d.atelier] = par[d.atelier] || { atelier: d.atelier, heures: 0, cout: 0, etapes: 0 };
          par[d.atelier].heures += (e.heures || 0);
          par[d.atelier].cout += (e.heures || 0) * cH;
          if (e.statut === 'valide') par[d.atelier].etapes++;
        });
      });
      return Object.values(par).sort((a, b) => b.cout - a.cout);
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
            const m = (etat.artMeta || {})[aid] || {};
            const photo = m.photo || (x && x.article && (x.article.photo || (x.article.photos && x.article.photos[0]))) || '';
            res.push({ articleId: aid, nom: o.nom || m.nom || (x && x.article.nom) || aid, atelierCode: o.atelierCode || '',
              client: x ? x.commande.client : (m.client || o.client || ''), ref: x ? x.commande.ref : (m.ref || ''),
              qte: x ? (x.article.qte || x.article.qty || 1) : (m.qty || 1), prix: x ? (x.article.prix || x.article.pu || 0) : (m.pu || 0),
              photo: photo,
              fiche: (etat.fichesArt && etat.fichesArt[aid]) || {},
              bons: Object.values(etat.bons).filter(b => b.articleId === aid).sort((a, b) => (b.t0 || 0) - (a.t0 || 0)),
              statut: o.statut || 'affecte', t0: o.t0 || null, elapsedMs: o.elapsedMs || 0, motif: o.motif || '' });
          }
        });
      });
      return res;
    },
    // Heures de chrono d'un ouvrier (ou tous) sur un article — pour pré-remplir la validation d'étape.
    heuresChrono: (articleId, ouvrierId) => {
      const liste = (etat.affArt || {})[articleId] || [];
      const concernes = ouvrierId ? liste.filter(o => o.ouvrierId === ouvrierId) : liste;
      const ms = concernes.reduce((s, o) => s + (o.elapsedMs || 0) + (o.t0 ? (Date.now() - o.t0) : 0), 0);
      return Math.round((ms / 3600000) * 10) / 10; // heures, 1 décimale
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
      // un ouvrier ne fait qu'UNE chose à la fois : on met en pause ses autres articles en cours
      let pauses = 0;
      Object.keys(etat.affArt || {}).forEach(aid => {
        if (aid === articleId) return;
        (etat.affArt[aid] || []).forEach(x => {
          if (x.ouvrierId === ouvrierId && x.statut === 'encours') {
            if (x.t0) { x.elapsedMs = (x.elapsedMs || 0) + (Date.now() - x.t0); x.t0 = null; }
            x.statut = 'pause'; x.motif = 'a démarré une autre commande'; pauses++;
          }
        });
      });
      o.statut = 'encours'; o.t0 = Date.now(); o.motif = ''; if (!o.debutLe) o.debutLe = Date.now(); sauver();
      CJ.evenement('info', nomOuvrier(ouvrierId), `🔧 démarre « ${o.nom || libArticle(articleId)} »${clientDe(articleId)}${pauses ? ' (autre commande mise en pause)' : ''}.`, 'Atelier ' + (o.atelierCode || ''));
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

    // ===== COLONNE VERTÉBRALE : suivi complet d'une commande =====
    // Donne à TOUS les agents (Fatima, cockpit, Hanane) le MÊME état réel d'une
    // commande : production, qui travaille, contrôle qualité, matière, livraison.
    // `order` = une commande de CJ_ORDERS (id, ref, articles[]) ou amorcée.
    suivi: (order) => {
      if (!order) return null;
      const ref = order.ref || order.id;
      const arts = order.articles || [];
      let affectes = 0, enCours = 0, pause = 0, finis = 0, qcOk = 0, qcAno = 0, qcAtt = 0, avecActivite = 0;
      const ouvriers = new Set(), ateliers = new Set(), bons = [], motifs = [];
      let moTotal = 0;
      arts.forEach(a => {
        const liste = (etat.affArt || {})[a.id] || [];
        if (liste.length) { affectes++; avecActivite++; }
        liste.forEach(o => {
          if (o.ouvrierId) ouvriers.add(nomOuvrier(o.ouvrierId));
          if (o.atelierCode) ateliers.add(o.atelierCode);
          if (o.statut === 'encours') enCours++;
          if (o.statut === 'pause') { pause++; if (o.motif) motifs.push(o.motif); }
          const th = (window.coutHoraire ? window.coutHoraire(o.atelierCode) : 60);
          const ms = (o.elapsedMs || 0) + (o.t0 ? (Date.now() - o.t0) : 0);
          moTotal += (ms / 3600000) * th;
        });
        if (liste.length && liste.every(o => o.statut === 'fini')) {
          finis++;
          const q = etat.qc[a.id];
          if (!q) qcAtt++; else if (q.ok) qcOk++; else qcAno++;
        }
        Object.values(etat.bons).filter(b => b.articleId === a.id).forEach(b => bons.push(b));
      });
      const livree = !!etat.livraisons[ref] || /delivered/i.test(order.livr || order.deliveryStatus || '');
      const bonsEnAttente = bons.filter(b => b.statut !== 'recu').length;
      // étape réelle, du plus avancé au moins avancé
      let etape, pret = false, source = 'atelier';
      if (livree) { etape = 'Livré'; }
      else if (qcAno > 0) { etape = 'Anomalie qualité'; }
      else if (arts.length && finis === arts.length && qcOk === arts.length) { etape = 'Prêt à livrer'; pret = true; }
      else if (finis > 0 && qcAtt > 0) { etape = 'En contrôle qualité'; }
      else if (pause > 0) { etape = 'En pause'; }
      else if (enCours > 0) { etape = 'En fabrication'; }
      else if (affectes > 0) { etape = 'Affecté (pas démarré)'; }
      else {
        // aucune activité dans l'appli -> on reflète l'état CreaJit (honnête : pas encore lancé en interne)
        source = 'creajit';
        const ps = String(order.prod || order.productionStatus || '').toLowerCase();
        if (ps === 'completed') { etape = 'Prêt (CreaJit)'; pret = true; }
        else if (ps === 'in_progress') { etape = 'En fabrication (CreaJit)'; }
        else { etape = 'Pas encore lancé'; }
      }
      return {
        ref, totalArticles: arts.length, affectes, enCours, pause, finis,
        qcOk, qcAnomalie: qcAno, qcEnAttente: qcAtt, avecActivite,
        ouvriers: [...ouvriers], ateliers: [...ateliers], bons, bonsEnAttente,
        motifs, moTotal, livree, etape, pretALivrer: pret, source,
        // progression 0..100 (affecté 25, en cours 50, fini 75, qc ok 100)
        progression: arts.length ? Math.round(((affectes ? 25 : 0) + (enCours || finis ? 25 : 0) + (finis ? 25 : 0) + (qcOk === arts.length && arts.length ? 25 : 0))) : 0,
      };
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

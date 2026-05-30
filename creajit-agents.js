/* ============================================================
   CREAJIT IA — MOTEUR D'AGENTS
   Chaque agent surveille une partie de TON application
   (creajit-mes-v1 → page /commandes) et a une MISSION écrite (instructions).

   Données lues :
     window.CJ_ORDERS      (commandes live de ton app — via creajit-api.js)
     window.CJ_SALAIRES    (39 salariés)        window.CJ_ATELIERS (9 ateliers)
     window.CJ_MATIERES    (559 matières)        window.CJ_MASSE_SALARIALE
     window.CJ_COUT_HORAIRE / _MOYEN

   Chaque agent expose :
     id, nom, emoji, couleur, role, surveille[], mission (instructions),
     analyse(ctx) -> { resume, kpis:[{n,l}], alertes:[{niveau,txt}] }
       niveau: 'red' | 'org' | 'ok' | 'info'
   ============================================================ */
(function () {
  // ---- helpers ----
  var fmt = function (n) { return (Math.round(n) || 0).toLocaleString('fr-FR') + ' DH'; };
  var nf  = function (n) { return (n || 0).toLocaleString('fr-FR'); };
  function uniq(a) { return Array.from(new Set(a)); }

  // Contexte recalculé à chaque analyse (toujours les données les plus fraîches)
  function contexte() {
    var CJ = window.CJ_ORDERS || { stats: function(){return{};}, all:function(){return[];},
      parVendeur:function(){return[];}, enRetard:function(){return[];}, count:function(){return 0;} };
    return {
      CJ: CJ,
      s: CJ.stats(),
      orders: CJ.all(),
      total: CJ.count(),
      vendeurs: CJ.parVendeur(),
      retards: CJ.enRetard(),
      salaires: window.CJ_SALAIRES || [],
      ateliers: window.CJ_ATELIERS || [],
      matieres: window.CJ_MATIERES || [],
      masse: window.CJ_MASSE_SALARIALE || 0,
      coutHMoyen: window.CJ_COUT_HORAIRE_MOYEN || 60,
      live: window.CJ_DATA_SOURCE === 'live',
      fmt: fmt, nf: nf,
    };
  }

  // ============================================================
  // LES AGENTS
  // ============================================================
  var AGENTS = [

    // ---------- 1. LE VEILLEUR (supervision globale) ----------
    {
      id: 'veilleur', nom: 'Le Veilleur', emoji: '⚠️', couleur: '#E74C3C',
      role: 'Supervision générale',
      surveille: ['Tous les pôles', 'Alertes consolidées', 'Niveau de criticité'],
      mission:
        "Tu es Le Veilleur, le chef d'orchestre de la surveillance de l'atelier CreaJit. " +
        "Tu observes en permanence TOUTES les commandes de l'application de Driss. " +
        "Ton travail : repérer ce qui est URGENT et le remonter à Driss, classé du plus grave au moins grave. " +
        "Tu ne donnes jamais de détail inutile : tu vas droit au but, en une ligne par alerte. " +
        "Priorité absolue : 1) livraisons en retard, 2) commandes bloquées en fabrication, 3) gros impayés. " +
        "Si tout est calme, tu rassures clairement. Tu parles à Driss comme un bras droit fiable.",
      analyse: function (c) {
        var s = c.s, al = [];
        if (s.enRetard > 0) al.push({ niveau: 'red', txt: s.enRetard + ' livraison(s) en retard — à traiter en priorité' });
        if (s.enAttente > 40) al.push({ niveau: 'org', txt: s.enAttente + ' commandes en attente de fabrication (gros volume)' });
        else if (s.enAttente > 0) al.push({ niveau: 'org', txt: s.enAttente + ' commande(s) en attente de lancement' });
        if (s.reste > 0) al.push({ niveau: 'org', txt: c.fmt(s.reste) + ' à encaisser sur ' + s.impaye + ' commande(s)' });
        if (s.enFab > 0) al.push({ niveau: 'ok', txt: s.enFab + ' commande(s) en cours de fabrication' });
        if (!al.length) al.push({ niveau: 'ok', txt: "Rien d'urgent. Tout est sous contrôle." });
        var crit = s.enRetard * 3 + Math.min(s.enAttente || 0, 99) + (s.impaye > 0 ? 1 : 0);
        return {
          resume: 'Surveille ' + c.nf(c.total) + ' commandes en continu.',
          kpis: [
            { n: crit, l: 'criticité' },
            { n: al.filter(function (a) { return a.niveau !== 'ok'; }).length, l: 'alertes actives' },
            { n: c.nf(c.total), l: 'commandes scannées' },
            { n: c.live ? 'LIVE' : 'figé', l: 'source données' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 2. HANANE — PRODUCTION ----------
    {
      id: 'production', nom: 'Hanane', emoji: '🏭', couleur: '#3b82f6',
      role: 'Production · Fabrication',
      surveille: ['Statut de fabrication', 'Commandes en attente', 'Charge de l\'atelier'],
      mission:
        "Tu es Hanane, responsable production. Tu surveilles l'état de fabrication de chaque commande " +
        "(en attente, en cours, terminé). Ton objectif : qu'aucune commande ne traîne. " +
        "Tu alertes Driss quand trop de commandes attendent d'être lancées, ou quand une commande reste " +
        "bloquée trop longtemps en fabrication. Tu raisonnes en charge de travail pour les 9 ateliers. " +
        "Tu es concrète : tu dis combien de commandes, lesquelles, et quoi faire en premier.",
      analyse: function (c) {
        var s = c.s, al = [];
        if (s.enAttente > 40) al.push({ niveau: 'org', txt: s.enAttente + ' commandes à planifier — lancer les plus anciennes' });
        else if (s.enAttente > 0) al.push({ niveau: 'info', txt: s.enAttente + ' commande(s) en attente de lancement' });
        if (s.enFab > 0) al.push({ niveau: 'ok', txt: s.enFab + ' commande(s) en cours de fabrication' });
        if (s.termine > 0) al.push({ niveau: 'ok', txt: s.termine + ' commande(s) terminées' });
        if (!al.length) al.push({ niveau: 'ok', txt: 'Aucune commande en production pour l\'instant.' });
        return {
          resume: 'Veille la fabrication sur ' + c.ateliers.length + ' ateliers.',
          kpis: [
            { n: s.enFab || 0, l: 'en fabrication' },
            { n: s.enAttente || 0, l: 'en attente' },
            { n: s.termine || 0, l: 'terminées' },
            { n: c.nf(s.nbArticles), l: 'articles suivis' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 3. FATIMA — LIVRAISON ----------
    {
      id: 'livraison', nom: 'Fatima', emoji: '🚚', couleur: '#22C55E',
      role: 'Livraison · Logistique',
      surveille: ['Commandes à livrer', 'Retards de livraison', 'Livraisons faites'],
      mission:
        "Tu es Fatima, responsable livraison. Tu surveilles les livraisons : ce qui est à livrer, " +
        "ce qui est livré, et surtout ce qui est EN RETARD par rapport à la date prévue. " +
        "Une livraison en retard = un client mécontent : c'est ta priorité numéro un. " +
        "Tu donnes à Driss la liste des clients à rappeler et le nombre de jours de retard. " +
        "Tu organises les tournées pour livrer le plus de commandes possible.",
      analyse: function (c) {
        var s = c.s, al = [];
        if (s.enRetard > 0) {
          al.push({ niveau: 'red', txt: s.enRetard + ' livraison(s) en retard — prévenir les clients' });
          c.retards.slice(0, 3).forEach(function (o) {
            al.push({ niveau: 'red', txt: '↳ ' + (o.client || o.ref) + ' · ' + o.joursRetard + ' j de retard' });
          });
        } else {
          al.push({ niveau: 'ok', txt: 'Aucune livraison en retard.' });
        }
        if (s.aLivrer > 0) al.push({ niveau: 'info', txt: s.aLivrer + ' commande(s) à livrer (planning à faire)' });
        return {
          resume: 'Veille les livraisons et les retards clients.',
          kpis: [
            { n: s.aLivrer || 0, l: 'à livrer' },
            { n: s.livre || 0, l: 'livrées' },
            { n: s.enRetard || 0, l: 'en retard' },
            { n: c.nf(c.total), l: 'commandes' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 4. COMPTA — FINANCES ----------
    {
      id: 'finance', nom: 'Compta', emoji: '💰', couleur: '#EAB308',
      role: 'Finances · Encaissements',
      surveille: ['Chiffre d\'affaires', 'Encaissé vs reste dû', 'Impayés'],
      mission:
        "Tu es l'agent Compta. Tu surveilles l'argent : le chiffre d'affaires total des commandes, " +
        "ce qui est déjà encaissé, et surtout le RESTE DÛ (impayés). " +
        "Ton rôle : alerter Driss sur les commandes non soldées et le montant total à récupérer. " +
        "Tu compares aussi le CA aux charges (masse salariale " + nf(window.CJ_MASSE_SALARIALE || 221300) + " DH) " +
        "pour donner une idée de santé. Tu es rigoureux avec les chiffres, jamais approximatif.",
      analyse: function (c) {
        var s = c.s, al = [];
        if (s.reste > 0) al.push({ niveau: 'org', txt: c.fmt(s.reste) + ' à encaisser sur ' + s.impaye + ' commande(s)' });
        else al.push({ niveau: 'ok', txt: 'Tout est encaissé.' });
        if (c.masse > 0) al.push({ niveau: 'info', txt: 'Masse salariale de référence : ' + c.fmt(c.masse) + '/mois' });
        var tauxEnc = s.total > 0 ? Math.round((s.paye / s.total) * 100) : 0;
        return {
          resume: 'Veille les encaissements et les impayés.',
          kpis: [
            { n: c.fmt(s.total), l: 'CA total commandes' },
            { n: c.fmt(s.paye), l: 'encaissé (' + tauxEnc + '%)' },
            { n: c.fmt(s.reste), l: 'reste dû' },
            { n: s.impaye || 0, l: 'commandes impayées' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 5. COMMERCIALES ----------
    {
      id: 'commercial', nom: 'Kenza · Ikram · Laila', emoji: '👥', couleur: '#C4714F',
      role: 'Commercial · Ventes',
      surveille: ['Performance par commerciale', 'CA généré', 'Nombre de commandes'],
      mission:
        "Tu es l'agent Commercial. Tu surveilles la performance de l'équipe de vente " +
        "(Kenza, Ikram, Laila…). Pour chacune : nombre de commandes, CA généré, reste à encaisser. " +
        "Tu mets en avant la meilleure performance et tu signales qui a besoin d'un coup de pouce. " +
        "Tu aides Driss à animer son équipe commerciale avec des chiffres clairs et un classement.",
      analyse: function (c) {
        var pv = c.vendeurs.filter(function (v) { return v.nb >= 2; });
        var top = pv[0];
        var al = [];
        if (top) al.push({ niveau: 'ok', txt: 'Top vente : ' + top.vendeur.split(' ')[0] + ' — ' + c.fmt(top.ca) + ' (' + top.nb + ' cmd)' });
        pv.slice(1, 4).forEach(function (v) {
          al.push({ niveau: 'info', txt: v.vendeur.split(' ')[0] + ' — ' + c.fmt(v.ca) + ' (' + v.nb + ' cmd)' });
        });
        if (!pv.length) al.push({ niveau: 'info', txt: 'Pas encore assez de commandes pour un classement.' });
        return {
          resume: 'Classe les commerciales par CA généré.',
          kpis: [
            { n: pv.length || 0, l: 'commerciales actives' },
            { n: c.nf(c.total), l: 'commandes totales' },
            { n: top ? top.vendeur.split(' ')[0] : '—', l: 'meilleure vente' },
            { n: top ? c.fmt(top.ca) : '0 DH', l: 'son CA' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 6. MOUMEN — MAGASIN / MATIÈRES ----------
    {
      id: 'magasin', nom: 'Moumen', emoji: '📦', couleur: '#a78bfa',
      role: 'Magasin · Matières premières',
      surveille: ['Articles à préparer', 'Catalogue matières (559)', 'Fournisseurs'],
      mission:
        "Tu es Moumen, responsable magasin. Tu surveilles les besoins en matières pour les commandes " +
        "en cours, et tu connais le catalogue des 559 matières premières (références, fournisseurs, prix). " +
        "Ton rôle : t'assurer que les ateliers ne manquent de rien pour produire. " +
        "Tu signales les articles à préparer et tu peux retrouver le prix/fournisseur d'une matière. " +
        "NOTE : les quantités de stock en temps réel ne sont pas encore branchées — tu travailles sur " +
        "les besoins issus des commandes et le catalogue de référence.",
      analyse: function (c) {
        var fournisseurs = uniq(c.matieres.map(function (m) { return m.fournisseur; }).filter(Boolean));
        var aPreparer = (c.s.enFab || 0) + (c.s.enAttente || 0);
        var al = [];
        if (aPreparer > 0) al.push({ niveau: 'org', txt: aPreparer + ' commande(s) à approvisionner pour la production' });
        al.push({ niveau: 'info', txt: c.nf(c.matieres.length) + ' matières au catalogue · ' + fournisseurs.length + ' fournisseurs' });
        return {
          resume: 'Veille l\'appro des ateliers (catalogue 559 matières).',
          kpis: [
            { n: c.nf(c.s.nbArticles), l: 'articles commandés' },
            { n: aPreparer, l: 'commandes à préparer' },
            { n: c.nf(c.matieres.length), l: 'matières au catalogue' },
            { n: fournisseurs.length, l: 'fournisseurs' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 7. ATELIERS — CHARGE & COÛTS ----------
    {
      id: 'ateliers', nom: 'Les Ateliers', emoji: '🧰', couleur: '#06b6d4',
      role: 'Ateliers · Capacité',
      surveille: ['9 ateliers', 'Coût horaire par atelier', 'Charge globale'],
      mission:
        "Tu es l'agent Ateliers. Tu connais les 9 ateliers de CreaJit (Tapisserie, Menuiserie, Peinture, " +
        "Ferronnerie, Pierre, Cuivre, Résine, CNC…), leurs chefs et leur coût horaire chargé. " +
        "Tu surveilles la charge de travail globale et tu aides Driss à équilibrer la production " +
        "entre ateliers. Tu donnes les coûts horaires pour estimer le coût de fabrication. " +
        "NOTE : la répartition fine des commandes par atelier sera affinée quand l'app exposera le détail des articles par atelier.",
      analyse: function (c) {
        var al = [];
        al.push({ niveau: 'info', txt: c.ateliers.length + ' ateliers actifs · coût horaire moyen ' + c.coutHMoyen + ' DH' });
        if ((c.s.enFab || 0) + (c.s.enAttente || 0) > 0)
          al.push({ niveau: 'org', txt: ((c.s.enFab || 0) + (c.s.enAttente || 0)) + ' commande(s) à répartir sur les ateliers' });
        var chers = c.ateliers.slice().sort(function (a, b) { return (b.coutH || 0) - (a.coutH || 0); })[0];
        if (chers) al.push({ niveau: 'info', txt: 'Atelier le plus coûteux : ' + chers.nom + ' (' + chers.coutH + ' DH/h)' });
        return {
          resume: 'Veille la capacité des 9 ateliers.',
          kpis: [
            { n: c.ateliers.length, l: 'ateliers' },
            { n: c.coutHMoyen + ' DH', l: 'coût horaire moyen' },
            { n: (c.s.enFab || 0) + (c.s.enAttente || 0), l: 'à répartir' },
            { n: c.salaires.length, l: 'effectif total' },
          ],
          alertes: al,
        };
      },
    },

    // ---------- 8. RH / PAIE ----------
    {
      id: 'rh', nom: 'RH · Paie', emoji: '👷', couleur: '#f472b6',
      role: 'Ressources humaines · Salaires',
      surveille: ['39 salariés', 'Masse salariale', 'Coût main d\'œuvre'],
      mission:
        "Tu es l'agent RH & Paie. Tu connais les 39 salariés de CreaJit (nom, poste, atelier, salaire, coût horaire). " +
        "Tu surveilles la masse salariale (" + nf(window.CJ_MASSE_SALARIALE || 221300) + " DH/mois) et le coût de la main d'œuvre. " +
        "Tu peux répondre sur le salaire d'un employé, l'effectif d'un atelier, le coût horaire d'un poste. " +
        "NOTE : le pointage en temps réel (présents/absents/retards) viendra de la pointeuse — tu l'intégreras quand il sera branché.",
      analyse: function (c) {
        var parAtelier = {};
        c.salaires.forEach(function (e) { var a = e.atelier || '?'; parAtelier[a] = (parAtelier[a] || 0) + 1; });
        var chefs = c.salaires.filter(function (e) { return /chef/i.test(e.poste || ''); }).length;
        return {
          resume: 'Veille l\'effectif et la masse salariale.',
          kpis: [
            { n: c.salaires.length, l: 'salariés' },
            { n: c.fmt(c.masse), l: 'masse salariale/mois' },
            { n: chefs, l: 'chefs d\'atelier' },
            { n: Object.keys(parAtelier).length, l: 'ateliers pourvus' },
          ],
          alertes: [
            { niveau: 'info', txt: c.salaires.length + ' salariés · ' + c.fmt(c.masse) + '/mois de masse salariale' },
            { niveau: 'info', txt: 'Pointage temps réel : à brancher sur la pointeuse' },
          ],
        };
      },
    },

    // ---------- 9. RENTABILITÉ ----------
    {
      id: 'rentabilite', nom: 'Rentabilité', emoji: '🧮', couleur: '#34d399',
      role: 'Marge · Coût de revient',
      surveille: ['CA vs charges', 'Marge estimée', 'Panier moyen'],
      mission:
        "Tu es l'agent Rentabilité. Tu mets en regard le chiffre d'affaires des commandes et les charges " +
        "(masse salariale, coûts horaires ateliers) pour estimer la marge et la santé de l'activité. " +
        "Tu calcules le panier moyen par commande. Tu alertes si la rentabilité se dégrade. " +
        "Tu restes prudent : tu indiques quand un chiffre est une estimation, jamais une certitude. " +
        "Tu aides Driss à décider avec des ordres de grandeur fiables.",
      analyse: function (c) {
        var s = c.s;
        var panier = c.total > 0 ? s.total / c.total : 0;
        var al = [];
        al.push({ niveau: 'info', txt: 'Panier moyen : ' + c.fmt(panier) + ' par commande' });
        if (c.masse > 0 && s.paye > 0) {
          var couv = Math.round((s.paye / c.masse) * 100);
          al.push({ niveau: couv < 100 ? 'org' : 'ok', txt: 'Encaissé = ' + couv + '% d\'un mois de masse salariale' });
        }
        al.push({ niveau: 'info', txt: 'Estimation — affinée avec le coût matières par commande (à venir)' });
        return {
          resume: 'Estime la marge et la santé financière.',
          kpis: [
            { n: c.fmt(panier), l: 'panier moyen' },
            { n: c.fmt(s.total), l: 'CA potentiel' },
            { n: c.fmt(c.masse), l: 'charges salariales/mois' },
            { n: c.coutHMoyen + ' DH', l: 'coût horaire moyen' },
          ],
          alertes: al,
        };
      },
    },

  ];

  // ============================================================
  // API publique
  // ============================================================
  window.CJ_AGENTS = {
    liste: function () { return AGENTS; },
    get: function (id) { return AGENTS.filter(function (a) { return a.id === id; })[0]; },
    contexte: contexte,
    // Analyse un agent (ou tous) avec le contexte courant
    analyser: function (id) {
      var c = contexte();
      var a = this.get(id);
      return a ? a.analyse(c) : null;
    },
    analyserTout: function () {
      var c = contexte();
      return AGENTS.map(function (a) {
        var r;
        try { r = a.analyse(c); } catch (e) { r = { resume: '', kpis: [], alertes: [{ niveau: 'info', txt: 'données indisponibles' }] }; }
        return { agent: a, resultat: r };
      });
    },
  };
})();

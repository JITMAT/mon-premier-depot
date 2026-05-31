/* ============================================================
   CREAJIT IA — Ateliers, départements, équipes & SALAIRES réels
   Source EXACTE : document « CREAJIT — Tous les Ateliers » (Driss).
   9 ateliers A→I · départements · chefs · tenues · salaires · heures · coût/h.
   ============================================================ */
(function () {
  // Chaque atelier : code, nom produit, chef général, couleur de tenue, départements.
  // dept : code, nom, chef, fabrique, equipe [{n, sal}], heures (mois), coutH (DH/h).
  var ATELIERS = [
    { code: 'A', chef: 'Ayoub El Yagiz', produits: 'Canapé • Fauteuil • Lit • Sommier • Méridienne',
      tenue: 'Bleue', couleur: '#3b82f6',
      depts: [
        { code: 'DA01', nom: 'Tapisserie Canapés', chef: 'Ayoub El Yagiz', fabrique: 'Canapé, Fauteuil, Méridienne', heures: 528, coutH: 67,
          equipe: [{ n: 'Ayoub El Yagiz', sal: 6000 }, { n: 'Abdessamie El Yagiz', sal: 6000 }, { n: 'Labiade De Mohssine', sal: 3900 }] },
        { code: 'DA02', nom: 'Menuiserie carcasse canapé', chef: 'Said Lamghari', fabrique: 'Carcasse Canapé, Fauteuil, Méridienne', heures: 352, coutH: 64,
          equipe: [{ n: 'Said Lamghari', sal: 5000 }, { n: 'Abdelhadi Bouchfer', sal: 5000 }] },
        { code: 'DA03', nom: 'Tapisserie Lits', chef: 'Mohamad Marhoub', fabrique: 'Lit, Sommier', heures: 352, coutH: 64,
          equipe: [{ n: 'Mohamad Marhoub', sal: 6000 }, { n: 'Hassan Labiad', sal: 3900 }] },
        { code: 'DA04', nom: 'Menuiserie carcasse lit', chef: 'Abdelaati Lafdili', fabrique: 'Carcasse Lit, Sommier', heures: 176, coutH: 64,
          equipe: [{ n: 'Abdelaati Lafdili', sal: 5000 }] },
        { code: 'DA05', nom: 'Couture', chef: 'Mohamed Fadil El Mouaden', fabrique: 'Tous produits', heures: 176, coutH: 71,
          equipe: [{ n: 'Mohamed Fadil El Mouaden', sal: 6000 }] },
        { code: 'DA06', nom: 'Confection Rideaux', chef: 'Ayoub El Yagiz', fabrique: 'Rideaux tous produits', heures: 176, coutH: 68,
          equipe: [{ n: 'Ayoub El Yagiz', sal: 6000 }] },
      ] },
    { code: 'B', chef: 'Ahmed Araji', produits: 'Chaise • Transat • ShowRoom • Standard',
      tenue: 'Orange', couleur: '#f97316',
      depts: [
        { code: 'DB01', nom: 'Tapisserie', chef: 'Ahmed Araji', fabrique: 'Chaise tapissée, Transat, ShowRoom, Standard', heures: 704, coutH: 67,
          equipe: [{ n: 'Ahmed Araji', sal: 6000 }, { n: 'Abdelilah Dakhama', sal: 6000 }, { n: 'Le Boudrif De Mustapha', sal: 5000 }, { n: 'Abdelmajid Anjar', sal: 5000 }] },
        { code: 'DB02', nom: 'Carcasse Canapé & Lit', chef: 'Khalid Houfati', fabrique: 'Carcasse canapé, lit', heures: 176, coutH: 64,
          equipe: [{ n: 'Khalid Houfati', sal: 5000 }] },
        { code: 'DB03', nom: 'Couture', chef: 'Youssef Argibi', fabrique: 'Couture chaise, Finitions', heures: 176, coutH: 71,
          equipe: [{ n: 'Youssef Argibi', sal: 5000 }] },
        { code: 'DB04', nom: 'Ferronnerie', chef: 'Yassine Madidi', fabrique: 'Chaise métal, Transat, Assemblages', heures: 352, coutH: 64,
          equipe: [{ n: 'Yassine Madidi', sal: 5000 }, { n: 'Adil Rehaimine', sal: 5500 }] },
        { code: 'DB05', nom: 'Carcasse Chaise Bois', chef: 'Souhail Sakat', fabrique: 'Carcasse chaise bois, Pièces bois', heures: 176, coutH: 64,
          equipe: [{ n: 'Souhail Sakat', sal: 5000 }] },
        { code: 'DB06', nom: 'Peinture', chef: 'Youssef Ben Elarradia', fabrique: 'Peinture chaise, transat, Finitions', heures: 176, coutH: 68,
          equipe: [{ n: 'Youssef Ben Elarradia', sal: 5500 }] },
      ] },
    { code: 'C', chef: 'Bahri El Othmani', produits: 'Découpe Laser • Usinage CNC • Gravure',
      tenue: 'Violette', couleur: '#8b5cf6',
      depts: [
        { code: 'DC01', nom: 'CNC & Laser', chef: 'Bahri El Othmani', fabrique: 'Découpe Laser, Usinage CNC, Gravure', heures: 176, coutH: 28,
          equipe: [{ n: 'Bahri El Othmani', sal: 5000 }] },
      ] },
    { code: 'D', chef: 'Ettaib Bougatouch', produits: 'Moules Résine • Polystyrène • Moulage',
      tenue: 'Cyan', couleur: '#06b6d4',
      depts: [
        { code: 'DD01', nom: 'Résine & Polystyrène', chef: 'Ettaib Bougatouch', fabrique: 'Moules Résine, Polystyrène, Moulage', heures: 352, coutH: 71,
          equipe: [{ n: 'Ettaib Bougatouch', sal: 5000 }, { n: 'Rachid Ait Taleb', sal: 20000, note: 'payé 5 000 DH/semaine' }] },
      ] },
    { code: 'E', chef: 'Dit Chnitifa', produits: 'Menuiserie • Bois • Structures',
      tenue: 'Marron', couleur: '#92400e',
      depts: [
        { code: 'DE01', nom: 'Menuiserie', chef: 'Dit Chnitifa', fabrique: 'Meubles bois, Structures, Pièces sur mesure', heures: 880, coutH: 70,
          equipe: [{ n: 'Dit Chnitifa', sal: 8000 }, { n: 'Chaise Ayoub', sal: 6000 }, { n: 'Mourad Zemit', sal: 5000 }, { n: 'Redouan Houfati', sal: 5000 }, { n: 'El Mahdi Bahaj', sal: 5000 }] },
      ] },
    { code: 'F', chef: 'Mohamed Elkarmani', produits: 'Peinture • Laque • Finitions',
      tenue: 'Rouge', couleur: '#ef4444',
      depts: [
        { code: 'DF01', nom: 'Peinture', chef: 'Mohamed Elkarmani', fabrique: 'Peinture meubles, Laque, Finitions, Patine', heures: 880, coutH: 55,
          equipe: [{ n: 'Mohamed Elkarmani', sal: 5500 }, { n: 'Abdelaaziz Ben Amer', sal: 5000 }, { n: 'Mohamed Elmoussaoui', sal: 5000 }, { n: 'Mouad Elmaamlem', sal: 4000 }, { n: 'Milouda El Azaoui', sal: 3500 }, { n: 'Youssef Ibnradiya', sal: 5000 }] },
      ] },
    { code: 'G', chef: 'Mohamed Boualili', produits: 'Ferronnerie • Soudure • Métal',
      tenue: 'Grise', couleur: '#6b7280',
      depts: [
        { code: 'DG01', nom: 'Ferronnerie & Soudure', chef: 'Mohamed Boualili', fabrique: 'Structures métal, Soudure, Ferronnerie décorative', heures: 352, coutH: 63,
          equipe: [{ n: 'Mohamed Boualili', sal: 5500 }, { n: 'Abdelghani Malih', sal: 5000 }] },
      ] },
    { code: 'H', chef: 'Mustapha Aababou', produits: 'Pierre • Marbre • Céramique',
      tenue: 'Beige', couleur: '#d97706',
      depts: [
        { code: 'DH01', nom: 'Pierre & Marbre', chef: 'Mustapha Aababou', fabrique: 'Taille pierre, Marbre, Céramique, Mosaïque', heures: 528, coutH: 72,
          equipe: [{ n: 'Mustapha Aababou', sal: 8000 }, { n: 'Anoir Touati', sal: 5000 }, { n: 'Amine Samadi', sal: 5000 }] },
      ] },
    { code: 'I', chef: 'Noureddine Ouzzat', produits: 'Cuivre • Laiton • Métaux précieux',
      tenue: 'Dorée', couleur: '#b45309',
      depts: [
        { code: 'DI01', nom: 'Cuivre & Laiton', chef: 'Noureddine Ouzzat', fabrique: 'Pièces cuivre, Laiton décoratif, Accessoires', heures: 176, coutH: 73,
          equipe: [{ n: 'Noureddine Ouzzat', sal: 6000 }] },
      ] },
  ];

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  }

  // Liste à plat des ouvriers (dédupliquée : Ayoub = 1 personne même s'il gère 2 départements)
  var vus = {}, FLAT = [];
  ATELIERS.forEach(function (at) {
    at.depts.forEach(function (d) {
      d.equipe.forEach(function (m) {
        var k = norm(m.n);
        if (vus[k]) { // déjà compté : on note juste son 2e département
          vus[k].depts.push(d.code);
          return;
        }
        var rec = { n: m.n, key: k, sal: m.sal, note: m.note || '', atelier: at.code, atColor: at.couleur,
                    tenue: at.tenue, poste: (d.chef === m.n ? 'Chef ' + d.nom : d.nom), coutH: d.coutH,
                    depts: [d.code] };
        vus[k] = rec; FLAT.push(rec);
      });
    });
  });

  // Totaux
  ATELIERS.forEach(function (at) {
    at.salaires = at.depts.reduce(function (s, d) { return s + d.equipe.reduce(function (ss, m) { return ss + m.sal; }, 0); }, 0);
    at.heures = at.depts.reduce(function (s, d) { return s + d.heures; }, 0);
    at.nbOuvriers = at.depts.reduce(function (s, d) { return s + d.equipe.length; }, 0);
  });

  window.CJ_ATELIERS_DOC = ATELIERS;
  window.CJ_SALAIRES = FLAT;                              // 1 ligne par personne (dédupliquée)
  window.CJ_MASSE_SALARIALE = FLAT.reduce(function (s, e) { return s + e.sal; }, 0); // masse réelle (sans double compte)
  window.cjNormNom = norm;
  // mots non distinctifs (initiales, particules) à ignorer pour la correspondance
  var STOP = { m: 1, el: 1, le: 1, de: 1, ben: 1, ait: 1, dit: 1, la: 1, du: 1 };
  function motsCles(nom) {
    return String(nom || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/[^a-z]+/).filter(function (w) { return w.length >= 3 && !STOP[w]; });
  }
  // retrouve le salaire d'un ouvrier — tolère les variantes d'orthographe
  // (ex. « M. Fadil El Mouaden » = « Mohamed Fadil El Mouaden », « Mustapha Boudrif » = « Le Boudrif De Mustapha »)
  window.cjSalaire = function (nom) {
    var k = norm(nom);
    var exact = FLAT.find(function (e) { return e.key === k; });
    if (exact) return exact;
    var sub = FLAT.find(function (e) { return e.key.indexOf(k) >= 0 || k.indexOf(e.key) >= 0; });
    if (sub) return sub;
    // correspondance par mots-clés : tous les mots distinctifs du plus court présents dans l'autre
    var mc = motsCles(nom);
    if (!mc.length) return null;
    return FLAT.find(function (e) {
      var me = motsCles(e.n);
      if (!me.length) return false;
      var court = mc.length <= me.length ? mc : me;
      var longSet = {}; (mc.length <= me.length ? me : mc).forEach(function (w) { longSet[w] = 1; });
      var communs = court.filter(function (w) { return longSet[w]; }).length;
      return communs >= court.length && communs >= 2; // au moins 2 mots-clés tous partagés
    }) || null;
  };
})();

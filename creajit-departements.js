/* ============================================================
   CREAJIT IA — Référentiel des DÉPARTEMENTS d'atelier
   ------------------------------------------------------------
   Source : document « CREAJIT — Tous les Ateliers » (Driss).
   Chaque atelier est une « petite usine » découpée en départements,
   chacun avec son chef, son équipe et SON coût horaire chargé.
   Le coût de revient d'un article = somme des étapes (départements)
   qu'il traverse × coût horaire de chaque département.
   ============================================================ */
(function () {
  // dept : { code, atelier, nom, chef, coutH, fabrique:[...], parcoursTypiques }
  var DEPTS = [
    // ===== Atelier A — Canapé / Fauteuil / Lit / Sommier / Méridienne =====
    { code: 'DA01', atelier: 'A', nom: 'Tapisserie Canapés', chef: 'Ayoub El Yagiz', coutH: 67, fabrique: ['Canapé', 'Fauteuil', 'Méridienne'] },
    { code: 'DA02', atelier: 'A', nom: 'Menuiserie carcasse canapé', chef: 'Said Lamghari', coutH: 64, fabrique: ['Carcasse Canapé', 'Carcasse Fauteuil', 'Carcasse Méridienne'] },
    { code: 'DA03', atelier: 'A', nom: 'Tapisserie Lits', chef: 'Mohamad Marhoub', coutH: 64, fabrique: ['Lit', 'Sommier'] },
    { code: 'DA04', atelier: 'A', nom: 'Menuiserie carcasse lit', chef: 'Abdelaati Lafdili', coutH: 64, fabrique: ['Carcasse Lit', 'Sommier'] },
    { code: 'DA05', atelier: 'A', nom: 'Couture', chef: 'Mohamed Fadil El Mouaden', coutH: 71, fabrique: ['Canapé', 'Fauteuil', 'Lit', 'Sommier', 'Méridienne'] },
    { code: 'DA06', atelier: 'A', nom: 'Confection Rideaux', chef: 'Ayoub El Yagiz', coutH: 68, fabrique: ['Rideaux'] },
    // ===== Atelier B — Chaise / Transat / ShowRoom / Standard =====
    { code: 'DB01', atelier: 'B', nom: 'Tapisserie', chef: 'Ahmed Araji', coutH: 67, fabrique: ['Chaise tapissée', 'Transat', 'ShowRoom', 'Standard'] },
    { code: 'DB02', atelier: 'B', nom: 'Carcasse Canapé & Lit', chef: 'Khalid Houfati', coutH: 64, fabrique: ['Carcasse canapé', 'Carcasse lit'] },
    { code: 'DB03', atelier: 'B', nom: 'Couture', chef: 'Youssef Argibi', coutH: 71, fabrique: ['Couture chaise', 'Finitions'] },
    { code: 'DB04', atelier: 'B', nom: 'Ferronnerie', chef: 'Yassine Madidi', coutH: 64, fabrique: ['Chaise métal', 'Transat structure', 'Assemblages'] },
    { code: 'DB05', atelier: 'B', nom: 'Carcasse Chaise Bois', chef: 'Souhail Sakat', coutH: 64, fabrique: ['Carcasse chaise bois', 'Pièces bois'] },
    { code: 'DB06', atelier: 'B', nom: 'Peinture', chef: 'Youssef Ben Elarradia', coutH: 68, fabrique: ['Peinture chaise', 'Peinture transat', 'Finitions'] },
    // ===== Ateliers C → I — 1 département chacun =====
    { code: 'DC01', atelier: 'C', nom: 'CNC & Laser', chef: 'Bahri El Othmani', coutH: 28, fabrique: ['Découpe Laser', 'Usinage CNC', 'Gravure'] },
    { code: 'DD01', atelier: 'D', nom: 'Résine & Polystyrène', chef: 'Ettaib Bougatouch', coutH: 71, fabrique: ['Moules Résine', 'Pièces Polystyrène', 'Moulage'] },
    { code: 'DE01', atelier: 'E', nom: 'Menuiserie', chef: 'Dit Chnitifa', coutH: 70, fabrique: ['Meubles bois', 'Structures', 'Pièces sur mesure'] },
    { code: 'DF01', atelier: 'F', nom: 'Peinture', chef: 'Mohamed Elkarmani', coutH: 55, fabrique: ['Peinture meubles', 'Laque', 'Finitions', 'Patine'] },
    { code: 'DG01', atelier: 'G', nom: 'Ferronnerie & Soudure', chef: 'Mohamed Boualili', coutH: 63, fabrique: ['Structures métal', 'Soudure', 'Ferronnerie décorative'] },
    { code: 'DH01', atelier: 'H', nom: 'Pierre & Marbre', chef: 'Mustapha Aababou', coutH: 72, fabrique: ['Taille pierre', 'Marbre', 'Céramique', 'Mosaïque'] },
    { code: 'DI01', atelier: 'I', nom: 'Cuivre & Laiton', chef: 'Noureddine Ouzzat', coutH: 73, fabrique: ['Pièces cuivre', 'Laiton décoratif', 'Accessoires'] },
  ];

  // Parcours typiques par grande famille de produit (chaîne de départements)
  var PARCOURS = {
    'Canapé':    ['DA02', 'DA01', 'DA05', 'DA06'],
    'Fauteuil':  ['DA02', 'DA01', 'DA05'],
    'Méridienne':['DA02', 'DA01', 'DA05'],
    'Lit':       ['DA04', 'DA03', 'DA05'],
    'Sommier':   ['DA04', 'DA03'],
    'Chaise':    ['DB05', 'DB01', 'DB03', 'DB06'],
    'Transat':   ['DB04', 'DB01', 'DB06'],
    'Table':     ['DE01', 'DF01'],
    'Pierre':    ['DH01'],
    'Travertin': ['DH01', 'DF01'],
    'Cuivre':    ['DI01'],
  };

  window.CJ_DEPTS = DEPTS;
  window.CJ_PARCOURS = PARCOURS;
  // Helpers
  window.cjDept = function (code) { return DEPTS.find(function (d) { return d.code === code; }) || null; };
  window.cjDeptsAtelier = function (atelier) { return DEPTS.filter(function (d) { return d.atelier === atelier; }); };
  window.cjCoutDept = function (code) { var d = window.cjDept(code); return d ? d.coutH : (window.coutHoraire ? window.coutHoraire(code && code[1]) : 60); };
  // devine le parcours d'après le nom de l'article (sinon vide -> à choisir à la main)
  window.cjParcoursPour = function (nomArticle) {
    var n = String(nomArticle || '').toLowerCase();
    var clefs = Object.keys(PARCOURS);
    for (var i = 0; i < clefs.length; i++) { if (n.indexOf(clefs[i].toLowerCase()) >= 0) return PARCOURS[clefs[i]].slice(); }
    return [];
  };
})();

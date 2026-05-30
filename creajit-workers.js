// Registre partagé des agents CREAJIT (direction + ouvriers réels par atelier).
// id = identifiant stable. 'page' = mini-site dédié si existant, sinon on ouvre
// la fiche personnelle générique ouvrier.html?w=<id>.
(function () {
  // Direction & agents à mini-site dédié
  var DIRECTION = [
    { id: 'driss',   nm: 'Driss',          role: 'Patron',                  page: 'index.html' },
    { id: 'kenza',   nm: 'Kenza',          role: 'Commerciale', page: 'kenza.html' },
    { id: 'sabiri',  nm: 'Mohamed Sabiri', role: 'Comptable / Finance', page: 'sabiri.html' },
    { id: 'hanane',  nm: 'Hanane Ajdi',    role: 'Exploitation',            page: 'hanane.html' },
    { id: 'said',    nm: 'Said Chnitifa',  role: 'Chef de tous les ateliers' },
    { id: 'fatima',  nm: 'Fatima Ezzahra', role: 'Qualité & Logistique', page: 'fatima.html' },
    { id: 'mohamedmag', nm: 'Mohamed Moumen', role: 'Magasin / Achat',      page: 'magasin.html' },
    { id: 'hassan',  nm: 'Hassan Laagouri',role: 'Réception',               page: 'reception.html' },
  ];
  // Ouvriers réels par atelier (fiche Ateliers CreaJit)
  var OUVRIERS = [
    ['F','Youssef Ibnradiya','ibnradiya'],
    ['A','Ayoub El Yagiz',null,1],['A','Abdessamie El Yagiz'],['A','Labiade De Mohssine'],['A','Said Lamghari'],['A','Abdelhadi Bouchfer'],['A','Mohamad Marhoub'],['A','Hassan Labiad'],['A','Abdelaati Lafdili'],['A','M. Fadil El Mouaden'],
    ['B','Ahmed Araji',null,1],['B','Abdelilah Dakhama'],['B','Mustapha Boudrif'],['B','Abdelmajid Anjar'],['B','Khalid Houfati'],['B','Youssef Argibi'],['B','Yassine Madidi'],['B','Adil Rehaimine'],['B','Souhail Sakat'],['B','Youssef Ben Elarradia'],
    ['C','Bahri El Othmani',null,1],
    ['D','Ettaib Bougatouch',null,1],['D','Rachid Ait Taleb'],
    ['E','Dit Chnitifa',null,1],['E','Chaise Ayoub'],['E','Mourad Zemit'],['E','Redouan Houfati'],['E','El Mahdi Bahaj'],
    ['F','Mohamed Elkarmani',null,1],['F','Abdelaaziz Ben Amer'],['F','Mohamed Elmoussaoui'],['F','Mouad Elmaamlem'],['F','Milouda El Azaoui'],
    ['G','Mohamed Boualili',null,1],['G','Abdelghani Malih'],
    ['H','Mustapha Aababou',null,1],['H','Anoir Touati'],['H','Amine Samadi'],
    ['I','Noureddine Ouzzat',null,1],
  ].map(function (w) { return { at: w[0], nm: w[1], id: w[2] || w[1].toLowerCase().replace(/[^a-z]/g, ''), chef: !!w[3] }; });

  window.CJ_DIRECTION = DIRECTION;
  window.CJ_OUVRIERS = OUVRIERS;
  window.CJ_WORKERS = DIRECTION.concat(OUVRIERS); // tout le monde (pour la fiche perso)
})();

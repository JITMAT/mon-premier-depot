// Base de données complète salariés ateliers CREAJIT
// Source: Liste officielle 60 salariés — Mai 2026
// 37 ouvriers de production · 208h/mois

export const AT = [
  {id:'tapissier',  n:'Tapisserie',     e:'🧵', c:'#9B59B6'},
  {id:'menuiserie', n:'Menuiserie',     e:'🪵', c:'#27AE60'},
  {id:'peinture',   n:'Peinture',       e:'🎨', c:'#E67E22'},
  {id:'ferroniere', n:'Ferronnerie',    e:'🔧', c:'#7F8C8D'},
  {id:'cuivre',     n:'Cuivre/Laiton',  e:'🟡', c:'#D4A017'},
  {id:'pierre',     n:'Pierre',         e:'🪨', c:'#8D6748'},
  {id:'resine',     n:'Polystyrène',    e:'💧', c:'#1ABC9C'},
  {id:'cnc',        n:'CNC Laser',      e:'⚡', c:'#4A90D9'},
]

export const EMP = [
  // ─── TAPISSERIE (12) ─────────────────────────────────────────
  {id:'e04', num:4,  n:'Abdelilah Dakhama',        at:'tapissier',  tx:28.8, sal:6000, poste:'Tapissier',                  paiement:'mois',    tel:'+212603331438'},
  {id:'e05', num:5,  n:'Mohamed Fadil El Mouaden',  at:'tapissier',  tx:28.8, sal:6000, poste:'Tapissier',                  paiement:'mois',    tel:null},
  {id:'e07', num:7,  n:'Ahmed El Araji',            at:'tapissier',  tx:28.8, sal:6000, poste:'Chef Tapissier',             paiement:'mois',    tel:null},
  {id:'e09', num:9,  n:'Ayoub El Yagiz',            at:'tapissier',  tx:28.8, sal:6000, poste:'Chef Tapissier',             paiement:'mois',    tel:'+212671231799'},
  {id:'e16', num:16, n:'El Mustapha Boudrif',       at:'tapissier',  tx:24.0, sal:5000, poste:'Tapissier',                  paiement:'mois',    tel:'+212678978307'},
  {id:'e18', num:18, n:'Hassan Labiad',             at:'tapissier',  tx:18.8, sal:3900, poste:'Tapissier',                  paiement:'mois',    tel:'+212644682956'},
  {id:'e24', num:24, n:'Mohssine Labiad',           at:'tapissier',  tx:18.8, sal:3900, poste:'Tapissier',                  paiement:'mois',    tel:'+212621966307'},
  {id:'e27', num:27, n:'Youssef Argibi',            at:'tapissier',  tx:24.0, sal:5000, poste:'Tapissier',                  paiement:'mois',    tel:null},
  {id:'e31', num:31, n:'Abdessamie El Yagiz',       at:'tapissier',  tx:28.8, sal:6000, poste:'Tapissier',                  paiement:'mois',    tel:'+212772756872'},
  {id:'e34', num:34, n:'Abdelmajid Anjar',          at:'tapissier',  tx:24.0, sal:5000, poste:'Tapissier',                  paiement:'semaine', tel:null},
  {id:'e38', num:38, n:'Mustapha Aourik',           at:'tapissier',  tx:24.0, sal:5000, poste:'Tapissier',                  paiement:'mois',    tel:null},
  {id:'e60', num:60, n:'Mohamad Marhoub',           at:'tapissier',  tx:28.8, sal:6000, poste:'Chef Tapissier',             paiement:'mois',    tel:'+212696188040'},
  // ─── MENUISERIE (10) ─────────────────────────────────────────
  {id:'e14', num:14, n:'Ayoub Chair',               at:'menuiserie', tx:28.8, sal:6000, poste:'Chef Atelier Menuiserie',    paiement:'mois',    tel:'+212698578474'},
  {id:'e25', num:25, n:'Khalid El Boudy',           at:'menuiserie', tx:26.4, sal:5500, poste:'Menuisier',                  paiement:'mois',    tel:null},
  {id:'e35', num:35, n:'Souhail Sakat',             at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'mois',    tel:null},
  {id:'e37', num:37, n:'Mourad Zemit',              at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'semaine', tel:null},
  {id:'e39', num:39, n:'Abdelhadi Bouchfer',        at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'semaine', tel:null},
  {id:'e40', num:40, n:'Said Chnitifa',             at:'menuiserie', tx:38.5, sal:8000, poste:'Menuisier',                  paiement:'mois',    tel:'+212606394015'},
  {id:'e46', num:46, n:'Khalid Houfati',            at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'semaine', tel:null},
  {id:'e49', num:49, n:'Abdelaati Lafdili',         at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'semaine', tel:null},
  {id:'e51', num:51, n:'Redouan Houfati',           at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'semaine', tel:null},
  {id:'e57', num:57, n:'El Mahdi Bahaj',            at:'menuiserie', tx:24.0, sal:5000, poste:'Menuisier',                  paiement:'semaine', tel:null},
  // ─── PEINTURE (5) ────────────────────────────────────────────
  {id:'e08', num:8,  n:'Mohamed Elkarmani',         at:'peinture',   tx:26.4, sal:5500, poste:'Peintre',                   paiement:'mois',    tel:'+212697735992'},
  {id:'e15', num:15, n:'Youssef Ben Elarradia',     at:'peinture',   tx:26.4, sal:5500, poste:'Peintre',                   paiement:'mois',    tel:null},
  {id:'e41', num:41, n:'Mohamed Elmoussaoui',       at:'peinture',   tx:24.0, sal:5000, poste:'Peintre',                   paiement:'semaine', tel:null},
  {id:'e47', num:47, n:'Abdelaaziz Ben Amer',       at:'peinture',   tx:24.0, sal:5000, poste:'Peintre',                   paiement:'mois',    tel:null},
  {id:'e48', num:48, n:'Mouad Elmaamlem',           at:'peinture',   tx:19.2, sal:4000, poste:'Peintre',                   paiement:'mois',    tel:null},
  // ─── FERRONNERIE & SOUDURE (4) ──────────────────────────────
  {id:'e19', num:19, n:'Mohamed Boualili',          at:'ferroniere', tx:26.4, sal:5500, poste:'Ferronier',                  paiement:'mois',    tel:null},
  {id:'e30', num:30, n:'Abdelghani Malih',          at:'ferroniere', tx:24.0, sal:5000, poste:'Ferronier',                  paiement:'mois',    tel:null},
  {id:'e20', num:20, n:'Yassine Madidi',            at:'ferroniere', tx:24.0, sal:5000, poste:'Soudeur',                    paiement:'mois',    tel:'+212677246864'},
  {id:'e59', num:59, n:'Adil Rehaimine',            at:'ferroniere', tx:24.0, sal:5000, poste:'Soudeur',                    paiement:'mois',    tel:'+212699029233'},
  // ─── CUIVRE (1) ──────────────────────────────────────────────
  {id:'e06', num:6,  n:'Noureddine Ouzzat',         at:'cuivre',     tx:28.8, sal:6000, poste:'Chef Atelier Cuivre',        paiement:'mois',    tel:'+212670560259'},
  // ─── PIERRE (3) ──────────────────────────────────────────────
  {id:'e21', num:21, n:'Mustapha Aababou',          at:'pierre',     tx:38.5, sal:8000, poste:'Responsable Atelier Pierre', paiement:'mois',    tel:'+212667010127'},
  {id:'e33', num:33, n:'Amine Samadi',              at:'pierre',     tx:24.0, sal:5000, poste:'Maçon Pierre',               paiement:'semaine', tel:null},
  {id:'e54', num:54, n:'Anoir Touati',              at:'pierre',     tx:24.0, sal:5000, poste:'Maçon Pierre',               paiement:'mois',    tel:null},
  // ─── CNC LASER (2) ───────────────────────────────────────────
  {id:'e56', num:56, n:'Ettaib Bougatouch',         at:'cnc',        tx:24.0, sal:5000, poste:'Opérateur CNC',              paiement:'mois',    tel:null},
  {id:'e28', num:28, n:'Bahri El Othmani',           at:'cnc',        tx:24.0, sal:5000, poste:'Opérateur CNC',              paiement:'mois',    tel:null},
  // ─── POLYSTYRÈNE (1) ─────────────────────────────────────────
  {id:'e50', num:50, n:'Rachid Ait Taleb',          at:'resine',     tx:24.0, sal:5000, poste:'Opérateur Polystyrène',      paiement:'semaine', tel:null},
]

export const atI = (id) => AT.find(a => a.id === id) || AT[0]
export const ini = (n) => (n || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()

// Totaux masse salariale atelier
export const MASSE_SALARIALE_ATELIER = EMP.reduce((s, e) => s + e.sal, 0)
// → 197 900 DH/mois

/* ============================================================
   CREAJIT IA — Espace Hanane (cahier des charges Driss)
   Flux : LISTE DES CLIENTS (toutes les commandes CreaJit, filtrables)
   → CLIC sur un client → on voit SES articles (avec photo quand dispo)
   → on AFFECTE chaque article à un ouvrier (liste réelle par atelier à droite).
   ============================================================ */
(function () {
  if (location.pathname.toLowerCase().indexOf('hanane') < 0) return;

  // ---- Vraies commandes CreaJit (récupérées via le connecteur) ----
  const COMMANDES = [
    { ref:'26040019', client:'2A WEDDING', com:'Ikram Benaddi', statut:'confirmed', livr:'2026-05-05', retard:24, total:95000, paye:40016, reste:54984, nb:3, notes:'Le prix des tables inclut uniquement le socle. Délai 05/05.',
      articles:[ {id:'a1',nm:'Chaise Cartel',img:'a1',qty:75,pu:730}, {id:'a2',nm:'TABLEAU 120/80',img:'a2',qty:25,pu:730}, {id:'a3',nm:'TABLEAU 40/40',img:'a3',qty:40,pu:550} ] },
    { ref:'26050010', client:'Mme Soumali',         com:'Ikram Benaddi',         statut:'confirmed', livr:null,        retard:0,  total:39000, paye:19500, reste:19500, nb:9 },
    { ref:'26050015', client:'Mme Yasmine',         com:'Laila Boudil',          statut:'confirmed', livr:null,        retard:0,  total:31000, paye:15500, reste:15500, nb:4 },
    { ref:'26040052', client:'Mr Benjamin',         com:'Ikram Benaddi',         statut:'ready',     livr:'2026-05-08',retard:21, total:26000, paye:26000, reste:0,     nb:1 },
    { ref:'26040024', client:'Mme Anisa Guerroumi', com:'Ikram Benaddi',         statut:'ready',     livr:'2026-05-16',retard:13, total:21000, paye:21000, reste:0,     nb:2 },
    { ref:'26040045', client:'Mr Yazid',            com:'Kenza Mokhantar',       statut:'ready',     livr:'2026-05-04',retard:25, total:20000, paye:20000, reste:0,     nb:1 },
    { ref:'26040059', client:'Mme Zaki Nadia',      com:'Ikram Benaddi',         statut:'confirmed', livr:null,        retard:0,  total:20000, paye:10000, reste:10000, nb:1 },
    { ref:'26040048', client:'Azzozi Relax Houses', com:'Laila Boudil',          statut:'ready',     livr:'2026-05-08',retard:21, total:12300, paye:12300, reste:0,     nb:2 },
    { ref:'26040022', client:'Mme Ilhame',          com:'Laila Boudil',          statut:'ready',     livr:'2026-05-15',retard:14, total:12000, paye:12000, reste:0,     nb:1 },
    { ref:'26050030', client:'Mme Daniela Douhi',   com:'Kenza Mokhantar',       statut:'ready',     livr:null,        retard:0,  total:10000, paye:10000, reste:0,     nb:1 },
    { ref:'26040008', client:'Mr Youssef Ajdir',    com:'Kenza Mokhantar',       statut:'ready',     livr:'2026-05-09',retard:20, total:10000, paye:10000, reste:0,     nb:1 },
    { ref:'26050007', client:'Mr Maliki',           com:'Laila Boudil',          statut:'confirmed', livr:'2026-05-25',retard:0,  total:7850,  paye:3600,  reste:4250,  nb:3 },
    { ref:'26040026', client:'Mr Soufiane',         com:'Laila Boudil',          statut:'ready',     livr:'2026-05-04',retard:25, total:6500,  paye:6500,  reste:0,     nb:1 },
    { ref:'26040016', client:'Mme Perez',           com:'Kenza Mokhantar',       statut:'ready',     livr:'2026-05-30',retard:0,  total:5500,  paye:5500,  reste:0,     nb:1 },
    { ref:'26040060', client:'Mme Laila',           com:'Laila Boudil',          statut:'confirmed', livr:'2026-05-20',retard:0,  total:5300,  paye:2650,  reste:2650,  nb:1 },
    { ref:'26050019', client:'Mme Nazha',           com:'Ikram Benaddi',         statut:'ready',     livr:'2026-05-18',retard:11, total:3200,  paye:3200,  reste:0,     nb:1 },
    { ref:'26040053', client:'Expresse Beuty',      com:'Laila Boudil',          statut:'confirmed', livr:'2026-05-08',retard:21, total:2800,  paye:400,   reste:2400,  nb:1 },
    { ref:'26040025', client:'Showroom',            com:'Fatima Sedky',          statut:'ready',     livr:null,        retard:0,  total:1,     paye:0,     reste:1,     nb:1 },
  ];

  // Ouvriers réels par atelier (fiche Ateliers CreaJit)
  const WORKERS = [
    ['A','Ayoub El Yagiz',1],['A','Abdessamie El Yagiz'],['A','Labiade De Mohssine'],['A','Said Lamghari'],['A','Abdelhadi Bouchfer'],['A','Mohamad Marhoub'],['A','Hassan Labiad'],['A','Abdelaati Lafdili'],['A','M. Fadil El Mouaden'],
    ['B','Ahmed Araji',1],['B','Abdelilah Dakhama'],['B','Mustapha Boudrif'],['B','Abdelmajid Anjar'],['B','Khalid Houfati'],['B','Youssef Argibi'],['B','Yassine Madidi'],['B','Adil Rehaimine'],['B','Souhail Sakat'],['B','Youssef Ben Elarradia'],
    ['C','Bahri El Othmani',1],
    ['D','Ettaib Bougatouch',1],['D','Rachid Ait Taleb'],
    ['E','Dit Chnitifa',1],['E','Chaise Ayoub'],['E','Mourad Zemit'],['E','Redouan Houfati'],['E','El Mahdi Bahaj'],
    ['F','Mohamed Elkarmani',1],['F','Abdelaaziz Ben Amer'],['F','Mohamed Elmoussaoui'],['F','Mouad Elmaamlem'],['F','Milouda El Azaoui'],
    ['G','Mohamed Boualili',1],['G','Abdelghani Malih'],
    ['H','Mustapha Aababou',1],['H','Anoir Touati'],['H','Amine Samadi'],
    ['I','Noureddine Ouzzat',1],
  ].map(w => ({ at:w[0], nm:w[1], chef:!!w[2], id:w[1].toLowerCase().replace(/[^a-z]/g,'') }));

  // Catalogue produits CreaJit (extrait stock réel ; sync complète = connecteur)
  const CAT = [
    ['BROOKLYN','SALONS','rupture'],['DOUBLE LOV','SALONS','rupture'],['EGO L','SALONS','rupture'],['LUNA SOFT','SALONS','rupture'],['MERIDIEN','SALONS','rupture'],['NOVA','SALONS','rupture'],['NUAGE','SALONS','rupture'],['MISA','SALONS','rupture'],['ASTORIA','SALONS','bas'],['SKY','SALONS','bas'],['ARCUS','SALONS','bas'],['PRESTIGE II','SALONS','bas'],
    ['Chaise LUNA MOVE','CHAISES','rupture'],['Chaise MARRY II','CHAISES','rupture'],['ELEGANCE BAR','CHAISES','rupture'],['PULSY III','CHAISES','rupture'],['TROCADEROXIS','CHAISES','rupture'],['chaise HERMES','CHAISES','rupture'],['Chaise HARMONIE','CHAISES','bas'],['Chaise MARRY','CHAISES','bas'],
    ['ELLIPSE','TABLES','rupture'],['HORIZON','TABLES','rupture'],['PEBBLE DUO','TABLES','rupture'],['PIETRA','TABLES','rupture'],['VELA','TABLES','rupture'],['Table Marmo','TABLES','rupture'],['TALIA','TABLES','bas'],['SERENIA','TABLES','bas'],
    ['Lit CARRET','CHAMBRE','rupture'],['Lit CELESTIA','CHAMBRE','rupture'],['Lit ORION','CHAMBRE','rupture'],['Lit ZENORA','CHAMBRE','rupture'],['Lit OLIA','CHAMBRE','bas'],['Lit CLOUD','CHAMBRE','bas'],
    ['AURAX','TRAVERTIN SELECTION','rupture'],['Aeris','TRAVERTIN SELECTION','rupture'],['CERATRAV','TRAVERTIN SELECTION','rupture'],['TRAVERTINO','TRAVERTIN SELECTION','rupture'],['ROCASA','TRAVERTIN SELECTION','bas'],['SILIA','TRAVERTIN SELECTION','bas'],
    ['ELOR','DECORATIONS','rupture'],['ELYA','DECORATIONS','rupture'],['Nawal','DECORATIONS','rupture'],['Nexus Taupe','DECORATIONS','rupture'],['Silhouette','DECORATIONS','bas'],['Épure','DECORATIONS','bas'],
    ['Pergola Ombrella','JARDIN','rupture'],['Pergola VOLERA','JARDIN','rupture'],['ZETTALIQUE','JARDIN','rupture'],['Balançoire AUREA','JARDIN','bas'],['Chaise SOLIS','JARDIN','bas'],
    ['ABSOLU','MATELAS','rupture'],['PRESTIGIA','MATELAS','rupture'],['ÉQUILIBRE','MATELAS','rupture'],
    ['MAPLE','Cuivre Signature','bas'],['LEAF','Cuivre Signature','bas'],['MINA','Cuivre Signature','bas'],['SOUFFLE','Cuivre Signature','bas'],
  ].map(p => ({ nm:p[0], cat:p[1], stock:p[2] }));

  // VRAIES commandes CreaJit (186, avec photos) via le socle commun CJ_ORDERS.
  if (window.CJ_ORDERS && window.CJ_ORDERS.count()) {
    COMMANDES.length = 0;
    window.CJ_ORDERS.all().forEach(function (o) {
      COMMANDES.push({
        cle: o.id || o.ref, ref: o.ref, client: o.client || '', com: o.vendeur || '',
        statut: o.prod || 'confirmed', statutLib: o.prodLib, livr: o.date || null, retard: 0,
        date: o.date, tel: o.tel, paiement: o.paie, paiementLib: o.paieLib,
        livraison: o.livr, livraisonLib: o.livrLib,
        total: o.total || 0, paye: (o.paie === 'PAID' ? o.total : 0),
        reste: (o.paie === 'PAID' ? 0 : o.total),
        nb: (o.articles || []).length,
        articles: (o.articles || []).map(function (a) {
          return { id: a.id, nm: a.nom, qty: a.qte, pu: a.prix, photo: a.photo || '' };
        })
      });
    });
  }
  const COMS = Array.from(new Set(COMMANDES.map(c => c.com)));

  // ---- État ----
  let tab = 'commandes', q = '', fStat = '', fCom = '', tri = 'retard', view = 'list', curRef = null, selA = null;
  let bonLignes = [], matQ = '', openArt = null, openTab = '';
  let atelierOuvert = {}; // accordéon : quels ateliers sont dépliés
  function depuis(t0) { if (!t0) return ''; var m = Math.floor((Date.now() - t0) / 60000); return m < 60 ? (m + ' min') : (Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0')); }
  var BONSTAT = { envoye: '📤 Envoyé au magasin', commande: '🛒 Commande fournisseur', recu: '✅ Reçu' };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const dh = n => (Math.round(n||0)).toLocaleString('fr-FR') + ' DH';

  // ---- Report du travail ouvrier (remonte ici depuis la fiche ouvrier) ----
  // Temps écoulé réel = temps cumulé + (en cours : depuis t0)
  function tempsMs(o) { return (o.elapsedMs || 0) + (o.t0 ? (Date.now() - o.t0) : 0); }
  function fmtDur(ms) { var m = Math.floor((ms||0) / 60000); return m < 1 ? '0 min' : (m < 60 ? (m + ' min') : (Math.floor(m/60) + 'h' + String(m%60).padStart(2,'0'))); }
  // Coût main d'œuvre d'un ouvrier sur l'article = heures × coût horaire chargé de son atelier
  function moOuvrier(o) { var th = (window.coutHoraire ? window.coutHoraire(o.atelierCode) : 60); return (tempsMs(o)/3600000) * th; }
  var TRAV = {
    affecte: { lib: 'à faire', em: '⏳', col: '#8d96a5', bg: 'rgba(141,166,189,.14)' },
    encours: { lib: 'en cours', em: '🔧', col: '#EAB308', bg: 'rgba(234,179,8,.16)' },
    pause:   { lib: 'en pause', em: '⏸️', col: '#E08C3A', bg: 'rgba(224,140,58,.16)' },
    fini:    { lib: 'terminé',  em: '✅', col: '#37c98a', bg: 'rgba(55,201,138,.16)' },
  };
  function travInfo(o) { return TRAV[o.statut] || TRAV.affecte; }
  const ats = () => (window.CJ_ATELIERS || []);
  const atName = c => { const a = ats().find(x => x.code === c); return a ? a.nom : ('Atelier ' + c); };
  const atColor = c => { const a = ats().find(x => x.code === c); return a ? a.couleur : '#C4714F'; };
  const affs = () => (window.CJ ? window.CJ.etat().affectations : {});
  const photo = img => (window.ART && img && window.ART[img]) ? `<img src="${window.ART[img]}" style="width:54px;height:54px;border-radius:9px;object-fit:cover;background:#fff">` : `<div style="width:54px;height:54px;border-radius:9px;background:#222c3d;display:grid;place-items:center;font-size:22px">🪑</div>`;
  function iconePour(nom){
    var n=(nom||'').toLowerCase();
    if(/livr|install|transport/.test(n)) return '🚚';
    if(/matela|sommier|lit/.test(n)) return '🛏️';
    if(/chaise/.test(n)) return '🪑';
    if(/canap|salon|méri|meri|fauteuil/.test(n)) return '🛋️';
    if(/table|console|chevet|bureau/.test(n)) return '🪵';
    if(/tableau|cadre|déco|deco|miroir/.test(n)) return '🖼️';
    if(/lustre|lampe|luminaire/.test(n)) return '💡';
    if(/travertin|pierre|marbre/.test(n)) return '🪨';
    if(/cuivre|laiton/.test(n)) return '🟡';
    if(/coussin|rideau|tissu/.test(n)) return '🧵';
    return '📦';
  }
  function photoCatalogue(nom){
    var cat=window.CJ_CATALOGUE||[]; if(!cat.length||!nom) return '';
    var n=String(nom).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    var mot=n.split(' ').filter(function(x){return x.length>3;})[0];
    for(var i=0;i<cat.length;i++){
      var cn=String(cat[i].nom||'').toLowerCase();
      if(cn.indexOf(n)>=0 || (mot && cn.indexOf(mot)>=0)) return cat[i].photo||'';
    }
    return '';
  }
  var imgStyle='width:54px;height:54px;border-radius:10px;object-fit:cover;background:#fff';
  function ph(nom){ return '<div style="width:54px;height:54px;border-radius:9px;background:#222c3d;display:grid;place-items:center;font-size:24px">'+iconePour(nom)+'</div>'; }
  function imgTag(src,nom){ return '<span class="cjimg" data-ic="'+iconePour(nom)+'"><img src="'+esc(src)+'" style="'+imgStyle+';display:block" onerror="var s=this.parentNode;s.innerHTML=\'<div style=&quot;width:54px;height:54px;border-radius:9px;background:#222c3d;display:grid;place-items:center;font-size:24px&quot;>\'+s.getAttribute(\'data-ic\')+\'</div>\'"></span>'; }
  const photoOf = a => {
    if (a && a.photo) return imgTag(a.photo, a.nm);
    if (a && a.img && window.ART && window.ART[a.img]) return imgTag(window.ART[a.img], a.nm);
    var pc = photoCatalogue(a && a.nm);
    if (pc) return imgTag(pc, a.nm);
    return ph(a && a.nm);
  };
  const toastMsg = m => { if (typeof window.toast === 'function') window.toast(m); };
  const cmd = key => COMMANDES.find(c => (c.cle || c.ref) === key);

  // articles d'une commande (réels si dispo, sinon créneaux d'après le nombre d'articles CreaJit)
  function articlesDe(c) {
    const base = (c.articles && c.articles.length) ? c.articles.slice() : [];
    const saisis = window.CJ ? window.CJ.articlesSaisis(c.ref) : [];
    return base.concat(saisis);
  }
  function formArticleHTML(c) {
    return '<div class="cjsec"><div class="cjsec-h">\u2795 Ajouter un article (fiche technique)</div>'
      + '<div class="cjgrid"><input id="aa_nm" placeholder="Nom de l\'article"><input id="aa_qty" type="number" placeholder="Qt\u00e9"></div>'
      + '<div class="cjgrid" style="margin-top:7px"><input id="aa_pu" type="number" placeholder="Prix unit. (DH)"><input id="aa_photo" type="file" accept="image/*"></div>'
      + '<button class="cjbtn2" id="aa_add" style="margin-top:8px">\u2795 Ajouter l\'article</button>'
      + '<div class="pc" style="margin-top:6px">CreaJit indique ' + (c.nb || '?') + ' article(s) pour cette commande \u2014 ajoute-les ici avec leur photo (le connecteur ne fournit pas le d\u00e9tail).</div></div>';
  }
  function wireAddArticle(c) {
    var b = document.getElementById('aa_add'); if (!b) return;
    b.onclick = function () {
      var nm = (document.getElementById('aa_nm').value || '').trim(); if (!nm) { toastMsg('Donne un nom d\'article'); return; }
      var qty = +document.getElementById('aa_qty').value || 0, pu = +document.getElementById('aa_pu').value || 0;
      var file = document.getElementById('aa_photo').files[0];
      function save(photo) { window.CJ.ajouterArticle(c.ref, { nm: nm, qty: qty, pu: pu, photo: photo || '' }); toastMsg('Article ajout\u00e9 \u2705'); renderArts(); }
      if (file) { var r = new FileReader(); r.onload = function () { save(r.result); }; r.readAsDataURL(file); } else save('');
    };
  }

  // ---- Barre de filtres (une fois) ----
  function ensureUI() {
    if (document.getElementById('cjhf')) return;
    const arts = document.getElementById('arts'); if (!arts) return;
    const bar = document.createElement('div'); bar.id = 'cjhf';
    bar.innerHTML = `
      <div class="cjtabs">
        <button data-tab="commandes" class="on">📋 Commandes clients (${COMMANDES.length})</button>
        <button data-tab="catalogue">🛋️ Catalogue (${(window.CJ_CATALOGUE||[]).length})</button>
      </div>
      <div class="cjfilt">
        <input id="cjq" placeholder="🔎 Client, référence, produit…">
        <select id="cjcom"><option value="">Tous commerciaux</option>${COMS.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>
        <select id="cjstat"><option value="">Tous statuts</option><option value="ready">Prête</option><option value="confirmed">Confirmée</option></select>
        <select id="cjtri"><option value="retard">Tri : retard</option><option value="livraison">Tri : livraison</option><option value="client">Tri : client</option><option value="montant">Tri : montant</option></select>
      </div>`;
    arts.parentNode.insertBefore(bar, arts);
    const sty = document.createElement('style');
    sty.textContent = `
      #cjhf .cjtabs{display:flex;gap:8px;margin-bottom:9px}
      #cjhf .cjtabs button{background:#10151f;border:1px solid rgba(196,113,79,.25);color:#8d96a5;border-radius:10px;padding:8px 13px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
      #cjhf .cjtabs button.on{background:#C4714F;color:#1a0f08;border-color:#C4714F}
      #cjhf .cjfilt{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
      #cjhf input,#cjhf select{background:#10151f;border:1px solid rgba(196,113,79,.25);color:#ece9e3;border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit}
      #cjhf #cjq{flex:1;min-width:160px}
      .cjcli{display:flex;align-items:center;gap:12px;background:#161d2b;border:1px solid rgba(196,113,79,.18);border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer}
      .cjvig{width:54px;height:54px;flex-shrink:0}
      .cjvig img{width:54px;height:54px;border-radius:10px;object-fit:cover}
      .cjtag{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap}
      .cjcli:hover{border-color:#C4714F}
      .cjcli .nm{font-weight:700;font-size:15px}
      .cjcli .mt{font-size:11.5px;color:#8d96a5;margin-top:2px}
      .cjcli .rt{color:#E74C3C;font-weight:700;font-size:12px}
      .cjcli .chev{color:#e69a76;font-size:20px;margin-left:auto}
      .cjp{display:flex;align-items:center;gap:11px;background:#161d2b;border:1px solid rgba(196,113,79,.18);border-radius:11px;padding:10px 12px;margin-bottom:8px}
      .cjp .pn{flex:1;font-size:14px;font-weight:600}
      .cjp .pc{font-size:11px;color:#8d96a5}
      .cjp .pb{font-size:11px;padding:2px 9px;border-radius:20px;font-weight:700}
      .cjp .rupture{background:rgba(231,76,60,.16);color:#E74C3C}.cjp .bas{background:rgba(234,179,8,.16);color:#EAB308}
      .cjcat-h{font-family:'Fraunces',serif;font-size:13px;color:#e69a76;margin:14px 0 7px;font-weight:700}
      .vbtn{background:#10151f;border:1px solid rgba(196,113,79,.3);color:#e69a76;border-radius:8px;padding:7px 11px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
      .vbtn:hover{background:#C4714F;color:#1a0f08}
      .cjback{background:none;border:none;color:#e69a76;font-weight:700;font-size:13px;cursor:pointer;padding:0;margin-bottom:10px;font-family:inherit}
      .cjsec{border:1px solid rgba(196,113,79,.18);border-radius:13px;padding:12px;margin-top:12px;background:#10151f}
      .cjsec-h{font-family:'Fraunces',serif;font-weight:700;font-size:14px;margin-bottom:9px}
      .cjgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .cjsec input,.cjsec textarea{background:#0c1018;border:1px solid rgba(196,113,79,.25);color:#ece9e3;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit}
      .cjsec textarea{min-height:46px;resize:vertical}
      #mat_q{width:100%}
      .cjmres{margin-top:6px}
      .cjmr{background:#161d2b;border:1px solid rgba(196,113,79,.18);border-radius:8px;padding:8px 10px;margin-bottom:5px;cursor:pointer;font-size:13px}
      .cjmr:hover{border-color:#C4714F}
      .cjlignes{margin-top:8px}
      .cjbtn2{background:#C4714F;color:#1a0f08;border:none;border-radius:9px;padding:9px 14px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}`;
    document.head ? document.head.appendChild(sty) : document.documentElement.appendChild(sty);

    bar.querySelectorAll('.cjtabs button').forEach(b => b.onclick = () => {
      tab = b.getAttribute('data-tab'); view = 'list'; selA = null;
      bar.querySelectorAll('.cjtabs button').forEach(x => x.classList.toggle('on', x === b));
      renderArts();
    });
    bar.querySelector('#cjq').oninput = e => { q = e.target.value.toLowerCase(); renderArts(); };
    bar.querySelector('#cjcom').onchange = e => { fCom = e.target.value; renderArts(); };
    bar.querySelector('#cjstat').onchange = e => { fStat = e.target.value; renderArts(); };
    bar.querySelector('#cjtri').onchange = e => { tri = e.target.value; renderArts(); };
  }

  function renderArts() {
    ensureUI();
    const box = document.getElementById('arts'); if (!box) return;
    const bar = document.getElementById('cjhf');
    if (bar) bar.querySelector('.cjfilt').style.display = (tab === 'commandes' && view === 'list') ? 'flex' : 'none';

    if (tab === 'catalogue') return renderCatalogue(box);
    if (view === 'detail') return renderDetail(box);

    // ---- LISTE DES CLIENTS ----
    let cmds = COMMANDES.slice();
    if (fStat) cmds = cmds.filter(c => c.statut === fStat);
    if (fCom) cmds = cmds.filter(c => c.com === fCom);
    if (q) cmds = cmds.filter(c => (c.ref + ' ' + c.client + ' ' + c.com).toLowerCase().includes(q));
    cmds.sort((a, b) => tri === 'client' ? a.client.localeCompare(b.client)
      : tri === 'montant' ? b.total - a.total
      : tri === 'livraison' ? String(a.livr || '9999').localeCompare(String(b.livr || '9999'))
      : (b.retard - a.retard));

    const A = affs();
    let h = '';
    cmds.forEach(c => {
      // photo du 1er article (vraie photo, sinon catalogue, sinon icône type)
      const a0 = (c.articles && c.articles[0]) || {};
      const vignette = photoOf({ nom: a0.nm, photo: a0.photo, img: a0.img });

      // statut production coloré
      const ps = c.statut, pl = c.statutLib || '';
      const prodColor = ps === 'COMPLETED' ? '#37c98a' : ps === 'IN_PROGRESS' ? '#EAB308' : '#8d96a5';
      const prodBg = ps === 'COMPLETED' ? 'rgba(55,201,138,.16)' : ps === 'IN_PROGRESS' ? 'rgba(234,179,8,.16)' : 'rgba(141,166,189,.14)';

      // paiement
      const pay = c.paiement, payColor = pay === 'PAID' ? '#37c98a' : pay === 'PARTIAL' ? '#EAB308' : '#E74C3C';
      const payLib = pay === 'PAID' ? 'Payé' : pay === 'PARTIAL' ? 'Partiel' : 'Impayé';

      // livraison
      const liv = c.livraison, livColor = liv === 'DELIVERED' ? '#37c98a' : liv === 'PARTIAL' ? '#EAB308' : '#8d96a5';
      const livLib = liv === 'DELIVERED' ? 'Livré' : liv === 'PARTIAL' ? 'Livré partiel' : 'À livrer';

      // avancement : combien d'articles affectés / total
      const arts = c.articles || [];
      const aff = id => (window.CJ ? window.CJ.affArticle(id) : []);
      const affectes = arts.filter(a => aff(a.id).length).length;
      const pctAff = arts.length ? Math.round(affectes / arts.length * 100) : 0;
      const noms = Array.from(new Set([].concat.apply([], arts.map(a => aff(a.id).map(o => {
        const w = WORKERS.find(x => x.id === o.ouvrierId); return w ? w.nm.split(' ')[0] : '';
      }))).filter(Boolean)));
      // report travail agrégé (remonté depuis les fiches ouvriers)
      const allOuv = [].concat.apply([], arts.map(a => aff(a.id)));
      const nbEnCours = allOuv.filter(o => o.statut === 'encours').length;
      const nbPause = allOuv.filter(o => o.statut === 'pause').length;
      const nbFini = allOuv.filter(o => o.statut === 'fini').length;
      const moTot = allOuv.reduce((s,o) => s + moOuvrier(o), 0);
      let travBadges = '';
      if (nbEnCours) travBadges += `<span style="font-size:11px;color:#EAB308">🔧 ${nbEnCours} en cours</span>`;
      if (nbPause) travBadges += `<span style="font-size:11px;color:#E08C3A">⏸️ ${nbPause} pause</span>`;
      if (nbFini) travBadges += `<span style="font-size:11px;color:#37c98a">✅ ${nbFini} terminé${nbFini>1?'s':''}</span>`;
      if (moTot > 0) travBadges += `<span style="font-size:11px;color:#e69a76">💰 MO ${dh(moTot)}</span>`;

      h += `<div class="cjcli" data-open="${esc(c.cle || c.ref)}">
        <div class="cjvig">${vignette}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
            <span class="nm">${esc(c.client)}</span>
            <span class="cjtag" style="background:${prodBg};color:${prodColor}">${esc(pl || 'Confirmée')}</span>
            ${c.retard ? `<span class="cjtag" style="background:rgba(231,76,60,.16);color:#E74C3C">+${c.retard} j</span>` : ''}
          </div>
          <div class="mt">${esc(c.ref || '—')} · ${arts.length} article${arts.length>1?'s':''} · <b style="color:#e8e0d0">${dh(c.total)}</b> · ${esc(c.com)}</div>
          <div class="mt" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="color:${payColor};font-weight:600">● ${payLib}</span>
            <span style="color:${livColor}">🚚 ${livLib}</span>
            <span style="color:#8d96a5">📅 ${esc(c.livr || '—')}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
            <div style="flex:1;height:6px;background:#0c1018;border-radius:6px;overflow:hidden;max-width:160px">
              <div style="height:100%;width:${pctAff}%;background:${pctAff===100?'#37c98a':'#C4714F'}"></div>
            </div>
            <span style="font-size:11px;color:#8d96a5">${affectes}/${arts.length} affecté${affectes>1?'s':''}</span>
            ${noms.length ? `<span style="font-size:11px;color:#e69a76">👷 ${esc(noms.join(', '))}</span>` : ''}
          </div>
          ${travBadges ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:5px">${travBadges}</div>` : ''}
        </div>
        <div class="chev">›</div></div>`;
    });
    if (!cmds.length) h = `<div class="sub">Aucune commande ne correspond au filtre.</div>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-open]').forEach(el => el.onclick = () => { curRef = el.getAttribute('data-open'); view = 'detail'; selA = null; bonLignes = []; matQ = ''; renderArts(); });
  }

  // ---- DÉTAIL D'UN CLIENT : chaque article = sa fabrication (ouvriers + fiche + achats) ----
  function renderDetail(box) {
    const c = cmd(curRef); if (!c) { view = 'list'; return renderArts(); }
    let h = `<button class="cjback" id="cjback">← Toutes les commandes</button>
      <div style="border:1px solid rgba(196,113,79,.25);border-radius:13px;padding:13px;margin-bottom:12px;background:#10151f">
        <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:16px">${esc(c.client)}</b>
          ${c.retard ? `<span class="rt" style="color:#E74C3C;font-weight:700">+${c.retard} j retard</span>` : ''}</div>
        <div class="mt" style="font-size:12px;color:#8d96a5;margin:3px 0">${esc(c.ref || '—')} · ${esc(c.com)} · livraison ${esc(c.livr || '—')}</div>
        <div style="font-size:13px">Total <b>${dh(c.total)}</b> · <span style="color:#37c98a">payé ${dh(c.paye)}</span> · <span style="color:#E74C3C">reste ${dh(c.reste)}</span></div>
      </div>
      <div class="sub" style="margin-bottom:8px">${selA ? '👉 Article sélectionné — clique un <b>ouvrier à droite</b> pour l\'ajouter (plusieurs possibles).' : 'Chaque article : ajoute un ou plusieurs ouvriers, sa fiche de production et ses achats matière.'}</div>`;

    articlesDe(c).forEach(a => {
      const ouvs = window.CJ ? window.CJ.affArticle(a.id) : [];
      const on = selA === a.id;
      const fa = window.CJ ? window.CJ.ficheArticleDe(a.id) : {};
      const bons = window.CJ ? window.CJ.bonsArticle(a.id) : [];
      // chips ouvriers — avec report du travail (statut + chrono + coût main d'œuvre)
      let chips = ouvs.map(o => {
        const w = WORKERS.find(x => x.id === o.ouvrierId);
        const ti = travInfo(o);
        const dur = (o.statut === 'encours' || o.statut === 'pause' || o.statut === 'fini') ? ' · ⏱️ ' + fmtDur(tempsMs(o)) : '';
        const mo = tempsMs(o) > 0 ? ' · 💰 ' + dh(moOuvrier(o)) : '';
        const mot = (o.statut === 'pause' && o.motif) ? ' · ' + esc(o.motif) : '';
        return `<span class="cjchip" style="border-color:${ti.col}55"><span style="color:${ti.col}">${ti.em}</span> ${esc(w ? w.nm : o.ouvrierId)}${o.atelierCode ? ' ('+esc(o.atelierCode)+')' : ''}<span class="pc" style="color:${ti.col}"> ${ti.lib}${dur}${mo}${mot}</span> <b data-rmw="${esc(a.id)}|${esc(o.ouvrierId)}">✕</b></span>`;
      }).join('');
      // total main d'œuvre de l'article (tous ouvriers)
      const moArt = ouvs.reduce((s,o) => s + moOuvrier(o), 0);

      h += `<div class="cjart-card">
        <div class="cjart-top">${photoOf(a)}
          <div style="flex:1;min-width:0"><div class="pn">${esc(a.nm)}</div>
            <div class="pc">${a.qty ? a.qty+' × '+a.pu+' DH' : ''}${moArt > 0 ? ' · <span style="color:#e69a76">main d\'œuvre ' + dh(moArt) + '</span>' : ''}</div>
            <div class="cjchips">${chips || '<span class="pc">Aucun ouvrier affecté</span>'}</div>
          </div></div>
        <div class="cjart-actions">
          <button class="vbtn" data-sel="${esc(a.id)}" data-nom="${esc(a.nm)}" data-ref="${esc(c.ref)}" data-client="${esc(c.client)}" data-at="${a.at||''}">${on ? '● Sélection active — clique un ouvrier' : '➕ Affecter un ouvrier'}</button>
          <button class="vbtn2 ${openArt===a.id&&openTab==='fiche'?'on':''}" data-fiche="${esc(a.id)}">📝 Fiche${fa.dimensions||fa.tissu||fa.notes?' ✓':''}</button>
          <button class="vbtn2 ${openArt===a.id&&openTab==='mat'?'on':''}" data-mat="${esc(a.id)}">🧰 Matière${bons.length?' ('+bons.length+')':''}</button>
          <button class="vbtn2 ${openArt===a.id&&openTab==='parc'?'on':''}" data-parc="${esc(a.id)}">🏭 Parcours${(window.CJ&&window.CJ.parcoursDe(a.id).length)?' ('+window.CJ.parcoursDe(a.id).length+')':''}</button>
        </div>`;

      // panneau fiche article
      if (openArt === a.id && openTab === 'fiche') {
        h += `<div class="cjpan">
          <div class="cjgrid">
            <input id="fa_dim" placeholder="Dimensions" value="${esc(fa.dimensions||'')}">
            <input id="fa_tissu" placeholder="Tissu / matériau" value="${esc(fa.tissu||'')}">
            <input id="fa_acc" placeholder="Accoudoirs (G/D)" value="${esc(fa.accoudoirs||'')}">
            <input id="fa_cout" placeholder="Coutures / finition" value="${esc(fa.coutures||'')}">
          </div>
          <textarea id="fa_notes" placeholder="Notes / détails client" style="width:100%;margin-top:7px">${esc(fa.notes||'')}</textarea>
          <div style="display:flex;align-items:center;gap:10px;margin-top:9px">
            ${fa.imageRef?`<img src="${esc(fa.imageRef)}" style="width:56px;height:56px;border-radius:9px;object-fit:cover;border:1px solid var(--line)">`:''}
            <label style="font-size:12px;color:var(--mut);cursor:pointer">🖼️ Image de référence (photo client / Pinterest)<br><input id="fa_img" type="file" accept="image/*" style="margin-top:4px"></label>
          </div>
          <label style="display:flex;align-items:center;gap:8px;margin-top:9px;font-size:13px;padding:8px;border-radius:9px;background:${fa.dessinValide?'rgba(55,201,138,.12)':'rgba(231,76,60,.1)'}"><input type="checkbox" id="fa_dessin" ${fa.dessinValide?'checked':''}> 🎨 <b>Dessin/modèle validé par le client</b> <span class="pc">(la fabrication est bloquée tant que ce n'est pas coché)</span></label>
          <button class="cjbtn2" id="fa_save" style="margin-top:9px">💾 Enregistrer la fiche de cet article</button>
          <span id="fa_ok" style="color:#37c98a;font-weight:700;font-size:12px;margin-left:8px"></span>
        </div>`;
      }
      // panneau matière article
      if (openArt === a.id && openTab === 'mat') {
        const mats = window.CJ ? window.CJ.matieres() : [];
        let res = '';
        if (matQ) {
          const r = mats.filter(m => (m.nom+' '+m.ref+' '+m.fournisseur).toLowerCase().includes(matQ.toLowerCase())).slice(0,8);
          res = r.map(m => `<div class="cjmr" data-add="${esc(m.ref)}">${esc(m.nom)} <span class="pc">· ${esc(m.fournisseur)} · ${m.puTTC||''} DH</span></div>`).join('') || '<div class="pc" style="padding:6px">Aucune matière trouvée.</div>';
        }
        h += `<div class="cjpan">
          <input id="mat_q" placeholder="🔎 Chercher une matière (559 réf.)…" value="${esc(matQ)}" autocomplete="off">
          <div class="cjmres">${res}</div>
          ${bonLignes.length ? `<div class="cjlignes">${bonLignes.map((l,i)=>`<div class="cjp"><div class="pn">${esc(l.nom)} <span class="pc">· ${esc(l.fournisseur)}</span></div><input class="qte" type="number" min="1" value="${l.qty}" data-q="${i}" style="width:64px"> <button class="vbtn" data-del="${i}">✕</button></div>`).join('')}
            <button class="cjbtn2" id="bon_send" style="margin-top:8px">📦 Envoyer le bon au magasin (pour cet article)</button>` : '<div class="pc" style="margin-top:6px">Ajoute les matières de cet article, puis envoie le bon.</div>'}
          ${bons.length ? `<div class="cjsec-h" style="margin-top:11px">Bons de cet article</div>${bons.map(b=>`<div class="cjp"><div class="pn">${(b.lignes||[]).map(x=>esc(x.nom)).join(', ')||'Bon'} <span class="pc">· ${(b.lignes||[]).length} ligne(s)</span></div><span class="pb ${b.statut==='recu'?'bas':'rupture'}" style="${b.statut==='recu'?'background:rgba(55,201,138,.16);color:#37c98a':''}">${b.statut==='recu'?'✅ Reçu':(b.statut==='commande'?'🛒 Commande':'📤 Envoyé')}</span></div>`).join('')}` : ''}
        </div>`;
      }
      // panneau parcours (chaîne de départements)
      if (openArt === a.id && openTab === 'parc') {
        const parc = window.CJ ? window.CJ.parcoursDe(a.id) : [];
        const depts = window.CJ_DEPTS || [];
        const suggere = (window.cjParcoursPour ? window.cjParcoursPour(a.nm) : []);
        const codesActifs = parc.map(e => e.dept);
        // étapes choisies (ordonnées)
        const choisies = parc.length ? parc.map((e, i) => {
          const d = depts.find(x => x.code === e.dept) || {};
          return `<div class="cjp"><div class="pn">${i+1}. ${esc(e.dept)} · ${esc(d.nom||'')} <span class="pc">(${d.coutH||'?'} DH/h · atelier ${d.atelier||'?'})</span>${e.statut==='valide'?' <span style="color:#37c98a">✅ '+e.heures+'h</span>':''}</div><button class="vbtn" data-pdel="${esc(a.id)}|${esc(e.dept)}">✕</button></div>`;
        }).join('') : '<div class="pc">Aucune étape. Choisis les départements ci-dessous (dans l\'ordre de fabrication).</div>';
        // boutons d'ajout par atelier
        const parAtelier = {};
        depts.forEach(d => { (parAtelier[d.atelier] = parAtelier[d.atelier] || []).push(d); });
        let dispo = Object.keys(parAtelier).map(at => `<div style="margin-top:7px"><div class="pc" style="margin-bottom:4px">Atelier ${at}</div>${parAtelier[at].map(d => `<button class="vbtn2 ${codesActifs.includes(d.code)?'on':''}" data-padd="${esc(a.id)}|${esc(d.code)}" style="margin:2px">${esc(d.code)} ${esc(d.nom)} · ${d.coutH}</button>`).join('')}</div>`).join('');
        h += `<div class="cjpan">
          <div class="cjsec-h">🏭 Parcours de fabrication (chaîne d'étapes)</div>
          ${suggere.length ? `<button class="cjbtn2" data-psug="${esc(a.id)}" style="margin-bottom:8px">✨ Parcours conseillé : ${suggere.join(' → ')}</button>` : ''}
          <div class="cjlignes">${choisies}</div>
          <div class="cjsec-h" style="margin-top:11px">Ajouter une étape</div>
          ${dispo}
        </div>`;
      }
      h += `</div>`;
    });

    box.innerHTML = h;
    const bk = document.getElementById('cjback'); if (bk) bk.onclick = () => { view = 'list'; selA = null; openArt = null; renderArts(); };
    // sélection ouvrier
    box.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { selA = (selA === b.getAttribute('data-sel')) ? null : b.getAttribute('data-sel'); renderArts(); });
    // retirer un ouvrier
    box.querySelectorAll('[data-rmw]').forEach(b => b.onclick = () => { const [aid,oid]=b.getAttribute('data-rmw').split('|'); window.CJ.retirerAffArticle(aid,oid); renderArts(); });
    // toggle fiche / matière
    box.querySelectorAll('[data-fiche]').forEach(b => b.onclick = () => { const id=b.getAttribute('data-fiche'); if(openArt===id&&openTab==='fiche'){openArt=null;}else{openArt=id;openTab='fiche';} renderArts(); });
    box.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => { const id=b.getAttribute('data-mat'); if(openArt===id&&openTab==='mat'){openArt=null;}else{openArt=id;openTab='mat';bonLignes=[];matQ='';} renderArts(); });
    box.querySelectorAll('[data-parc]').forEach(b => b.onclick = () => { const id=b.getAttribute('data-parc'); if(openArt===id&&openTab==='parc'){openArt=null;}else{openArt=id;openTab='parc';} renderArts(); });
    // parcours : ajouter / retirer / suggérer une étape
    box.querySelectorAll('[data-padd]').forEach(b => b.onclick = () => { const [aid,code]=b.getAttribute('data-padd').split('|'); const cur=window.CJ.parcoursDe(aid).map(e=>e.dept); if(!cur.includes(code)) cur.push(code); else cur.splice(cur.indexOf(code),1); window.CJ.setParcours(aid,cur); renderArts(); });
    box.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { const [aid,code]=b.getAttribute('data-pdel').split('|'); const cur=window.CJ.parcoursDe(aid).map(e=>e.dept).filter(x=>x!==code); window.CJ.setParcours(aid,cur); renderArts(); });
    box.querySelectorAll('[data-psug]').forEach(b => b.onclick = () => { const aid=b.getAttribute('data-psug'); const a=articlesDe(c).find(x=>x.id===aid); const sug=window.cjParcoursPour(a?a.nm:''); if(sug.length){window.CJ.setParcours(aid,sug); window.CJ.evenement('info','Hanane',`Parcours défini pour « ${a.nm} » : ${sug.join(' → ')}.`); renderArts();} });
    wireArticlePanels(c);
  }

  function wireArticlePanels(c) {
    const $ = id => document.getElementById(id);
    if ($('fa_save')) $('fa_save').onclick = () => {
      const aid = openArt;
      const sauve = (imgRef) => {
        const data = { dimensions:$('fa_dim').value, tissu:$('fa_tissu').value, accoudoirs:$('fa_acc').value, coutures:$('fa_cout').value, notes:$('fa_notes').value, dessinValide:$('fa_dessin').checked };
        if (imgRef !== undefined) data.imageRef = imgRef;
        window.CJ.ficheArticle(aid, data);
        window.CJ.evenement(data.dessinValide?'success':'info','Hanane',`Fiche article enregistrée (${c.client})${data.dessinValide?' — dessin VALIDÉ client ✅':''}.`);
        if ($('fa_ok')) $('fa_ok').textContent='✓ enregistrée';
      };
      const fimg = $('fa_img');
      if (fimg && fimg.files && fimg.files[0]) { const r=new FileReader(); r.onload=()=>sauve(r.result); r.readAsDataURL(fimg.files[0]); }
      else sauve();
    };
    if ($('mat_q')) $('mat_q').oninput = e => { matQ=e.target.value; const pos=e.target.selectionStart; renderArts(); const m=$('mat_q'); if(m){m.focus(); try{m.setSelectionRange(pos,pos);}catch(x){}} };
    document.querySelectorAll('[data-add]').forEach(el => el.onclick = () => { const ref=el.getAttribute('data-add'); const m=(window.CJ.matieres()||[]).find(x=>x.ref===ref); if(m){bonLignes.push({ref:m.ref,nom:m.nom,fournisseur:m.fournisseur,unite:m.unite,pu:m.puTTC||m.puHT||0,qty:1}); matQ=''; renderArts();} });
    document.querySelectorAll('.qte').forEach(inp => inp.onchange = () => { bonLignes[+inp.getAttribute('data-q')].qty=+inp.value||1; });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { bonLignes.splice(+b.getAttribute('data-del'),1); renderArts(); });
    if ($('bon_send')) $('bon_send').onclick = () => {
      if(!bonLignes.length) return;
      window.CJ.bon({ ref:c.ref, client:c.client, articleId:openArt, lignes:bonLignes.slice(), par:'Hanane', statut:'envoye' });
      window.CJ.evenement('warn','Hanane',`Bon matière envoyé pour un article de ${c.client}.`,'→ Mohamed (magasin)');
      bonLignes=[]; matQ=''; toastMsg('📦 Bon envoyé au magasin'); renderArts();
    };
  }

  function ficheMatiereHTML(c) {
    const f = (window.CJ ? window.CJ.ficheDe(c.ref) : {}) || {};
    const bons = (window.CJ ? window.CJ.bons() : []).filter(b => b.ref === c.ref);
    const mats = (window.CJ ? window.CJ.matieres() : []);
    let res = '';
    if (matQ) {
      const r = mats.filter(m => (m.nom + ' ' + m.ref + ' ' + m.fournisseur).toLowerCase().includes(matQ.toLowerCase())).slice(0, 8);
      res = r.map(m => `<div class="cjmr" data-add="${esc(m.ref)}">${esc(m.nom)} <span class="pc">· ${esc(m.fournisseur)} · ${m.puTTC || ''} DH</span></div>`).join('') || `<div class="pc" style="padding:6px">Aucune matière trouvée.</div>`;
    }
    return `
    <div class="cjsec">
      <div class="cjsec-h">📝 Fiche technique <span class="pc">(remplie par commercial + Hanane)</span></div>
      <div class="cjgrid">
        <input id="ft_dim" placeholder="Dimensions" value="${esc(f.dimensions || '')}">
        <input id="ft_tissu" placeholder="Tissu / matériau" value="${esc(f.tissu || '')}">
        <input id="ft_acc" placeholder="Accoudoirs (G/D)" value="${esc(f.accoudoirs || '')}">
        <input id="ft_cout" placeholder="Coutures / finition" value="${esc(f.coutures || '')}">
      </div>
      <textarea id="ft_notes" placeholder="Notes / détails vus avec le client" style="width:100%;margin-top:7px">${esc(f.notes || '')}</textarea>
      <label style="display:flex;align-items:center;gap:8px;margin-top:9px;font-size:13px"><input type="checkbox" id="ft_dessin" ${f.dessinValide?'checked':''}> 🎨 Dessin validé par le client <span class="pc">(à valider avant de lancer la fabrication)</span></label>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap">
        <button class="cjbtn2" id="ft_save">💾 Enregistrer la fiche</button>
        <span class="pc">📸 Photos / 🎨 dessin IA validé client — à brancher (module suivant)</span>
        <span id="ft_ok" style="color:#37c98a;font-weight:700;font-size:12px"></span>
      </div>
    </div>

    <div class="cjsec">
      <div class="cjsec-h">🧰 Matière première <span class="pc">(à vérifier / commander AVANT de lancer)</span></div>
      <input id="mat_q" placeholder="🔎 Chercher une matière (559 réf.)…" value="${esc(matQ)}" autocomplete="off">
      <div class="cjmres">${res}</div>
      ${bonLignes.length ? `<div class="cjlignes">${bonLignes.map((l, i) => `<div class="cjp"><div class="pn">${esc(l.nom)} <span class="pc">· ${esc(l.fournisseur)}</span></div>
        <input class="qte" type="number" min="1" value="${l.qty}" data-q="${i}" style="width:64px"> <span class="pc">${esc(l.unite || '')}</span>
        <button class="vbtn" data-del="${i}">✕</button></div>`).join('')}
        <button class="cjbtn2" id="bon_send" style="margin-top:8px">📦 Envoyer le bon au magasin (Mohamed)</button>` : `<div class="pc" style="margin-top:6px">Ajoute les matières nécessaires, puis envoie le bon au magasin.</div>`}
      ${bons.length ? `<div class="cjsec-h" style="margin-top:12px">Bons de cette commande</div>${bons.map(b => `<div class="cjp">
        <div class="pn">${(b.lignes || []).map(x => esc(x.nom)).join(', ') || 'Bon matière'} <span class="pc">· ${(b.lignes || []).length} ligne(s)</span></div>
        <span class="pb ${b.statut === 'recu' ? 'bas' : 'rupture'}" style="${b.statut === 'recu' ? 'background:rgba(55,201,138,.16);color:#37c98a' : ''}">${BONSTAT[b.statut] || b.statut}</span>
        <span class="pc">⏱️ ${b.statut === 'recu' ? 'reçu en ' + depuis2(b.t0, b.tRecu) : depuis(b.t0)}</span></div>`).join('')}` : ''}
    </div>`;
  }
  function depuis2(t0, t1) { if (!t0 || !t1) return ''; var m = Math.floor((t1 - t0) / 60000); return m < 60 ? (m + ' min') : (Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0')); }

  function wireFicheMatiere(c) {
    const $ = id => document.getElementById(id);
    if ($('ft_save')) $('ft_save').onclick = () => {
      window.CJ && window.CJ.fiche(c.ref, { dimensions: $('ft_dim').value, tissu: $('ft_tissu').value, accoudoirs: $('ft_acc').value, coutures: $('ft_cout').value, notes: $('ft_notes').value, dessinValide: $('ft_dessin') ? $('ft_dessin').checked : false });
      window.CJ && window.CJ.evenement('info', 'Hanane', `Fiche technique enregistrée pour ${c.client} (${c.ref}).`);
      if ($('ft_ok')) $('ft_ok').textContent = '✓ enregistrée';
    };
    if ($('mat_q')) {
      $('mat_q').oninput = e => { matQ = e.target.value; const box = document.getElementById('arts'); const pos = e.target.selectionStart; renderArts(); const m = document.getElementById('mat_q'); if (m) { m.focus(); try { m.setSelectionRange(pos, pos); } catch (x) {} } };
    }
    document.querySelectorAll('[data-add]').forEach(el => el.onclick = () => {
      const ref = el.getAttribute('data-add'); const m = (window.CJ.matieres() || []).find(x => x.ref === ref);
      if (m) { bonLignes.push({ ref: m.ref, nom: m.nom, fournisseur: m.fournisseur, unite: m.unite, pu: m.puTTC||m.puHT||0, qty: 1 }); matQ = ''; renderArts(); }
    });
    document.querySelectorAll('.qte').forEach(inp => inp.onchange = () => { const i = +inp.getAttribute('data-q'); bonLignes[i].qty = +inp.value || 1; });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { bonLignes.splice(+b.getAttribute('data-del'), 1); renderArts(); });
    if ($('bon_send')) $('bon_send').onclick = () => {
      if (!bonLignes.length) return;
      window.CJ.bon({ ref: c.ref, client: c.client, lignes: bonLignes.slice(), par: 'Hanane', statut: 'envoye' });
      window.CJ.evenement('warn', 'Hanane', `Bon matière envoyé au magasin pour ${c.client} (${c.ref}) — ${bonLignes.length} ligne(s).`, '→ Mohamed (magasin)');
      bonLignes = []; matQ = '';
      toastMsg('📦 Bon envoyé au magasin (Mohamed) — chrono lancé');
      renderArts();
    };
  }

  function renderCatalogue(box) {
    let items = (window.CJ_CATALOGUE || []).slice();
    if (q) items = items.filter(p => (p.nm || '').toLowerCase().includes(q));
    let h = `<div class="cjcat-h">Catalogue CREAJIT — ${items.length} produits (photos du site)</div>`;
    items.forEach(p => {
      const img = p.photo ? `<img src="${esc(p.photo)}" style="width:54px;height:54px;border-radius:9px;object-fit:cover;background:#fff">`
        : `<div style="width:54px;height:54px;border-radius:9px;background:#222c3d;display:grid;place-items:center">🛋️</div>`;
      const st = p.stock === 'ok' ? `<span class="pb" style="background:rgba(55,201,138,.16);color:#37c98a">en stock</span>`
        : `<span class="pb rupture">⛔ rupture</span>`;
      h += `<div class="cjp">${img}<div class="pn">${esc(p.nm)} <span class="pc">· ${p.prix} DH</span></div>${st}</div>`;
    });
    if (!items.length) h = `<div class="sub">Catalogue indisponible.</div>`;
    box.innerHTML = h;
  }

  // ---- Colonne droite : ouvriers réels par atelier (cliquables -> mini-site) ----
  // état de travail -> pastille
  function badge(st) {
    if (st === 'encours') return '<span style="color:#37c98a;font-size:10.5px;font-weight:700">🟢 en cours</span>';
    if (st === 'pause') return '<span style="color:#f0a23b;font-size:10.5px;font-weight:700">⏸️ en pause</span>';
    if (st === 'fini') return '<span style="color:#60a5fa;font-size:10.5px;font-weight:700">✅ terminé</span>';
    if (st === 'affecte') return '<span style="color:#e69a76;font-size:10.5px;font-weight:700">📋 à démarrer</span>';
    return '';
  }
  function dhW(n) { return Math.round(n || 0).toLocaleString('fr-FR') + ' DH'; }
  function fmtDuree(ms) {
    ms = ms || 0; const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (hh ? hh + 'h' : '') + String(mm).padStart(hh ? 2 : 1, '0') + 'm' + String(ss).padStart(2, '0') + 's';
  }
  function fmtHeureDate(ts) {
    const d = new Date(ts), now = new Date();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const memeJour = d.toDateString() === now.toDateString();
    return (memeJour ? "auj." : String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0')) + ' ' + hm;
  }
  // chrono en direct : met à jour les pastilles ⏱️ sans tout redessiner
  let chronoTimer = null;
  function lancerChrono() {
    if (chronoTimer) clearInterval(chronoTimer);
    chronoTimer = setInterval(function () {
      const els = document.querySelectorAll('[data-chrono][data-t0]');
      if (!els.length) { clearInterval(chronoTimer); chronoTimer = null; return; }
      els.forEach(function (el) {
        const t0 = parseInt(el.getAttribute('data-t0'), 10); if (!t0) return;
        const base = parseInt(el.getAttribute('data-base'), 10) || 0;
        el.textContent = '⏱️ ' + fmtDuree(base + (Date.now() - t0)) + ' 🟢';
      });
    }, 1000);
  }

  // raisons rapides de pause (numérotées pour aller vite)
  const MOTIFS_PAUSE = ['Rupture matière', 'Attente validation client', 'Attente étape précédente', 'Pause déjeuner', 'Problème machine', 'Fin de journée'];
  function demanderMotifPause(aid, wid) {
    const liste = MOTIFS_PAUSE.map((m, i) => (i + 1) + '. ' + m).join('\n');
    const r = prompt('Pourquoi cette pause ?\n\n' + liste + '\n\nTape le numéro (1-' + MOTIFS_PAUSE.length + ') ou écris ta raison :');
    if (r === null) return; // annulé
    let motif = r.trim();
    const num = parseInt(motif, 10);
    if (num >= 1 && num <= MOTIFS_PAUSE.length && String(num) === motif) motif = MOTIFS_PAUSE[num - 1];
    if (window.CJ) CJ.pauserTravail(aid, wid, motif);
    toastMsg('⏸️ En pause — ' + (motif || 'sans raison'));
    renderWorkers();
  }

  function renderWorkers() {
    const box = document.getElementById('workers'); if (!box) return;
    const groups = {}; WORKERS.forEach(w => { (groups[w.at] = groups[w.at] || []).push(w); });
    let h = '';
    Object.keys(groups).sort().forEach(at => {
      const ouvert = !!atelierOuvert[at];
      // compte les ouvriers occupés dans cet atelier
      let occupes = 0;
      groups[at].forEach(w => { if (window.CJ && CJ.affectationsOuvrier(w.id).some(x => x.statut !== 'fini')) occupes++; });
      // En-tête d'atelier cliquable (accordéon)
      h += `<div style="margin-bottom:9px;border:1px solid rgba(196,113,79,.18);border-radius:12px;overflow:hidden;background:#131a27">
        <div data-acc="${at}" style="display:flex;align-items:center;gap:9px;padding:11px 12px;cursor:pointer">
          <span style="background:${atColor(at)};color:#fff;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-weight:700;font-size:13px">${at}</span>
          <div style="flex:1;min-width:0"><b style="font-size:13.5px">${esc(atName(at))}</b>
            <div class="pc" style="font-size:11px;color:#8d96a5">${groups[at].length} ouvriers${occupes ? ' · <span style="color:#37c98a">'+occupes+' occupé(s)</span>' : ''}</div></div>
          <span style="font-size:13px;color:#8d96a5;transition:.2s;transform:rotate(${ouvert ? 90 : 0}deg)">▶</span>
        </div>`;
      if (ouvert) {
        h += `<div style="padding:4px 10px 10px;display:flex;flex-direction:column;gap:7px">`;
        groups[at].forEach(w => {
          const jobs = window.CJ ? CJ.affectationsOuvrier(w.id).filter(x => x.statut !== 'fini') : [];
          // cadre coloré selon l'état de l'ouvrier (visibilité d'un coup d'œil)
          const actif = jobs.some(x => x.statut === 'encours');
          const jobPause = jobs.find(x => x.statut === 'pause');
          const enPause = !!jobPause;
          const aDemarrer = jobs.some(x => x.statut === 'affecte');
          let bord = 'rgba(196,113,79,.18)', fond = '#161d2b', barre = '';
          if (selA) { bord = 'rgba(196,113,79,.5)'; }
          else if (actif) { bord = '#37c98a'; fond = 'rgba(55,201,138,.07)'; barre = '#37c98a'; }
          else if (enPause) { bord = '#f0a23b'; fond = 'rgba(240,162,59,.07)'; barre = '#f0a23b'; }
          else if (aDemarrer) { bord = '#e69a76'; fond = 'rgba(230,154,118,.06)'; barre = '#e69a76'; }
          h += `<div style="background:${fond};border:1px solid ${bord};border-left:${barre ? '4px solid ' + barre : '1px solid ' + bord};border-radius:11px;padding:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div data-assign="${w.id}" style="cursor:${selA ? 'copy' : 'pointer'};flex:1;min-width:0">
                <span style="font-weight:600;font-size:13px">${esc(w.nm)}${w.chef ? ' · chef' : ''}</span>
                ${actif ? '<span style="color:#37c98a;font-size:11px;font-weight:600"> · 🟢 au travail</span>' : enPause ? `<span style="color:#f0a23b;font-size:11px;font-weight:600"> · ⏸️ ${esc(jobPause.motif || 'en pause')}</span>` : ''}
                ${selA ? '<span class="pc" style="color:#e69a76;font-size:11px"> — clique pour affecter ici</span>' : ''}
              </div>
              <button class="vbtn" data-voir="${w.id}">👁️ Fiche</button>
            </div>`;
          // les commandes que cet ouvrier a sur sa table
          if (jobs.length) {
            jobs.forEach(j => {
              h += `<div style="margin-top:8px;border-top:1px dashed rgba(255,255,255,.08);padding-top:8px">
                <div style="display:flex;align-items:center;gap:8px">
                  ${j.photo ? `<img src="${esc(j.photo)}" style="width:36px;height:36px;border-radius:8px;object-fit:cover">` : '<div style="width:36px;height:36px;border-radius:8px;background:#0c1018;display:grid;place-items:center">🛋️</div>'}
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12.5px;font-weight:600">${esc(j.nom)} ${badge(j.statut)}</div>
                    <div class="pc" style="font-size:11px;color:#8d96a5">${esc(j.client || '')}${j.ref ? ' · ' + esc(j.ref) : ''}</div>
                  </div>
                </div>
                ${j.statut === 'pause' ? `<div style="margin-top:7px;background:rgba(240,162,59,.14);border:1px solid rgba(240,162,59,.4);border-radius:8px;padding:6px 9px;font-size:11.5px;color:#f0a23b">⏸️ <b>En pause</b>${j.motif ? ' — ' + esc(j.motif) : ' (raison non précisée)'}</div>` : ''}
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:11px">
                  <span class="cjchip" data-chrono="${esc(j.articleId)}|${esc(w.id)}" data-base="${j.elapsedMs || 0}" data-t0="${j.t0 || ''}">⏱️ ${fmtDuree(j.msVivant)}${j.statut === 'encours' ? ' 🟢' : ''}</span>
                  ${j.debutLe ? `<span class="cjchip">🕒 ${fmtHeureDate(j.debutLe)}</span>` : ''}
                  <span class="cjchip">💰 revient ${dhW(j.coutRevient)}</span>
                  ${j.pu ? `<span class="cjchip">🏷️ ${dhW(j.qty * j.pu)}</span>` : ''}
                </div>
                <div style="display:flex;gap:6px;margin-top:7px">
                  ${j.statut === 'affecte' || j.statut === 'pause'
                    ? `<button class="cjbtn2" data-start="${esc(j.articleId)}|${esc(w.id)}" style="flex:1">▶️ Démarrer</button>`
                    : (j.statut === 'encours' ? `<button class="vbtn" data-pause="${esc(j.articleId)}|${esc(w.id)}">⏸️ Pause</button><button class="cjbtn2" data-done="${esc(j.articleId)}|${esc(w.id)}" style="flex:1">✅ Terminer</button>` : '')}
                </div>
              </div>`;
            });
          } else {
            h += `<div class="pc" style="font-size:11px;color:#6b7280;margin-top:6px">Aucune commande affectée${selA ? '' : ' — sélectionne un article à gauche pour lui en donner une'}.</div>`;
          }
          h += `</div>`;
        });
        h += `</div>`;
      }
      h += `</div>`;
    });
    box.innerHTML = h;
    // accordéon
    box.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => { const at = b.getAttribute('data-acc'); atelierOuvert[at] = !atelierOuvert[at]; renderWorkers(); });
    // fiche mini-site = rapport
    box.querySelectorAll('[data-voir]').forEach(b => b.onclick = e => { e.stopPropagation(); location.href = 'ouvrier.html?w=' + b.getAttribute('data-voir'); });
    // affecter (si un article est sélectionné)
    box.querySelectorAll('[data-assign]').forEach(el => el.onclick = () => { var wid = el.getAttribute('data-assign'); if (selA) affecter(selA, wid); else location.href = 'ouvrier.html?w=' + wid; });
    // démarrer / pause / terminer
    box.querySelectorAll('[data-start]').forEach(b => b.onclick = e => { e.stopPropagation(); const [aid, wid] = b.getAttribute('data-start').split('|'); CJ.demarrerTravail(aid, wid); toastMsg('▶️ Travail démarré'); renderWorkers(); });
    box.querySelectorAll('[data-pause]').forEach(b => b.onclick = e => { e.stopPropagation(); const [aid, wid] = b.getAttribute('data-pause').split('|'); demanderMotifPause(aid, wid); });
    box.querySelectorAll('[data-done]').forEach(b => b.onclick = e => { e.stopPropagation(); const [aid, wid] = b.getAttribute('data-done').split('|'); CJ.finirTravail(aid, wid); toastMsg('✅ Terminé'); renderWorkers(); });
    lancerChrono();
  }

  function affecter(itemId, wid) {
    const w = WORKERS.find(x => x.id === wid); if (!w) return;
    const btn = document.querySelector(`[data-sel="${(window.CSS && CSS.escape) ? CSS.escape(itemId) : itemId}"]`);
    const nom = btn ? (btn.getAttribute('data-nom') || itemId) : itemId;
    const client = btn ? btn.getAttribute('data-client') : '';
    // ce que Hanane a préparé (photo, qté, prix, client, réf) voyage avec l'affectation -> visible côté ouvrier
    const c = cmd(curRef);
    const art = c ? articlesDe(c).find(a => a.id === itemId) : null;
    const meta = art ? { photo: art.photo || '', qty: art.qty || art.qte || 1, pu: art.pu || art.prix || 0, client: client || (c ? c.client : ''), ref: c ? (c.ref || '') : '' } : { client: client };
    if (window.CJ) {
      window.CJ.ajouterAffArticle(itemId, wid, w.at, nom, meta);
      window.CJ.evenement('info', 'Hanane', `Hanane a ajouté ${w.nm} (${atName(w.at)}) sur « ${nom} » — ${client}.`, '→ ' + w.nm);
    }
    toastMsg(`✓ ${w.nm} ajouté sur « ${nom} »`);
    render();
  }

  function render() { ensureUI(); renderArts(); renderWorkers(); }
  window.render = render;
  window.addEventListener('load', render);
  if (window.CJ) window.CJ.abonner(() => renderArts());
})();
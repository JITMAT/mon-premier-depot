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

  // Si Claude in Chrome a injecté les VRAIES commandes (avec photos), on les utilise.
  if (window.CJ_COMMANDES_REELLES && window.CJ_COMMANDES_REELLES.length) {
    COMMANDES.length = 0;
    window.CJ_COMMANDES_REELLES.forEach(function (o) {
      var paye = o.paye != null ? o.paye : (o.paid || 0);
      var statut = o.statut || o.productionStatus || 'confirmed';
      COMMANDES.push({
        ref: o.ref, client: o.client || '', com: o.vendeur || o.com || '',
        statut: statut, livr: o.livr || o.date || null, retard: o.retard || 0,
        date: o.date || '', tel: o.telephone || '',
        paiement: o.paymentStatus || '', livraison: o.deliveryStatus || '',
        total: o.total || 0, paye: paye, reste: (o.reste != null ? o.reste : (o.total || 0) - paye),
        nb: (o.articles || []).length,
        articles: (o.articles || []).map(function (a, i) {
          var ph = a.photo || (Array.isArray(a.photos) && a.photos[0]) || '';
          return { id: (o.ref || 'cmd') + '_a' + i, nm: a.nom || a.name || ('Article ' + (i + 1)),
                   qty: a.qte || a.qty || a.quantity || '', pu: a.prix || a.pu || a.price || '', photo: ph };
        })
      });
    });
  }
  const COMS = Array.from(new Set(COMMANDES.map(c => c.com)));

  // ---- État ----
  let tab = 'commandes', q = '', fStat = '', fCom = '', tri = 'retard', view = 'list', curRef = null, selA = null;
  let bonLignes = [], matQ = '';
  function depuis(t0) { if (!t0) return ''; var m = Math.floor((Date.now() - t0) / 60000); return m < 60 ? (m + ' min') : (Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0')); }
  var BONSTAT = { envoye: '📤 Envoyé au magasin', commande: '🛒 Commande fournisseur', recu: '✅ Reçu' };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const dh = n => (Math.round(n||0)).toLocaleString('fr-FR') + ' DH';
  const ats = () => (window.CJ_ATELIERS || []);
  const atName = c => { const a = ats().find(x => x.code === c); return a ? a.nom : ('Atelier ' + c); };
  const atColor = c => { const a = ats().find(x => x.code === c); return a ? a.couleur : '#C4714F'; };
  const affs = () => (window.CJ ? window.CJ.etat().affectations : {});
  const photo = img => (window.ART && img && window.ART[img]) ? `<img src="${window.ART[img]}" style="width:54px;height:54px;border-radius:9px;object-fit:cover;background:#fff">` : `<div style="width:54px;height:54px;border-radius:9px;background:#222c3d;display:grid;place-items:center;font-size:22px">🪑</div>`;
  const photoOf = a => (a && a.photo) ? `<img src="${a.photo}" style="width:54px;height:54px;border-radius:9px;object-fit:cover;background:#fff">` : photo(a && a.img);
  const toastMsg = m => { if (typeof window.toast === 'function') window.toast(m); };
  const cmd = ref => COMMANDES.find(c => c.ref === ref);

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
      .cjcli{display:flex;align-items:center;gap:11px;background:#161d2b;border:1px solid rgba(196,113,79,.18);border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer}
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

    let h = '';
    cmds.forEach(c => {
      const stat = c.statut === 'ready' ? 'Prête' : 'Confirmée';
      h += `<div class="cjcli" data-open="${esc(c.ref)}">
        <div style="width:42px;height:42px;border-radius:11px;background:linear-gradient(145deg,#C4714F,#7c3f27);display:grid;place-items:center;font-weight:800;color:#1a0f08">${esc(c.client.replace(/^(Mme|Mr|MMe)\s*/i,'').trim().slice(0,1) || 'C')}</div>
        <div><div class="nm">${esc(c.client)}</div>
          <div class="mt">${esc(c.ref)} · ${c.nb} article${c.nb>1?'s':''} · ${dh(c.total)} · ${esc(c.com)}</div>
          <div class="mt">${stat} · livraison ${esc(c.livr || '—')}${c.retard ? ` · <span class="rt">+${c.retard} j</span>` : ''}</div></div>
        <div class="chev">›</div></div>`;
    });
    if (!cmds.length) h = `<div class="sub">Aucune commande ne correspond au filtre.</div>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-open]').forEach(el => el.onclick = () => { curRef = el.getAttribute('data-open'); view = 'detail'; selA = null; bonLignes = []; matQ = ''; renderArts(); });
  }

  // ---- DÉTAIL D'UN CLIENT : ses articles ----
  function renderDetail(box) {
    const c = cmd(curRef); if (!c) { view = 'list'; return renderArts(); }
    const A = affs();
    let h = `<button class="cjback" id="cjback">← Toutes les commandes</button>
      <div style="border:1px solid rgba(196,113,79,.25);border-radius:13px;padding:13px;margin-bottom:12px;background:#10151f">
        <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:16px">${esc(c.client)}</b>
          ${c.retard ? `<span class="rt" style="color:#E74C3C;font-weight:700">+${c.retard} j retard</span>` : ''}</div>
        <div class="mt" style="font-size:12px;color:#8d96a5;margin:3px 0">${esc(c.ref)} · ${esc(c.com)} · livraison ${esc(c.livr || '—')}</div>
        <div style="font-size:13px">Total <b>${dh(c.total)}</b> · <span style="color:#37c98a">payé ${dh(c.paye)}</span> · <span style="color:#E74C3C">reste ${dh(c.reste)}</span></div>
        ${c.notes ? `<div class="mt" style="font-size:12px;margin-top:6px">📝 ${esc(c.notes)}</div>` : ''}
      </div>
      <div class="sub" style="margin-bottom:8px">${selA ? '👉 Article sélectionné — clique un <b>ouvrier à droite</b> pour l\'affecter.' : 'Les articles de ce client — sélectionne puis affecte à un ouvrier.'}</div>`;

    articlesDe(c).forEach(a => {
      const af = A[a.id];
      if (af) {
        const w = WORKERS.find(x => x.id === af.ouvrierId);
        h += `<div class="cjp" style="border-color:rgba(55,201,138,.4)">${photoOf(a)}<div class="pn">${esc(a.nm)} <span class="pc">${a.qty ? a.qty+' × '+a.pu+' DH' : ''}</span></div>
          <div style="color:#37c98a;font-weight:700;font-size:12px">✅ ${esc(w ? w.nm : af.ouvrierId)}</div></div>`;
      } else {
        const on = selA === a.id;
        h += `<div class="cjp" style="${on ? 'border-color:#C4714F' : ''}">${photoOf(a)}
          <div class="pn">${esc(a.nm)} <span class="pc">${a.qty ? a.qty+' × '+a.pu+' DH' : (a.aDetailler ? 'détail/photo à compléter (fiche technique)' : '')}</span></div>
          <button class="vbtn" data-sel="${esc(a.id)}" data-nom="${esc(a.nm)}" data-ref="${esc(c.ref)}" data-client="${esc(c.client)}" data-qty="${a.qty||''}" data-pu="${a.pu||''}">${on ? '● Sélectionné' : 'Sélectionner'}</button></div>`;
      }
    });
    h += ficheMatiereHTML(c);
    box.innerHTML = h;
    const bk = document.getElementById('cjback'); if (bk) bk.onclick = () => { view = 'list'; selA = null; renderArts(); };
    box.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-sel'); selA = (selA === id) ? null : id; renderArts(); });
    wireFicheMatiere(c);
  }

  // ---- Étape PRÉ-PRODUCTION : fiche technique + matière première ----
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
      if (m) { bonLignes.push({ ref: m.ref, nom: m.nom, fournisseur: m.fournisseur, unite: m.unite, qty: 1 }); matQ = ''; renderArts(); }
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
  function renderWorkers() {
    const box = document.getElementById('workers'); if (!box) return;
    const groups = {}; WORKERS.forEach(w => { (groups[w.at] = groups[w.at] || []).push(w); });
    let h = '';
    Object.keys(groups).sort().forEach(at => {
      h += `<div style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <span style="background:${atColor(at)};color:#fff;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:700;font-size:12px">${at}</span>
        <b style="font-size:13px">${esc(atName(at))}</b></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">`;
      groups[at].forEach(w => {
        h += `<div data-assign="${w.id}" style="cursor:${selA ? 'copy' : 'pointer'};background:#161d2b;border:1px solid ${selA ? 'rgba(196,113,79,.5)' : 'rgba(196,113,79,.18)'};border-radius:11px;padding:9px">
          <div style="font-weight:600;font-size:13px">${esc(w.nm)}${w.chef ? ' · chef' : ''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="pc" style="font-size:10.5px;color:#8d96a5">${esc(atName(w.at))}</span>
            <button class="vbtn" data-voir="${w.id}">👁️ Voir</button>
          </div></div>`;
      });
      h += `</div></div>`;
    });
    box.innerHTML = h;
    box.querySelectorAll('[data-voir]').forEach(b => b.onclick = e => { e.stopPropagation(); location.href = 'ouvrier.html?w=' + b.getAttribute('data-voir'); });
    box.querySelectorAll('[data-assign]').forEach(el => el.onclick = () => { var wid=el.getAttribute('data-assign'); if (selA) affecter(selA, wid); else location.href='ouvrier.html?w='+wid; });
  }

  function affecter(itemId, wid) {
    const w = WORKERS.find(x => x.id === wid); if (!w) return;
    const btn = document.querySelector(`[data-sel="${(window.CSS && CSS.escape) ? CSS.escape(itemId) : itemId}"]`);
    const g = k => btn ? btn.getAttribute(k) : '';
    const nom = g('data-nom') || itemId, ref = g('data-ref'), client = g('data-client');
    const qty = +g('data-qty') || 0, pu = +g('data-pu') || 0;
    if (window.CJ) {
      window.CJ.affecterDetail({ articleId: itemId, ouvrierId: wid, atelierCode: w.at, nom, qty, pu, ref, client });
      window.CJ.evenement('info', 'Hanane', `Hanane a affecté « ${nom} » (${client}) à ${w.nm} — ${atName(w.at)}.`, '→ ' + w.nm);
    }
    selA = null;
    toastMsg(`✓ « ${nom} » affecté à ${w.nm} (${atName(w.at)})`);
    render();
  }

  function render() { ensureUI(); renderArts(); renderWorkers(); }
  window.render = render;
  window.addEventListener('load', render);
  if (window.CJ) window.CJ.abonner(() => renderArts());
})();
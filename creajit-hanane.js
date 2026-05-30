/* ============================================================
   CREAJIT IA — Espace Hanane enrichi (Module B+ : filtres, tout le
   catalogue/commandes à gauche, ouvriers réels par atelier à droite,
   cliquables vers leur mini-site).
   S'appuie sur le style existant (.col/.art/.wk...) et sur window.CJ.
   ============================================================ */
(function () {
  if (location.pathname.toLowerCase().indexOf('hanane') < 0) return;

  // ---- Données réelles ----
  const COMMANDES = [
    { ref:'26040019', client:'2A WEDDING', commercial:'Ikram Benaddi', statut:'confirmed', livraison:'2026-05-05', retard:24,
      articles:[ {id:'a1',nm:'Chaise Cartel',qty:75,pu:730}, {id:'a2',nm:'TABLEAU 120/80',qty:25,pu:730}, {id:'a3',nm:'TABLEAU 40/40',qty:40,pu:550} ] },
    { ref:'26050030', client:'Mme Daniela Douhi',  commercial:'—', statut:'ready',     livraison:null,         retard:0,  articles:[] },
    { ref:'26040052', client:'Mr Benjamin',        commercial:'—', statut:'ready',     livraison:'2026-05-08', retard:21, articles:[] },
    { ref:'26040045', client:'Mr Yazid',           commercial:'—', statut:'ready',     livraison:'2026-05-04', retard:25, articles:[] },
    { ref:'26040053', client:'Expresse Beuty',     commercial:'—', statut:'confirmed', livraison:'2026-05-08', retard:21, articles:[] },
    { ref:'26040008', client:'Mr Youssef Ajdir',   commercial:'—', statut:'ready',     livraison:'2026-05-09', retard:20, articles:[] },
    { ref:'26040022', client:'Mme Ilhame',         commercial:'—', statut:'ready',     livraison:'2026-05-15', retard:14, articles:[] },
    { ref:'26040016', client:'Mme Perez',          commercial:'—', statut:'ready',     livraison:'2026-05-30', retard:0,  articles:[] },
    { ref:'26040024', client:'Mme Anisa Guerroumi',commercial:'—', statut:'ready',     livraison:'2026-05-16', retard:13, articles:[] },
    { ref:'26040025', client:'Showroom',           commercial:'—', statut:'ready',     livraison:null,         retard:0,  articles:[] },
    { ref:'26040026', client:'Mr Soufiane',        commercial:'—', statut:'ready',     livraison:'2026-05-04', retard:25, articles:[] },
    { ref:'26040060', client:'Mme Laila',          commercial:'—', statut:'confirmed', livraison:'2026-05-20', retard:0,  articles:[] },
    { ref:'26040048', client:'Azzozi Relax Houses',commercial:'—', statut:'ready',     livraison:'2026-05-08', retard:21, articles:[] },
    { ref:'26040059', client:'Mme Zaki Nadia',     commercial:'—', statut:'confirmed', livraison:null,         retard:0,  articles:[] },
    { ref:'26050007', client:'Mr Maliki',          commercial:'—', statut:'confirmed', livraison:'2026-05-25', retard:0,  articles:[] },
    { ref:'26050010', client:'Mme Soumali',        commercial:'—', statut:'confirmed', livraison:null,         retard:0,  articles:[] },
    { ref:'26050015', client:'Mme Yasmine',        commercial:'—', statut:'confirmed', livraison:null,         retard:0,  articles:[] },
    { ref:'26050019', client:'Mme Nazha',          commercial:'—', statut:'ready',     livraison:'2026-05-18', retard:11, articles:[] },
  ];

  // Ouvriers réels par atelier (depuis ta fiche Ateliers)
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

  // Catalogue produits CreaJit (extrait synchronisé — stock réel ; sync complète = Module J)
  const CAT = [
    ['BROOKLYN','SALONS','rupture'],['DOUBLE LOV','SALONS','rupture'],['EGO L','SALONS','rupture'],['LUNA SOFT','SALONS','rupture'],['MERIDIEN','SALONS','rupture'],['NOVA','SALONS','rupture'],['NUAGE','SALONS','rupture'],['MISA','SALONS','rupture'],['ASTORIA','SALONS','bas'],['SKY','SALONS','bas'],['ARCUS','SALONS','bas'],['PRESTIGE II','SALONS','bas'],['Dune','SALONS','bas'],
    ['Chaise LUNA MOVE','CHAISES','rupture'],['Chaise MARRY II','CHAISES','rupture'],['ELEGANCE BAR','CHAISES','rupture'],['PULSY III','CHAISES','rupture'],['TROCADEROXIS','CHAISES','rupture'],['chaise HERMES','CHAISES','rupture'],['Chaise HARMONIE','CHAISES','bas'],['Chaise MARRY','CHAISES','bas'],
    ['ELLIPSE','TABLES','rupture'],['HORIZON','TABLES','rupture'],['PEBBLE DUO','TABLES','rupture'],['PIETRA','TABLES','rupture'],['VELA','TABLES','rupture'],['Table Marmo','TABLES','rupture'],['TALIA','TABLES','bas'],['SERENIA','TABLES','bas'],
    ['Lit CARRET','CHAMBRE','rupture'],['Lit CELESTIA','CHAMBRE','rupture'],['Lit ORION','CHAMBRE','rupture'],['Lit ZENORA','CHAMBRE','rupture'],['Lit OLIA','CHAMBRE','bas'],['Lit CLOUD','CHAMBRE','bas'],['ORYX','CHAMBRE','bas'],
    ['AURAX','TRAVERTIN SELECTION','rupture'],['Aeris','TRAVERTIN SELECTION','rupture'],['CERATRAV','TRAVERTIN SELECTION','rupture'],['TRAVERTINO','TRAVERTIN SELECTION','rupture'],['ROCASA','TRAVERTIN SELECTION','bas'],['SILIA','TRAVERTIN SELECTION','bas'],
    ['ELOR','DECORATIONS','rupture'],['ELYA','DECORATIONS','rupture'],['Nawal','DECORATIONS','rupture'],['Nexus Taupe','DECORATIONS','rupture'],['PUR LIN','DECORATIONS','rupture'],['Silhouette','DECORATIONS','bas'],['Épure','DECORATIONS','bas'],
    ['Pergola Ombrella','JARDIN','rupture'],['Pergola VOLERA','JARDIN','rupture'],['ZETTALIQUE','JARDIN','rupture'],['Balançoire AUREA','JARDIN','bas'],['Chaise SOLIS','JARDIN','bas'],
    ['ABSOLU','MATELAS','rupture'],['PRESTIGIA','MATELAS','rupture'],['ÉQUILIBRE','MATELAS','rupture'],
    ['MAPLE','Cuivre Signature','bas'],['LEAF','Cuivre Signature','bas'],['MINA','Cuivre Signature','bas'],['SOUFFLE','Cuivre Signature','bas'],['CUIKECH','Cuivre Signature','bas'],
    ['Ceramlux','PROMO','bas'],['CasaKid','PROMO','bas'],['CLOUD','PROMO','bas'],['SLEEP WELL','PROMO','bas'],
  ].map(p => ({ nm:p[0], cat:p[1], stock:p[2] }));

  // ---- État des filtres ----
  let tab = 'commandes', q = '', fStat = '', tri = 'retard', selA = null;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const ats = () => (window.CJ_ATELIERS || []);
  const atName = c => { const a = ats().find(x => x.code === c); return a ? a.nom : ('Atelier ' + c); };
  const atColor = c => { const a = ats().find(x => x.code === c); return a ? a.couleur : '#C4714F'; };
  const affs = () => (window.CJ ? window.CJ.etat().affectations : {});

  function toastMsg(m) { if (typeof window.toast === 'function') window.toast(m); }

  // ---- Barre de filtres (injectée une fois) ----
  function ensureUI() {
    if (document.getElementById('cjhf')) return;
    const arts = document.getElementById('arts'); if (!arts) return;
    const bar = document.createElement('div'); bar.id = 'cjhf';
    bar.innerHTML = `
      <div class="cjtabs">
        <button data-tab="commandes" class="on">📋 Commandes (${COMMANDES.length})</button>
        <button data-tab="catalogue">🛋️ Catalogue (${CAT.length})</button>
      </div>
      <div class="cjfilt">
        <input id="cjq" placeholder="🔎 Client, référence, produit, commercial…">
        <select id="cjstat"><option value="">Tous statuts</option><option value="ready">Prête</option><option value="confirmed">Confirmée</option></select>
        <select id="cjtri"><option value="retard">Tri : retard</option><option value="livraison">Tri : livraison</option><option value="client">Tri : client</option></select>
      </div>`;
    arts.parentNode.insertBefore(bar, arts);
    const sty = document.createElement('style');
    sty.textContent = `
      #cjhf{margin-bottom:12px}
      #cjhf .cjtabs{display:flex;gap:8px;margin-bottom:9px}
      #cjhf .cjtabs button{background:#10151f;border:1px solid rgba(196,113,79,.25);color:#8d96a5;border-radius:10px;padding:8px 13px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
      #cjhf .cjtabs button.on{background:#C4714F;color:#1a0f08;border-color:#C4714F}
      #cjhf .cjfilt{display:flex;gap:8px;flex-wrap:wrap}
      #cjhf input,#cjhf select{background:#10151f;border:1px solid rgba(196,113,79,.25);color:#ece9e3;border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit}
      #cjhf #cjq{flex:1;min-width:180px}
      .cjp{display:flex;align-items:center;gap:10px;background:#161d2b;border:1px solid rgba(196,113,79,.18);border-radius:11px;padding:10px 12px;margin-bottom:7px}
      .cjp .pn{flex:1;font-size:14px;font-weight:600}
      .cjp .pc{font-size:11px;color:#8d96a5}
      .cjp .pb{font-size:11px;padding:2px 9px;border-radius:20px;font-weight:700}
      .cjp .rupture{background:rgba(231,76,60,.16);color:#E74C3C}.cjp .bas{background:rgba(234,179,8,.16);color:#EAB308}
      .cjcat-h{font-family:'Fraunces',serif;font-size:13px;color:#e69a76;margin:14px 0 7px;font-weight:700}
      .vbtn{background:#10151f;border:1px solid rgba(196,113,79,.3);color:#e69a76;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
      .vbtn:hover{background:#C4714F;color:#1a0f08}`;
    document.head ? document.head.appendChild(sty) : document.documentElement.appendChild(sty);

    bar.querySelectorAll('.cjtabs button').forEach(b => b.onclick = () => {
      tab = b.getAttribute('data-tab');
      bar.querySelectorAll('.cjtabs button').forEach(x => x.classList.toggle('on', x === b));
      renderArts();
    });
    bar.querySelector('#cjq').oninput = e => { q = e.target.value.toLowerCase(); renderArts(); };
    bar.querySelector('#cjstat').onchange = e => { fStat = e.target.value; renderArts(); };
    bar.querySelector('#cjtri').onchange = e => { tri = e.target.value; renderArts(); };
  }

  // ---- Rendu colonne gauche ----
  function renderArts() {
    ensureUI();
    const box = document.getElementById('arts'); if (!box) return;
    if (tab === 'catalogue') { renderCatalogue(box); return; }

    let cmds = COMMANDES.slice();
    if (fStat) cmds = cmds.filter(c => c.statut === fStat);
    if (q) cmds = cmds.filter(c => (c.ref + ' ' + c.client + ' ' + c.commercial + ' ' + c.articles.map(a => a.nm).join(' ')).toLowerCase().includes(q));
    cmds.sort((a, b) => tri === 'client' ? a.client.localeCompare(b.client)
      : tri === 'livraison' ? String(a.livraison || '9999').localeCompare(String(b.livraison || '9999'))
      : (b.retard - a.retard));

    const A = affs();
    let h = '';
    if (selA) h += `<div class="sub" style="color:#e69a76;margin-bottom:8px">👉 Article sélectionné — clique un <b>ouvrier à droite</b> pour l'affecter.</div>`;
    cmds.forEach(c => {
      const stat = c.statut === 'ready' ? 'Prête' : 'Confirmée';
      h += `<div style="border:1px solid rgba(196,113,79,.18);border-radius:13px;padding:11px;margin-bottom:10px;background:#10151f">
        <div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(c.ref || '—')} · ${esc(c.client)}</b>
          ${c.retard ? `<span style="color:#E74C3C;font-weight:700;font-size:12px">+${c.retard} j</span>` : ''}</div>
        <div class="pc" style="font-size:11.5px;color:#8d96a5;margin:2px 0 8px">${stat} · livraison ${esc(c.livraison || '—')} · ${esc(c.commercial)}</div>`;
      if (!c.articles.length) {
        const id = 'cmd_' + c.ref; const af = A[id];
        h += itemRow(id, 'Commande complète', '', c, af);
      } else {
        c.articles.forEach(a => { const af = A[a.id]; h += itemRow(a.id, a.nm, a.qty + ' × ' + a.pu + ' DH', c, af, a); });
      }
      h += `</div>`;
    });
    if (!cmds.length) h = `<div class="sub">Aucune commande ne correspond au filtre.</div>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-sel'); selA = (selA === id) ? null : id; renderArts(); });
  }

  function itemRow(id, nom, meta, c, af, art) {
    const selOn = selA === id;
    if (af) {
      const w = WORKERS.find(x => x.id === af.ouvrierId);
      return `<div class="cjp" style="border-color:rgba(55,201,138,.4)"><div class="pn">${esc(nom)} <span class="pc">${esc(meta)}</span></div>
        <div style="color:#37c98a;font-weight:700;font-size:12px">✅ ${esc(w ? w.nm : af.ouvrierId)}</div></div>`;
    }
    return `<div class="cjp" style="${selOn ? 'border-color:#C4714F' : ''}"><div class="pn">${esc(nom)} <span class="pc">${esc(meta)}</span></div>
      <button class="vbtn" data-sel="${esc(id)}" data-nom="${esc(nom)}" data-ref="${esc(c.ref || '')}" data-client="${esc(c.client)}" data-qty="${art ? art.qty : ''}" data-pu="${art ? art.pu : ''}">${selOn ? '● Sélectionné' : 'Sélectionner'}</button></div>`;
  }

  function renderCatalogue(box) {
    let items = CAT.slice();
    if (q) items = items.filter(p => (p.nm + ' ' + p.cat).toLowerCase().includes(q));
    const groups = {};
    items.forEach(p => { (groups[p.cat] = groups[p.cat] || []).push(p); });
    let h = '';
    Object.keys(groups).forEach(cat => {
      h += `<div class="cjcat-h">${esc(cat)} (${groups[cat].length})</div>`;
      groups[cat].forEach(p => {
        h += `<div class="cjp"><div class="pn">${esc(p.nm)}</div>
          <span class="pb ${p.stock}">${p.stock === 'rupture' ? '⛔ rupture' : '⚠️ stock bas'}</span></div>`;
      });
    });
    if (!items.length) h = `<div class="sub">Aucun produit ne correspond.</div>`;
    box.innerHTML = h;
  }

  // ---- Rendu colonne droite : ouvriers par atelier (cliquables) ----
  function renderWorkers() {
    const box = document.getElementById('workers'); if (!box) return;
    const groups = {};
    WORKERS.forEach(w => { (groups[w.at] = groups[w.at] || []).push(w); });
    let h = '';
    Object.keys(groups).sort().forEach(at => {
      h += `<div class="atgroup" style="margin-bottom:14px"><div class="ath" style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <span style="background:${atColor(at)};color:#fff;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:700;font-size:12px">${at}</span>
        <b style="font-size:13px">${esc(atName(at))}</b></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">`;
      groups[at].forEach(w => {
        h += `<div class="wk" data-assign="${w.id}" style="cursor:${selA ? 'copy' : 'default'};background:#161d2b;border:1px solid rgba(196,113,79,.18);border-radius:11px;padding:9px">
          <div style="font-weight:600;font-size:13px">${esc(w.nm)}${w.chef ? ' · chef' : ''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="pc" style="font-size:10.5px;color:#8d96a5">${esc(atName(w.at))}</span>
            <button class="vbtn" data-voir="${w.id}">👁️ Voir l'agent</button>
          </div></div>`;
      });
      h += `</div></div>`;
    });
    box.innerHTML = h;
    box.querySelectorAll('[data-voir]').forEach(b => b.onclick = (e) => { e.stopPropagation(); location.href = 'ouvrier.html'; });
    box.querySelectorAll('[data-assign]').forEach(el => el.onclick = () => { if (selA) affecter(selA, el.getAttribute('data-assign')); });
  }

  function affecter(itemId, wid) {
    const w = WORKERS.find(x => x.id === wid); if (!w) return;
    const btn = document.querySelector(`[data-sel="${CSS.escape(itemId)}"]`);
    const nom = btn ? btn.getAttribute('data-nom') : itemId;
    const ref = btn ? btn.getAttribute('data-ref') : '';
    const client = btn ? btn.getAttribute('data-client') : '';
    const qty = btn ? +btn.getAttribute('data-qty') || 0 : 0;
    const pu = btn ? +btn.getAttribute('data-pu') || 0 : 0;
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

/* ============================================================
   CREAJIT IA — Flux réel Hanane → Ouvrier (Modules B & C)
   Panneau autonome (overlay) ajouté aux pages Hanane et Ouvrier.
   Utilise le cerveau commun window.CJ (creajit-data.js).
   - Hanane : voit les commandes CreaJit, affecte un article à un ouvrier.
   - Ouvrier : voit en DIRECT les articles qu'on lui a affectés.
   ============================================================ */
(function () {
  function role() {
    const p = location.pathname.toLowerCase();
    if (p.includes('hanane')) return 'hanane';
    if (p.includes('ouvrier')) return 'ouvrier';
    return 'autre';
  }
  const R = role();
  if (R === 'autre' || !window.CJ) return;

  // Ouvrier de cette page (la maquette ouvrier = Youssef, atelier Peinture F)
  const MOI = { id: 'youssef', nom: 'Youssef Ibnradiya', at: 'F' };
  const OUVRIERS = [
    { id: 'youssef',  nom: 'Youssef Ibnradiya',  at: 'F' },
    { id: 'lafdili',  nom: 'Abdelaati Lafdili',  at: 'E' },
    { id: 'boualili', nom: 'Mohamed Boualili',   at: 'G' },
    { id: 'madidi',   nom: 'Yassine Madidi',     at: 'B' },
    { id: 'araji',    nom: 'Ahmed Araji',        at: 'B' },
  ];
  const STATUTS = { affecte: '📌 À faire', encours: '🔨 En cours', fini: '✅ Fini' };

  // ---- styles ----
  const st = document.createElement('style');
  st.textContent = `
  #cjfbtn{position:fixed;right:14px;top:12px;z-index:2147483000;background:#C4714F;color:#1a0f08;border:none;border-radius:24px;padding:11px 16px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.45);font-family:'Hanken Grotesk',Arial,sans-serif}
  #cjfov{position:fixed;inset:0;background:rgba(5,8,14,.78);z-index:2147483001;display:none;align-items:flex-start;justify-content:center;padding:60px 14px 14px;overflow:auto;font-family:'Hanken Grotesk',Arial,sans-serif}
  #cjfov.open{display:flex}
  #cjfpan{background:#141a26;border:1px solid #2c3850;border-radius:18px;max-width:780px;width:100%;padding:20px;color:#eef2f8;box-shadow:0 20px 60px rgba(0,0,0,.6)}
  #cjfpan h2{font-family:'Fraunces',serif;font-size:21px;margin:0 0 4px}
  #cjfpan .sub{color:#97a2b2;font-size:13px;margin-bottom:16px}
  #cjfpan .x{float:right;background:#222c3d;border:1px solid #2c3850;color:#eef2f8;border-radius:9px;padding:6px 11px;cursor:pointer;font-weight:700}
  .cjcmd{border:1px solid #2c3850;border-radius:13px;padding:13px;margin-bottom:11px;background:#1a2230}
  .cjcmd .ttl{font-weight:700;font-size:15px}
  .cjcmd .cl{color:#97a2b2;font-size:12.5px;margin-bottom:8px}
  .cjart{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border-top:1px solid #28303f;padding:9px 0}
  .cjart .an{flex:1;min-width:140px;font-size:14px}
  .cjart select{background:#0f1622;color:#eef2f8;border:1px solid #2c3850;border-radius:8px;padding:7px 9px;font-size:13px;font-family:inherit}
  .cjart button{background:#2fbd74;color:#06210f;border:none;border-radius:8px;padding:8px 13px;font-weight:700;font-size:13px;cursor:pointer}
  .cjart .done{color:#2fbd74;font-weight:700;font-size:12.5px}
  .cjbadge{display:inline-block;font-size:11px;padding:2px 9px;border-radius:20px;background:#222c3d;color:#e69a76;margin-left:6px}
  .cjwork{border:1px solid #2c3850;border-radius:13px;padding:14px;margin-bottom:10px;background:#1a2230}
  .cjwork .wt{font-weight:700;font-size:16px}
  .cjwork .wm{color:#97a2b2;font-size:12.5px;margin:3px 0 10px}
  .cjwork button{background:#C4714F;color:#1a0f08;border:none;border-radius:9px;padding:9px 14px;font-weight:700;font-size:13px;cursor:pointer;margin-right:7px}
  .cjwork button.fin{background:#2fbd74;color:#06210f}
  .cjempty{color:#97a2b2;font-size:14px;padding:14px;text-align:center;border:1px dashed #2c3850;border-radius:12px}
  `;
  document.head ? document.head.appendChild(st) : document.documentElement.appendChild(st);

  // ---- bouton + overlay ----
  const btn = document.createElement('button');
  btn.id = 'cjfbtn';
  btn.textContent = R === 'hanane' ? '📥 Commandes à affecter' : '📋 Mes articles (direct)';
  const ov = document.createElement('div');
  ov.id = 'cjfov';
  ov.innerHTML = '<div id="cjfpan"></div>';
  function add() { document.body.appendChild(btn); document.body.appendChild(ov); }
  if (document.body) add(); else window.addEventListener('DOMContentLoaded', add);

  const pan = () => ov.querySelector('#cjfpan');
  function ouvrir() { rendre(); ov.classList.add('open'); }
  function fermer() { ov.classList.remove('open'); }
  btn.onclick = ouvrir;
  ov.onclick = (e) => { if (e.target === ov) fermer(); };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- rendu Hanane ----
  function rendreHanane() {
    const cmds = CJ.commandes();
    let h = `<button class="x" onclick="document.getElementById('cjfov').classList.remove('open')">✕</button>
      <h2>📥 Commandes CreaJit — à vérifier & affecter</h2>
      <div class="sub">Choisis un ouvrier pour chaque article, puis « Affecter ». L'ouvrier le verra aussitôt.</div>`;
    cmds.forEach(c => {
      h += `<div class="cjcmd"><div class="ttl">${esc(c.ref)} — ${esc(c.client)}${c.joursRetard ? `<span class="cjbadge" style="color:#e8584a">+${c.joursRetard} j retard</span>` : ''}</div>
        <div class="cl">${esc(c.commercial || '')}</div>`;
      if (!c.articles || !c.articles.length) {
        h += `<div class="cl" style="border-top:1px solid #28303f;padding-top:8px">Pas de détail d'articles (fiche technique à faire).</div>`;
      } else {
        c.articles.forEach(a => {
          const af = CJ.etat().affectations[a.id];
          const opts = OUVRIERS.map(o => `<option value="${o.id}|${o.at}"${af && af.ouvrierId === o.id ? ' selected' : ''}>${esc(o.nom)} (${o.at})</option>`).join('');
          h += `<div class="cjart"><div class="an">${esc(a.nom)} ×${a.qte}</div>`;
          if (af) {
            const nom = (OUVRIERS.find(o => o.id === af.ouvrierId) || {}).nom || af.ouvrierId;
            h += `<div class="done">✅ Affecté à ${esc(nom)} — ${STATUTS[af.statut] || af.statut}</div>`;
          } else {
            h += `<select data-aid="${a.id}">${opts}</select><button data-aff="${a.id}">Affecter</button>`;
          }
          h += `</div>`;
        });
      }
      h += `</div>`;
    });
    pan().innerHTML = h;
    pan().querySelectorAll('button[data-aff]').forEach(b => {
      b.onclick = () => {
        const aid = b.getAttribute('data-aff');
        const sel = pan().querySelector(`select[data-aid="${aid}"]`);
        const [oid, at] = sel.value.split('|');
        const x = CJ.article(aid); const art = x ? x.article : { nom: aid };
        const nom = (OUVRIERS.find(o => o.id === oid) || {}).nom || oid;
        CJ.affecter(aid, oid, at, 1);
        CJ.evenement('info', 'Hanane', `Hanane a affecté « ${art.nom} » à ${nom} (atelier ${at}).`, '→ Ouvrier ' + nom);
        rendreHanane();
      };
    });
  }

  // ---- rendu Ouvrier ----
  function rendreOuvrier() {
    const arts = CJ.articlesDeLOuvrier(MOI.id);
    let h = `<button class="x" onclick="document.getElementById('cjfov').classList.remove('open')">✕</button>
      <h2>📋 Mes articles affectés — ${esc(MOI.nom)}</h2>
      <div class="sub">Ce que Hanane t'a confié. Mis à jour en direct.</div>`;
    if (!arts.length) {
      h += `<div class="cjempty">Aucun article affecté pour l'instant.<br>Quand Hanane t'affecte un article, il apparaît ici tout de suite.</div>`;
    } else {
      arts.forEach(({ article, commande, affectation }) => {
        h += `<div class="cjwork"><div class="wt">${esc(article.nom)} <span class="cjbadge">${STATUTS[affectation.statut] || affectation.statut}</span></div>
          <div class="wm">Commande ${esc(commande.ref)} — ${esc(commande.client)} · atelier ${esc(affectation.atelierCode)} · qté ${article.qte || ''}</div>`;
        if (affectation.statut !== 'fini') {
          h += `<button data-start="${article.id}">${affectation.statut === 'encours' ? '⏸ En cours…' : '▶ Commencer'}</button>
                <button class="fin" data-fin="${article.id}">✅ Marquer fini</button>`;
        } else {
          h += `<div class="done" style="color:#2fbd74;font-weight:700">✅ Terminé — envoyé à Fatima (qualité)</div>`;
        }
        h += `</div>`;
      });
    }
    pan().innerHTML = h;
    pan().querySelectorAll('button[data-start]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-start'); const x = CJ.article(id);
      CJ.majAffectation(id, { statut: 'encours' });
      CJ.evenement('info', MOI.nom, `${MOI.nom} a démarré « ${x ? x.article.nom : ''} ».`);
      rendreOuvrier();
    });
    pan().querySelectorAll('button[data-fin]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-fin'); const x = CJ.article(id);
      CJ.majAffectation(id, { statut: 'fini' });
      CJ.evenement('success', MOI.nom, `${MOI.nom} a fini « ${x ? x.article.nom : ''} ».`, '→ Fatima (qualité)');
      rendreOuvrier();
    });
  }

  function rendre() { R === 'hanane' ? rendreHanane() : rendreOuvrier(); }

  // mise à jour en direct quand l'état change (autre page/onglet)
  CJ.abonner(() => { if (ov.classList.contains('open')) rendre(); });
})();

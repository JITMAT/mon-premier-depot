/* ============================================================
   CREAJIT IA — Fiche ouvrier personnalisée (ouvrier.html?w=<id>)
   Chaque ouvrier ouvre SA fiche (nom, atelier) et voit SES articles
   affectés par Hanane. Sans ?w, on reste sur l'ouvrier de la maquette.
   ============================================================ */
(function () {
  if (location.pathname.toLowerCase().indexOf('ouvrier') < 0) return;
  var wid = new URLSearchParams(location.search).get('w');
  var reg = window.CJ_WORKERS || [];
  var moi = reg.find(function (w) { return w.id === wid; }) || { id: 'ibnradiya', nm: 'Youssef Ibnradiya', at: 'F' };
  window.CJ_MOI = moi.id;

  function atName(c) { var a = (window.CJ_ATELIERS || []).find(function (x) { return x.code === c; }); return a ? a.nom : ('Atelier ' + c); }
  function ini(nm) { return nm.split(' ').map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase(); }

  function applyIdentity() {
    var nmEl = document.querySelector('.profile .nm');
    var rlEl = document.querySelector('.profile .rl');
    var av = document.getElementById('pAv');
    if (nmEl) nmEl.textContent = moi.nm;
    if (rlEl) rlEl.textContent = atName(moi.at) + ' · Atelier ' + moi.at + (moi.chef ? ' · chef' : '');
    if (av) av.innerHTML = '<div class="ini">' + ini(moi.nm) + '</div>';
    // Pour un autre ouvrier que celui de la maquette : on vide la file de démo,
    // il ne voit QUE ses vraies affectations de Hanane.
    if (moi.id !== 'ibnradiya' && typeof TASKS !== 'undefined') TASKS.length = 0;
    if (typeof renderWork === 'function') renderWork();
  }

  function sync() {
    if (typeof TASKS === 'undefined' || !window.CJ) return;
    var ass = window.CJ.etat().affectations, ch = false;
    Object.keys(ass).forEach(function (aid) {
      var af = ass[aid]; if (af.ouvrierId !== moi.id) return;
      if (TASKS.find(function (t) { return t.art === aid; })) return;
      var pv = (af.qty || 0) * (af.pu || 0);
      TASKS.push({ art: aid, nm: af.nom || aid, etape: af.atelierCode ? ('Atelier ' + af.atelierCode) : 'À faire', qty: af.qty || 1, pv: pv, moTot: Math.round(pv * 0.03), state: 'attente' });
      ch = true;
      if (typeof toast === 'function') toast("📥 Hanane t'a affecté « " + (af.nom || '') + " »");
    });
    if (ch && typeof renderWork === 'function') renderWork();
  }

  window.addEventListener('load', function () { applyIdentity(); sync(); });
  if (window.CJ) window.CJ.abonner(sync);
})();

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

  // System prompt PERSONNALISÉ pour l'IA de cette personne (sinon tout le monde = Youssef)
  (function () {
    var at = (window.CJ_ATELIERS || []).find(function (x) { return x.code === moi.at; });
    var poste = moi.role ? moi.role
      : (at ? ('ouvrier à l\'atelier ' + at.nom + ' (atelier ' + moi.at + ', ~' + at.coutH + ' DH/h)') : 'ouvrier');
    var prenom = (moi.nm || '').split(' ')[0];
    window.CJ_SYS = "Tu es l'assistant IA personnel de " + moi.nm + ", " + poste + " chez CREAJIT (meubles sur mesure, Marrakech). "
      + "Tu l'aides concrètement : estimer le temps et le coût de main d'œuvre, calculer les quantités de matière (coefficient de chute), vérifier le stock, rédiger des messages courts au magasin (Mohamed) ou à Fatima (logistique), et comprendre sa paie/prime (1% du bénéfice par article). "
      + "Tu es CONNECTÉ aux autres agents (voir l'état partagé temps réel ci-dessous). "
      + "Réponds en français, simple et court, et adresse-toi à " + prenom + " (jamais à quelqu'un d'autre).";
  })();

  function atName(c) { var a = (window.CJ_ATELIERS || []).find(function (x) { return x.code === c; }); return a ? a.nom : ('Atelier ' + c); }
  function ini(nm) { return nm.split(' ').map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase(); }

  function applyIdentity() {
    var nmEl = document.querySelector('.profile .nm');
    var rlEl = document.querySelector('.profile .rl');
    var av = document.getElementById('pAv');
    if (nmEl) nmEl.textContent = moi.nm;
    if (rlEl) rlEl.textContent = moi.role ? moi.role : (atName(moi.at) + ' · Atelier ' + moi.at + (moi.chef ? ' · chef' : ''));
    if (av) av.innerHTML = (window.CJ_PHOTOS && window.CJ_PHOTOS[moi.id]) ? ('<img src="' + window.CJ_PHOTOS[moi.id] + '">') : ('<div class="ini">' + ini(moi.nm) + '</div>');
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

/* ============================================================
   CREAJIT IA — Ouvrier connecté (source unique CJ)
   Remplit la file de travail (TASKS) de la maquette ouvrier à partir des
   VRAIES affectations par article de Hanane, et fait remonter le travail
   (démarré/pause/fini + chrono) dans le cerveau commun → page commande + cockpit.
   ============================================================ */
(function () {
  if (location.pathname.toLowerCase().indexOf('ouvrier') < 0) return;
  if (typeof window.CJ === 'undefined') return;

  var wid = (window.CJ_MOI) || (new URLSearchParams(location.search).get('w')) || 'ibnradiya';

  function atName(c) { var a = (window.CJ_ATELIERS || []).find(function (x) { return x.code === c; }); return a ? a.nom : ('Atelier ' + c); }
  function th(c) { return (window.coutHoraire ? window.coutHoraire(c) : 60); }

  // Garde anti-réentrance : pendant une action locale (start/pause/fini), on
  // NE resynchronise PAS depuis CJ. Sinon l'évènement émis par la maquette
  // rebâtirait TASKS et effacerait le chrono qu'on vient de lancer.
  var BUSY = false;

  // Reconstruit TASKS depuis CJ (affectations réelles de cet ouvrier)
  function sync() {
    if (BUSY) return;
    if (typeof TASKS === 'undefined') return;
    var taches = window.CJ.tachesOuvrier(wid);
    // si cet ouvrier n'est pas l'ouvrier de démo, on part des vraies tâches
    if (wid !== 'ibnradiya') TASKS.length = 0;
    taches.forEach(function (t) {
      if (TASKS.find(function (x) { return x.art === t.articleId; })) return;
      var pv = (t.qte || 1) * (t.prix || 0);
      var taux = th(t.atelierCode);
      TASKS.push({
        art: t.articleId, nm: t.nom, etape: atName(t.atelierCode), qty: t.qte,
        pv: pv, moTot: 0, taux: taux,
        state: t.statut === 'encours' ? 'en_cours' : (t.statut === 'pause' ? 'pause' : (t.statut === 'fini' ? 'fini' : 'attente')),
        t0: t.t0 || null, el: t.elapsedMs || 0, motif: t.motif || '', _cj: true
      });
    });
    if (typeof renderWork === 'function') renderWork();
  }

  // Brancher les actions ouvrier -> CJ (remontée temps réel).
  // On capture la tâche AVANT l'action (utile pour pause/fini), on exécute
  // l'action locale en mode BUSY (pas de resync intempestif), puis on pousse
  // le nouvel état vers CJ — ce qui déclenche un resync propre.
  function hook(name, kind) {
    if (typeof window[name] !== 'function') return;
    var orig = window[name];
    window[name] = function () {
      var avant = (typeof cur === 'function') ? cur() : null; // tâche courante avant l'action
      BUSY = true;
      var r;
      try { r = orig.apply(this, arguments); } finally { BUSY = false; }
      try {
        if (kind === 'start') {
          var c = (typeof cur === 'function') ? cur() : null; // tâche qui vient de démarrer
          if (c && c.art) window.CJ.demarrerTravail(c.art, wid);
        } else if (kind === 'finish') {
          if (avant && avant.art) window.CJ.finirTravail(avant.art, wid);
        } else if (kind === 'pause') {
          if (avant && avant.art) window.CJ.pauserTravail(avant.art, wid, avant.motif || '');
        }
      } catch (e) {}
      return r;
    };
  }
  hook('startTask', 'start');
  hook('finish', 'finish');
  hook('pickMotif', 'pause');

  window.addEventListener('load', sync);
  window.CJ.abonner(sync);
})();

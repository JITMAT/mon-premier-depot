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

  // Reconstruit TASKS depuis CJ (affectations réelles de cet ouvrier)
  function sync() {
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

  // Brancher les actions ouvrier -> CJ (remontée temps réel)
  function hook(name, kind) {
    if (typeof window[name] !== 'function') return;
    var orig = window[name];
    window[name] = function () {
      var r = orig.apply(this, arguments);
      try {
        var c = (typeof cur === 'function') ? cur() : null;
        // pour finish/pause c'est la tâche courante ; pour start, la nouvelle courante
        if (c && c.art) {
          if (kind === 'start') window.CJ.demarrerTravail(c.art, wid);
          if (kind === 'finish') window.CJ.finirTravail(c.art, wid);
          if (kind === 'pause') window.CJ.pauserTravail(c.art, wid, c.motif || '');
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

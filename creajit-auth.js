/* Auth simple CREAJIT IA : un compte par salarié (code partagé 0000).
   - Sur ouvrier.html : si pas de ?w= et pas de session, on prend la session.
   - Stocke l'utilisateur connecté dans localStorage (creajit_user). */
(function () {
  window.CJ_AUTH = {
    user: function () { try { return JSON.parse(localStorage.getItem('creajit_user') || 'null'); } catch (e) { return null; } },
    login: function (u) { localStorage.setItem('creajit_user', JSON.stringify(u)); },
    logout: function () { localStorage.removeItem('creajit_user'); location.href = 'login.html'; },
  };
  // Sur la fiche ouvrier sans ?w=, on utilise l'ouvrier connecté s'il existe
  if (location.pathname.toLowerCase().indexOf('ouvrier') >= 0) {
    var hasW = new URLSearchParams(location.search).get('w');
    var u = window.CJ_AUTH.user();
    if (!hasW && u && u.id) {
      window.CJ_MOI = u.id; // la fiche ouvrier lira cet id
    }
  }
})();

/* ============================================================
   CREAJIT IA — Client API (appelle /api/creajit, le serveur Netlify
   qui a accès à creajit.ma). Remplit window.CJ_COMMANDES_REELLES et
   window.CJ_CATALOGUE, puis re-render. Fonctionne uniquement sur le
   site DÉPLOYÉ (les Netlify functions ne tournent pas en glisser-dépose).
   ============================================================ */
(function () {
  async function charger(resource) {
    try {
      const r = await fetch('/api/creajit?resource=' + resource);
      const j = await r.json();
      if (j && j.ok && Array.isArray(j.data)) return j.data;
    } catch (e) {}
    return null;
  }

  async function init() {
    // Commandes réelles (avec articles + photos)
    const orders = await charger('orders');
    if (orders && orders.length) {
      window.CJ_COMMANDES_REELLES = orders;
      if (typeof window.render === 'function') window.render(); // Hanane
    }
    // Catalogue réel (avec photos)
    const products = await charger('products');
    if (products && products.length) {
      window.CJ_CATALOGUE = products;
      if (typeof window.render === 'function') window.render();
    }
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();

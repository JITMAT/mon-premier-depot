# 🤝 INSTRUCTIONS POUR CLAUDE CODE (PC de Driss)

> **But :** récupérer les VRAIES commandes CreaJit **avec photos** et les afficher dans l'app.
> Le Claude « cloud » a tout construit mais son réseau est bloqué (il ne peut pas joindre
> creajit.ma). **Toi, sur le PC, tu as internet + accès à creajit.ma/admin.** Tu finis le branchement.

## Repo & contexte
- Dépôt : `jitmat/mon-premier-depot` — branche **`claude/modest-archimedes-fM6Gq`**.
- Lis d'abord **`CONTEXT.md`** (vision + règles) et **`POUR-CLAUDE-PC.md`** (détails techniques).
- Site statique (pages HTML à la racine) + modules `creajit-*.js`. Déployé sur Netlify
  (site **velvety-marshmallow-df2ac9**, id `7206780c-6cbc-41e8-868c-f3508f3602a8`), connecté à GitHub
  (push = déploiement auto). Functions : `netlify/functions/creajit.js` (proxy) + `claude.js`.

## ✅ Ce qui est déjà prêt (ne pas refaire)
- L'app **affiche automatiquement** `window.CJ_COMMANDES_REELLES` si ce tableau existe
  (branché dans `creajit-hanane.js`). Le détail client affiche déjà `articles[].photo`.
- `netlify/functions/creajit.js` appelle `/api/sales`, `/api/products-all`, `/api/deliveries`
  avec plusieurs formats d'auth, et normalise commandes (articles+photos) et produits.
  Variables Netlify : `CREAJIT_TOKEN` (scope All), `CREAJIT_BASE=https://creajit.ma`.

## État connu (testé)
- `/api/sales` **existe** (renvoie 401, pas 404) → bonne route.
- Le token `cj_live_…` est **refusé (401)**. Le token de session `localStorage.creajit_auth.token`
  est un **JWT qui EXPIRE** (ex. 15h04) → pas durable pour un header serveur.

## 🎯 DEUX FAÇONS DE FINIR (choisis la plus fiable)

### Voie 1 — API serveur (si un vrai token API non-expirant existe)
1. Sur creajit.ma/admin/settings, vérifier s'il existe une **clé API permanente** (section API/Intégrations).
2. La mettre dans Netlify → `CREAJIT_TOKEN` (scope All) → **Clear cache and deploy**.
3. Tester : `https://velvety-marshmallow-df2ac9.netlify.app/.netlify/functions/creajit?resource=raw&path=/api/sales`
   - JSON 200 → ouvrir `?resource=orders`, c'est bon.
   - 401 encore → le header ne suffit pas (session requise) → passer à la Voie 2.

### Voie 2 — Extraction navigateur (RECOMMANDÉE, marche à coup sûr) — Claude in Chrome
1. `navigate` → `https://creajit.ma/admin/orders` (connecté).
2. Exécuter `javascript_tool` (extrait les commandes du Fiber React) :
```js
const findFiberRoot = () => {
  const root = document.getElementById('root') || document.body;
  const key = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
  if (key) return root[key];
  for (const child of root.children) { const k = Object.keys(child).find(k => k.startsWith('__reactFiber')); if (k) return child[k]; }
};
const searchFiber = (fiber, depth = 0, found = []) => {
  if (!fiber || depth > 30) return found;
  let state = fiber.memoizedState;
  while (state) { const v = state.memoizedState;
    if (Array.isArray(v) && v.length >= 50 && v[0] && v[0].items && v[0].customer !== undefined) found.push(v);
    state = state.next; }
  searchFiber(fiber.child, depth+1, found); searchFiber(fiber.sibling, depth+1, found); return found;
};
const orders = searchFiber(findFiberRoot()).sort((a,b)=>b.length-a.length)[0] || [];
const out = orders.map(o => ({
  ref: o.documentNumber, date: (o.date||'').slice(0,10),
  client: o.customer?.name || '', vendeur: o.user?.name || '',
  statut: o.status || 'confirmed', total: o.total||0, paye: o.paid||0, reste: o.remaining||0,
  articles: (o.items||[]).map(i => ({
    nom: i.name, qty: i.quantity, pu: i.price,
    photo: i.image?.trim() ? ('https://creajit.ma'+i.image) : (i.images?.[0] ? ('https://creajit.ma'+i.images[0]) : '')
  }))
}));
JSON.stringify(out);
```
3. **Crée le fichier `creajit-commandes-reelles.js`** avec :
```js
window.CJ_COMMANDES_REELLES = /* colle ici le tableau JSON extrait */ ;
```
4. **Ajoute** dans `hanane.html`, juste avant `<script src="creajit-hanane.js">` :
```html
<script src="creajit-commandes-reelles.js"></script>
```
   (idéalement aussi dans `fatima.html` et `index.html` si tu veux les vraies données partout.)
5. `git add -A && git commit -m "Vraies commandes CreaJit avec photos" && git push` (branche
   `claude/modest-archimedes-fM6Gq`). Le déploiement Netlify se fait tout seul.
6. Vérifie sur le site déployé : page **Hanane** → clic sur un client → ses **vrais articles
   avec photos** → affecter à un ouvrier.

## ⚠️ Règles
- **Jamais** de token/clé en clair dans le code ou sur GitHub (reste dans Netlify env).
- Ne casse pas le flux existant (Hanane→Mohamed→Hassan→Ouvrier→Fatima→cockpit). N'invente pas d'écran.
- Si tu génères un snapshot de commandes (Voie 2), c'est figé : re-extraire quand Driss veut rafraîchir.

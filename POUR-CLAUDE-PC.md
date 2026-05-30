# 🤝 Passation à Claude Code (PC de Driss) — Brancher CreaJit en vrai

> **Pourquoi cette note ?** Le Claude « cloud » qui a construit cette app a son **réseau bloqué**
> (il ne peut PAS joindre `creajit.ma` : 403 « Host not in allowlist »). **Toi, Claude Code sur le
> PC de Driss, tu AS internet et accès à creajit.ma/admin.** Tu dois donc finir le branchement
> de l'API CreaJit (commandes + articles + photos). Driss te copie-colle ce fichier.

## Contexte (déjà fait)
- L'app est ce dépôt. Site statique : pages HTML à la racine (`index.html`, `hanane.html`,
  `ouvrier.html`, `magasin.html`, `reception.html`, `fatima.html`, `kenza.html`, `sabiri.html`,
  `consignes.html`, `agents.html`) + modules `creajit-*.js`. Lis **`CONTEXT.md`** en entier d'abord.
- Une **fonction serveur** existe déjà : `netlify/functions/creajit.js` (proxy vers creajit.ma,
  avec auto-découverte de routes). Redirigée en `/api/creajit` via `netlify.toml`.
- Déploiement : **Netlify**, site **velvety-marshmallow-df2ac9** (id `7206780c-6cbc-41e8-868c-f3508f3602a8`).
  Variables déjà créées : `CREAJIT_TOKEN` (clé `cj_live_…`, secrète) et `CREAJIT_BASE=https://creajit.ma`.

## Ce que l'auth CreaJit utilise (confirmé)
Le back-office stocke un **Bearer token** dans le navigateur :
`JSON.parse(localStorage.getItem('creajit_auth')).token` → appels API en
`Authorization: Bearer <token>`.

## ✅ MÉTHODE CONFIRMÉE PAR DRISS — Claude in Chrome (session navigateur)
Le détail des commandes + photos n'est **pas** dans une API publique : il est chargé **dans la
page React (Fiber) de l'admin**. Il faut donc une **session navigateur** (Claude in Chrome).

**Procédure exacte :**
1. `navigate` vers `https://creajit.ma/admin/orders` (connecté).
2. Exécuter ce `javascript_tool` (extrait les commandes avec photos depuis le Fiber React) :

```js
const findFiberRoot = () => {
  const root = document.getElementById('root') || document.body;
  const key = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
  if (key) return root[key];
  for (const child of root.children) {
    const k = Object.keys(child).find(k => k.startsWith('__reactFiber'));
    if (k) return child[k];
  }
};
const searchFiber = (fiber, depth = 0, found = []) => {
  if (!fiber || depth > 30) return found;
  let state = fiber.memoizedState;
  while (state) {
    const val = state.memoizedState;
    if (Array.isArray(val) && val.length >= 50) {
      if (val[0] && val[0].items && val[0].customer !== undefined) found.push(val);
    }
    state = state.next;
  }
  searchFiber(fiber.child, depth + 1, found);
  searchFiber(fiber.sibling, depth + 1, found);
  return found;
};
const orders = searchFiber(findFiberRoot()).sort((a,b) => b.length - a.length)[0];
const withPhotos = orders.filter(o => o.items?.some(i => i.image?.trim() || i.images?.length));
JSON.stringify(withPhotos.map(o => ({
  ref: o.documentNumber,
  date: o.date?.slice(0,10),
  client: o.customer?.name || '',
  vendeur: o.user?.name || '',
  total: o.total,
  photos: o.items.filter(i => i.image?.trim() || i.images?.length)
    .map(i => ({ article: i.name, url: 'https://creajit.ma' + i.image }))
})))
```

3. **Récupère tout le tableau `orders`** (pas seulement ceux avec photos) en mappant chaque
   commande vers : `{ ref:o.documentNumber, date, client:o.customer?.name, vendeur:o.user?.name,
   total:o.total, statut, articles: o.items.map(i => ({ nom:i.name, qty:i.quantity, pu:i.price,
   photo: i.image ? 'https://creajit.ma'+i.image : '' })) }`.
4. **Écris ces vraies commandes** dans un fichier `creajit-commandes-reelles.js` :
   `window.CJ_COMMANDES_REELLES = [ … ];`
5. Dans **`creajit-hanane.js`**, utilise `window.CJ_COMMANDES_REELLES` si présent (au lieu du
   tableau `COMMANDES` figé). Le détail client affiche déjà `articles[].photo` via `photoOf(a)`.
6. `git commit` + `push` sur `claude/modest-archimedes-fM6Gq`, puis déploie sur Netlify.

> Note : c'est une **extraction par session navigateur** (snapshot). Pour du temps réel, refaire
> l'extraction périodiquement, ou demander à l'équipe CreaJit une vraie API REST `/orders` avec photos.

## 🎯 TA MISSION (rappel / alternative API si elle existe)
1. **Découvrir les vraies routes de l'API CreaJit.**
   - Ouvre `https://creajit.ma/admin`, F12 → onglet **Network**, navigue sur **Commandes**,
     **détail d'une commande**, **Produits**. Note les **Request URL** exactes (ex.
     `https://creajit.ma/api/orders`, `/api/orders/:id`, `/api/products`).
   - OU teste directement en ligne de commande avec la clé (la même que dans Netlify) :
     ```bash
     TOKEN="cj_live_…"   # la clé de creajit.ma/admin/settings
     for p in /api/orders /api/v1/orders /api/commandes /api/products /api/v1/products; do
       echo "== $p =="; curl -s -H "Authorization: Bearer $TOKEN" "https://creajit.ma$p" | head -c 400; echo
     done
     ```
   - Identifie surtout : la route **liste des commandes**, la route **détail commande**
     (avec **les articles** : nom, quantité, prix, **et l'URL de la photo**), et la route **produits**.

2. **Mettre les vraies routes dans `netlify/functions/creajit.js`** (remplace les chemins
   candidats par les vrais), en gardant l'auth `Authorization: Bearer ${process.env.CREAJIT_TOKEN}`.
   Renvoyer un JSON normalisé :
   - `orders` → `[{ ref, client, commercial, statut, livraison, total, paye, reste, articles:[{nom,qty,pu,photo}] }]`
   - `products` → `[{ nom, prix, stock, photo }]`

3. **Brancher le front sur l'API** (au lieu des données figées) :
   - Dans **`creajit-hanane.js`** : remplacer le tableau `COMMANDES` codé en dur par un
     `fetch('/api/creajit?resource=orders')` au chargement, puis `renderArts()`.
   - Le **détail d'un client** doit utiliser `articles` réels (nom, qty, pu, **photo**) →
     la fonction `photoOf(a)` affiche déjà `a.photo` si présent.
   - Onglet **Catalogue** : `fetch('/api/creajit?resource=products')` → afficher nom/prix/stock/**photo**.

4. **Déployer** : `git add -A && git commit && git push` sur la branche
   `claude/modest-archimedes-fM6Gq`. Si le site Netlify est **connecté à GitHub**, il se déploie seul.
   Sinon : `netlify deploy --prod` (CLI Netlify авtorisée sur le PC).

5. **Vérifier** : ouvre
   `https://velvety-marshmallow-df2ac9.netlify.app/api/creajit?resource=orders`
   → doit renvoyer les vraies commandes en JSON. Puis tester la page **Hanane** : clic sur un
   client → ses **vrais articles avec photos** → affecter à un ouvrier.

## ⚠️ Sécurité
- **Ne jamais** mettre la clé en clair dans le code ni la pousser sur GitHub. Elle reste dans
  **Netlify → Environment variables → `CREAJIT_TOKEN`** (déjà fait).
- La clé `cj_live_…` a transité par un chat : **conseiller à Driss de la régénérer** une fois fini,
  et remettre la nouvelle dans Netlify.

## Garde-fous (cahier des charges, voir CONTEXT.md §13)
- Ne casse pas le flux existant : Hanane (client→articles→fiche technique→matière→affecter) →
  Mohamed (magasin) → Hassan (réception) → Ouvrier (chrono/fini) → Fatima (QC/livraison) → cockpit.
- N'invente pas d'écran. Branche les **vraies données** dans les écrans existants.

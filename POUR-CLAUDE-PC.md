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

## 🎯 TA MISSION
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

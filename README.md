# CREAJIT IA

Application de pilotage d'atelier pour **CREAJIT** (meubles sur mesure, Marrakech).
Voir **[CONTEXT.md](./CONTEXT.md)** — le fichier maître du projet.

## En ligne

Aperçu déployé (Netlify) : **https://velvety-marshmallow-df2ac9.netlify.app/**

## Les pages (maquettes validées avec Driss)

Site statique — chaque écran est une page HTML autonome :

| Fichier | Écran |
|---|---|
| `index.html`     | 🏠 Page d'accueil — **Cockpit Patron** (board, fil d'actualité, équipe, ouvriers en retard, rentabilité, alertes, assistant IA) |
| `ouvrier.html`   | 👷 Agent **Ouvrier** (file de travail, chrono, pauses, fabriqués, paie) |
| `hanane.html`    | 🗂️ Agent **Hanane** (vérifier et affecter les étapes) |
| `cockpit.html`   | 👁️ Cockpit (version creajitmesv2) |
| `banc-test.html` | 🔀 Banc de test des agents |
| `ouvrier-v2.html`| Ancienne version de l'agent ouvrier |

## Déploiement

Site statique, sans build. Déposer le dossier sur Netlify, ou laisser Netlify
publier la racine du dépôt (voir `netlify.toml`).

## Archives

- `legacy/` — ancienne app « CREAJIT MES v2 ».
- `legacy-react/` — échafaudage React du Socle (auth, modèle de données, calculs)
  conservé pour réutilisation éventuelle.

# CREAJIT IA

Application de pilotage d'atelier pour **CREAJIT** (meubles sur mesure, Marrakech).
Chaque salarié est un *agent* avec son interface et une IA qui l'assiste ; le patron
pilote depuis un *cockpit*. Voir **[CONTEXT.md](./CONTEXT.md)** — le fichier maître
du projet, à lire en entier avant toute session de code.

## En ligne

Aperçu déployé (Netlify) : **https://velvety-marshmallow-df2ac9.netlify.app/**
Connexion : choisir un compte, code `0000`.

## Démarrer

```bash
npm install
npm run dev      # serveur de développement (Vite)
npm run build    # build de production -> dist/
```

Connexion (Module 1 / Socle) : choisir un compte de direction, code par défaut `0000`.

## Où on en est

Construction **un module à la fois** (CONTEXT §8). Voir le *Journal de construction*
en bas de `CONTEXT.md`.

- ✅ **Module 1 — Socle** : structure du projet, système de design (thème sombre),
  modèle de données (`src/lib/schema.js`), règles de calcul (`src/lib/calculs.js`),
  données de référence (ateliers, équipe), authentification simple.

## Structure

```
src/
  data/        Données de référence (ateliers, équipe/rôles)
  lib/         Modèle de données (schema) + règles de calcul + base locale
  pages/       Écrans (Login, Accueil)
  store.js     Auth + base de données locale (Zustand, persistée navigateur)
legacy/        Ancienne app « CREAJIT MES v2 » conservée pour référence
```

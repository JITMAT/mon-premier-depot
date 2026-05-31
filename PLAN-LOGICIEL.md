# CREAJIT IA — Plan du logiciel (état actuel)

> Vue d'ensemble de tous les écrans et de leur connexion.
> Le « cerveau commun » (creajit-data.js) relie TOUT.

## Les écrans (un par rôle)

| Écran | Pour qui | Ce qu'il fait |
|-------|----------|---------------|
| 🏠 **index.html** | Driss (patron) | Cockpit : tableau de bord, **🏭 Suivi des commandes**, ouvriers, retards, rentabilité, alertes auto, assistant IA |
| 📋 **hanane.html** | Hanane (exploitation) | Les 186 commandes, détail par article : affecter ouvriers, fiche de production, achats matière |
| 👷 **ouvrier.html** | Chaque ouvrier | Sa fiche perso (nom/atelier/taux), ses articles avec photo+fiche+matière, chrono, son agent IA |
| 🚚 **fatima.html** | Fatima (qualité+logistique) | Contrôle qualité photo, livraisons avec **vrais retards** + **coordination atelier** |
| 🧰 **magasin.html** | Mohamed (magasin) | Bons de matière reçus, préparation |
| 📦 **reception.html** | Hassan (réception) | Réception matière |
| 💼 **kenza.html** | Kenza (commerciale) | Ventes |
| 💰 **sabiri.html** | Sabiri (compta) | Finance |
| 🎙️ **consignes.html** | Driss | Donner des consignes aux agents |
| 👥 **agents.html** | — | Liste de tous les agents |
| 🔑 **login.html** | Tous | Connexion par employé |
| 📊 **rentabilite.html** | Driss | Coût de revient, marge, prix conseillé |

## Comment tout est connecté (la coordination)

```
                    ┌─────────────────────────────┐
                    │   CERVEAU COMMUN (CJ)        │
                    │   creajit-data.js           │
                    │   + CJ.suivi() = colonne     │
                    │     vertébrale               │
                    └──────────────┬──────────────┘
                                   │ (tout le monde lit/écrit ici)
      ┌──────────┬──────────┬──────┴─────┬──────────┬──────────┐
      │          │          │            │          │          │
   HANANE     OUVRIER    MOHAMED      FATIMA      BOSS      KENZA
   affecte    bosse +    reçoit la    voit       voit       vend
   + fiche    chrono     matière      l'atelier  TOUT
   + matière             
      │          │          │            │          │
      └──── une commande passe par toutes ces étapes ────┘

   Pas lancé → Affecté → En fabrication → En pause →
   En contrôle qualité → Prêt à livrer → Livré
```

## Le point clé : CJ.suivi(commande)

Pour CHAQUE commande, cette fonction réunit :
- l'étape réelle (de « pas lancé » à « livré »)
- quels ateliers + quels ouvriers travaillent dessus
- combien d'articles finis / total
- l'état du contrôle qualité (ok / anomalie / en attente)
- la matière en attente
- le motif de pause s'il y en a
- le coût main-d'œuvre
- la progression 0–100 %

→ C'est ce qui fait que **Fatima et le boss voient enfin ce que font les ateliers**.

## Ce qui reste à faire

- [ ] Même vue de suivi dans la page Hanane
- [ ] Vrai temps réel entre appareils (base de données partagée en ligne)
- [ ] Déploiement sur Netlify (à faire depuis un poste avec internet)

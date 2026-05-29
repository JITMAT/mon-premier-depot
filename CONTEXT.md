# CONTEXT.md — CREAJIT IA

> Fichier maître du projet. **À lire en entier avant toute action.**
> Toute session de code commence par lire ce fichier, et se termine par le mettre à jour
> (section « Journal de construction » en bas).

---

## 0. Règle d'or pour l'assistant qui code

1. **Lis ce fichier en entier avant d'écrire une seule ligne.**
2. **Construis UN module à la fois**, dans l'ordre de la section 8. Ne touche pas aux autres modules.
3. **Ne pars jamais dans tous les sens.** Si un choix n'est pas écrit ici, tu le **demandes**, tu n'inventes pas.
4. Après chaque module : `git commit` clair + **mets à jour le Journal de construction** (section 11).
5. Le pilote du projet (Driss) valide chaque étape avec « Claude chat » avant de passer à la suivante.
6. Code simple, clair, commenté en français. Pas de sur-ingénierie.

---

## 1. C'est quoi CREAJIT IA

Une application de pilotage d'atelier pour **CREAJIT** (fabrication de meubles sur mesure, Sidi Ghanem, Marrakech, ~60 employés, dirigée par Driss).

**Idée centrale :** chaque salarié = un **agent**, avec sa propre interface (petit logiciel), ses tâches, ses outils et une **IA qui l'assiste**. Les agents sont **reliés entre eux** (ils se passent le travail et se notifient). Le patron (Driss) pilote tout depuis un **cockpit** avec un fil d'actualité temps réel et son propre assistant IA.

**Objectif business du patron :** savoir exactement **ce que chaque salarié fait**, **combien coûte et rapporte chaque article**, **quel atelier est rentable**, récompenser les ouvriers par des primes, contrôler la qualité à chaque étape, et **respecter les délais de livraison**.

---

## 2. Les utilisateurs (rôles)

**Direction**
- **Driss** — Patron. Voit tout (cockpit).
- **Kenza** — Responsable commerciale.
- **Mohamed Sabiri** — Comptable / Finance.
- **Hanane Ajdi** — Responsable exploitation & production (reçoit les commandes, vérifie, affecte).
- **Said Chnitifa** — Chef de tous les ateliers.
- **Fatima Ezzahra** — Contrôle qualité & Logistique (reçoit les articles finis, planifie livraison).
- **Mohamed (Magasin / Achat)** — gère le stock et les bons de commande matière.

**Ouvriers** — un agent chacun, rattaché à un atelier (voir section 4).

---

## 3. Les agents et ce qu'ils font

### Agent OUVRIER (modèle déjà validé)
Interface tablette/PC, **menu à gauche** :
- **Articles affectés** : sa file de travail. Il peut **démarrer / reprendre n'importe quel article**, **mettre en pause avec un motif** (🧱 Rupture matière, 🍽️ Pause déjeuner, 🔧 Problème technique, 📐 Manque info/plan, 🏠 Fin de journée, ✏️ Autre), et **finir** un article. Chrono par ouvrier. Quand il démarre un autre article, l'actuel se met en pause automatiquement (« Changement d'article »).
- **Articles fabriqués** : compteur + liste (temps, coût MO, bénéfice).
- **Bons de commande / magasin** : il passe un bon de matière → part chez Mohamed (magasin) → quand préparé, le bon passe **vert « reçu »** + notification.
- **Rentabilité & salaire** : salaire de base − absences − retards + **prime 1% du bénéfice** par article fabriqué.
- **Pointage** : heure d'arrivée, heure de démarrage fabrication, temps de pause (→ à brancher sur la pointeuse Hikvision).
- **Planning du mois** : calendrier de ses articles.
- **Assistant IA** : l'aide à calculer, vérifier la matière, écrire au magasin, comprendre sa paie.
- **Outils & matière** : vérifier le stock.

**Liens entre agents :**
- Quand l'ouvrier finit → **Fatima (logistique)** reçoit une notification de l'article.
- Quand l'ouvrier signale **Rupture matière** → notification à **Hanane + Service Achat** ; s'il sait commander, il passe le bon lui-même, sinon Hanane s'en occupe.

### Agent HANANE (exploitation)
Reçoit les commandes, **vérifie avant fabrication** (matière dispo, fiche technique, dimensions, envoie les photos aux ouvriers), puis **affecte chaque étape à un ouvrier**. Tant que la vérif n'est pas faite, l'ouvrier est bloqué.

### Agent MOHAMED (magasin / achat)
Reçoit les bons de commande, confirme quantité + délai, marque « reçu ».

### Agent FATIMA (QC / logistique)
Reçoit les articles finis, fait le contrôle qualité (photo bloquante par étape), planifie la livraison, respecte les dates.

### Agent PATRON (cockpit Driss)
- **Tableau de bord** : équipe de direction (cartes agents) + chiffres du jour.
- **Fil d'actualité** : chaque agent remonte en temps réel (démarrage, fin, pause+motif, rupture, livraison, bon reçu…).
- **Tous les ouvriers** : tableau triable (rentabilité / articles faits / ponctualité), statut **🟢 au travail / 🟡 en pause / 🔴 sans commande**. Clic → fiche complète (pointage, pauses, comportement, production, **règlement salaire : salaire − acompte = reste à payer**).
- **Ouvriers en retard** : retard pointeuse du jour + stats.
- **Rentabilité des articles** : marge par article (prix réels CreaJit).
- **Alertes** : ruptures, stock bas, commandes en retard.
- **Mon assistant IA** : voit tout l'atelier, répond aux questions du patron.

### Banc de test agents (validé)
Écran où les agents se parlent réellement (réponses IA) ; sert à tester les scénarios (rupture → Mohamed, fini → Fatima, affectation Hanane → ouvrier).

---

## 4. Les ateliers et taux horaires

| Code | Atelier | Chef | Taux (DH/h) |
|---|---|---|---|
| A | Tapisserie | Ayoub El Yagiz | 26 |
| B | Chaise | Ahmed El Araji | 26 |
| C | CNC | Bahri | 28 |
| D | Résine | Ettaib | 24 |
| E | Menuiserie | Said Chnitifa | 26 |
| F | Peinture | Elkarmani | 22 |
| G | Ferronnerie | Boualili | 25 |
| H | Pierre | Aababou | 29 |
| I | Cuivre | Noureddine | 29 |

Un article passe par **plusieurs ateliers** (ex. Chaise : Ferronnerie → Tapisserie → Peinture). Chaque étape = un atelier + un ouvrier + un chrono + un contrôle qualité.

---

## 5. Les règles de calcul (NE PAS changer sans validation de Driss)

- **Coût main d'œuvre (par atelier)** = heures × taux horaire de l'atelier.
- **Matières** = quantité × prix unitaire × (1 + coefficient de chute).
  - Chutes : Tissu +18%, Bois +12%, Mousse +10%, Pierre +8%, Peinture +22%, Cuivre +10%, Résine +15%, Quincaillerie +5%.
- **Charges fixes** = **3 935 DH par article**.
- **Coût de revient** = main d'œuvre + matières + charges fixes.
- **Marge (bénéfice)** = Prix de vente − coût de revient.
- **Prime salarié** = **1% du bénéfice** de chaque article fabriqué.
  - ⚠️ Formule de bénéfice donnée par Driss pour la prime : Prix de vente − coût de fabrication (main d'œuvre) − charges fixes. **À confirmer** : inclure ou non les matières, et prime sur tout l'article ou sur la part de l'ouvrier.
- **Salaire à payer** = salaire de base − retenue absences − retenue retards + primes. **Reste à payer** = salaire − acompte déjà versé.
- Charges fixes société : ~157 431 DH/mois. Seuil de survie ~550 000 DH/mois. Objectif CA 900 000 – 1 200 000 DH/mois.

---

## 6. Données réelles disponibles (via MCP CreaJit)

Le MCP `creajit` (https://mcp.creajit.ma/sse) donne déjà :
- `get_hr_summary` → employés, présents/retards/absents, avances, salaires non payés.
- `get_production_status` → en fabrication, livrées ce mois, en retard (avec jours de retard).
- `get_system_status` → produits, commandes, clients, CA 30j.
- `search_order(ref)` → une commande (client, total, payé, restant, articles).
- `search_client(name)` → historique client.
- `get_activity_logs` → journal d'actions.

**Chiffres réels au démarrage (29/05/2026)** : 60 employés, 20 commandes en fabrication, 26 livrées ce mois, 10 en retard, 333 289 DH d'avances ce mois.

**Commande de référence pour les tests** : `26040019` — 2A MARIAGE (commerciale Ikram), total 95 000 DH.
Articles : Chaise Cartel ×75 @730 ; Tableau 120/80 ×25 @730 ; Tableau 40/40 ×40 @550.

⚠️ Le MCP donne des agrégats, **pas** le détail par ouvrier ni le parcours d'ateliers par article : ces données devront être saisies/gérées par l'app (Hanane qui affecte).

---

## 7. Stack technique

- **Front** : une seule app web responsive (tablette/PC d'abord, téléphone parfois). HTML/CSS/JS simple ou framework léger — garder simple.
- **Données** : base persistante (commandes, articles, parcours d'ateliers, affectations, chronos, pointages, bons de commande, salaires).
- **IA des agents** : API Anthropic (Claude). Chaque agent a son rôle/personnalité (system prompt). L'assistant patron reçoit un snapshot temps réel de l'atelier.
- **Connecteurs** :
  - **CreaJit MCP** → données réelles.
  - **Wassenger / WhatsApp** → notifications réelles entre agents (Hanane, Mohamed, Fatima, Driss…).
  - **Hikvision** (pointeuse) → heures d'arrivée/sortie réelles (à brancher plus tard).
- **Hébergement** : **Netlify** (Driss a déjà un compte ; site MES existant `7fa9a3ea-09bf-4260-895d-a2301396bfb3`).
- **Auth** : un compte par salarié (login par atelier/ouvrier), un compte direction.

---

## 8. Ordre de construction (un module à la fois)

1. **Socle** : repo, base de données, modèle de données (ouvriers, ateliers, articles, parcours, affectations, chronos, bons, pointages, salaires), auth simple.
2. **Connexion CreaJit MCP** : afficher les vraies commandes + le tableau « Tous les ouvriers » avec données réelles.
3. **Agent OUVRIER** (le modèle validé) branché en vrai : file de travail, chrono, pause+motif, fini, fabriqués.
4. **Agent HANANE** : reçoit commandes, vérifie, affecte les étapes aux ouvriers.
5. **Liens entre agents** : fini → Fatima ; rupture → Hanane+Achat ; bon → Mohamed (avec retour « reçu »). Notifs **WhatsApp réelles** (Wassenger).
6. **Cockpit PATRON** : fil d'actualité (vrais événements), tous les ouvriers, ouvriers en retard, rentabilité articles, alertes, assistant IA.
7. **Bons de commande / magasin** (cycle complet) + **Rentabilité & salaire** (primes, acomptes, reste à payer).
8. **Pointage Hikvision** (heures réelles) + **Planning du mois**.
9. **Contrôle qualité photo** bloquant par étape.

> On valide chaque module avec Driss + Claude chat avant de passer au suivant.

---

## 9. Design

- Thème sombre. Couleurs : fond `#0d111b`, cartes `#1a2230`, orange `#C4714F`, vert `#2fbd74`, jaune `#e8b53b`, rouge `#e8584a`.
- Polices : titres « Fraunces », texte « Hanken Grotesk ».
- Statuts ouvriers : 🟢 au travail / 🟡 en pause / 🔴 sans commande.
- Simple, clair, gros chiffres, pas surchargé. Menu à gauche sur les interfaces salarié, cockpit pour le patron.
- Maquettes de référence déjà validées (à reproduire en vrai) : agent ouvrier, cockpit patron, banc de test agents.

---

## 10. Règles importantes (ne jamais oublier)

- **CREAJIT ≠ Palacio Réception** : ce sont deux entités séparées. Ne jamais mélanger. Compte Drive CREAJIT : `jitmat.contact@gmail.com`.
- Numéros internes à exclure du traitement des leads : Driss, Nawal.
- Les chiffres financiers officiels ne remplacent pas une validation comptable (OEC).
- Toujours garder le `CONTEXT.md` à jour à la fin de chaque session.

---

## 11. Journal de construction

> Chaque session de code ajoute une ligne ici : date, module touché, ce qui est fait, ce qui reste.

- **2026-05-29 — Module 1 (Socle).** Nouveau projet *CREAJIT IA* (React + Vite + Zustand).
  Mis en place : système de design thème sombre (`src/index.css`), modèle de données
  (`src/lib/schema.js` : ouvriers, articles, parcours, affectations, chronos, bons,
  pointages, salaires), règles de calcul §5 (`src/lib/calculs.js`), données de référence
  (ateliers §4, équipe/rôles §2), base locale persistée (`src/store.js`), authentification
  simple (compte direction + PIN), écrans Login + Accueil. Build OK, config Netlify ajoutée.
  L'ancienne app « CREAJIT MES v2 » est conservée dans `legacy/`.
  **Reste / à valider avec Driss :** base du calcul de la prime (matières incluses ou non) ;
  choix d'une vraie base persistante partagée (pour l'instant stockage navigateur) ;
  comptes ouvriers (un par atelier). **Prochain module : §8.2 — branchement CreaJit MCP**
  (vraies commandes + tableau « Tous les ouvriers »).
- **2026-05-29 — Auth.** Code d'accès unique partagé (`CODE_ACCES`, choix de Driss) ;
  prêt à évoluer vers un code par personne.
- **2026-05-29 — Module 2 (Données réelles CreaJit).** Instantané des vraies données
  récupéré via le connecteur CreaJit (`src/data/snapshot.js` : 20 cmd en fabrication,
  10 en retard, 26 livrées, 60 employés, 333 289 DH d'avances, commande réf. 26040019
  2A WEDDING). Nouvelle navigation à menu de gauche (`components/Layout.jsx`) + écrans
  **Tableau de bord** (chiffres du jour + alertes retard) et **Commandes** (liste +
  détail commande réf.). Page **Référentiel** (ateliers/règles/équipe). Build OK.
  **Reste :** brancher le temps réel (fonction serveur Netlify qui proxy le MCP — pour
  l'instant données figées en instantané) ; le détail **par ouvrier** n'existe pas dans
  le MCP (CONTEXT §6) → viendra avec l'agent Hanane qui affecte. **Prochain : §8.3 —
  Agent OUVRIER** (file de travail, chrono, pause+motif, fini).
- **2026-05-29 — Réalignement sur les maquettes validées.** Driss a fourni ses écrans
  déjà construits/testés avec Claude chat. On **abandonne la version générique** et on
  intègre ces maquettes telles quelles : `public/ecrans/` (ouvrier.html = agentyoussefv4,
  hanane.html, cockpit.html = creajitmesv2, banc-test.html = creajitflux, ouvrier-v2.html).
  Après connexion, un **lanceur** (`pages/Lanceur.jsx`) ouvre l'écran adapté au rôle.
  Pages génériques supprimées (TableauDeBord, Commandes, Référentiel, Layout). Build OK,
  écrans inclus dans `dist/ecrans/`. En ligne : https://velvety-marshmallow-df2ac9.netlify.app/
  **Reste :** wirer les écrans entre eux + aux vraies données ; choisir lesquels sont la
  référence définitive (cockpit vs banc de test).

---

## 12. Vision détaillée de Driss (précisions, point par point)

> Driss explique sa vision point par point ; on note ici au fur et à mesure,
> puis on construit. **À respecter pour la construction finale.**

**Point 1 — Chaque ouvrier est EN MÊME TEMPS un agent IA.**
L'ouvrier n'est pas un simple écran qui affiche des infos : c'est un véritable
**agent intelligent**. Pour chaque ouvrier, son IA doit :
- **réfléchir** (raisonner sur sa situation de travail) ;
- **anticiper** (voir venir les problèmes : rupture matière, retard, manque d'info…) ;
- **calculer** (temps, coût main d'œuvre, matière, prime/paie…) ;
- **analyser** (son rendement, sa production, sa rentabilité) ;
- **aider à produire** (le guider concrètement dans sa fabrication).
→ L'ouvrier + son IA = **un seul agent**, actif et proactif, pas un formulaire passif.

**Point 1 (suite) — L'ouvrier et son IA ne font qu'un (assistant personnel).**
- L'ouvrier **fabrique avec ses mains** (savoir-faire métier qu'il maîtrise) ;
  l'IA apporte **l'organisation** : elle **conseille, anticipe, rappelle**.
- **Contexte humain crucial (Maroc) :** beaucoup d'ouvriers **ne sont pas allés à
  l'école**. Ils maîtrisent **la fabrication** mais **pas l'organisation ni la
  structuration**. L'IA doit donc **combler ce manque** : structurer, organiser,
  calculer, rappeler, **écrire à leur place** — l'ouvrier garde son savoir-faire,
  l'IA gère le reste. (Pensé comme une **égalité des chances**.)
- **Côté patron :** Driss **pilote en discutant avec les agents IA des ouvriers**.
  Ce sont les agents qui **surveillent, conseillent et analysent** chaque ouvrier ;
  Driss parle aux agents plutôt que de courir après chaque personne.
- Implication d'interface : prévoir **peu de texte / langage très simple / vocal &
  visuel** côté ouvrier (darija ?), et une **conversation patron ↔ agents** côté Driss.

**Point 2 — But + problème central + solution (fiche technique, dessin IA validé, QC par étape).**

*But de Driss :*
1. **Maîtriser le coût de revient** de chaque article.
2. **Maîtriser le processus de fabrication** avec **contrôle qualité**.

*Problème actuel (à résoudre) :*
- Chaîne : commercial vend (ex. canapé) → donne à **Hanane** → Hanane donne aux **ouvriers**.
- **Beaucoup de retours / réclamations clients.**
- En cas de problème, **chacun rejette la faute sur l'autre** (aucune traçabilité).
- **Pas de photo avec mesures**, **pas de fiche de production**.
- Erreurs typiques : **mauvais tissu**, **accoudoirs gauche/droite inversés**,
  **façon de coudre** (sur-mesure).
- Les clients envoient des **photos Pinterest** → le résultat **ne correspond pas**.

*Solution voulue :*
1. **Fiche technique** remplie par **le commercial AVEC Hanane** : tout ce qui a été vu
   avec le client, tous les détails (dimensions, tissu, sens accoudoirs, coutures…).
2. **Refaire le dessin avec l'IA** (génération d'image) → **validation par le client**
   → **puis seulement** on **lance la fabrication**.
3. **L'agent IA de chaque ouvrier contrôle**, **pose les bonnes questions** et **détecte
   les anomalies**.
4. **Contrôle qualité par ouvrier ET par étape** : l'IA **compare** (fiche technique
   validée ↔ travail réel, via photos/mesures) et **signale les anomalies**.

*Effets attendus :* fin du « c'est pas moi » (traçabilité complète) ; le client valide
**avant** fabrication ; coût de revient calculé sur une **base fiable** (la fiche technique).
*Besoin technique noté :* capacité **génération d'image / dessin par IA** + **validation client**.

**Point 3 — Gestion de la matière première (Hanane ↔ Mohamed ↔ Hassan), avec chrono d'appro.**

*Problème :* une fois la fiche de production faite, **la fabrication ne démarre pas / prend
du retard car la matière première n'est pas disponible.**

*Solution voulue :*
1. Référentiel **matière première : ~500 articles**, classés **par fournisseur** et **par
   nature de produit** (Driss l'a déjà listé dans une version précédente → **à récupérer**,
   peut-être dans `legacy/`).
2. **Avant de lancer une commande, Hanane consulte le magasin** et **bloque / réserve** la
   matière nécessaire à cet article.
3. Si **pas en stock** → Hanane **passe une commande** qui arrive chez **Mohamed**.
4. **Au moment de passer la commande, un CHRONO se déclenche** à côté de la commande
   (mesure le temps d'approvisionnement).
5. **Mohamed** : soit **retrait du magasin**, soit (si indispo) **commande chez les
   fournisseurs** (tous voisins, le plus loin à **2 km**). **Le chrono continue.**
6. La commande **s'affiche chez l'agent réception : Hassan** (🆕 nouvel agent).
7. Quand **Hassan reçoit la marchandise → la commande devient VERTE** chez **Mohamed**,
   **Hanane** et **l'ouvrier** qui a commandé.
8. On garde **toujours dans le processus : pour quel client et pour quel article.**

*Effets :* plus de fabrication lancée sans matière ; le chrono **mesure les retards d'appro** ;
statut partagé (vert = reçu), tracé par **client + article**.
*Nouvel agent :* **Hassan = agent réception** (réceptionne → passe au vert).
*À faire :* récupérer la **liste des 500 matières premières** (fournisseur / nature).

**Données reçues de Driss (29/05/2026) — fichiers dans `donnees/` :**
- `donnees/matieres-premieres-559.html` + `.csv` → **559 références** de matière première,
  colonnes : Référence · Désignation · Unité · **Fournisseur** · P.U. HT · P.U. TTC.
  **36 fournisseurs** distincts (ex. KY2N ARTON). → base du module stock/achat (Point 3).
- `donnees/ateliers-reels.html` → **structure réelle des 9 ateliers (A→I)** : avec
  **départements** (DA01…DA06, DB01…, etc.), **chef par département**, **équipes + salaires**,
  **heures/mois**, **coût horaire**, et une **couleur de tenue par atelier**
  (A Bleu, B Orange, C Violet, D Cyan, E Marron, F Rouge, G Gris, H Beige, I Doré).
  Chefs réels : A Ayoub El Yagiz · B Ahmed Araji · C Bahri El Othmani · D Ettaib Bougatouch ·
  E Dit Chnitifa · F Mohamed Elkarmani · G Mohamed Boualili · H Mustapha Aababou · I Noureddine Ouzzat.

> ⚠️ **À CONFIRMER avec Driss — coût horaire :** le fichier ateliers réels indique
> **55–73 DH/h** par département, alors que §4 indiquait **22–29 DH/h**. Décisif pour le
> **coût de revient (but n°1)** → savoir quel taux utiliser (et s'il inclut charges/salaires).
> Les **tenues de couleur par atelier** peuvent servir à coder visuellement les ouvriers.

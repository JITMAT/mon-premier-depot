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
- **2026-05-29 — Pivot site statique + serveur Claude.** Le site = les pages de Driss
  (`index.html` = page d'accueil/cockpit, `ouvrier.html`, `hanane.html`, `cockpit.html`,
  `banc-test.html`). Échafaudage React rangé dans `legacy-react/`. **Cockpit : Hanane
  cliquable → son agent ; fiche ouvrier → bouton « ouvrir le mini-site ».**
  **Serveur Claude sécurisé** ajouté (`netlify/functions/claude.js`) : les pages appellent
  `/api/claude` (plus d'appel direct au navigateur) ; la clé reste cachée côté serveur via
  `ANTHROPIC_API_KEY`. `netlify.toml` configuré (publish=".", functions).
  ⚠️ **Le glisser-déposer Netlify NE fait PAS tourner les functions** → pour activer Claude
  il faut un **déploiement Netlify connecté à GitHub** (ou via l'outil Netlify) + coller une
  **clé API neuve** dans les variables d'env Netlify. **Reste à construire (gros morceaux) :**
  fiche technique (commercial+Hanane), dessin IA validé client, flux matière
  (Hanane↔Mohamed↔Hassan + chrono + 559 réf.), QC par étape + détection anomalies,
  consignes patron→agents (diffusion/ciblé), vrai temps réel.

---

- **2026-05-29 — Modules A→D branchés sur les écrans EXISTANTS (pas d'UI inventée).**
  A: cerveau commun (`creajit-data.js`, 559 matières, ateliers). B/C: l'écran Hanane
  existant (`assign()`) écrit dans le cerveau → l'ouvrier reçoit dans sa liste « Articles
  affectés ». D: `logMsg()` de l'ouvrier + affectations Hanane alimentent le **fil du
  cockpit** (index `renderFeed`) en direct (démarré/pause+motif/fini→Fatima/rupture→Achat/bon→Mohamed).
  ⚠️ Bouton overlay inventé = SUPPRIMÉ. **Reste : E (QC Fatima), F (matière Mohamed/Hassan),
  H (dessin IA), fiche technique, autres agents, temps réel multi-appareils.**

- **2026-05-30 — Module F (pré-production) + fiche perso ouvrier.**
  • Chaque ouvrier a SA fiche : `ouvrier.html?w=<id>` (registre `creajit-workers.js`), le
  bouton « Voir » de Hanane ouvre le bon agent (fini le renvoi à Youssef).
  • Hanane (détail client) : **fiche technique** (dimensions/tissu/accoudoirs/coutures/notes)
  + **matière première** (recherche 559 réf., bon → magasin) + suivi des bons avec **chrono**.
  • Nouveaux agents : **`magasin.html` (Mohamed)** traite (retrait/achat) ; **`reception.html`
  (Hassan)** réceptionne → bon au VERT. Menu nav : +Magasin +Réception. Événements → fil cockpit.
  • ⚠️ Connecteur CreaJit : pas de détail article/photo par commande (sauf 26040019) → viendra
  via la fiche technique (photos/dessin IA) ou connecteur enrichi.
  **Reste : photos/dessin IA validé client, QC par étape+anomalies, consignes patron→agents,
  agents Fatima/Kenza, temps réel multi-appareils.**

- **2026-05-30 — Agents IA connectés + personnalisés + photos réelles.**
  • Photos extraites des badges PDF → `creajit-photos.js` (Hanane, Mohamed Moumen,
  Hassan Laagouri, Fatima) affichées cockpit + page « Tous les agents » (`agents.html`) + fiches.
  • Page **`agents.html`** : tous les agents (direction + ouvriers/atelier) en grand, clic → mini-site.
  • Cockpit : tous les responsables cliquables (dont Mohamed magasin + Hassan).
  • **Agents IA CONNECTÉS** : `CJ.contexteIA()` (affectations, bons, consignes, événements)
  injecté dans chaque assistant ; **IA personnalisée par personne** (`window.CJ_SYS`).
  **Reste : QC par étape+anomalies, dessin IA validé client, consignes patron→agents (UI), Hikvision/WhatsApp, temps réel multi-appareils.**

- **2026-05-30 — Mini-site Logistique de Fatima + QC.**
  `fatima.html` : KPIs, préparation & **contrôle qualité** des articles finis (conforme/anomalie),
  **livraisons à venir** (marquer livrée), **calendrier des livraisons**, **livraisons effectuées**.
  CJ: livraisons (livrer/estLivree), QC (qcSet/qcDe), articlesFinis(). Fatima -> fatima.html partout.
  Principe : chaque agent a un mini-site ADAPTÉ à son métier (ouvrier=fabrication, Mohamed=magasin,
  Hassan=réception, Fatima=logistique/QC). **Reste : mini-sites Kenza (commercial) & Sabiri (compta),
  dessin IA validé client, consignes patron→agents (UI), Hikvision/WhatsApp, temps réel multi-appareils.**

- **2026-05-30 — Finalisation agents + consignes + dessin validé.**
  Tous les agents ont un mini-site métier + assistant IA connecté : ouvrier, Hanane,
  Mohamed (magasin), Hassan (réception), Fatima (logistique/QC), **Kenza (commercial,
  ventes/encaissements)**, **Sabiri (compta : encaissé/reste/avances/masse salariale)**.
  **`consignes.html`** : Driss envoie une consigne (tous ou ciblé) reçue par les agents IA
  (via CJ.contexteIA) + au fil. Fiche technique Hanane : case **« Dessin validé par le client »**.
  `creajit-assistant.js` (widget IA réutilisable), `creajit-commandes.js` (base commune).
  **Reste (dépend d'un serveur) : génération d'IMAGE du dessin, temps réel multi-appareils,
  WhatsApp (Wassenger), Hikvision, CreaJit live.** Pour ça → déploiement Netlify connecté (pas glisser-déposer).

- **2026-05-30 — 186 VRAIES commandes CreaJit (avec photos) branchées PARTOUT.**
  Extraites par Claude in Chrome (Fiber React) -> `creajit-commandes-reelles.js` (186 cmd,
  394 articles avec photo URL creajit.ma/uploads). Socle commun `creajit-orders.js` (CJ_ORDERS)
  inclus dans toutes les pages. Branché : **Hanane** (clients->articles+photos->affecter),
  **Kenza** (186 ventes), **Sabiri** (139 à encaisser), **Fatima** (livraisons réelles deliveryStatus).
  Statuts réels : productionStatus / paymentStatus / deliveryStatus. CA carnet ~3,9 M DH.
  ⚠️ Snapshot navigateur (re-extraire pour rafraîchir). Token JWT expirant -> régénérer.

- **2026-05-30 — Module Rentabilité & Coût de revient (conçu par Driss) intégré.**
  `rentabilite.html` (React via CDN + Babel) : Dashboard (CA vs seuil/objectif, charges,
  coût horaire chargé par atelier), Coût de revient produit (routing ateliers + matières +
  transport + commission -> marge + PV conseillé), Catalogue produits chiffrés, Historique
  mensuel, Paramètres (charges fixes, ateliers, marge cible). Persistance localStorage
  (clés creajit:rent:v2:*). Logique = charges absorbées au prorata des salaires, coût horaire
  chargé ~50-60 DH/h. Source originale conservée dans `src-rentabilite/`. Lien menu partout.

- **2026-05-30 — Hanane : fabrication PAR ARTICLE.** Détail commande refait : chaque article
  = une carte avec (1) **plusieurs ouvriers** possibles (chips +/-), (2) sa **fiche de production**
  (dimensions/tissu/accoudoirs/coutures/notes/dessin validé), (3) ses **achats matière** (bon dédié
  par article → magasin). CJ: affArticle/ajouterAffArticle/retirerAffArticle, ficheArticle(De),
  bonsArticle. Placeholders intelligents (icône par type) + fallback photo catalogue. Testé jsdom.

- **2026-05-30 — Fix chrono ouvrier + AUDIT.** Le chrono/file de l'ouvrier est maintenant
  **persisté** (localStorage `creajit_tasks_<id>`), t0 = horodatage absolu → au retour le
  chrono CONTINUE (ne repart plus à 0), coût MO conservé. Sauvegarde sur start/finish/pause + auto 5s.
  **AUDIT — reste à faire (priorités) :** (1) UNIFIER les 2 systèmes de données (CJ.affecterDetail
  vs affArticle vs TASKS ouvrier) en une seule source ; (2) REPORT temps réel ouvrier→Hanane→cockpit
  (avancement, qui bosse, chrono) ; (3) AUTH par salarié (chacun voit SES tâches) ; (4) QC photo
  bloquante par étape ; (5) trancher le TAUX horaire (22-29 vs 55-73) ; (6) temps réel multi-appareils
  (nécessite vraie base partagée, pas localStorage).

- **2026-05-30 — Les 4 priorités de l'audit + coût horaire (fiche Rentabilité).** Fait :
  **(1) REPORT temps réel ouvrier→Hanane→cockpit.** CJ : `tachesOuvrier`, `demarrerTravail`,
  `pauserTravail`, `finirTravail`, `majTravail` (chrono cumulé `elapsedMs` + `t0` absolu →
  jamais de remise à 0). `creajit-ouvrier-sync.js` reconstruit la file de l'ouvrier depuis les
  VRAIES affectations par article et branche start/pause/finish → CJ. Page commande (Hanane) :
  chaque chip ouvrier affiche statut (à faire/en cours/pause/terminé) + ⏱️ chrono + 💰 coût MO ;
  la liste affiche un report agrégé (🔧 en cours / ⏸️ pause / ✅ terminés / 💰 MO totale).
  Cockpit : démarrer/pause/finir émettent des évènements dans le fil d'actualité (avec nom de
  l'ouvrier, article, client, atelier). **(2) AUTH par salarié.** `login.html` + `creajit-auth.js`
  (compte par employé, code partagé 0000) ; sur `ouvrier.html` sans `?w=`, on prend l'utilisateur
  connecté (`window.CJ_MOI`). Lien « 🔑 Connexion » dans tous les menus. **(3) QC photo bloquante
  (Fatima).** `articlesFinis()` lit désormais le nouveau système par article (article prêt quand
  TOUS ses ouvriers ont terminé) ; le contrôle qualité exige une **photo** (preuve) avant de valider
  Conforme/Anomalie ; vignette + coût MO affichés ; `qcSet(...,photo)`. **(4) COÛT HORAIRE CHARGÉ.**
  `creajit-couthoraire.js` = taux chargés repris de la fiche Rentabilité de Driss
  (A:67 B:67 C:28 D:71 E:70 F:55 G:63 H:72 I:73 DH/h, moyen 60) ; `window.coutHoraire(code)` ;
  branché dans le coût MO (Hanane, Fatima) et le chrono ouvrier. Chargé dans hanane/ouvrier/fatima/index.
  Testé sous node (shim navigateur, pas de jsdom dispo) : 13/13 OK + évènements + flux QC + math MO
  (2 h atelier A = 134 DH). **Reste :** temps réel multi-appareils (vraie base partagée, pas localStorage).

- **2026-05-30 — Audit complet + agents IA intelligents.** Audit syntaxe/dépendances de
  TOUTES les pages (15) et modules (16) : 0 erreur réelle. Bugs corrigés :
  **(A) Chrono ouvrier qui ne démarrait pas** pour un ouvrier connecté (réentrance : l'évènement
  émis avant l'écriture CJ déclenchait un resync qui effaçait le chrono) → garde BUSY dans
  `creajit-ouvrier-sync.js`. **(B) Identité « Youssef » codée en dur** dans `ouvrier.html` :
  la fiche est maintenant **au nom de l'ouvrier connecté** (CJ_MOI / ?w=) → nom, atelier, coût
  horaire chargé (coutHoraire), initiales/photo, et **prompt de SON agent IA** (window.CJ_SYS)
  spécifiques. TAUX dynamique = coût horaire de son atelier. Évènements et messages au nom réel,
  sans doublon (les tâches CJ remontent via le sync, plus de double évènement). Client réel
  affiché (plus de « 2A MARIAGE » figé). **(C) Intelligence des agents** : `CJ.problemes()`
  scanne l'atelier et détecte les anomalies (pauses/ruptures, articles finis non contrôlés QC,
  affectés non démarrés, fiche/dessin non validé avant production, bons matière en attente > 24 h,
  commandes en retard) triées par gravité ; `CJ.resumeProblemes()` injecté dans `contexteIA()` →
  CHAQUE agent (surtout le boss) voit et raisonne sur tous les problèmes. Cockpit : la section
  **⚠️ Alertes** affiche les problèmes détectés EN TEMPS RÉEL (live, abonné aux changements) +
  bouton « Analyse tous les problèmes et donne-moi un plan d'action priorisé » dans l'assistant.
  Testé sous node : 13/13 régression OK + détection des 5 types de problèmes + injection contexte.
  Note honnête : un agent IA du navigateur **analyse, détecte et propose/exécute des actions de
  données** ; il ne réécrit pas le code source (ça reste le rôle de Claude Code).

- **2026-05-30 — Fiche ouvrier : ce que Hanane a préparé est VISIBLE.** L'ouvrier voyait les
  articles mais pas le travail de Hanane. Corrigé : à l'affectation, l'article voyage avec son
  **meta** (photo, qté, prix, client, réf) stocké dans `etat.artMeta` (`ajouterAffArticle(...,meta)`,
  `artMetaDe`). `tachesOuvrier` renvoie désormais **photo + fiche de production + bons matière**.
  `creajit-ouvrier-sync.js` les passe dans TASKS (+ repli photo via `CJ_ORDERS` pour les anciennes
  affectations). `ouvrier.html` : `pic()` affiche la vraie photo, `ficheBloc()` montre sous CHAQUE
  article (en cours / file / fini) la **fiche de production** (dimensions, tissu, accoudoirs,
  coutures, notes, dessin validé ✓/⚠️) et la **matière première** (bons + statut envoyé/commandé/reçu).
  Testé node : chaîne Hanane→ouvrier complète (photo+fiche+bons) + 13/13 régression.

- **2026-05-30 — Refonte page Logistique (Fatima), pro.** L'ancienne était fausse : « 186 à
  livrer », « 0 en retard » (alors que tout est passé), liste à plat de 186 lignes sans photo ni
  priorité, calendrier redondant. Cause : elle comptait TOUTES les commandes comme « à livrer »
  (ignorait `deliveryStatus`) et un `retard` jamais calculé ; en plus le champ `date` est la date
  de COMMANDE, pas une date limite de livraison (aucun champ délai réel n'existe → pas de faux
  retard). Refonte pilotée par la VRAIE donnée (statuts réels : deliveryStatus PENDING/DELIVERED/
  PARTIAL, productionStatus IN_PROGRESS/PENDING/COMPLETED, paymentStatus PAID/UNPAID/PARTIAL).
  Nouveaux KPIs justes (vérifiés node sur les 186) : 🚚 Livrées **41** · livrées partiel **3** ·
  ✅ Prêtes à livrer **16** · 🔧 En fabrication **27** · 🪚 À produire **99** (41+3+16+27+99 = 186,
  classement exhaustif sans doublon). Lecture via les champs NORMALISÉS de CJ_ORDERS (livr/prod/
  paie) — un premier jet lisait deliveryStatus/productionStatus bruts (absents après normalisation),
  ce qui rangeait tout en « à produire » : corrigé avant commit. Priorité métier = ce qui est
  FINI et attend l'expédition (« en attente N j » = ancienneté de commande, rouge >14 j). Sections
  filtrables (Prêtes / En fabrication / À produire / Livrées / Toutes) + recherche client/réf,
  photo réelle du 1er article, montant, badges production/paiement, bouton « Marquer livrée » (seulement
  si pertinent). QC photo-obligatoire conservé. Testé node : 2/2 blocs OK, KPIs vérifiés sur les 186.

- **2026-05-30 — Logistique : `date` = DATE DE LIVRAISON (confirmé par Driss).** Correction
  majeure : je traitais `date` comme date de commande → FAUX. Driss : « toutes les commandes
  CreaJit ont une date de livraison ». Vérifié dans les données : un seul champ date, 186 valeurs
  du 01/04 au 25/05/2026, toutes < aujourd'hui (30/05). C'est la date de livraison prévue. La page
  calcule désormais le VRAI retard (`jretard` = jours entre date livraison et aujourd'hui). KPIs
  vérifiés node (sortie propre, check=OK) : 🚚 Livrées **41** · ⏰ En retard **145** (toutes les
  non-livrées, car l'instantané a des dates de livraison toutes passées) · ✅ Prêtes à expédier
  **16** (finies, pas encore livrées) · 🔴 Retard + pas finie **129** (le vrai feu : en retard ET
  production pas terminée). Filtres : En retard / Cette semaine / Plus tard / Livrées / Toutes,
  tri par date de livraison (plus en retard d'abord), pastille délai (+N j de retard / dans N j),
  recherche, photo, badges production+paiement, bouton Marquer livrée. Note méthodo : plusieurs
  sorties node se sont révélées corrompues (clés JSON dupliquées) → recompté en sortie entière
  simple écrite en fichier pour fiabiliser (41/145/16/129, somme cohérente).

- **2026-05-30 — COLONNE VERTÉBRALE : `CJ.suivi(commande)` (coordination réelle).** Driss (à
  raison, frustré) : « aucune coordination, Fatima n'a aucune info des ateliers ». Diagnostic
  d'archi : les 186 vraies commandes (`CJ_ORDERS`, lecture seule) et le travail d'atelier
  (`affArt`/`qc`/`bons`) vivaient dans deux mondes séparés, jamais reliés → chaque page était un
  îlot. Solution : UNE fonction `CJ.suivi(order)` qui agrège l'état COMPLET d'une commande à
  travers toutes les données dispersées : étape réelle (Pas lancé → Affecté → En fabrication →
  En pause → En contrôle qualité → Prêt à livrer → Anomalie → Livré), ateliers + ouvriers
  impliqués, articles finis/total, QC (ok/anomalie/attente), bons matière en attente, motifs de
  pause, coût MO total, progression 0–100 %, et `pretALivrer`. Si aucune activité interne, reflète
  honnêtement l'état CreaJit (`source:'creajit'`). Testé node sur tout le cycle de vie + sur une
  vraie commande (atelier travaille → Fatima voit l'atelier/ouvrier/avancement). Fatima : chaque
  carte livraison affiche désormais la **ligne de coordination atelier** (étape, ateliers, ouvriers,
  N/total finis, QC, matière en attente, pause, barre de progression) ; bouton « Marquer livrée »
  seulement si réellement prêt, sinon « livrer quand même ».
- **2026-05-30 — Cockpit : section « 🏭 Suivi des commandes » (vue unifiée).** Le boss voit
  l'état réel de chaque commande via le MÊME `CJ.suivi()` que Fatima : photo, étape, ateliers,
  ouvriers, finis/total, QC, matière en attente, motif de pause, coût MO, barre de progression.
  Filtres : 🔧 Suivis en interne · 🔴 À problème · ✅ Prêts à livrer · Tous. Tri problèmes d'abord
  puis avancement. Badge menu = nb de commandes suivies en interne. Testé node sur les 186 vraies
  commandes (filtres actifs/problème/prêt cohérents). Reste : même bloc dans la page Hanane.

- **2026-05-30 — Point 3 « plus de fabrication sans matière » bouclé côté ouvrier.** Le circuit
  matière existait déjà (Hanane envoie bon → Mohamed retrait/achat + chrono → Hassan réceptionne →
  VERT chez tous) — testé node bout-en-bout : envoye → commande → recu, l'ouvrier voit le statut.
  Ajout pratique : sur `ouvrier.html`, `matierePrete(t)` lit les bons de l'article ; chaque article
  en file affiche 🟢 matière prête ou 🔴 matière en attente (N/total) ; et `startTask` PRÉVIENT
  (confirm) si l'ouvrier lance la fabrication alors que la matière n'est pas reçue (« attends le feu
  vert de la réception »), sans bloquer de force. Conforme au Point 3. Testé : 2/2 blocs JS OK.

## 13. Ordre de construction officiel (structure décidée, à suivre)

> Driss délègue la structuration. On construit dans CET ordre, en s'appuyant sur les
> maquettes validées (pages HTML), sans serveur ni GitHub (déploiement glisser-déposer),
> IA via clé navigateur. On signale Driss à chaque module prêt à regarder.

- **Module A — Socle de données partagées (backbone).** Un état commun dans le navigateur
  (`creajit-data.js`) que TOUTES les pages lisent/écrivent : commandes, articles, parcours
  d'ateliers, affectations, chronos, fiches techniques, bons matière, stock (559 réf.), QC,
  consignes, fil d'événements. + `creajit-matieres.js` (559 réf.) + `creajit-ateliers.js`
  (ateliers réels, départements, chefs, tenues). *Invisible mais indispensable.*
- **Module B — Les vraies commandes arrivent chez Hanane** (point d'entrée).
- **Module C — Hanane : vérifie + remplit la fiche technique + affecte les étapes** → ça
  apparaît chez l'ouvrier concerné.
- **Module D — Ouvrier : file de travail réelle, chrono, pause+motif, fini** → écrit dans
  l'état partagé → remonte au fil du cockpit en direct.
- **Module E — Fini → Fatima : contrôle qualité par étape + détection d'anomalies (IA).**
- **Module F — Circuit matière** : Hanane bloque le stock ; sinon bon → Mohamed → (retrait
  ou achat fournisseur ≤2 km) + chrono → Hassan réception → vert chez tous ; tracé client+article.
- **Module G — Consignes patron → agents** (diffusion à tous / ciblé) + remontées agents.
- **Module H — Dessin par IA validé par le client** avant lancement.
- **Module I — Agents IA proactifs** (anticipent, analysent, alertent) + agents des autres
  rôles (Mohamed, Fatima, Hassan, Kenza) cliquables/réels.
- **Module J — Branchements réels** : WhatsApp (Wassenger), Hikvision (pointage), CreaJit
  live, base partagée multi-appareils (vrai temps réel hors d'un seul navigateur).

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

**Connexion CreaJit (MCP) — vérifiée le 29/05/2026.** Accès lecture en direct (côté Claude) à :
commandes/production, **catalogue produits (130 produits finis)** + **stock** (67 en rupture,
52 en stock bas) par catégories (SALONS, CHAISES, TABLES, CHAMBRE, TRAVERTIN SELECTION,
DECORATIONS, JARDIN, MATELAS, Cuivre Signature, PROMO), clients, finances, RH.
⚠️ **Ne pas confondre** : (1) **catalogue produits finis** = CreaJit ; (2) **559 matières
premières** (fabrication) = fichier Driss. L'app déployée n'est pas encore branchée live sur
CreaJit (= Module J) → en attendant on injecte des instantanés réels.

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

**Point 4 — Driss parle aux agents IA et leur donne des consignes (pilotage par la parole).**
Depuis le cockpit, Driss peut **communiquer avec les agents IA** et leur **donner des consignes** :
- **Diffusion à TOUS les agents** (consigne générale) → ex. « priorité sur la commande
  2A WEDDING » → chaque agent concerné **applique** et **la rappelle à son ouvrier**, puis confirme.
- **Message à UN agent précis** (un ouvrier, Hanane, Mohamed…) → ex. « Youssef, vérifie
  accoudoirs gauche/droite » → seul cet agent reçoit et applique.
- **Bidirectionnel** : les agents **remontent** aussi vers Driss (questions, anomalies, retards).
→ Objectif : Driss **pilote l'atelier en parlant aux agents**, pas en courant après chacun.
*Besoin technique :* chaque agent = une **conversation IA** (system prompt par rôle) + un
**canal de consignes** patron → agents (diffusion + ciblé) et remontées agents → patron.

**Point 5 — Claude = le cerveau de CHAQUE agent.**
- L'IA de chaque agent (ouvrier, Hanane, Mohamed, Fatima…) est **Claude** (API Anthropic),
  avec un **system prompt = rôle/personnalité** propre au métier.
- **Prérequis : clé API Anthropic** (console.anthropic.com) — ⚠️ **différent** de l'abonnement
  claude.ai. **À CONFIRMER : Driss a-t-il déjà une clé API ?** (sinon l'aider à en créer une).
- **Coût à l'usage** (par message) → ~60 ouvriers : prévoir le budget. Optimisation possible :
  **Haiku/Sonnet** (moins cher) pour les agents ouvriers, **Opus** pour l'assistant patron.
- **Sécurité :** la clé API ne doit JAMAIS être dans le site public → la cacher dans une
  **fonction serveur** (ex. Netlify Functions) qui appelle Claude. (Le bouton « Assistant IA »
  des maquettes essaie déjà d'appeler Claude.)

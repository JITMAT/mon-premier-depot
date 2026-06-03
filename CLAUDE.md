# CLAUDE.md — CREAJIT · Pointage + RH + Paie

> Cahier des charges de l'application `creajit-app.html` (monofichier HTML/CSS/JS).
> **Document reconstruit à partir du code source réel.** À utiliser comme brief de passation pour Claude Code lors de l'intégration au MES CREAJIT.
>
> 🔒 **Secrets masqués dans ce document versionné** (mot de passe admin, token/ID Telegram). Les valeurs réelles vivent dans le bloc `CONFIG` du fichier HTML et **ne doivent pas être commitées en clair**. Avant tout déploiement public : déplacer ces valeurs vers des variables d'environnement et changer le mot de passe.

---

## A. Nature de l'application

Application autonome **monofichier** (`creajit-app.html`) : pointeuse + gestion RH + paie marocaine. Aucune dépendance serveur ; persistance via `localStorage`. Titre : « CREAJIT — Pointage & RH ». Tourne sur tablette à l'entrée (pointeuse) et sur PC (admin).

## B. Accès & sécurité

- **Login admin** : `creajitpointeuse` / `••••••••` (`ADMIN_USER` / `ADMIN_PASS` — voir `CONFIG`).
- **Mot de passe oublié** → génère un code envoyé dans le groupe **Direction CREAJIT Telegram** (`<TG_GROUP_ID>`) via le bot `@Creajitatalierbot`.
- La pointeuse (scan salarié) est accessible sans login ; l'espace admin est verrouillé.

## C. Données & stockage (`localStorage`)

Clés (`const K`) :
| Clé | Contenu |
|-----|---------|
| `cj2f_w` | salariés (SEED, 60 fiches) |
| `cj2_p`  | pointages (punches) |
| `cj2_s`  | sorties temporaires (achat/RDV/livraison) |
| `cj2_a`  | acomptes |
| `cj2_t`  | paramètres / divers |
| `cj2_hs` | demandes d'heures sup (hsReqs) |

- **60 salariés** en SEED, dont **21 avec photo** (base64), le reste à compléter.
- Identifiants salariés au format `CJ-Wxxx`.

## D. Ateliers & taux horaires (DH/h)

| Code | Atelier | Taux | Code | Atelier | Taux |
|------|---------|------|------|---------|------|
| TAP | Tapisserie | 26 | CUI | Cuivre | 29 |
| MEN | Menuiserie | 26 | CNC | Laser CNC | 28 |
| PEI | Peinture | 22 | POL | Polystyrène | 24 |
| FER | Ferronnerie | 25 | PIE | Pierre | 29 |
| SOU | Soudure | 25 | | | |

Ateliers/services à taux 0 (non productifs) : CHA (chantier), LOG, ADM, VEN, FIN, INF, SEC, ENT, CUIS, LIV, DIV.

---

## E. Annexes — logique métier (à préserver à l'identique)

### E.1 Pointeuse — 3 boutons
1. **ARRIVÉE / DÉPART** (même bouton) : arrivée si salarié absent, départ s'il est présent.
2. **SORTIE** temporaire (achat / RDV / livraison) avec motif, retour au rescan.
3. **DEMANDE HEURES SUP** : le salarié scanne pour demander à rester après 18h.

### E.2 Plafond des heures (18h00)
- Compteur **plafonné à 18h00** : `FIN_JOURNEE = 1080` (minutes). Départ après 18h sans HS validée → compté jusqu'à 18h seulement.
- `punch.countTs` = heure de comptage (18h si dépassement sans HS, sinon heure réelle). `hours()` utilise `countTs`.
- Départ **avant 18h** = compté à l'heure réelle.

### E.3 Tolérance & motif de départ
- **Aucune alerte entre 18h00 et 18h30** : `TOL_DEPART = 1110`.
- Départ pointé **après 18h30** → overlay **motif obligatoire** : *Oubli de pointage* / *Client en retard* / *Heures supplémentaires* (stocké dans `punch.motifDepart`).

### E.4 Heures supplémentaires (validation verrouillée)
- HS comptées **uniquement si la demande est validée** par un responsable.
- Bouton « Demande H. sup » → entrée dans `hsReqs` (statut `EN_ATTENTE`) + notification Telegram.
- Onglet admin « Heures sup » : **Valider / Refuser**.
- Si **VALIDE** ce jour → `countTs` = heure réelle (compte au-delà de 18h). Sans validation → 0 h sup, compteur bloqué à 18h.
- **Validateurs autorisés** (`VALIDATEURS`, chacun avec son code) :
  - `CJ-W049` — Fatima Ezzahra Sedky
  - `CJ-W053` — Mohamed Sabiri
  - `CJ-W047` — Abdelaali Ouitjane
  - `CJ-W044` — Hassan Laagouri

### E.5 Sorties temporaires
Achat / RDV / livraison : sortie avec motif, retour au rescan. Stockées dans `cj2_s`.

### E.6 Fiche salarié
Champs : nom, atelier, salaire mensuel, CIN, téléphone, `tarifJour`, photo, `archive`. Salarié archivable (sort des listes actives sans suppression).

### E.7 Badges (carte de visite)
Format **85,6 × 54 mm** (format carte bancaire), avec photo + identifiant. Impression PDF.

### E.8 Paie marocaine — 3 régimes
- **NORMAL** : CNSS (≈4 %) + AMO + IPE et IR retenus selon barème marocain.
- **ANAPEC (Idmaj)** : indemnité **exonérée** de CNSS / AMO.
- **EXTRA** : journalier / ponctuel.
- CNSS due si déclaré — laissée **modifiable manuellement** dans la fiche.

### E.9 Calcul de paie
Net = salaire + prime − retards (`dRet`) − absences (`dAbs`), éléments variables saisis. La **prime est saisie manuellement** dans la fiche (`fi-prime`), pas calculée automatiquement dans cette version.
> ⚠️ À confirmer pour le MES : si Driss veut la prime auto = marge × 0,5 %, c'est à brancher côté MES (rentabilité), pas dans la pointeuse.

### E.10 Acomptes
Saisie + historique des acomptes par salarié (`cj2_a`), déduits du net.

### E.11 Notifications Telegram (réelles)
- Bot `@Creajitatalierbot`, envoi via `api.telegram.org/bot<TG_TOKEN>/sendMessage`.
- Destinataires : groupe ⏰ Pointeuse + privé Driss (copie loggée dans l'app).
- Messages : arrivée/départ, demande HS, validation/refus HS, dépassement / compteur arrêté.

### E.12 Historique & export
Historique des pointages par jour/salarié, export (CSV) pour la paie.

### E.13 Multi-écran
Pointeuse plein écran (tablette entrée) ; admin sur PC. Responsive.

### E.14 Récap heures / HS (résumé)
- Compteur plafonné 18h (`FIN_JOURNEE=1080`), tolérance jusqu'à 18h30 (`TOL_DEPART=1110`), motif obligatoire après 18h30.
- HS seulement si validées par un des 4 responsables. Clé storage `cj2_hs`.

### E.15 À brancher au MES (intégration)
- Remontée des **heures (dont HS) → rentabilité & paie** du MES.
- **Webhook Telegram** pour valider les HS depuis le MES (boutons).
- Stockage **Netlify Blobs** pour photos / CIN (au lieu de localStorage base64).
- Formules de coût produit côté MES : CR = (heures × taux atelier) + matières (coeff. chutes) + charges fixes (3 935 DH).

### E.16 Zones verrouillées du MES (ne pas toucher à l'intégration)
Commandes, Fiche article, Fiche technique, Commande marchandise, Workflow, IA, Équipe, Achat, Devis.

### E.17 Intégration cible
Remplacer l'ébauche « RH & Pointeuse » du MES (dashboard KPI + tableau « Pointage du jour ») par cette appli, dans l'habillage MES (sidebar ERP·MES·PRODUCTION, fond sombre), en supprimant le double en-tête. Conserver l'entrée de sidebar et la route.

---

## F. État de la reproduction (`creajit-app.html` dans ce dépôt)

Version reconstruite par Claude Code à partir de ce brief. **Fait** : pointeuse 3 boutons,
plafond 18h + tolérance 18h30 + motif obligatoire, demande HS + validation verrouillée par code
(4 validateurs), sorties temporaires, fiches salariés (édition + archive), acomptes, paie
(3 régimes, CNSS modifiable), export CSV, persistance `localStorage` (mêmes clés `K`),
notifications Telegram (actives si `TG_TOKEN` renseigné, sinon loggées en console).

**À compléter pour atteindre l'original** : SEED complet 60 salariés + 21 photos base64,
badges PDF 85,6×54 mm, récupération mot de passe par code Telegram, intégration MES (E.15–E.17).

*Reconstruit à partir de `creajit-app.html`. En cas de divergence, le code source fait foi.*

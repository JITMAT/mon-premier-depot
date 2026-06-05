// Constantes métier partagées CREAJIT — source unique de vérité
// pour éviter les valeurs en dur divergentes entre les pages.

import { EMP } from './employees'

// Taux horaire de secours (DH/h) si un ouvrier n'est pas retrouvé
export const TX_DEFAUT = 24

// Charges fixes mensuelles (DH) — doit rester aligné avec Rentabilite > Charges
export const CHARGES_FIXES_MENSUELLES = 157430.83

// Estimation du nombre d'articles produits par mois (pour la quote-part de charges)
export const ART_PAR_MOIS = 40

// Charge fixe imputée à un article
export const CHARGE_PAR_ARTICLE = CHARGES_FIXES_MENSUELLES / ART_PAR_MOIS

// Masse salariale ateliers calculée depuis la liste réelle des ouvriers
export const MASSE_SAL_ATELIERS = EMP.reduce((s, e) => s + e.sal, 0)

// Effectif réel des ateliers de production
export const NB_OUVRIERS_ATELIER = EMP.length

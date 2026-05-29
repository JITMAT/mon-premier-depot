// ─── Règles de calcul (CONTEXT.md §5) ───────────────────────────
// ⚠️ NE PAS changer ces formules sans validation de Driss.

import { ATELIER_PAR_CODE } from '../data/ateliers.js'

// Charges fixes par article (DH)
export const CHARGES_FIXES = 3935

// Coefficients de chute par type de matière (CONTEXT §5)
export const CHUTES = {
  tissu:        0.18, // Tissu +18%
  bois:         0.12, // Bois +12%
  mousse:       0.10, // Mousse +10%
  pierre:       0.08, // Pierre +8%
  peinture:     0.22, // Peinture +22%
  cuivre:       0.10, // Cuivre +10%
  resine:       0.15, // Résine +15%
  quincaillerie:0.05, // Quincaillerie +5%
}

// Coût main d'œuvre d'une étape = heures × taux horaire de l'atelier
export function coutMainOeuvre(codeAtelier, heures) {
  const at = ATELIER_PAR_CODE[codeAtelier]
  if (!at || !heures) return 0
  return heures * at.taux
}

// Coût main d'œuvre total d'un article = somme des étapes [{ code, heures }]
export function coutMainOeuvreTotal(etapes = []) {
  return etapes.reduce((tot, e) => tot + coutMainOeuvre(e.code, e.heures), 0)
}

// Coût d'une matière = quantité × prix unitaire × (1 + coefficient de chute)
export function coutMatiere({ type, quantite, prixUnitaire }) {
  const chute = CHUTES[type] ?? 0
  return (quantite || 0) * (prixUnitaire || 0) * (1 + chute)
}

// Coût matières total = somme des lignes de matière
export function coutMatieresTotal(matieres = []) {
  return matieres.reduce((tot, m) => tot + coutMatiere(m), 0)
}

// Coût de revient = main d'œuvre + matières + charges fixes
export function coutDeRevient({ etapes = [], matieres = [] }) {
  return coutMainOeuvreTotal(etapes) + coutMatieresTotal(matieres) + CHARGES_FIXES
}

// Marge (bénéfice) = prix de vente − coût de revient
export function marge(prixVente, article) {
  return (prixVente || 0) - coutDeRevient(article)
}

// Prime salarié = 1% du bénéfice de chaque article fabriqué.
// ⚠️ CONTEXT §5 : la base exacte du bénéfice pour la prime (matières incluses ou
// non, prime sur tout l'article ou part de l'ouvrier) reste À CONFIRMER par Driss.
// Implémentation par défaut : 1% de la marge complète.
export function primeSalarie(prixVente, article) {
  return marge(prixVente, article) * 0.01
}

// Reste à payer = salaire à payer − acompte déjà versé
// salaire à payer = salaire de base − retenue absences − retenue retards + primes
export function salaireAPayer({ base = 0, retenueAbsences = 0, retenueRetards = 0, primes = 0 }) {
  return base - retenueAbsences - retenueRetards + primes
}
export function resteAPayer(salaire, acompte = 0) {
  return salaireAPayer(salaire) - acompte
}

// Petit utilitaire d'affichage monétaire (DH)
export function dh(montant) {
  return `${Math.round(montant || 0).toLocaleString('fr-FR')} DH`
}

// ─── Les ateliers et taux horaires (CONTEXT.md §4) ──────────────
// Un article passe par plusieurs ateliers. Chaque étape = atelier + ouvrier
// + chrono + contrôle qualité. NE PAS changer les taux sans validation Driss.

export const ATELIERS = [
  { code: 'A', nom: 'Tapisserie',  chef: 'Ayoub El Yagiz',  taux: 26 },
  { code: 'B', nom: 'Chaise',      chef: 'Ahmed El Araji',  taux: 26 },
  { code: 'C', nom: 'CNC',         chef: 'Bahri',           taux: 28 },
  { code: 'D', nom: 'Résine',      chef: 'Ettaib',          taux: 24 },
  { code: 'E', nom: 'Menuiserie',  chef: 'Said Chnitifa',   taux: 26 },
  { code: 'F', nom: 'Peinture',    chef: 'Elkarmani',       taux: 22 },
  { code: 'G', nom: 'Ferronnerie', chef: 'Boualili',        taux: 25 },
  { code: 'H', nom: 'Pierre',      chef: 'Aababou',         taux: 29 },
  { code: 'I', nom: 'Cuivre',      chef: 'Noureddine',      taux: 29 },
]

// Accès rapide par code (ex. ATELIER_PAR_CODE['C'].taux === 28)
export const ATELIER_PAR_CODE = Object.fromEntries(ATELIERS.map(a => [a.code, a]))

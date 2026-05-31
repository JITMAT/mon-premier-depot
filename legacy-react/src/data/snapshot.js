// ─── Instantané des vraies données CREAJIT (CONTEXT.md §6) ──────
// Données réelles récupérées via le connecteur CreaJit le 29/05/2026.
// Pour l'instant on les fige ici (« instantané ») pour pouvoir les afficher
// dans l'aperçu. Le branchement en temps réel (rafraîchissement auto) se fera
// via une petite fonction serveur — voir Journal de construction.

export const SNAPSHOT_DATE = '2026-05-29'

// Résumé RH (get_hr_summary)
export const RH = {
  totalEmployes: 60,
  actifs: 60,
  presentsAujourdhui: 0,
  retardsAujourdhui: 0,
  absentsAujourdhui: 0,
  nonPointes: 60,
  avancesMois: 333289,
  nbAvances: 257,
  salairesNonPayes: 0,
}

// Résumé système (get_system_status)
export const SYSTEME = {
  produits: 130,
  alertesStockBas: 127,
  clients: 1,
  ca30j: 0,
}

// État production (get_production_status)
export const PRODUCTION = {
  enFabrication: 20,
  livreesCeMois: 26,
  enRetard: 10,
}

// Commandes en cours de fabrication
export const COMMANDES = [
  { ref: '26050030', client: 'Mme Daniela Douhi',   statut: 'ready',     livraison: null },
  { ref: '26040052', client: 'Mr Benjamin',         statut: 'ready',     livraison: '2026-05-08' },
  { ref: '26040045', client: 'Mr Yazid',            statut: 'ready',     livraison: '2026-05-04' },
  { ref: '26040053', client: 'Expresse Beuty',      statut: 'confirmed', livraison: '2026-05-08' },
  { ref: '26040008', client: 'Mr Youssef Ajdir',    statut: 'ready',     livraison: '2026-05-09' },
  { ref: '26040022', client: 'Mme Ilhame',          statut: 'ready',     livraison: '2026-05-15' },
  { ref: '26040016', client: 'Mme Perez',           statut: 'ready',     livraison: '2026-05-30' },
  { ref: '26040019', client: '2A WEDDING',          statut: 'confirmed', livraison: '2026-05-05' },
  { ref: '26040024', client: 'Mme Anisa Guerroumi', statut: 'ready',     livraison: '2026-05-16' },
  { ref: '26040025', client: 'Showroom',            statut: 'ready',     livraison: null },
  { ref: '26040026', client: 'Mr Soufiane',         statut: 'ready',     livraison: '2026-05-04' },
  { ref: '26040060', client: 'Mme Laila',           statut: 'confirmed', livraison: '2026-05-20' },
  { ref: '26040048', client: 'Azzozi Relax Houses', statut: 'ready',     livraison: '2026-05-08' },
  { ref: '26040059', client: 'Mme Zaki Nadia',      statut: 'confirmed', livraison: null },
  { ref: '26050007', client: 'Mr Maliki',           statut: 'confirmed', livraison: '2026-05-25' },
  { ref: '26050010', client: 'Mme Soumali',         statut: 'confirmed', livraison: null },
  { ref: '26050015', client: 'Mme Yasmine',         statut: 'confirmed', livraison: null },
  { ref: '26050019', client: 'Mme Nazha',           statut: 'ready',     livraison: '2026-05-18' },
]

// Commandes en retard (avec jours de retard)
export const RETARDS = [
  { ref: '26040026', client: 'Mr Soufiane',         joursRetard: 25 },
  { ref: '26040045', client: 'Mr Yazid',            joursRetard: 25 },
  { ref: '26040019', client: '2A WEDDING',          joursRetard: 24 },
  { ref: '26040052', client: 'Mr Benjamin',         joursRetard: 21 },
  { ref: '26040048', client: 'Azzozi Relax Houses', joursRetard: 21 },
  { ref: '26040053', client: 'Expresse Beuty',      joursRetard: 21 },
  { ref: '26040008', client: 'Mr Youssef Ajdir',    joursRetard: 20 },
  { ref: '26040022', client: 'Mme Ilhame',          joursRetard: 14 },
  { ref: '26040024', client: 'Mme Anisa Guerroumi', joursRetard: 13 },
  { ref: '26050019', client: 'Mme Nazha',           joursRetard: 11 },
]

// Commande de référence détaillée (search_order 26040019) + articles (CONTEXT §6)
export const COMMANDE_REF = {
  ref: '26040019',
  client: '2A WEDDING',
  commercial: 'Ikram Benaddi',
  statut: 'confirmed',
  paiement: 'PARTIAL',
  total: 95000,
  paye: 40016,
  restant: 54984,
  date: '2026-04-18',
  notes: 'Le prix des tables inclut uniquement le socle. Délai 05/05.',
  articles: [
    { nom: 'Chaise Cartel',    quantite: 75, prix: 730 },
    { nom: 'Tableau 120/80',   quantite: 25, prix: 730 },
    { nom: 'Tableau 40/40',    quantite: 40, prix: 550 },
  ],
}

// ─── Les utilisateurs / rôles (CONTEXT.md §2) ───────────────────
// Auth simple du Socle : un compte direction + (plus tard) un compte
// par ouvrier rattaché à un atelier. Le PIN est volontairement basique
// pour le Module 1 ; il sera durci quand on branchera un vrai backend.

// Rôles applicatifs
export const ROLES = {
  PATRON:      'patron',       // Driss — voit tout (cockpit)
  COMMERCIAL:  'commercial',   // Kenza
  COMPTABLE:   'comptable',    // Mohamed Sabiri
  EXPLOITATION:'exploitation', // Hanane Ajdi
  CHEF_ATELIER:'chef_atelier', // Said Chnitifa
  QC_LOGISTIQUE:'qc_logistique',// Fatima Ezzahra
  MAGASIN:     'magasin',      // Mohamed (Magasin / Achat)
  OUVRIER:     'ouvrier',      // un agent chacun
}

// Équipe de direction (CONTEXT §2). PIN par défaut « 0000 » pour le Socle.
export const DIRECTION = [
  { id: 'driss',   nom: 'Driss',          fonction: 'Patron',                          role: ROLES.PATRON,        pin: '0000' },
  { id: 'kenza',   nom: 'Kenza',          fonction: 'Responsable commerciale',         role: ROLES.COMMERCIAL,    pin: '0000' },
  { id: 'sabiri',  nom: 'Mohamed Sabiri', fonction: 'Comptable / Finance',             role: ROLES.COMPTABLE,     pin: '0000' },
  { id: 'hanane',  nom: 'Hanane Ajdi',    fonction: 'Exploitation & production',       role: ROLES.EXPLOITATION,  pin: '0000' },
  { id: 'said',    nom: 'Said Chnitifa',  fonction: 'Chef de tous les ateliers',       role: ROLES.CHEF_ATELIER,  pin: '0000' },
  { id: 'fatima',  nom: 'Fatima Ezzahra', fonction: 'Contrôle qualité & Logistique',   role: ROLES.QC_LOGISTIQUE, pin: '0000' },
  { id: 'magasin', nom: 'Mohamed',        fonction: 'Magasin / Achat',                 role: ROLES.MAGASIN,       pin: '0000' },
]

// Libellés lisibles pour l'UI
export const LIBELLE_ROLE = {
  [ROLES.PATRON]:        'Patron',
  [ROLES.COMMERCIAL]:    'Commercial',
  [ROLES.COMPTABLE]:     'Comptable',
  [ROLES.EXPLOITATION]:  'Exploitation',
  [ROLES.CHEF_ATELIER]:  'Chef d\'atelier',
  [ROLES.QC_LOGISTIQUE]: 'Qualité & Logistique',
  [ROLES.MAGASIN]:       'Magasin / Achat',
  [ROLES.OUVRIER]:       'Ouvrier',
}

// ─── Les utilisateurs / rôles (CONTEXT.md §2) ───────────────────
// Auth simple du Socle : un compte direction + (plus tard) un compte
// par ouvrier rattaché à un atelier.
//
// CODE D'ACCÈS : pour l'instant un seul code simple, partagé par tout le
// monde (choix de Driss). Pour passer à un code par personne plus tard, il
// suffira de remplacer cette constante par un champ par compte.
export const CODE_ACCES = '0000'

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

// Équipe de direction (CONTEXT §2). Tous se connectent avec CODE_ACCES.
export const DIRECTION = [
  { id: 'driss',   nom: 'Driss',          fonction: 'Patron',                          role: ROLES.PATRON },
  { id: 'kenza',   nom: 'Kenza',          fonction: 'Responsable commerciale',         role: ROLES.COMMERCIAL },
  { id: 'sabiri',  nom: 'Mohamed Sabiri', fonction: 'Comptable / Finance',             role: ROLES.COMPTABLE },
  { id: 'hanane',  nom: 'Hanane Ajdi',    fonction: 'Exploitation & production',       role: ROLES.EXPLOITATION },
  { id: 'said',    nom: 'Said Chnitifa',  fonction: 'Chef de tous les ateliers',       role: ROLES.CHEF_ATELIER },
  { id: 'fatima',  nom: 'Fatima Ezzahra', fonction: 'Contrôle qualité & Logistique',   role: ROLES.QC_LOGISTIQUE },
  { id: 'magasin', nom: 'Mohamed',        fonction: 'Magasin / Achat',                 role: ROLES.MAGASIN },
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

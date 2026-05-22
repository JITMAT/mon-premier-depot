export const ATELIERS_MAP = {
  menuisier: { nom: 'Menuiserie',   icon: '🪵', color: '#3498DB' },
  peinture:  { nom: 'Peinture',     icon: '🎨', color: '#F39C12' },
  tapissier: { nom: 'Tapisserie',   icon: '🧵', color: '#9B59B6' },
  couturier: { nom: 'Couturier',    icon: '✂️', color: '#E67E22' },
  ferronier: { nom: 'Ferronnerie',  icon: '🔧', color: '#E74C3C' },
  pierre:    { nom: 'Pierre',       icon: '🪨', color: '#8E44AD' },
  cnc:       { nom: 'CNC',          icon: '⚡', color: '#1ABC9C' },
  cuivre:    { nom: 'Cuivre',       icon: '🟡', color: '#D4A017' },
  resine:    { nom: 'Résine',       icon: '🧪', color: '#2ECC71' },
}

// Sous-rôles peinture
export const PEINTURE_ROLES = [
  { id: 'poncage',  label: 'Ponçage',        icon: '🔩' },
  { id: 'cabine',   label: 'Peinture cabine', icon: '🎨' },
]

export const WORKFLOWS = {
  canape: {
    id:'canape', nom:'Canapé / Banquette / Méridienne', icon:'🛋️',
    keywords:['canap','banquet','meridien','brooklyn','ego','luna soft','prestige','arcus','astori','misa','nova','double','farce','ciel','vague','nuvia','convertib','nuage'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Carcasse bois',           icon:'🪵', estH:10, matiere:'Bois, contreplaqué, colle, vis, agrafes' },
      { id:'s2', at:'menuisier', nom:'Sangles & ressorts',      icon:'🔩', estH:2,  matiere:'Sangles élastiques, ressorts zigzag' },
      { id:'s3', at:'couturier', nom:'Coupe & couture tissu',   icon:'✂️', estH:5,  matiere:'Tissu (ml), fil, fermetures, passepoil' },
      { id:'s4', at:'tapissier', nom:'Garniture mousse & habillage', icon:'🧵', estH:12, matiere:'Mousse HD, ouate, tissu posé' },
    ]
  },
  fauteuil: {
    id:'fauteuil', nom:'Fauteuil', icon:'💺',
    keywords:['fauteuil'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Carcasse bois',        icon:'🪵', estH:5, matiere:'Bois, contreplaqué, colle' },
      { id:'s2', at:'couturier', nom:'Coupe tissu',          icon:'✂️', estH:2, matiere:'Tissu, fil, fermetures' },
      { id:'s3', at:'tapissier', nom:'Garniture & habillage',icon:'🧵', estH:5, matiere:'Mousse HD, ouate, clous' },
    ]
  },
  chaise_bois: {
    id:'chaise_bois', nom:'Chaise bois', icon:'🪑',
    keywords:['marry','pulsy','hermes','harmonie','luna move','chaise'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Carcasse bois',          icon:'🪵', estH:4,  matiere:'Bois hêtre, chevilles, colle' },
      { id:'s2', at:'peinture',  nom:'Vernis / laque',         icon:'🎨', estH:2,  matiere:'Vernis, laque, papier de verre', sousRoles:true },
      { id:'s3', at:'couturier', nom:'Coupe tissu assise',     icon:'✂️', estH:1,  matiere:'Tissu, fil' },
      { id:'s4', at:'tapissier', nom:'Habillage assise & dossier', icon:'🧵', estH:2, matiere:'Mousse, tissu, clous' },
    ]
  },
  chaise_metal: {
    id:'chaise_metal', nom:'Chaise métal', icon:'🔩',
    keywords:['zettalique','solis','astorie'],
    steps:[
      { id:'s1', at:'ferronier', nom:'Soudure carcasse',     icon:'🔧', estH:5,  matiere:'Tube métal, électrodes, meule' },
      { id:'s2', at:'peinture',  nom:'Anti-rouille & couleur',icon:'🎨', estH:2,  matiere:'Primaire, peinture époxy', sousRoles:true },
      { id:'s3', at:'couturier', nom:'Coupe tissu',          icon:'✂️', estH:1,  matiere:'Tissu, fil' },
      { id:'s4', at:'tapissier', nom:'Habillage tissu',      icon:'🧵', estH:2,  matiere:'Mousse, tissu, rivets' },
    ]
  },
  transat: {
    id:'transat', nom:'Transat / Balançoire', icon:'🏖️',
    keywords:['transat','edgy','balancoire','balançoire','aurea'],
    steps:[
      { id:'s1', at:'ferronier', nom:'Soudure structure métal',  icon:'🔧', estH:6,  matiere:'Tube aluminium, électrodes' },
      { id:'s2', at:'peinture',  nom:'Traitement & laque extérieur',icon:'🎨', estH:2, matiere:'Primaire, laque UV', sousRoles:true },
      { id:'s3', at:'couturier', nom:'Confection sangles & toile',icon:'✂️', estH:4,  matiere:'Textilène, fil UV' },
      { id:'s4', at:'tapissier', nom:'Pose & fixation toile',     icon:'🧵', estH:2,  matiere:'Rivets inox, attaches' },
    ]
  },
  table_travertin: {
    id:'table_travertin', nom:'Table travertin / marbre', icon:'🪨',
    keywords:['travertin','marbre','travertino','aurax','aeris','alver','rocasa','silia','youb','verroterra','trio','pierre','stone','bureau en pierre'],
    steps:[
      { id:'s1', at:'pierre', nom:'Découpe plateau',      icon:'🪨', estH:3,  matiere:'Dalle travertin, disques diamant' },
      { id:'s2', at:'pierre', nom:'Polissage & finition', icon:'🪨', estH:3,  matiere:'Abrasifs 400-1500, résine, polish' },
    ]
  },
  table_basse: {
    id:'table_basse', nom:'Table basse', icon:'☕',
    keywords:['table basse','basse','coffee','centre'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Pieds & structure bois',  icon:'🪵', estH:4,  matiere:'Bois, vis inox, colle' },
      { id:'s2', at:'peinture',  nom:'Vernis / laque',          icon:'🎨', estH:2,  matiere:'Vernis, laque, ponçage', sousRoles:true },
      { id:'s3', at:'pierre',    nom:'Plateau verre / marbre', icon:'🪨', estH:3,  matiere:'Verre trempé ou dalle marbre' },
    ]
  },
  table_ceram: {
    id:'table_ceram', nom:'Table céramique pied métal', icon:'🟫',
    keywords:['ceratrav','ceramique','céramique','ceram','duo linea','linea'],
    steps:[
      { id:'s1', at:'ferronier', nom:'Pieds métal soudés',     icon:'🔧', estH:4,  matiere:'Tube acier, électrodes' },
      { id:'s2', at:'peinture',  nom:'Laquage pieds',          icon:'🎨', estH:2,  matiere:'Laque époxy, primaire', sousRoles:true },
      { id:'s3', at:'pierre',    nom:'Découpe plateau céramique',icon:'🪨', estH:3, matiere:'Dalle céramique, disques' },
    ]
  },
  table_bois: {
    id:'table_bois', nom:'Table bois', icon:'🪵',
    keywords:['table bois','plateau bois'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Plateau & pieds bois', icon:'🪵', estH:8,  matiere:'Planches bois massif, vis, colle PU' },
      { id:'s2', at:'peinture',  nom:'Huilage / vernis',     icon:'🎨', estH:2,  matiere:'Huile naturelle, vernis', sousRoles:true },
    ]
  },
  lit: {
    id:'lit', nom:'Lit / Tête de lit', icon:'🛏️',
    keywords:['lit ','tete de lit','tête de lit','olia','carret','celestia','zenora','simriss','orion','luna-ouest'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Structure bois lit',    icon:'🪵', estH:10, matiere:'Bois, contreplaqué, lattis, vis' },
      { id:'s2', at:'couturier', nom:'Coupe tissu tête de lit',icon:'✂️', estH:2, matiere:'Tissu, fil, molleton' },
      { id:'s3', at:'tapissier', nom:'Habillage tête de lit', icon:'🧵', estH:4,  matiere:'Mousse, tissu, boutons capitonnage' },
    ]
  },
  tableau_bois: {
    id:'tableau_bois', nom:'Tableau / Cadre bois', icon:'🖼️',
    keywords:['tableau','talia','vela','pietra','serénie','ellipse','horizon','pebble','trio bois','table marmo','serenia'],
    steps:[
      { id:'s1', at:'menuisier', nom:'Découpe & assemblage cadre', icon:'🪵', estH:3, matiere:'Bois, contreplaqué, colle, vis' },
      { id:'s2', at:'peinture',  nom:'Traitement surface',         icon:'🎨', estH:1, matiere:'Peinture, vernis, enduit', sousRoles:true },
      { id:'s3', at:'cnc',       nom:'Découpe / gravure CNC',      icon:'⚡', estH:2, matiere:'Fichier CNC, fraise' },
    ]
  },
  tableau_metal: {
    id:'tableau_metal', nom:'Tableau / Cadre métal', icon:'🪞',
    keywords:['cadre metal','miroir metal'],
    steps:[
      { id:'s1', at:'ferronier', nom:'Découpe & soudure cadre',  icon:'🔧', estH:3, matiere:'Fer, meule, soudure' },
      { id:'s2', at:'peinture',  nom:'Peinture / laque',         icon:'🎨', estH:1, matiere:'Peinture époxy', sousRoles:true },
    ]
  },
  cuivre: {
    id:'cuivre', nom:'Produit Cuivre Signature', icon:'🟡',
    keywords:['cuivre','cuikech','cuiline','feuille','souffle','mina','maple','leaf','eérable','érable'],
    steps:[
      { id:'s1', at:'cuivre', nom:'Découpe feuille de cuivre',  icon:'🟡', estH:4,  matiere:'Feuille de cuivre, ciseaux métal' },
      { id:'s2', at:'cuivre', nom:'Martelage & formage',         icon:'🟡', estH:6,  matiere:'Marteaux, formes, établi' },
      { id:'s3', at:'cuivre', nom:'Patine & finition',           icon:'🟡', estH:3,  matiere:'Acides, vernis protection, chiffons' },
    ]
  },
  resine: {
    id:'resine', nom:'Produit Résine / Époxy', icon:'🧪',
    keywords:['resine','résine','epoxy','époxy','ceramlux'],
    steps:[
      { id:'s1', at:'resine', nom:'Préparation moule & support', icon:'🧪', estH:2,  matiere:'Moule silicone, support bois' },
      { id:'s2', at:'resine', nom:'Coulage résine & pigments',   icon:'🧪', estH:3,  matiere:'Résine époxy, durcisseur, pigments' },
      { id:'s3', at:'resine', nom:'Démoulage & ponçage',         icon:'🔩', estH:4,  matiere:'Papier de verre 120-2000, eau' },
      { id:'s4', at:'resine', nom:'Vernis & finitions',          icon:'✨', estH:2,  matiere:'Vernis UV, polish, chiffon microfibre' },
    ]
  },
  pergola: {
    id:'pergola', nom:'Pergola (assemblage)', icon:'⛱️',
    keywords:['pergola','ombrella','volera'],
    steps:[
      { id:'s1', at:'ferronier', nom:'Assemblage structure métal', icon:'🔧', estH:10, matiere:'Profilés alu, boulons inox, chevilles' },
      { id:'s2', at:'peinture',  nom:'Traitement anticorrosion',   icon:'🎨', estH:2,  matiere:'Primaire, protection UV', sousRoles:true },
    ]
  },
}

export function detectWorkflow(nom = '') {
  const n = nom.toLowerCase()
  for (const [key, wf] of Object.entries(WORKFLOWS)) {
    if (wf.keywords.some(k => n.includes(k))) return key
  }
  return null
}

export function initSteps(wfId) {
  if (!WORKFLOWS[wfId]) return []
  return WORKFLOWS[wfId].steps.map((s, i) => ({
    ...s, idx: i,
    status: i === 0 ? 'todo' : 'waiting',
    sessions: [],
    startedAt: null, endedAt: null,
    pausedAt: null, pauseReason: '',
    pauseDurationMs: 0,
    totalEstimatedH: null,
    assignedWorkers: [],   // [{ eId, empN, role?, estH }]
  }))
}

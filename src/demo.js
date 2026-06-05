// ─────────────────────────────────────────────────────────────────
//  MODE DÉMO — NE FAIT PAS PARTIE DE LA VRAIE APPLICATION
//  Sert uniquement à visualiser/tester les pages sans backend.
//  Faux login (admin) + données d'exemple injectées.
// ─────────────────────────────────────────────────────────────────

export const DEMO_USER = {
  id: 'u1', name: 'Driss Aarab', email: 'driss@creajit.ma', role: 'admin',
}

// Commandes d'exemple (forme attendue par Orders/Cmd/Alertes/Admin/Rentabilité)
export const DEMO_ORDERS = [
  {
    uuid: 'demo-1', ref: '26050012', cl: 'Mme Bennani', com: 'Kenza', tel: '+212600112233',
    liv: '2026-06-02', date: '2026-05-20', status: 'confirmed',
    late: true, j: 3, sol: 4200, tot: 18500, nb: 2,
    articles: [
      { nom: 'Canapé Brooklyn', at: 'tapissier', q: 1, prix: 12000, dim: 'L240 x P95', photo: '', cjNotes: 'Velours beige\nLivraison étage 3' },
      { nom: 'Fauteuil Luna', at: 'tapissier', q: 1, prix: 6500, dim: '', photo: '', cjNotes: '' },
    ],
  },
  {
    uuid: 'demo-2', ref: '26050018', cl: 'Mr Tazi', com: 'Ikram', tel: '+212611445566',
    liv: '2026-06-10', date: '2026-05-25', status: 'ready',
    late: false, j: 0, sol: 0, tot: 9800, nb: 1,
    articles: [
      { nom: 'Table travertin Aurax', at: 'pierre', q: 1, prix: 9800, dim: 'Ø120', photo: '', cjNotes: 'Travertin clair' },
    ],
  },
  {
    uuid: 'demo-3', ref: '26050021', cl: 'SHOWROOM', com: 'Laila', tel: '',
    liv: null, date: '2026-05-28', status: 'pending',
    late: false, j: 0, sol: 15000, tot: 15000, nb: 2,
    articles: [
      { nom: 'Chaise métal Solis', at: 'ferronier', q: 4, prix: 1200, dim: '', photo: '', cjNotes: '' },
      { nom: 'Lit Olia', at: 'menuisier', q: 1, prix: 10200, dim: 'L200 x l180', photo: '', cjNotes: 'Tête de lit capitonnée' },
    ],
  },
  {
    uuid: 'demo-4', ref: '26040007', cl: 'Mme Idrissi', com: 'Kenza', tel: '+212622778899',
    liv: '2026-05-15', date: '2026-04-18', status: 'partial',
    late: true, j: 21, sol: 3000, tot: 7400, nb: 1,
    articles: [
      { nom: 'Pergola Ombrella', at: 'ferronier', q: 1, prix: 7400, dim: '3x4m', photo: '', cjNotes: '' },
    ],
  },
]

// Quelques articles déjà "en production" pour remplir Cmd / Rentabilité / Équipe
function mkArt(id, ref, uuid, nom, at, q, prix, st) {
  return {
    id, ref, uuid, nom, at, q, prix, dim: '', photo: '',
    cjNotes: '', productionStatus: '', st, emps: [],
    created: new Date().toISOString(), fiche: {},
  }
}

export const DEMO_ARTS = {
  'demo-a1': mkArt('demo-a1', '26050012', 'demo-1', 'Canapé Brooklyn', 'tapissier', 1, 12000, 'wip'),
  'demo-a2': mkArt('demo-a2', '26050012', 'demo-1', 'Fauteuil Luna', 'tapissier', 1, 6500, 'todo'),
  'demo-a3': mkArt('demo-a3', '26050018', 'demo-2', 'Table travertin Aurax', 'pierre', 1, 9800, 'ok'),
  'demo-a4': mkArt('demo-a4', '26050021', 'demo-3', 'Lit Olia', 'menuisier', 1, 10200, 'todo'),
}

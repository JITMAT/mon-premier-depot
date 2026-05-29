import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DIRECTION } from './data/equipe.js'
import { COLLECTIONS_VIDES } from './lib/schema.js'

// ─── Authentification (Socle, simple) ───────────────────────────
// Connexion par identifiant + PIN. Pour le Module 1 on s'appuie sur la
// liste DIRECTION ; les comptes ouvriers viendront avec leur module.
export const useAuth = create(persist(
  (set, get) => ({
    user: null,

    login: (id, pin) => {
      const compte = DIRECTION.find(d => d.id === id)
      if (!compte || compte.pin !== pin) {
        throw new Error('Identifiant ou code incorrect')
      }
      const user = { id: compte.id, nom: compte.nom, role: compte.role, fonction: compte.fonction }
      set({ user })
      return user
    },

    logout: () => set({ user: null }),
  }),
  { name: 'creajit-ia-auth' }
))

// ─── Base de données locale (Socle) ─────────────────────────────
// Toutes les collections du modèle de données (voir lib/schema.js) sont
// stockées ici et persistées dans le navigateur. Cette couche est
// volontairement isolée : on pourra brancher un vrai backend plus tard
// sans toucher aux écrans.
export const useDB = create(persist(
  (set, get) => ({
    ...structuredClone(COLLECTIONS_VIDES),

    // Ajoute / remplace un élément dans une collection
    set: (collection, id, valeur) => {
      const col = { ...get()[collection], [id]: valeur }
      set({ [collection]: col })
    },

    // Met à jour partiellement un élément existant
    update: (collection, id, changements) => {
      const actuel = get()[collection][id]
      if (!actuel) return
      const col = { ...get()[collection], [id]: { ...actuel, ...changements } }
      set({ [collection]: col })
    },

    // Supprime un élément
    remove: (collection, id) => {
      const col = { ...get()[collection] }
      delete col[id]
      set({ [collection]: col })
    },

    // Liste les éléments d'une collection sous forme de tableau
    liste: (collection) => Object.values(get()[collection] || {}),

    // Remet la base à zéro (utile en dev)
    reset: () => set(structuredClone(COLLECTIONS_VIDES)),
  }),
  { name: 'creajit-ia-db' }
))

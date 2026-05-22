import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── AUTH STORE ─────────────────────────────────────────────────
export const useAuth = create(persist(
  (set, get) => ({
    user: null,
    token: null,

    login: async (email, password) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion')
      set({ user: data.user, token: data.token })
      return data.user
    },

    logout: () => set({ user: null, token: null }),

    hasAccess: (section) => {
      const { user } = get()
      if (!user) return false
      if (user.role === 'admin') return true
      const ROLE_ACCESS = {
        production: ['orders', 'production', 'team', 'alerts'],
        commercial: ['orders', 'alerts'],
        livraison: ['orders', 'livraison', 'alerts'],
        magasin: ['stock', 'reception', 'alerts'],
      }
      return (ROLE_ACCESS[user.role] || []).includes(section)
    }
  }),
  { name: 'creajit-auth' }
))

// ─── APP STORE ─────────────────────────────────────────────────
export const useApp = create(persist(
  (set, get) => ({
    // Orders (from CreaJit API)
    orders: [],
    ordersLoading: false,
    ordersLastSync: null,

    // Local production data
    arts: {},        // { id: { id, ref, uuid, nom, at, q, prix, dim, photo, st, emps, created } }
    sessions: [],    // [ { id, aId, eId, empN, at, t0, end, st } ]
    mats: {},        // { artId: [ { id, n, q, u, p } ] }
    quals: {},       // { artId: { ok, par, obs, date } }
    achats: {},      // { artId: [ { id, nom, ... } ] }
    valRecep: {},    // { key: { validePar, date } }
    stepProgress: {}, // { artId: [ step1, step2, ... ] }

    // UI state
    tab: 'orders',
    selRef: null,
    selArt: null,

    setTab: (tab) => set({ tab }),
    setSelRef: (ref) => set({ selRef: ref, tab: 'cmd' }),
    setSelArt: (id) => set({ selArt: id, tab: 'art' }),

    // Fetch orders from API
    fetchOrders: async (token) => {
      set({ ordersLoading: true })
      try {
        const res = await fetch('/api/creajit/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (Array.isArray(data)) {
          set({ orders: data, ordersLastSync: new Date().toISOString(), ordersLoading: false })
          const { arts } = get()
          const newArts = { ...arts }
          let changed = false

          data.forEach(order => {
            if (!order.articles || !order.articles.length) return
            const existing = Object.values(newArts).filter(a => a.ref === order.ref)

            if (existing.length === 0) {
              // Créer les articles pour cette commande
              order.articles.forEach(item => {
                const id = `cj_${order.uuid}_${Math.random().toString(36).slice(2,7)}`
                newArts[id] = {
                  id, ref: order.ref, uuid: order.uuid,
                  nom: item.nom, at: item.at, q: item.q, prix: item.prix,
                  dim: item.dim, photo: item.photo,
                  cjNotes: item.cjNotes || '',
                  productionStatus: item.productionStatus || '',
                  st: 'todo', emps: [], created: new Date().toISOString(), fiche: {}
                }
                changed = true
              })
            } else {
              // Mettre à jour cjNotes + photo sur les articles existants
              order.articles.forEach((item, idx) => {
                const art = existing[idx]
                if (art && (art.cjNotes !== item.cjNotes || !art.cjNotes)) {
                  newArts[art.id] = {
                    ...newArts[art.id],
                    cjNotes: item.cjNotes || newArts[art.id].cjNotes || '',
                    photo: item.photo || newArts[art.id].photo || '',
                    dim: item.dim || newArts[art.id].dim || '',
                  }
                  changed = true
                }
              })
            }
          })

          if (changed) set({ arts: newArts })
        }
      } catch(e) {
        set({ ordersLoading: false })
      }
    },

    // Arts actions
    addArt: (art) => {
      const arts = { ...get().arts, [art.id]: art }
      set({ arts })
    },

    // Step workflow actions
    initArtSteps: (artId, steps) => {
      const stepProgress = { ...get().stepProgress, [artId]: steps }
      set({ stepProgress })
    },

    startStep: (artId, stepIdx, session) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i === stepIdx) return { ...s, status: 'active', startedAt: s.startedAt || session.t0, sessions: [...s.sessions, session] }
        return s
      })
      sp[artId] = steps
      set({ stepProgress: sp })
      // update art status
      const arts = { ...get().arts }
      if (arts[artId]) arts[artId] = { ...arts[artId], st: 'wip' }
      set({ arts })
    },

    stopStepSession: (artId, stepIdx, sessionId, endTime) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i !== stepIdx) return s
        const sessions = s.sessions.map(ses => ses.id === sessionId ? { ...ses, end: endTime } : ses)
        return { ...s, sessions }
      })
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    completeStep: (artId, stepIdx) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i === stepIdx) return { ...s, status: 'done', endedAt: new Date().toISOString() }
        if (i === stepIdx + 1) return { ...s, status: 'todo' }
        return s
      })
      sp[artId] = steps
      // if all done, mark art ok
      if (steps.every(s => s.status === 'done')) {
        const arts = { ...get().arts }
        if (arts[artId]) arts[artId] = { ...arts[artId], st: 'ok' }
        set({ arts })
      }
      set({ stepProgress: sp })
    },

    pauseStep: (artId, stepIdx, reason) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i !== stepIdx) return s
        // Stop all running sessions
        const sessions = s.sessions.map(ses => ses.end ? ses : { ...ses, end: new Date().toISOString() })
        return { ...s, status: 'paused', pausedAt: new Date().toISOString(), pauseReason: reason, sessions }
      })
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    resumeStep: (artId, stepIdx) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i !== stepIdx) return s
        const pauseMs = s.pausedAt ? Date.now() - new Date(s.pausedAt).getTime() + (s.pauseDurationMs || 0) : (s.pauseDurationMs || 0)
        return { ...s, status: 'active', pausedAt: null, pauseReason: '', pauseDurationMs: pauseMs }
      })
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    // Pause/resume individual worker session
    pauseSession: (artId, stepIdx, sesId, reason, ctrKey) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i !== stepIdx) return s
        const sessions = s.sessions.map(ses => {
          if (ses.id !== sesId) return ses
          return { ...ses, pausedAt: new Date().toISOString(), pauseReason: reason }
        })
        const cnt = { ...(s.pauseCounters||{}) }
        if (ctrKey) cnt[ctrKey] = (cnt[ctrKey]||0)+1
        return { ...s, sessions, pauseCounters: cnt }
      })
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    resumeSession2: (artId, stepIdx, sesId) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i !== stepIdx) return s
        const sessions = s.sessions.map(ses => {
          if (ses.id !== sesId || !ses.pausedAt) return ses
          const pMs = Date.now() - new Date(ses.pausedAt).getTime()
          const pauses = [...(ses.pauses||[]), { reason: ses.pauseReason, durationMs: pMs }]
          return { ...ses, pausedAt: null, pauseReason: '', totalPauseMs: (ses.totalPauseMs||0)+pMs, pauses }
        })
        return { ...s, sessions }
      })
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    finishSession: (artId, stepIdx, sesId) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => {
        if (i !== stepIdx) return s
        const sessions = s.sessions.map(ses => {
          if (ses.id !== sesId) return ses
          let pMs = ses.totalPauseMs||0
          if (ses.pausedAt) pMs += Date.now() - new Date(ses.pausedAt).getTime()
          return { ...ses, end: new Date().toISOString(), pausedAt: null, totalPauseMs: pMs }
        })
        return { ...s, sessions }
      })
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    setStepEstimate: (artId, stepIdx, hours) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => i === stepIdx ? { ...s, totalEstimatedH: hours } : s)
      sp[artId] = steps
      set({ stepProgress: sp })
    },

    updateStepField: (artId, stepIdx, field, value) => {
      const sp = { ...get().stepProgress }
      if (!sp[artId]) return
      const steps = sp[artId].map((s, i) => i === stepIdx ? { ...s, [field]: value } : s)
      sp[artId] = steps
      set({ stepProgress: sp })
    },
    updateArt: (id, changes) => {
      const arts = { ...get().arts, [id]: { ...get().arts[id], ...changes } }
      set({ arts })
    },
    deleteArt: (id) => {
      const arts = { ...get().arts }
      delete arts[id]
      set({ arts })
    },

    // Sessions (timer)
    addSession: (ses) => set({ sessions: [...get().sessions, ses] }),
    stopSession: (sesId) => {
      const sessions = get().sessions.map(s =>
        s.id === sesId ? { ...s, st: 'done', end: new Date().toISOString() } : s
      )
      set({ sessions })
    },

    // Matières
    addMat: (artId, mat) => {
      const mats = { ...get().mats, [artId]: [...(get().mats[artId] || []), mat] }
      set({ mats })
    },
    delMat: (artId, matId) => {
      const mats = { ...get().mats, [artId]: (get().mats[artId] || []).filter(m => m.id !== matId) }
      set({ mats })
    },

    // Qualité
    saveQual: (artId, qual) => {
      const quals = { ...get().quals, [artId]: qual }
      const arts = { ...get().arts }
      if (arts[artId]) arts[artId] = { ...arts[artId], st: qual.ok ? 'ok' : 'nok' }
      set({ quals, arts })
    },

    // Achats
    addAchat: (artId, achat) => {
      const achats = { ...get().achats, [artId]: [...(get().achats[artId] || []), achat] }
      set({ achats })
    },
    receptAchat: (artId, achatId, recepData) => {
      const achats = { ...get().achats }
      achats[artId] = (achats[artId] || []).map(a =>
        a.id === achatId ? { ...a, ...recepData, dateR: new Date().toISOString() } : a
      )
      set({ achats })
    },
  }),
  {
    name: 'creajit-app',
    partialize: (state) => ({
      arts: state.arts,
      sessions: state.sessions,
      mats: state.mats,
      quals: state.quals,
      achats: state.achats,
      valRecep: state.valRecep,
      ordersLastSync: state.ordersLastSync,
    })
  }
))

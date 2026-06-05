import React, { useState } from 'react'
import { useApp } from '../store'
import { atI } from '../data/employees'
import FicheProduction from './FicheProduction'

// ─── CATALOGUE PRODUITS ────────────────────────────────────────────
// Affiche tous les articles du store (photos viennent de CreaJit via
// fetchOrders → art.photo). Un clic ouvre la fiche de production A4.

export default function Catalogue() {
  const { arts, orders } = useApp()
  const [search, setSearch]       = useState('')
  const [ficheProd, setFicheProd] = useState(null)
  const [filterAt, setFilterAt]   = useState('all')

  const artList = Object.values(arts)

  // Ateliers présents
  const ateliers = [...new Set(artList.map(a => a.at).filter(Boolean))]

  const filtered = artList.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !search || (a.nom||'').toLowerCase().includes(q) || (a.ref||'').toLowerCase().includes(q)
    const matchAt = filterAt === 'all' || a.at === filterAt
    return matchSearch && matchAt
  })

  // Grouper par nom de produit (modèle)
  const byModel = {}
  filtered.forEach(a => {
    const key = (a.nom || 'Sans nom').toUpperCase()
    if (!byModel[key]) byModel[key] = []
    byModel[key].push(a)
  })
  const models = Object.entries(byModel).sort(([a],[b]) => a.localeCompare(b))

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>

      {/* ── En-tête ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>
          🛋️ Catalogue <span style={{ color: '#C4714F' }}>CREAJIT</span>
          <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 10 }}>
            {artList.length} article{artList.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un modèle ou une référence..."
            style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <select
            value={filterAt}
            onChange={e => setFilterAt(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="all">Tous ateliers</option>
            {ateliers.map(at => {
              const a = atI(at)
              return <option key={at} value={at}>{a.e} {a.n}</option>
            })}
          </select>
        </div>
      </div>

      {/* ── Vide ─────────────────────────────────────────────────── */}
      {artList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Catalogue vide</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            Les articles et leurs photos apparaissent ici automatiquement après synchronisation avec CreaJit.
          </div>
        </div>
      )}

      {/* ── Grille des modèles ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {models.map(([nomModel, artsList]) => {
          const rep = artsList.find(a => a.photo) || artsList[0]
          const at  = atI(rep.at)

          return (
            <ModelCard
              key={nomModel}
              nomModel={nomModel}
              rep={rep}
              artsList={artsList}
              at={at}
              orders={orders}
              onOpenFiche={setFicheProd}
            />
          )
        })}
      </div>

      {filtered.length === 0 && artList.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aucun résultat pour « {search} »</div>
      )}

      {/* ── Fiche de production ───────────────────────────────────── */}
      {ficheProd && <FicheProduction artId={ficheProd} onClose={() => setFicheProd(null)} />}
    </div>
  )
}

// ─── Carte modèle ─────────────────────────────────────────────────
function ModelCard({ nomModel, rep, artsList, at, orders, onOpenFiche }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column' }}>

      {/* Photo ─ occupe 60% de la carte */}
      <div
        style={{ position: 'relative', height: 190, background: '#f8fafc', cursor: 'pointer', overflow: 'hidden' }}
        onClick={() => onOpenFiche(rep.id)}
      >
        {rep.photo
          ? <img src={rep.photo} alt={nomModel}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
          : null
        }
        {/* Fallback si photo absente ou erreur */}
        <div style={{
          display: rep.photo ? 'none' : 'flex',
          width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6, color: '#94a3b8'
        }}>
          <span style={{ fontSize: 52 }}>{at.e}</span>
          <span style={{ fontSize: 11 }}>{at.n}</span>
        </div>
        {/* Badge catégorie */}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
          {at.e} {at.n}
        </div>
        {/* Indicateur photo présente */}
        {rep.photo && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(21,128,61,.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
            📷 Photo réelle
          </div>
        )}
        {/* Overlay clic */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', padding: 10 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>{nomModel}</div>
            {rep.dim && <div style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'monospace' }}>{rep.dim}</div>}
          </div>
        </div>
      </div>

      {/* Infos + commandes ─────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Bouton principal : ouvrir fiche du premier article */}
        <button
          onClick={() => onOpenFiche(rep.id)}
          style={{ width: '100%', padding: '9px 12px', background: '#C4714F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          📄 Fiche de production
        </button>

        {/* Liste des commandes de ce modèle */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#64748b', fontFamily: 'inherit', padding: '2px 0', width: '100%', textAlign: 'left' }}
          >
            {expanded ? '▲' : '▼'} {artsList.length} commande{artsList.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {artsList.map(a => {
                const ord = orders.find(o => o.ref === a.ref)
                return (
                  <button
                    key={a.id}
                    onClick={() => onOpenFiche(a.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#C4714F', fontFamily: 'monospace' }}>{a.ref}</div>
                      {ord?.cl && <div style={{ fontSize: 11, color: '#475569' }}>{ord.cl}</div>}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>📄</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

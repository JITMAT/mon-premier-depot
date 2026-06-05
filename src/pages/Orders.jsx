import React, { useState, useMemo } from 'react'
import { useApp } from '../store'

const STATUS_COLORS = {
  confirmed: { bg: 'rgba(52,152,219,.12)', c: '#3498DB', l: 'Confirmée' },
  ready:     { bg: 'rgba(46,204,113,.12)', c: '#2ECC71', l: 'Prête' },
  partial:   { bg: 'rgba(241,196,15,.12)', c: '#F1C40F', l: 'Part. livrée' },
  paid:      { bg: 'rgba(46,204,113,.12)', c: '#2ECC71', l: 'Payée' },
  pending:   { bg: 'rgba(136,136,154,.12)', c: '#88889A', l: 'En attente' },
}

const dh = n => Math.round(n || 0).toLocaleString('fr') + ' DH'

const COMMERCIAUX = ['Tous', 'Kenza', 'Ikram', 'Laila']
const MOIS = ['Tous', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function Orders() {
  const { orders, arts, ordersLoading, setSelRef } = useApp()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCom, setFilterCom] = useState('Tous')
  const [filterMois, setFilterMois] = useState('Tous')
  const [filterDateLiv, setFilterDateLiv] = useState('')
  const [filterDateCmd, setFilterDateCmd] = useState('')
  const [sortBy, setSortBy] = useState('livraison') // livraison | retard | com | total
  const [showFilters, setShowFilters] = useState(false)

  const retards = orders.filter(o => o.late).length
  const totalSol = orders.reduce((s, o) => s + (o.sol || 0), 0)

  const filtered = useMemo(() => {
    let list = orders.filter(o => {
      const q = search.toLowerCase()
      if (q && !(o.cl||'').toLowerCase().includes(q) && !(o.ref||'').includes(q) && !(o.com||'').toLowerCase().includes(q)) return false
      if (filterStatus === 'late' && !o.late) return false
      if (filterStatus === 'confirmed' && o.status !== 'confirmed') return false
      if (filterStatus === 'ready' && o.status !== 'ready') return false
      if (filterCom !== 'Tous' && o.com !== filterCom) return false
      if (filterMois !== 'Tous') {
        const mIdx = MOIS.indexOf(filterMois)
        if (o.liv) {
          const m = new Date(o.liv).getMonth() + 1
          if (m !== mIdx) return false
        } else return false
      }
      if (filterDateLiv && o.liv !== filterDateLiv) return false
      if (filterDateCmd) {
        // compare just the date part of the order
        const orderDate = o.date ? o.date.slice(0,10) : ''
        if (orderDate !== filterDateCmd) return false
      }
      return true
    })

    list.sort((a, b) => {
      if (sortBy === 'livraison') {
        // Sans date → à la fin
        if (!a.liv && !b.liv) return 0
        if (!a.liv) return 1
        if (!b.liv) return -1
        return new Date(a.liv) - new Date(b.liv)
      }
      if (sortBy === 'retard') return (b.j||0) - (a.j||0)
      if (sortBy === 'com') return (a.com||'').localeCompare(b.com||'')
      if (sortBy === 'total') return (b.tot||0) - (a.tot||0)
      return 0
    })

    return list
  }, [orders, search, filterStatus, filterCom, filterMois, filterDateLiv, filterDateCmd, sortBy])

  const hasActiveFilters = filterStatus !== 'all' || filterCom !== 'Tous' || filterMois !== 'Tous' || filterDateLiv || filterDateCmd

  function resetFilters() {
    setFilterStatus('all'); setFilterCom('Tous'); setFilterMois('Tous')
    setFilterDateLiv(''); setFilterDateCmd(''); setSearch('')
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { v: filtered.length + '/' + orders.length, l: 'Commandes', c: 'var(--tx)' },
          { v: retards, l: 'Retards', c: retards > 0 ? 'var(--rd)' : 'var(--mu)' },
          { v: dh(totalSol), l: 'À encaisser', c: 'var(--or)', small: true },
        ].map(s => (
          <div key={s.l} style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: s.small ? 12 : 18, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 2, textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Search + filtre toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--mu)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Client, référence..."
            style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '9px 32px 9px 32px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 15 }}>✕</button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} style={{
          padding: '0 14px', borderRadius: 8, border: `1.5px solid ${hasActiveFilters ? 'var(--or)' : 'var(--bd)'}`,
          background: hasActiveFilters ? 'rgba(196,113,79,.12)' : 'var(--c2)',
          color: hasActiveFilters ? 'var(--or)' : 'var(--mu)', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
        }}>
          {hasActiveFilters ? '🔶 Filtres' : '⚙️ Filtres'}
        </button>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: 12, marginBottom: 10 }}>

          {/* Statut */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Statut</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                { id:'all', l:'Tout' },
                { id:'late', l:'🔴 Retards' },
                { id:'confirmed', l:'Confirmées' },
                { id:'ready', l:'✅ Prêtes' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilterStatus(f.id)} style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filterStatus === f.id ? 'var(--or)' : 'var(--c2)',
                  color: filterStatus === f.id ? '#fff' : 'var(--mu)',
                  fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
                }}>{f.l}</button>
              ))}
            </div>
          </div>

          {/* Commerciale */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Commerciale</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {COMMERCIAUX.map(c => (
                <button key={c} onClick={() => setFilterCom(c)} style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filterCom === c ? '#3498DB' : 'var(--c2)',
                  color: filterCom === c ? '#fff' : 'var(--mu)',
                  fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
                }}>👩 {c}</button>
              ))}
            </div>
          </div>

          {/* Mois de livraison */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Mois de livraison</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {MOIS.map(m => (
                <button key={m} onClick={() => setFilterMois(m)} style={{
                  padding: '3px 8px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filterMois === m ? '#9B59B6' : 'var(--c2)',
                  color: filterMois === m ? '#fff' : 'var(--mu)',
                  fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
                }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Date livraison exacte + date commande */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>📅 Date livraison exacte</div>
              <input type="date" value={filterDateLiv} onChange={e => setFilterDateLiv(e.target.value)}
                style={{ width: '100%', background: 'var(--c2)', border: `1px solid ${filterDateLiv ? 'var(--or)' : 'var(--bd)'}`, borderRadius: 7, padding: '7px 8px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}/>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>📋 Date commande</div>
              <input type="date" value={filterDateCmd} onChange={e => setFilterDateCmd(e.target.value)}
                style={{ width: '100%', background: 'var(--c2)', border: `1px solid ${filterDateCmd ? 'var(--or)' : 'var(--bd)'}`, borderRadius: 7, padding: '7px 8px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}/>
            </div>
          </div>

          {/* Tri */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Trier par</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                { id:'livraison', l:'📅 Date livraison' },
                { id:'retard', l:'🔴 Retard' },
                { id:'com', l:'👩 Commerciale' },
                { id:'total', l:'💰 Montant' },
              ].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: sortBy === s.id ? 'var(--or)' : 'var(--c2)',
                  color: sortBy === s.id ? '#fff' : 'var(--mu)',
                  fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
                }}>{s.l}</button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={resetFilters} style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid rgba(231,76,60,.3)', background: 'rgba(231,76,60,.08)', color: 'var(--rd)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>
              ✕ Réinitialiser tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {ordersLoading && (
        <div style={{ textAlign: 'center', padding: 16, color: 'var(--mu)', fontSize: 13 }}>
          <span className="spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid var(--bd)', borderTopColor: 'var(--or)', borderRadius: '50%', verticalAlign: 'middle', marginRight: 8 }}/>
          Synchronisation CreaJit...
        </div>
      )}

      {filtered.length === 0 && !ordersLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--mu)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div>Aucune commande trouvée</div>
        </div>
      )}

      {/* Liste commandes */}
      {filtered.map(o => {
        const artsList = Object.values(arts).filter(a => a.ref === o.ref)
        const done = artsList.filter(a => a.st === 'ok').length
        const prog = artsList.length ? Math.round(done / artsList.length * 100) : 0
        const st = STATUS_COLORS[o.status] || STATUS_COLORS.pending

        // Jours restants avant livraison
        const daysLeft = o.liv ? Math.ceil((new Date(o.liv) - new Date()) / 86400000) : null
        const isLate = o.late
        const isUrgent = !isLate && daysLeft !== null && daysLeft <= 3

        return (
          <div key={o.uuid} onClick={() => setSelRef(o.ref)} style={{
            background: 'var(--c1)',
            border: `1px solid ${isLate ? 'rgba(231,76,60,.4)' : isUrgent ? 'rgba(241,196,15,.3)' : 'var(--bd)'}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
            borderLeft: `4px solid ${isLate ? 'var(--rd)' : isUrgent ? 'var(--yw)' : prog === 100 ? 'var(--gn)' : 'var(--or)'}`,
          }}>
            {/* Ligne 1 — Ref + statut + retard */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--or)' }}>{o.ref}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: st.bg, color: st.c }}>{st.l}</span>
              {isLate && <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--rd)', marginLeft: 'auto' }}>⚠️ +{o.j}j</span>}
            </div>

            {/* Ligne 2 — Nom client (GRAND) */}
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.cl}</div>

            {/* Ligne 3 — Date livraison GRANDE */}
            {o.liv && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                padding: '6px 10px', borderRadius: 8,
                background: isLate ? 'rgba(231,76,60,.1)' : isUrgent ? 'rgba(241,196,15,.08)' : 'rgba(46,204,113,.07)',
                border: `1px solid ${isLate ? 'rgba(231,76,60,.25)' : isUrgent ? 'rgba(241,196,15,.25)' : 'rgba(46,204,113,.2)'}`,
              }}>
                <span style={{ fontSize: 14 }}>{isLate ? '🔴' : isUrgent ? '🟡' : '📅'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Date de livraison</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isLate ? 'var(--rd)' : isUrgent ? 'var(--yw)' : 'var(--gn)' }}>
                    {new Date(o.liv).toLocaleDateString('fr', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 50 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: isLate ? 'var(--rd)' : isUrgent ? 'var(--yw)' : 'var(--gn)', lineHeight: 1 }}>
                    {isLate ? '+' + o.j : daysLeft === 0 ? '0' : daysLeft}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--mu)' }}>{isLate ? 'j. retard' : daysLeft === 0 ? "auj." : 'j. rest.'}</div>
                </div>
              </div>
            )}

            {/* Ligne 4 — Commerciale + tel + montants */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--mu)' }}>👩 {o.com}</span>
              {o.tel && <span style={{ fontSize: 10, color: 'var(--mu)' }}>📞 {o.tel}</span>}
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{dh(o.tot)}</div>
                <div style={{ fontSize: 10, color: o.sol > 0 ? 'var(--rd)' : 'var(--gn)' }}>
                  {o.sol > 0 ? 'Solde: ' + dh(o.sol) : '✅ Payé'}
                </div>
              </div>
            </div>

            {/* Barre progression */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: 'var(--bd)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: prog === 100 ? 'var(--gn)' : 'var(--or)', width: prog + '%', transition: 'width .3s' }}/>
              </div>
              <span style={{ fontSize: 10, color: 'var(--mu)', whiteSpace: 'nowrap' }}>
                {artsList.length ? done + '/' + artsList.length + ' art.' : o.nb + ' à charger'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

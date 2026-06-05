import React, { useState } from 'react'
import { useApp } from '../store'
import { EMP, AT } from '../data/employees'

const dh = n => Math.round(n || 0).toLocaleString('fr') + ' DH'
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0

// Charges fixes initiales CREAJIT (mémorisées)
const CHARGES_INIT = [
  { id: 'c1', nom: 'Loyer atelier', ic: '🏠', montant: 90000 },
  { id: 'c2', nom: 'Leasing voiture', ic: '🚗', montant: 15930.83 },
  { id: 'c3', nom: 'Leasing machine', ic: '⚙️', montant: 16000 },
  { id: 'c4', nom: 'CNSS (cotisation sociale)', ic: '🏦', montant: 20000 },
  { id: 'c5', nom: 'Électricité + eau', ic: '⚡', montant: 8000 },
  { id: 'c6', nom: 'Assurance protection', ic: '🛡️', montant: 5000 },
  { id: 'c7', nom: 'Téléphone', ic: '📞', montant: 2000 },
  { id: 'c8', nom: 'ADSL internet', ic: '📡', montant: 500 },
]

const MASSE_SAL_ATELIERS = EMP.reduce((s, e) => s + e.sal, 0)

// Personnel hors ateliers — 20 personnes — 105 500 DH/mois
const HORS_ATELIERS = [
  { cat:'Administration',   noms:'Sabiri, Fatima, Hanane, Abdelaali, Bahri, Ayoub H.', nb:6, total:38000, ic:'🏢' },
  { cat:'Equipe chantier',  noms:'Guerroumi, Zeroual, Yassine A.B., El Kissani',        nb:4, total:20500, ic:'🔨' },
  { cat:'Commerciales',     noms:'Kenza, Laila, Ikram',                                 nb:3, total:15000, ic:'💼' },
  { cat:'Cuisine/Entretien',noms:'Zakaria, Hafsa, Naima',                               nb:3, total:12000, ic:'🍽️' },
  { cat:'Logistique/Magasin',noms:'Hassan Laagourri, Mohamed Moumen',                   nb:2, total:10000, ic:'📦' },
  { cat:'Securite',         noms:'Mustapha Souabni',                                    nb:1, total:5000,  ic:'🔒' },
  { cat:'Livreur',          noms:'Abdelhakim El Harti',                                 nb:1, total:5000,  ic:'🚚' },
]
const MASSE_SAL_HORS = HORS_ATELIERS.reduce((s, c) => s + c.total, 0)
const NB_HORS = HORS_ATELIERS.reduce((s, c) => s + c.nb, 0)
const MASSE_SAL_TOTALE = MASSE_SAL_ATELIERS + MASSE_SAL_HORS
const OBJECTIF_CA = 550000
const JOURS_OUVR = 22

export default function Rentabilite() {
  const { orders, arts, sessions, mats, achats } = useApp()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [charges, setCharges] = useState(CHARGES_INIT)
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState(0)
  const [editNom, setEditNom] = useState('')
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [newCharge, setNewCharge] = useState({ nom: '', ic: '💰', montant: 0 })

  // ── Calculs ──────────────────────────────────────────────────
  const totalChargesFixes = charges.reduce((s, c) => s + c.montant, 0)
  const totalCharges = totalChargesFixes + MASSE_SAL_TOTALE
  const caMonth = orders.reduce((s, o) => s + (o.tot || 0), 0)
  const resultat = caMonth - totalCharges
  const seuil = totalCharges
  const progSeuil = Math.min(100, pct(caMonth, OBJECTIF_CA))
  const objectifJour = Math.round(OBJECTIF_CA / JOURS_OUVR)

  // Coût par atelier (masse sal + quote-part charges fixes)
  function atCout(atId) {
    const empsAt = EMP.filter(e => e.at === atId)
    const salAt = empsAt.reduce((s, e) => s + e.sal, 0)
    const part = MASSE_SAL_ATELIERS > 0 ? salAt / MASSE_SAL_ATELIERS : 0
    const chargesAt = totalChargesFixes * part
    return { sal: salAt, charges: chargesAt, total: salAt + chargesAt, emps: empsAt.length, part }
  }

  // Coût de revient par article
  function artCout(art) {
    const artSes = (sessions || []).filter(s => s.aId === art.id && s.end)
    const mo = artSes.reduce((a, s) => {
      const ms = +new Date(s.end) - +new Date(s.t0)
      const emp = EMP.find(e => e.id === s.eId)
      return a + (ms / 3600000) * (emp ? emp.tx : 24)
    }, 0)
    const matCost = (mats[art.id] || []).reduce((a, m) => a + m.q * m.p, 0)
    const achatCost = (achats[art.id] || [])
      .filter(a => a.dateR)
      .reduce((a, x) => a + (x.prix || 0) * (x.q || 1), 0)
    const at = atCout(art.at)
    const heures = artSes.reduce((a, s) => a + (+new Date(s.end) - +new Date(s.t0)) / 3600000, 0)
    const chargeArt = at.total > 0 && heures > 0 ? (heures / (at.emps * 160)) * at.charges : 0
    const coutTotal = mo + matCost + achatCost + chargeArt
    const ordre = orders.find(o => o.ref === art.ref)
    const prixVente = art.prix || 0
    const marge = prixVente - coutTotal
    const margePct = prixVente > 0 ? Math.round(marge / prixVente * 100) : null
    return { mo: +mo.toFixed(0), mat: +matCost.toFixed(0), achat: +achatCost.toFixed(0), charge: +chargeArt.toFixed(0), total: +coutTotal.toFixed(0), prixVente, marge: +marge.toFixed(0), margePct, heures: +heures.toFixed(1) }
  }

  const artsList = Object.values(arts)
  const artsAvecCout = artsList.map(a => ({ ...a, cout: artCout(a) }))
  const artsDeficit = artsAvecCout.filter(a => a.cout.prixVente > 0 && a.cout.marge < 0)
  const artsBons = artsAvecCout.filter(a => a.cout.prixVente > 0 && a.cout.marge >= 0)

  // Marge couleur
  function margeColor(pct) {
    if (pct === null) return 'var(--mu)'
    if (pct < 0) return 'var(--rd)'
    if (pct < 20) return 'var(--yw)'
    return 'var(--gn)'
  }
  function margeBg(pct) {
    if (pct === null) return 'var(--c2)'
    if (pct < 0) return 'rgba(231,76,60,.1)'
    if (pct < 20) return 'rgba(241,196,15,.1)'
    return 'rgba(46,204,113,.1)'
  }

  const TABS = [
    { id: 'dashboard', l: '📊 Dashboard' },
    { id: 'charges', l: '💰 Charges' },
    { id: 'ateliers', l: '🏭 Ateliers' },
    { id: 'articles', l: '📦 Articles' },
  ]

  return (
    <div>
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--c2)', borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none',
            background: activeTab === t.id ? 'var(--or)' : 'none',
            color: activeTab === t.id ? '#fff' : 'var(--mu)',
            cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Alerte si déficit */}
          {resultat < 0 && (
            <div style={{ background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.35)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rd)', marginBottom: 4 }}>⚠️ Résultat négatif ce mois</div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Il manque <b style={{ color: 'var(--rd)' }}>{dh(Math.abs(resultat))}</b> pour couvrir toutes les charges.</div>
            </div>
          )}

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { v: dh(caMonth), l: 'CA du mois', c: 'var(--gn)' },
              { v: dh(totalCharges), l: 'Charges totales', c: 'var(--rd)' },
              { v: dh(resultat), l: 'Résultat brut', c: resultat >= 0 ? 'var(--gn)' : 'var(--rd)' },
              { v: dh(objectifJour), l: 'Objectif / jour', c: 'var(--or)' },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 3, textTransform: 'uppercase' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Barre progression objectif */}
          <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>Progression vers objectif {Math.round(OBJECTIF_CA / 1000)}k DH</span>
              <span style={{ fontFamily: 'monospace', color: progSeuil >= 100 ? 'var(--gn)' : 'var(--yw)', fontWeight: 700 }}>{progSeuil}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bd)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 5, width: progSeuil + '%', background: progSeuil >= 100 ? 'var(--gn)' : progSeuil >= 75 ? 'var(--yw)' : 'var(--rd)', transition: 'width .5s' }}/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--mu)' }}>
              {caMonth < OBJECTIF_CA
                ? `Il manque ${dh(OBJECTIF_CA - caMonth)} pour atteindre le seuil recommandé`
                : `✅ Objectif atteint — surplus de ${dh(caMonth - OBJECTIF_CA)}`}
            </div>
          </div>

          {/* Décomposition charges */}
          <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Décomposition des charges</div>
            {[
              { l: `Masse sal. ateliers (${EMP.length})`, v: MASSE_SAL_ATELIERS, c: '#9B59B6', pct2: pct(MASSE_SAL_ATELIERS, totalCharges) },
              { l: 'Masse sal. hors ateliers (20)', v: MASSE_SAL_HORS, c: '#3498DB', pct2: pct(MASSE_SAL_HORS, totalCharges) },
              { l: 'Charges fixes', v: totalChargesFixes, c: '#C4714F', pct2: pct(totalChargesFixes, totalCharges) },
            ].map(r => (
              <div key={r.l} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                  <span style={{ color: r.c, fontWeight: 600 }}>{r.l}</span>
                  <span style={{ fontFamily: 'monospace', color: r.c }}>{dh(r.v)} · {r.pct2}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--bd)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: r.c, width: r.pct2 + '%' }}/>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bd)', fontSize: 12, fontWeight: 700 }}>
              <span>TOTAL ({EMP.length + NB_HORS} personnes)</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--rd)' }}>{dh(totalCharges)}</span>
            </div>
          </div>

          {/* Alertes articles */}
          {artsDeficit.length > 0 && (
            <div style={{ background: 'rgba(231,76,60,.06)', border: '1px solid rgba(231,76,60,.3)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rd)', marginBottom: 8 }}>⚠️ {artsDeficit.length} article(s) vendu(s) en dessous du coût de revient</div>
              {artsDeficit.slice(0, 3).map(a => {
                const o = orders.find(x => x.ref === a.ref)
                return (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--mu)' }}>{a.nom} {o ? `(${o.cl})` : ''}</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--rd)', fontWeight: 700 }}>{dh(a.cout.marge)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CHARGES ── */}
      {activeTab === 'charges' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase' }}>
              Charges fixes mensuelles — modifiables
            </div>
            <button onClick={() => setShowAddCharge(true)} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'var(--or)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 700 }}>＋ Ajouter</button>
          </div>

          {/* Masse salariale ateliers */}
          <div style={{ background: 'rgba(155,89,182,.06)', border: '1px solid rgba(155,89,182,.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>👷</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Masse salariale — Ateliers</div>
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>{EMP.length} ouvriers production — modifiable dans Équipe</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#9B59B6' }}>{dh(MASSE_SAL_ATELIERS)}</div>
            </div>
          </div>

          {/* Masse salariale hors ateliers */}
          <div style={{ background: 'rgba(52,152,219,.06)', border: '1px solid rgba(52,152,219,.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🏢</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Masse salariale — Hors ateliers</div>
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>20 personnes — Administration, Commerciales, Logistique...</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#3498DB' }}>{dh(MASSE_SAL_HORS)}</div>
            </div>
            {HORS_ATELIERS.map(h => (
              <div key={h.cat} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: '1px solid rgba(52,152,219,.12)' }}>
                <span style={{ fontSize: 14 }}>{h.ic}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{h.cat} <span style={{ color: 'var(--mu)', fontWeight: 400 }}>({h.nb} pers.) — {h.noms}</span></div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#3498DB' }}>{dh(h.total)}</div>
              </div>
            ))}
          </div>

          {charges.map(c => (
            <div key={c.id} style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 14px', marginBottom: 7 }}>
              {editId === c.id ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>Désignation</div>
                      <input value={editNom} onChange={e => setEditNom(e.target.value)}
                        style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 7, padding: '8px 10px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>Montant (DH)</div>
                      <input type="number" min="0" value={editVal} onChange={e => setEditVal(+e.target.value)}
                        style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 7, padding: '8px 10px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}/>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditId(null)} style={{ flex: 1, padding: 8, borderRadius: 7, border: '1px solid var(--bd)', background: 'var(--c2)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>Annuler</button>
                    <button onClick={() => {
                      setCharges(prev => prev.map(x => x.id === c.id ? { ...x, nom: editNom, montant: editVal } : x))
                      setEditId(null)
                    }} style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', background: 'var(--gn)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>✅ Enregistrer</button>
                    <button onClick={() => {
                      setCharges(prev => prev.filter(x => x.id !== c.id))
                      setEditId(null)
                    }} style={{ padding: 8, borderRadius: 7, border: 'none', background: 'rgba(231,76,60,.15)', color: 'var(--rd)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>🗑</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{c.ic}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nom}</div>
                    <div style={{ fontSize: 10, color: 'var(--mu)' }}>{pct(c.montant, totalChargesFixes)}% des charges fixes</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--or)' }}>{dh(c.montant)}</div>
                  <button onClick={() => { setEditId(c.id); setEditVal(c.montant); setEditNom(c.nom) }}
                    style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid var(--bd)', background: 'var(--c2)', color: 'var(--mu)', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                </div>
              )}
            </div>
          ))}

          {/* Total */}
          <div style={{ background: 'var(--c2)', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              <span>Total charges fixes</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--or)' }}>{dh(totalChargesFixes)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--mu)' }}>
              <span>+ Masse salariale</span>
              <span style={{ fontFamily: 'monospace', color: '#9B59B6' }}>{dh(MASSE_SAL_ATELIERS)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bd)' }}>
              <span>TOTAL À COUVRIR / MOIS</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--rd)' }}>{dh(totalCharges)}</span>
            </div>
          </div>

          {/* Modal ajout charge */}
          {showAddCharge && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ background: 'var(--c1)', borderRadius: '14px 14px 0 0', padding: 20 }}>
                <div style={{ width: 32, height: 3, background: 'var(--bd)', borderRadius: 2, margin: '0 auto 16px' }}/>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Nouvelle charge fixe</div>
                {[
                  { k: 'ic', l: 'Icône', ph: '💰', t: 'text' },
                  { k: 'nom', l: 'Désignation', ph: 'Transport, Comptable...', t: 'text' },
                  { k: 'montant', l: 'Montant mensuel (DH)', ph: '0', t: 'number' },
                ].map(f => (
                  <div key={f.k} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>{f.l}</div>
                    <input type={f.t} placeholder={f.ph} value={newCharge[f.k] || ''}
                      onChange={e => setNewCharge(p => ({ ...p, [f.k]: f.t === 'number' ? +e.target.value : e.target.value }))}
                      style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 12px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}/>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                  <button onClick={() => setShowAddCharge(false)} style={{ padding: 11, borderRadius: 8, border: '1px solid var(--bd)', background: 'var(--c2)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Annuler</button>
                  <button onClick={() => {
                    if (!newCharge.nom || !newCharge.montant) return
                    setCharges(p => [...p, { id: 'c' + Date.now(), ...newCharge }])
                    setNewCharge({ nom: '', ic: '💰', montant: 0 })
                    setShowAddCharge(false)
                  }} style={{ padding: 11, borderRadius: 8, border: 'none', background: 'var(--or)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Ajouter</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ATELIERS ── */}
      {activeTab === 'ateliers' && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 10 }}>
            Coût total + rentabilité par atelier
          </div>
          {AT.map(at => {
            const c = atCout(at.id)
            if (!c.emps) return null
            const artAt = artsAvecCout.filter(a => a.at === at.id)
            const caAt = artAt.reduce((s, a) => s + (a.cout.prixVente || 0), 0)
            const margeAt = caAt - c.total
            const margePctAt = caAt > 0 ? Math.round(margeAt / caAt * 100) : null
            return (
              <div key={at.id} style={{ background: 'var(--c1)', border: `1px solid ${margePctAt !== null && margePctAt < 0 ? 'rgba(231,76,60,.35)' : 'var(--bd)'}`, borderLeft: `4px solid ${at.c}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{at.e}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: at.c }}>{at.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.emps} ouvrier{c.emps > 1 ? 's' : ''} · {artAt.length} articles suivis</div>
                  </div>
                  {margePctAt !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: margeColor(margePctAt) }}>
                        {margePctAt >= 0 ? '+' : ''}{margePctAt}%
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--mu)' }}>marge</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[
                    { l: 'Salaires', v: dh(c.sal), c: '#9B59B6' },
                    { l: 'Charges fix.', v: dh(Math.round(c.charges)), c: 'var(--or)' },
                    { l: 'Coût total/mois', v: dh(Math.round(c.total)), c: 'var(--rd)' },
                  ].map(s => (
                    <div key={s.l} style={{ background: 'var(--c2)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 2, textTransform: 'uppercase' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {caAt > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bd)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--mu)' }}>CA généré (articles suivis)</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--gn)' }}>{dh(caAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                      <span>Marge brute</span>
                      <span style={{ fontFamily: 'monospace', color: margeColor(margePctAt) }}>{dh(margeAt)}</span>
                    </div>
                  </div>
                )}
                {artAt.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 8 }}>
                    Activez les timers sur les articles de cet atelier pour calculer la rentabilité.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ARTICLES ── */}
      {activeTab === 'articles' && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 10 }}>
            Rentabilité par article
          </div>
          {artsList.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--mu)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <div>Aucun article en production</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>Ajoutez des articles dans les commandes</div>
            </div>
          )}
          {artsAvecCout.map(art => {
            const o = orders.find(x => x.ref === art.ref)
            const c = art.cout
            const hasMarge = c.prixVente > 0
            return (
              <div key={art.id} style={{
                background: 'var(--c1)', border: '1px solid var(--bd)',
                borderLeft: `4px solid ${hasMarge ? margeColor(c.margePct) : 'var(--bd)'}`,
                borderRadius: 12, padding: 13, marginBottom: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  {art.photo && <img src={art.photo} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }}/>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.nom}</div>
                    <div style={{ fontSize: 10, color: 'var(--mu)' }}>{o ? `${o.ref} · ${o.cl}` : ''}</div>
                  </div>
                  {hasMarge && (
                    <div style={{ textAlign: 'right', flexShrink: 0, background: margeBg(c.margePct), borderRadius: 8, padding: '5px 10px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: margeColor(c.margePct) }}>
                        {c.margePct !== null ? (c.margePct >= 0 ? '+' : '') + c.margePct + '%' : '—'}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--mu)' }}>marge</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginBottom: c.total > 0 ? 8 : 0 }}>
                  {[
                    { l: 'Main d\'œuvre', v: dh(c.mo), c: '#9B59B6' },
                    { l: 'Matières', v: dh(c.mat + c.achat), c: '#27AE60' },
                    { l: 'Charges', v: dh(c.charge), c: 'var(--or)' },
                    { l: 'Coût rev.', v: dh(c.total), c: 'var(--rd)' },
                  ].map(s => (
                    <div key={s.l} style={{ background: 'var(--c2)', borderRadius: 7, padding: '6px 4px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 8, color: 'var(--mu)', marginTop: 1, textTransform: 'uppercase' }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {hasMarge && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: 8, borderTop: '1px solid var(--bd)' }}>
                    <span style={{ color: 'var(--mu)' }}>Prix vente {dh(c.prixVente)} − Coût {dh(c.total)}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: margeColor(c.margePct) }}>
                      {c.marge >= 0 ? '✅ ' : '❌ '}{dh(c.marge)}
                    </span>
                  </div>
                )}
                {!hasMarge && (
                  <div style={{ fontSize: 11, color: 'var(--mu)', fontStyle: 'italic' }}>
                    Prix de vente non renseigné — entrez le prix dans la fiche article
                  </div>
                )}
                {c.heures > 0 && <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 4 }}>⏱ {c.heures}h travaillées</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

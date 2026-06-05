import React, { useState } from 'react'
import { EMP, AT, atI, ini } from '../data/employees'
import { TX_DEFAUT, CHARGE_PAR_ARTICLE } from '../data/constants'
import { useApp, useAuth } from '../store'
import { WORKFLOWS, ATELIERS_MAP, PEINTURE_ROLES, detectWorkflow, initSteps } from '../data/workflows'
import FicheProduction from './FicheProduction'

const dh = n => Math.round(n || 0).toLocaleString('fr') + ' DH'
const fD = ms => { if (!ms || ms <= 0) return '00:00:00'; const s = Math.floor(ms/1000); return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(v=>String(v).padStart(2,'0')).join(':') }
const fHM = iso => { if (!iso) return '--:--'; const d = new Date(iso); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0') }
function gid() { return Math.random().toString(36).slice(2,9) }

// Sanitisation minimale du SVG renvoyé par l'IA avant injection (anti-XSS) :
// on retire les balises script, les gestionnaires d'évènements inline (on*)
// et les URI javascript:. N'injecter QUE du contenu commençant par <svg>.
function sanitizeSvg(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const start = raw.indexOf('<svg')
  if (start === -1) return ''
  let svg = raw.slice(start)
  const end = svg.lastIndexOf('</svg>')
  if (end !== -1) svg = svg.slice(0, end + 6)
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '')
}

// AT, atI imported from employees.js

function TimerInline({ from }) {
  const [ms, setMs] = React.useState(Date.now() - new Date(from).getTime())
  React.useEffect(() => {
    const t = setInterval(() => setMs(Date.now() - new Date(from).getTime()), 1000)
    return () => clearInterval(t)
  }, [from])
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000)
  return <span style={{fontFamily:'monospace',fontSize:10,color:'var(--gn)'}}>{h>0?h+'h':''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>
}
function fH(ms) { if(!ms||ms<=0)return '0h'; const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000); return h>0?`${h}h${m>0?m+'m':''}`:`${m}m` }

function Timer({ from }) {
  const [ms, setMs] = React.useState(Date.now() - new Date(from).getTime())
  React.useEffect(() => {
    const t = setInterval(() => setMs(Date.now() - new Date(from).getTime()), 1000)
    return () => clearInterval(t)
  }, [from])
  return <span>{fD(ms)}</span>
}

// ─── CMD ─────────────────────────────────────────────────────────
export function Cmd() {
  const { orders, arts, sessions, mats, quals, setTab, setSelArt, selRef, addArt, updateArt, addSession, stopSession, addMat, delMat, saveQual } = useApp()
  const [modal, setModal] = useState(null)
  const [fNom, setFNom] = useState('')
  const [fAt, setFAt] = useState('tapissier')
  const [fQte, setFQte] = useState(1)
  const [fPrix, setFPrix] = useState(0)

  const o = orders.find(x => x.ref === selRef)
  if (!o) return <button onClick={() => setTab('orders')} style={{ padding: '8px 16px', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, color: 'var(--tx)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>← Retour</button>

  const artsList = Object.values(arts).filter(a => a.ref === o.ref)
  const done = artsList.filter(a => a.st === 'ok').length
  const totC = artsList.reduce((s,a) => { const ss = (sessions || []).filter(s2 => s2.aId === a.id && s2.end); const mo = ss.reduce((sm,s2) => sm+(+new Date(s2.end)-+new Date(s2.t0))/3600000*(EMP.find(e=>e.id===s2.eId)?.tx||TX_DEFAUT), 0); const mat = (mats[a.id]||[]).reduce((sm,m) => sm+m.q*m.p, 0); return s+mo+mat }, 0)

  const addArtLocal = () => {
    if (!fNom.trim()) return
    const id = gid()
    addArt({ id, ref: o.ref, uuid: o.uuid, nom: fNom.trim(), at: fAt, q: fQte, prix: fPrix, dim: '', photo: '', st: 'todo', emps: [], created: new Date().toISOString() })
    setModal(null); setFNom(''); setFAt('tapissier'); setFQte(1); setFPrix(0)
  }

  const ST = {todo:{l:'À faire',c:'#88889A',bg:'rgba(136,136,154,.13)'},wip:{l:'En prod.',c:'#F39C12',bg:'rgba(243,156,18,.13)'},ok:{l:'Validé ✅',c:'#2ECC71',bg:'rgba(46,204,113,.13)'},nok:{l:'Non conf',c:'#E74C3C',bg:'rgba(231,76,60,.13)'}}

  return (
    <div>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <button onClick={() => setTab('orders')} style={{ padding: '7px 12px', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, color: 'var(--tx)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--or)', marginBottom: 2 }}>{o.ref} · {o.com}</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{o.cl}</div>
          {o.tel && <div style={{ fontSize: 11, color: 'var(--mu)' }}>📞 {o.tel} {o.liv && `· 📅 ${o.liv}`}</div>}
        </div>
        {o.late && <div style={{ background: 'rgba(231,76,60,.15)', color: 'var(--rd)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>+{o.j}j</div>}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { v: dh(o.tot), l: 'Total', c: 'var(--tx)' },
          { v: dh(o.sol), l: 'Solde', c: o.sol > 0 ? 'var(--rd)' : 'var(--gn)' },
          { v: dh(totC), l: 'Coût rev.', c: 'var(--or)' },
        ].map(s => (
          <div key={s.l} style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 2, textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* CreaJit link */}
      {o.uuid && (
        <a href={`https://creajit.ma/admin/orders/${o.uuid}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(196,113,79,.08)', border: '1px solid rgba(196,113,79,.3)', borderRadius: 8, padding: '9px 12px', textDecoration: 'none', color: 'var(--or)', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          📋 Voir sur CreaJit →
        </a>
      )}

      {/* Articles header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase' }}>
          Articles ({artsList.length}/{o.nb}) · {done} validés
        </div>
        <button onClick={() => setModal('addArt')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--or)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>＋ Ajouter</button>
      </div>

      {/* Progress */}
      {artsList.length > 0 && (
        <div style={{ height: 4, background: 'var(--bd)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', borderRadius: 2, background: done === artsList.length ? 'var(--gn)' : 'var(--or)', width: (artsList.length ? done/artsList.length*100 : 0) + '%', transition: 'width .3s' }}/>
        </div>
      )}

      {artsList.length === 0 && (
        <div style={{ textAlign: 'center', padding: 28, color: 'var(--mu)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ marginBottom: 12 }}>{o.nb} article(s) à saisir</div>
        </div>
      )}

      {artsList.map(art => {
        const st = ST[art.st] || ST.todo
        const run = (sessions||[]).find(s => s.aId === art.id && s.st === 'run')
        const sessDone = (sessions||[]).filter(s => s.aId === art.id && s.end)
        const totMs = sessDone.reduce((a,s) => a + (+new Date(s.end) - +new Date(s.t0)), 0)
        const c = (sessions||[]).filter(s=>s.aId===art.id&&s.end).reduce((a,s)=>a+(+new Date(s.end)-+new Date(s.t0))/3600000*(EMP.find(e=>e.id===s.eId)?.tx||TX_DEFAUT),0) + (mats[art.id]||[]).reduce((a,m)=>a+m.q*m.p,0)
        const at = atI(art.at)
        return (
          <div key={art.id} onClick={() => { setSelArt(art.id); setTab('art') }}
            style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 13, marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${at.c}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {art.photo && <img src={art.photo} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}/>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{art.nom}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 12, background: st.bg, color: st.c }}>{st.l}</span>
                </div>
                {art.dim && <div style={{ fontSize: 11, color: 'var(--yw)', marginBottom: 2 }}>{art.dim}</div>}
                <div style={{ fontSize: 10, color: 'var(--mu)' }}>{at.e} {at.n} · Qté {art.q}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: run ? 'var(--gn)' : 'var(--mu)' }} className={run ? 'pulse' : ''}>
                  {run ? <Timer from={run.t0}/> : fD(totMs)}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--or)', marginTop: 2 }}>{dh(c)}</div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Add art modal */}
      {modal === 'addArt' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--c1)', borderRadius: '14px 14px 0 0', padding: 20 }}>
            <div style={{ width: 32, height: 3, background: 'var(--bd)', borderRadius: 2, margin: '0 auto 16px' }}/>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ajouter un article</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>Nom de l'article</div>
              <input value={fNom} onChange={e => setFNom(e.target.value)} placeholder="Canapé Cuir..."
                style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 12px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>Atelier</div>
                <select value={fAt} onChange={e => setFAt(e.target.value)} style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 8px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
                  {AT.map(a => <option key={a.id} value={a.id}>{a.e} {a.n}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>Qté</div>
                <input type="number" min="1" value={fQte} onChange={e => setFQte(+e.target.value)} style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 8px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}/>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 4 }}>Prix (DH)</div>
                <input type="number" min="0" value={fPrix} onChange={e => setFPrix(+e.target.value)} style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 8px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setModal(null)} style={{ padding: 11, borderRadius: 8, border: '1px solid var(--bd)', background: 'var(--c2)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Annuler</button>
              <button onClick={addArtLocal} disabled={!fNom.trim()} style={{ padding: 11, borderRadius: 8, border: 'none', background: 'var(--or)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ART DETAIL ──────────────────────────────────────────────────
export function ArtDetail() {
  const {
    orders, arts, sessions, mats, quals, achats,
    setTab, selArt, updateArt, addSession, stopSession,
    addMat, delMat, saveQual, addAchat,
    stepProgress, initArtSteps, startStep, stopStepSession,
    completeStep, pauseStep, resumeStep, setStepEstimate,
    pauseSession, resumeSession2, finishSession
  } = useApp()
  const { token } = useAuth()

  // ─── Local state ───────────────────────────────────────────────
  const [showFicheProd, setShowFicheProd] = useState(false) // fiche de production imprimable
  const [modal, setModal] = useState(null) // null | 'mat' | 'qual' | 'pause' | 'sur_mesure'
  const [workerSearch, setWorkerSearch] = useState('')
  const [pausingSession, setPausingSession] = useState(null)  // { stepIdx, sesId }
  const [selPauseReason, setSelPauseReason] = useState('')
  const [tick, setTick] = useState(0)
  const [workerAtFilter, setWorkerAtFilter] = useState('')
  const [workerRole, setWorkerRole] = useState(null)
  const [activeStep, setActiveStep] = useState(null) // stepIdx for current modal
  const [estH, setEstH] = useState(4)
  const [selWorker, setSelWorker] = useState('')
  const [pauseReason, setPauseReason] = useState('')
  const [fMNom, setFMNom] = useState('')
  const [fMQte, setFMQte] = useState(1)
  const [fMU, setFMU] = useState('pcs')
  const [fMP, setFMP] = useState(0)
  const [fQOk, setFQOk] = useState(true)
  const [fQPar, setFQPar] = useState('Hanane Ajdi')
  const [fQObs, setFQObs] = useState('')

  // Live timer refresh
  React.useEffect(() => {
    const t = setInterval(() => setTick(x => x+1), 1000)
    return () => clearInterval(t)
  }, [])

  const art = arts[selArt]
  if (!art) return (
    <button onClick={() => setTab('cmd')} style={{ padding:'8px 16px', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>← Retour</button>
  )

  const o = orders.find(x => x.ref === art.ref)
  const at = atI(art.at)
  const artSes = (sessions||[]).filter(s => s.aId === art.id)
  const run = artSes.find(s => s.st === 'run')
  const done = artSes.filter(s => s.end)
  const totMs = done.reduce((a,s) => a + (+new Date(s.end) - +new Date(s.t0)), 0)
  const moH = done.reduce((a,s) => a + (+new Date(s.end) - +new Date(s.t0))/3600000, 0)
  const moCost = done.reduce((a,s) => {
    const emp = EMP.find(e => e.id === s.eId)
    return a + (+new Date(s.end) - +new Date(s.t0))/3600000 * (emp ? emp.tx : TX_DEFAUT)
  }, 0)
  const matCost = (mats[art.id]||[]).reduce((a,m) => a+m.q*m.p, 0)
  const achatCost = (achats[art.id]||[]).filter(a=>a.dateR).reduce((a,x)=>a+(x.prix||0)*(x.q||1),0)
  const totCost = moCost + matCost + achatCost
  const prixVente = art.prix || 0
  const marge = prixVente > 0 ? prixVente - totCost : null
  const margePct = prixVente > 0 ? Math.round((marge/prixVente)*100) : null
  const q2 = quals[art.id]
  const matieresDispo = (mats[art.id]||[]).length > 0

  const ST = {
    todo:{l:'À faire',c:'#88889A',bg:'rgba(136,136,154,.13)'},
    wip:{l:'En production',c:'#F39C12',bg:'rgba(243,156,18,.13)'},
    ok:{l:'Validé ✅',c:'#2ECC71',bg:'rgba(46,204,113,.13)'},
    nok:{l:'Non conforme',c:'#E74C3C',bg:'rgba(231,76,60,.13)'}
  }
  const st = ST[art.st] || ST.todo

  // ─── Workflow steps ─────────────────────────────────────────────
  const steps = stepProgress[art.id] || []
  const wfKey = art.wfId
  const wf = wfKey ? WORKFLOWS[wfKey] : null

  function fH(ms) {
    if (!ms || ms <= 0) return '0h'
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000)
    return h > 0 ? `${h}h${m > 0 ? m+'m' : ''}` : `${m}m`
  }

  function fHms(ms) {
    if (!ms || ms <= 0) return '0h'
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000)
    if (h > 0) return `${h}h${m>0?m+'m':''}`
    if (m > 0) return `${m}m${s>0?s+'s':''}`
    return `${s}s`
  }

  function stepTotalMs(step) {
    return step.sessions.reduce((acc, ses) => {
      if (!ses.end) return acc + (Date.now() - new Date(ses.t0).getTime())
      return acc + (new Date(ses.end) - new Date(ses.t0))
    }, 0)
  }

  function openPause(stepIdx) {
    setActiveStep(stepIdx)
    setPauseReason('')
    setModal('pause')
  }

  function doPause() {
    if (!pauseReason) return
    pauseStep(art.id, activeStep, pauseReason)
    setModal(null); setPauseReason(''); setActiveStep(null)
  }

  // ─── Delivery date ──────────────────────────────────────────────
  const daysLeft = o && o.liv ? Math.ceil((new Date(o.liv) - new Date()) / 86400000) : null
  const isLate = daysLeft !== null && daysLeft < 0
  const isUrgent = !isLate && daysLeft !== null && daysLeft <= 3

  // ─── FICHE STATE ─────────────────────────────────────────────────
  const [showFiche, setShowFiche] = useState(false)
  const [fiche, setFiche] = useState(null)
  const [valComm, setValComm] = useState(false)
  const [valCommNom, setValCommNom] = useState('')
  const [valChef, setValChef] = useState(false)
  const [valChefNom, setValChefNom] = useState('')
  const [sketchSvg, setSketchSvg] = useState('')
  const [sketchLoading, setSketchLoading] = useState(false)
  const ficheData = fiche || art.fiche || {}
  const canLancer = valComm && valCommNom && valChef && valChefNom

  function saveFiche(key, val) {
    const nf = { ...ficheData, [key]: val }
    setFiche(nf)
    updateArt(art.id, { fiche: nf })
  }

  // Les appels IA passent par le backend (/api/ai/*) qui détient la clé
  // Anthropic — jamais exposée côté navigateur. Le token d'auth est transmis.
  async function genererSketch() {
    setSketchLoading(true)
    const ctx = `${art.nom}. L=${ficheData.longueur||'?'}cm l=${ficheData.largeur||'?'}cm H=${ficheData.hauteur||'?'}cm. Tissu:${ficheData.couleurTissu||'beige'}. Bois:${ficheData.couleurBois||'naturel'}. Accoudoirs:${ficheData.accoudoirs||'les deux'}.`
    try {
      const res = await fetch('/api/ai/sketch', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ artId: art.id, context: ctx })
      })
      if (!res.ok) throw new Error('sketch')
      const d = await res.json()
      setSketchSvg(d.svg || d.text || '')
    } catch(e) { setSketchSvg('') }
    setSketchLoading(false)
  }

  async function analyserArticle() {
    setSketchLoading(true)
    const ctx = `Article:${art.nom}. Atelier:${at.n}. CoutRevient:${Math.round(totCost)}DH. PrixVente:${prixVente}DH. Marge:${margePct}%. Matières:${matieresDispo?'ok':'MANQUANTES'}. Validation:${valComm?valCommNom:'NON'} / ${valChef?valChefNom:'NON'}.`
    try {
      const res = await fetch('/api/ai/analyze', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ artId: art.id, context: ctx })
      })
      if (!res.ok) throw new Error('analyze')
      const d = await res.json()
      setSketchSvg('ANALYSE:' + (d.text || ''))
    } catch(e) { setSketchSvg('ANALYSE:Erreur') }
    setSketchLoading(false)
  }

  return (
    <div>

      {/* ── BACK ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <button onClick={() => setTab('cmd')} style={{ padding:'7px 12px', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:12 }}>← Retour</button>
        <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:12, background:st.bg, color:st.c }}>{st.l}</span>
        <button onClick={() => setShowFicheProd(true)} style={{ marginLeft:'auto', padding:'7px 14px', background:'var(--or)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:12 }}>📄 Fiche de production</button>
      </div>

      {/* ── FICHE DE PRODUCTION (plein écran, imprimable) ── */}
      {showFicheProd && <FicheProduction artId={art.id} onClose={() => setShowFicheProd(false)} />}

      {/* ── DATE LIVRAISON ── */}
      {daysLeft !== null && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, marginBottom:12,
          background:isLate?'rgba(231,76,60,.1)':isUrgent?'rgba(241,196,15,.08)':'rgba(46,204,113,.07)',
          border:`1.5px solid ${isLate?'rgba(231,76,60,.35)':isUrgent?'rgba(241,196,15,.35)':'rgba(46,204,113,.25)'}` }}>
          <span style={{ fontSize:18 }}>{isLate?'🔴':isUrgent?'🟡':'📅'}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'var(--mu)', textTransform:'uppercase' }}>Date de livraison</div>
            <div style={{ fontSize:14, fontWeight:800, color:isLate?'var(--rd)':isUrgent?'var(--yw)':'var(--gn)' }}>
              {new Date(o.liv).toLocaleDateString('fr',{weekday:'short',day:'2-digit',month:'short'})}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'monospace', fontSize:24, fontWeight:900, color:isLate?'var(--rd)':isUrgent?'var(--yw)':'var(--gn)', lineHeight:1 }}>
              {isLate?'+':''}{Math.abs(daysLeft)}
            </div>
            <div style={{ fontSize:9, color:'var(--mu)' }}>{isLate?'j retard':'j restants'}</div>
          </div>
        </div>
      )}

      {/* ── 3 COLONNES PHOTO + RECAP + CREAJIT ── */}
      <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 1fr', gap:8, marginBottom:12 }}>
        <div>
          {art.photo ? <img src={art.photo} alt="" style={{ width:120, height:120, objectFit:'cover', borderRadius:10, border:'2px solid var(--bd)', display:'block' }}/> :
            <div style={{ width:120, height:120, background:'var(--c2)', borderRadius:10, border:'2px dashed var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{at.e}</div>}
          <div style={{ marginTop:4, textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:800 }}>{art.nom}</div>
            <div style={{ fontSize:9, color:'var(--mu)' }}>{o?.ref} · {o?.cl}</div>
          </div>
        </div>
        <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:10, padding:9 }}>
          <div style={{ fontSize:8, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:5 }}>Récap production</div>
          {[
            {l:'Atelier', v:at.e+' '+at.n, c:at.c},
            {l:'Statut', v:st.l, c:st.c},
            {l:'Temps', v:fD(totMs), c:'var(--tx)'},
            {l:'Main œuvre', v:moH.toFixed(1)+'h · '+dh(moCost), c:'#9B59B6'},
            {l:'Matières', v:dh(matCost+achatCost), c:'#27AE60'},
            {l:'Coût rev.', v:dh(totCost), c:'var(--or)'},
            prixVente>0 ? {l:'Prix vente', v:dh(prixVente), c:'var(--gn)'} : null,
            margePct!==null ? {l:'Marge', v:(margePct>=0?'+':'')+margePct+'% · '+dh(marge), c:margePct>=20?'var(--gn)':margePct>=0?'var(--yw)':'var(--rd)'} : null,
          ].filter(Boolean).map(r => (
            <div key={r.l} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 0', borderBottom:'.5px solid var(--bd)' }}>
              <span style={{ fontSize:9, color:'var(--mu)', width:68, flexShrink:0 }}>{r.l}</span>
              <span style={{ fontSize:10, fontWeight:700, color:r.c, fontFamily:'monospace' }}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(196,113,79,.05)', border:'1px solid rgba(196,113,79,.25)', borderRadius:10, padding:9 }}>
          <div style={{ fontSize:8, fontWeight:700, color:'var(--or)', textTransform:'uppercase', marginBottom:5 }}>📋 Infos CreaJit</div>
          {art.dim && <div style={{ marginBottom:4, padding:'4px 6px', background:'rgba(241,196,15,.1)', border:'1px solid rgba(241,196,15,.2)', borderRadius:5 }}>
            <div style={{ fontSize:8, color:'var(--yw)', marginBottom:1 }}>VARIANTES</div>
            <div style={{ fontSize:10, fontWeight:700 }}>{art.dim}</div>
          </div>}
          {art.cjNotes && (() => {
            const lines = art.cjNotes.split('\n').map(l=>l.trim()).filter(Boolean)
            return <div>
              <div style={{ marginBottom:4, padding:'4px 6px', background:'rgba(52,152,219,.08)', border:'1px solid rgba(52,152,219,.2)', borderRadius:5 }}>
                <div style={{ fontSize:8, color:'var(--bl)', marginBottom:1 }}>NOTE</div>
                <div style={{ fontSize:10, fontWeight:700 }}>{lines[0]}</div>
              </div>
              {lines.slice(1).length > 0 && <div style={{ padding:'4px 6px', background:'rgba(155,89,182,.08)', border:'1px solid rgba(155,89,182,.2)', borderRadius:5 }}>
                <div style={{ fontSize:8, color:'#9B59B6', marginBottom:1 }}>INTERNE</div>
                {lines.slice(1).map((l,i) => <div key={i} style={{ fontSize:10, fontWeight:700 }}>{l}</div>)}
              </div>}
            </div>
          })()}
          {!art.dim && !art.cjNotes && <div style={{ fontSize:10, color:'var(--mu)', textAlign:'center', paddingTop:8 }}>Pas de notes CreaJit</div>}
        </div>
      </div>

      {/* ── FICHE TECHNIQUE (collapsible) ── */}
      <div style={{ background:showFiche?'var(--c1)':'rgba(196,113,79,.04)', border:`1.5px solid ${showFiche?'#C4714F':'rgba(196,113,79,.3)'}`, borderRadius:12, marginBottom:12, overflow:'hidden' }}>
        <button onClick={() => setShowFiche(!showFiche)} style={{ width:'100%', padding:'12px 14px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontFamily:'inherit' }}>
          <span style={{ fontSize:16 }}>📐</span>
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:700, color:showFiche?'#C4714F':'var(--tx)' }}>Fiche technique</div>
            <div style={{ fontSize:10, color:'var(--mu)', marginTop:1 }}>{showFiche ? 'Cliquer pour fermer' : 'À remplir par la commerciale — cliquer pour ouvrir'}</div>
          </div>
          {(() => { const f=['longueur','largeur','hauteur','couleurTissu','couleurBois']; const n=f.filter(k=>ficheData[k]).length; return n>0?<span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20, background:n===f.length?'rgba(46,204,113,.15)':'rgba(196,113,79,.15)', color:n===f.length?'var(--gn)':'var(--or)' }}>{n}/{f.length} remplis</span>:null })()}
          <span style={{ fontSize:16, color:'var(--mu)', transform:showFiche?'rotate(180deg)':'none', transition:'transform .2s' }}>▾</span>
        </button>

        {showFiche && (
          <div style={{ padding:'0 12px 12px', borderTop:'1px solid rgba(196,113,79,.2)' }}>

            {/* ── DIMENSIONS 6 champs sur 1 ligne ── */}
            <div style={{ marginTop:10, marginBottom:8 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Dimensions (cm)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5 }}>
                {[{k:'longueur',l:'Long.'},{k:'largeur',l:'Larg.'},{k:'hauteur',l:'Haut.'},{k:'profAssise',l:'Prof. assise'},{k:'hauteurPied',l:'Haut. pied'},{k:'largeurDossier',l:'Larg. dossier'}].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:2 }}>{f.l}</div>
                    <input type="text" value={ficheData[f.k]||''} onChange={e => saveFiche(f.k, e.target.value)} placeholder="—"
                      style={{ width:'100%', background:'var(--c2)', border:`1px solid ${ficheData[f.k]?'var(--gn)':'var(--bd)'}`, borderRadius:5, padding:'4px 6px', color:ficheData[f.k]?'var(--gn)':'var(--tx)', fontSize:12, outline:'none', fontFamily:'monospace', textAlign:'center' }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* ── COULEURS 3 champs sur 1 ligne ── */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Couleurs & matières</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                {[{k:'couleurTissu',l:'Tissu / réf. couleur',ph:'ex: Velours beige #F5E6D3'},{k:'couleurBois',l:'Bois / métal',ph:'ex: Noyer foncé'},{k:'couleurBaguette',l:'Baguette / liseré',ph:'—'}].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:2 }}>{f.l}</div>
                    <input value={ficheData[f.k]||''} onChange={e => saveFiche(f.k, e.target.value)} placeholder={f.ph}
                      style={{ width:'100%', background:'var(--c2)', border:`1px solid ${ficheData[f.k]?'var(--gn)':'var(--bd)'}`, borderRadius:5, padding:'4px 7px', color:ficheData[f.k]?'var(--gn)':'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FINITION + ACCOUDOIRS sur 1 ligne ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:4 }}>Finition</div>
                <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                  {['Mat','Brillant','Satin','Vieilli','Naturel'].map(opt => (
                    <button key={opt} onClick={() => saveFiche('finition', ficheData.finition===opt?null:opt)}
                      style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${ficheData.finition===opt?'#C4714F':'var(--bd)'}`, background:ficheData.finition===opt?'rgba(196,113,79,.15)':'var(--c2)', color:ficheData.finition===opt?'#C4714F':'#94A3B8', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:4 }}>Accoudoirs</div>
                <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                  {['Aucun','Gauche','Droit','Les deux'].map(opt => (
                    <button key={opt} onClick={() => saveFiche('accoudoirs', ficheData.accoudoirs===opt?null:opt)}
                      style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${ficheData.accoudoirs===opt?'#C4714F':'var(--bd)'}`, background:ficheData.accoudoirs===opt?'rgba(196,113,79,.15)':'var(--c2)', color:ficheData.accoudoirs===opt?'#C4714F':'#94A3B8', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── BOMBAGE + COUTURE sur 1 ligne ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:4 }}>Bombage</div>
                <div style={{ display:'flex', gap:3 }}>
                  {['Sans bombage','Avec bombage'].map(opt => (
                    <button key={opt} onClick={() => saveFiche('bombage', ficheData.bombage===opt?null:opt)}
                      style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${ficheData.bombage===opt?'#C4714F':'var(--bd)'}`, background:ficheData.bombage===opt?'rgba(196,113,79,.15)':'var(--c2)', color:ficheData.bombage===opt?'#C4714F':'#94A3B8', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:4 }}>Couture</div>
                <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                  {['Couture simple','Couture spéciale'].map(opt => (
                    <button key={opt} onClick={() => saveFiche('couture', ficheData.couture===opt?null:opt)}
                      style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${ficheData.couture===opt?'#C4714F':'var(--bd)'}`, background:ficheData.couture===opt?'rgba(196,113,79,.15)':'var(--c2)', color:ficheData.couture===opt?'#C4714F':'#94A3B8', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                      {opt}
                    </button>
                  ))}
                </div>
                {ficheData.couture === 'Couture spéciale' && (
                  <input value={ficheData.coutureDetail||''} onChange={e => saveFiche('coutureDetail', e.target.value)} placeholder="Préciser la couture spéciale..."
                    style={{ width:'100%', marginTop:4, background:'var(--c2)', border:'1px solid var(--bd)', color:'var(--tx)', borderRadius:5, padding:'5px 8px', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
                )}
              </div>
            </div>

            {/* ── COUSSINS ── */}
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:3 }}>Nombre de coussins</div>
                  <input type="number" min="0" max="12" value={ficheData.nbCoussins||''} onChange={e => saveFiche('nbCoussins', e.target.value)} placeholder="ex: 4"
                    style={{ width:'100%', background:'var(--c2)', border:`1px solid ${ficheData.nbCoussins?'var(--gn)':'var(--bd)'}`, borderRadius:5, padding:'4px 7px', color:ficheData.nbCoussins?'var(--gn)':'var(--tx)', fontSize:12, outline:'none', fontFamily:'monospace' }}/>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:4 }}>Taille par défaut</div>
                  <div style={{ display:'flex', gap:3 }}>
                    {['Petit','Moyen','Grand','Rectangle'].map(opt => (
                      <button key={opt} onClick={() => saveFiche('tailleCoussinDef', ficheData.tailleCoussinDef===opt?null:opt)}
                        style={{ padding:'4px 8px', borderRadius:20, border:`1px solid ${ficheData.tailleCoussinDef===opt?'#C4714F':'var(--bd)'}`, background:ficheData.tailleCoussinDef===opt?'rgba(196,113,79,.15)':'var(--c2)', color:ficheData.tailleCoussinDef===opt?'#C4714F':'#94A3B8', cursor:'pointer', fontSize:10, fontWeight:700, fontFamily:'inherit' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Lignes par coussin */}
              {Array.from({length: Math.min(parseInt(ficheData.nbCoussins)||0, 12)}).map((_,i) => {
                const ck = `coussin${i}`
                const cv = ficheData[ck] || {}
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr', gap:5, marginBottom:4, background:'var(--c2)', borderRadius:6, padding:'6px 10px', border:'1px solid var(--bd)', alignItems:'center' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#C4714F' }}>Coussin {i+1}</div>
                    <div style={{ display:'flex', gap:2 }}>
                      {['Petit','Moyen','Grand','Rect.'].map(opt => (
                        <button key={opt} onClick={() => saveFiche(ck, {...cv, taille:opt})}
                          style={{ padding:'4px 8px', borderRadius:20, border:`1px solid ${cv.taille===opt?'#C4714F':'var(--bd)'}`, background:cv.taille===opt?'rgba(196,113,79,.15)':'transparent', color:cv.taille===opt?'#C4714F':'#94A3B8', cursor:'pointer', fontSize:10, fontWeight:700, fontFamily:'inherit' }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input value={cv.dims||''} onChange={e => saveFiche(ck, {...cv, dims:e.target.value})} placeholder="L × H (cm)"
                      style={{ background:'var(--c1)', border:'1px solid var(--bd)', color:'var(--tx)', borderRadius:4, padding:'3px 6px', fontSize:11, outline:'none', fontFamily:'monospace' }}/>
                    <input value={cv.note||''} onChange={e => saveFiche(ck, {...cv, note:e.target.value})} placeholder="couleur, tissu..."
                      style={{ background:'var(--c1)', border:'1px solid var(--bd)', color:'var(--tx)', borderRadius:4, padding:'3px 6px', fontSize:11, outline:'none', fontFamily:'inherit' }}/>
                  </div>
                )
              })}
            </div>

            {/* ── NOTE LIBRE ── */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:3 }}>Note / option spéciale</div>
              <input value={ficheData.notes||''} onChange={e => saveFiche('notes', e.target.value)} placeholder="Pieds chromés, surpiqûre visible, tissu endroit, option client..."
                style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', color:'var(--tx)', borderRadius:5, padding:'4px 8px', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
            </div>

            {/* ── IA ── */}
            <div style={{ borderTop:'1px solid var(--bd)', paddingTop:8, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, fontWeight:700 }}>🤖 IA</span>
              <button onClick={genererSketch} disabled={sketchLoading} style={{ padding:'4px 9px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:10, fontWeight:700, background:'rgba(52,152,219,.12)', color:'var(--bl)' }}>{sketchLoading?'⟳':'✏️ Dessiner'}</button>
              <button onClick={analyserArticle} disabled={sketchLoading} style={{ padding:'4px 9px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:10, fontWeight:700, background:'rgba(231,76,60,.08)', color:'var(--rd)' }}>{sketchLoading?'⟳':'🔍 Analyser'}</button>
            </div>
            {sketchSvg && !sketchSvg.startsWith('ANALYSE:') && <div style={{ background:'#1F1F26', borderRadius:8, padding:8, marginTop:8, overflow:'hidden' }} dangerouslySetInnerHTML={{__html:sanitizeSvg(sketchSvg)}}/>}
            {sketchSvg && sketchSvg.startsWith('ANALYSE:') && <div style={{ background:'rgba(231,76,60,.06)', border:'1px solid rgba(231,76,60,.2)', borderRadius:8, padding:10, marginTop:8, fontSize:12, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{sketchSvg.replace('ANALYSE:','')}</div>}
          </div>
        )}
      </div>

      {/* ── VALIDATION AVANT LANCEMENT + MESURES ── */}
      <div style={{ background:'var(--c1)', border:`1px solid ${canLancer?'rgba(46,204,113,.4)':'var(--bd)'}`, borderRadius:12, padding:14, marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>✅ Validation avant lancement</div>

        {/* Mesures prises par */}
        <div style={{ background:'rgba(196,113,79,.05)', border:'1px solid rgba(196,113,79,.2)', borderRadius:10, padding:10, marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--or)', marginBottom:8 }}>📐 Mesures</div>

          {/* Mesures prises par */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'var(--mu)', marginBottom:4 }}>Mesures prises par</div>
            <select value={ficheData.mesuresPrisesParNom||''} onChange={e => saveFiche('mesuresPrisesParNom', e.target.value)}
              style={{ width:'100%', background:'var(--c2)', border:`1px solid ${ficheData.mesuresPrisesParNom?'var(--gn)':'var(--bd)'}`, borderRadius:7, padding:'7px 10px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
              <option value="">— Sélectionner —</option>
              {['Kenza Mokhantar','Ikram Benaddi','Laila Boudil','Hanane Ajdi','Driss Aarab'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {ficheData.mesuresPrisesParNom && (
              <div style={{ fontSize:9, color:'var(--gn)', marginTop:3, fontWeight:600 }}>✅ Mesures prises par {ficheData.mesuresPrisesParNom}</div>
            )}
          </div>

          {/* Mesures données par le client */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'var(--mu)', marginBottom:4 }}>Mesures données par le client</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
              {[['mesCliL','L (cm)'],['mesCliLa','la (cm)'],['mesCliH','H (cm)'],['mesCliProf','Prof. (cm)'],['mesCliAutre','Autre (cm)']].map(([k,l]) => (
                <div key={k}>
                  <div style={{ fontSize:9, color:'var(--mu)', marginBottom:2 }}>{l}</div>
                  <input type="number" value={ficheData[k]||''} onChange={e => saveFiche(k, e.target.value)} placeholder="0"
                    style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:6, padding:'5px 6px', color:'var(--tx)', fontSize:11, outline:'none', fontFamily:'monospace', textAlign:'center' }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Upload fiche mesures signée */}
          <div>
            <div style={{ fontSize:10, color:'var(--mu)', marginBottom:4 }}>📎 Fiche mesures signée par le client</div>
            {ficheData.ficheMesureUrl ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(46,204,113,.06)', border:'1px solid rgba(46,204,113,.2)', borderRadius:7, padding:'7px 10px' }}>
                <span style={{ fontSize:13 }}>📄</span>
                <span style={{ fontSize:11, color:'var(--gn)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ficheData.ficheMesureNom||'Document signé'}</span>
                <button onClick={() => { saveFiche('ficheMesureUrl',null); saveFiche('ficheMesureNom',null) }}
                  style={{ background:'none', border:'none', color:'var(--rd)', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            ) : (
              <label style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(196,113,79,.04)', border:'1.5px dashed rgba(196,113,79,.3)', borderRadius:7, padding:'8px 10px', cursor:'pointer' }}>
                <span style={{ fontSize:13 }}>📤</span>
                <span style={{ fontSize:11, color:'var(--or)' }}>Télécharger la fiche signée (PDF, JPG, PNG)</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => { saveFiche('ficheMesureUrl', ev.target.result); saveFiche('ficheMesureNom', file.name) }
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}/>
              </label>
            )}
          </div>
        </div>

        {/* Validations commerciale + chef atelier */}
        {[
          {val:valComm, setVal:setValComm, nom:valCommNom, setNom:setValCommNom, label:'Commerciale — confirme les specs', sub:'Dimensions, couleurs et options correctes', icon:'👩', names:['Kenza Mokhantar','Ikram Benaddi','Laila Boudil','Hanane Ajdi','Driss Aarab']},
          {val:valChef, setVal:setValChef, nom:valChefNom, setNom:setValChefNom, label:'Chef atelier — peut produire', sub:'Spécifications comprises, matières OK', icon:'👷', names:['Hanane Ajdi','Ayoub El Yagiz','Ahmed El Araji','Said Chnitifa','Noureddine Ouzzat','Mohamed Elkarmani','Mohamed Boualili','Driss Aarab']},
        ].map((v,i) => (
          <div key={i} style={{ padding:'10px 0', borderBottom:i===0?'1px solid var(--bd)':'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:v.val&&!v.nom?6:0 }}>
              <button onClick={() => { v.setVal(!v.val); if(v.val) v.setNom('') }} style={{ width:28, height:28, borderRadius:7, border:`2px solid ${v.val?'var(--gn)':'var(--bd)'}`, background:v.val?'rgba(46,204,113,.15)':'var(--c2)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{v.val?'✅':''}</button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{v.label}</div>
                <div style={{ fontSize:10, color:'var(--mu)' }}>{v.sub}</div>
              </div>
              {v.val && v.nom ? <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(46,204,113,.1)', border:'1px solid rgba(46,204,113,.3)', borderRadius:8, padding:'3px 10px' }}><span>{v.icon}</span><span style={{ fontSize:11, fontWeight:700, color:'var(--gn)' }}>{v.nom}</span></div> : <span style={{ fontSize:10, color:v.val?'var(--yw)':'var(--mu)' }}>{v.val?'Sélectionner ↓':'En attente'}</span>}
            </div>
            {v.val && !v.nom && (
              <div style={{ marginLeft:38 }}>
                <select value={v.nom} onChange={e => v.setNom(e.target.value)} style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--yw)', borderRadius:7, padding:'7px 10px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit' }}>
                  <option value="">— Sélectionner —</option>
                  {v.names.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
        {canLancer
          ? <div style={{ marginTop:10, padding:10, background:'rgba(46,204,113,.06)', borderRadius:8, fontSize:11, color:'var(--gn)', textAlign:'center', fontWeight:700 }}>✅ Validé — Workflow peut démarrer</div>
          : <div style={{ marginTop:10, padding:10, background:'rgba(136,136,154,.08)', borderRadius:8, fontSize:11, color:'var(--mu)', textAlign:'center' }}>Les 2 validations requises pour lancer</div>
        }
      </div>

      {/* ── ALERTES ATELIER ── */}
      {(() => {
        const allSessions = Object.entries(stepProgress).filter(([id]) => id === art.id).flatMap(([,steps]) =>
          (steps||[]).flatMap((step, si) => step.sessions.map(ses => ({ses, step, si})))
        )
        const alertes = []
        allSessions.forEach(({ses, step, si}) => {
          if (!ses.pausedAt) return
          const pauseMs = Date.now() - new Date(ses.pausedAt).getTime()
          const PAUSE_COL = {
            'Manque de marchandise':'#EA580C','Matière non reçue':'#EA580C',
            'Outil en panne':'#DC2626','Autre atelier prioritaire':'#7C3AED','Fin de journée':'#64748B'
          }
          const col = PAUSE_COL[ses.pauseReason] || '#D97706'
          alertes.push({ ses, step, si, pauseMs, col })
        })
        // Dépassements
        allSessions.forEach(({ses, step, si}) => {
          if (ses.end || ses.pausedAt) return
          const workMs = Date.now() - new Date(ses.t0).getTime() - (ses.totalPauseMs||0)
          const estMs = (ses.estimatedH||step.estH||4)*3600000
          if (workMs > estMs) alertes.push({ ses, step, si, overMs: workMs - estMs, col:'#DC2626', isOver:true })
        })
        if (alertes.length === 0) return null
        return (
          <div style={{ marginBottom:10 }}>
            {alertes.map((a, ai) => (
              <div key={ai} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:9, marginBottom:5, background:`${a.col}10`, border:`.5px solid ${a.col}44`, borderLeft:`3px solid ${a.col}` }}>
                <span style={{ fontSize:14 }}>{a.isOver ? '⏱️' : '⏸'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:a.col }}>
                    {a.isOver
                      ? `Dépassement — ${a.ses.empN.split(' ')[0]} · Étape ${a.si+1} · +${fHms(a.overMs)}`
                      : `Pause ${a.pauseMs > 3600000 ? '⚠️ +1h' : ''} — ${a.ses.empN.split(' ')[0]} · ${a.ses.pauseReason}`}
                  </div>
                  <div style={{ fontSize:9, color:'var(--mu)' }}>
                    {a.isOver ? `Estimation dépassée — revoir la charge de travail`
                      : `En pause depuis ${fHms(a.pauseMs)} · Étape ${a.si+1} — ${a.step.nom}`}
                  </div>
                </div>
                {a.ses && !a.isOver && !a.ses.end && a.ses.pausedAt && (
                  <button onClick={() => resumeSession2(art.id, a.si, a.ses.id)} style={{ padding:'4px 9px', borderRadius:6, border:'.5px solid rgba(22,163,74,.4)', background:'rgba(22,163,74,.06)', color:'var(--gn)', cursor:'pointer', fontFamily:'inherit', fontSize:10, fontWeight:700 }}>▶ Reprendre</button>
                )}
              </div>
            ))}
          </div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── WORKFLOW FABRICATION MULTI-ATELIERS ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>

        {/* Header + sélecteur famille */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:wf?10:12 }}>
          <span style={{ fontSize:16 }}>{wf?wf.icon:'⚙️'}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>Workflow fabrication</div>
            <div style={{ fontSize:10, color:'var(--mu)' }}>
              {wf?`${wf.nom} · ${steps.filter(s=>s.status==='done').length}/${steps.length} étapes`:'Sélectionner le type de produit'}
            </div>
          </div>
          {wf && <button onClick={() => { updateArt(art.id,{wfId:null}); initArtSteps(art.id,[]) }}
            style={{ fontSize:9, padding:'2px 8px', borderRadius:20, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--mu)', cursor:'pointer', fontFamily:'inherit' }}>Changer</button>}
        </div>

        {!wfKey && (
          <div>
            <select onChange={e => {
              if (!e.target.value) return
              if (e.target.value==='sur_mesure') { setModal('sur_mesure'); return }
              const s = initSteps(e.target.value)
              initArtSteps(art.id, s); updateArt(art.id, { wfId: e.target.value })
            }} defaultValue="" style={{ width:'100%', background:'var(--c2)', border:'1.5px solid var(--or)', borderRadius:9, padding:'11px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer', marginBottom:8 }}>
              <option value="">— Choisir le type de produit —</option>
              <optgroup label="🛋️ Salon">{[['canape','🛋️ Canapé / Banquette'],['fauteuil','💺 Fauteuil'],['chaise_bois','🪑 Chaise bois'],['chaise_metal','🔩 Chaise métal'],['transat','🏖️ Transat']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</optgroup>
              <optgroup label="🪨 Tables">{[['table_travertin','🪨 Table travertin'],['table_basse','☕ Table basse'],['table_ceram','🟫 Table céramique'],['table_bois','🪵 Table bois']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</optgroup>
              <optgroup label="🛏️ Chambre"><option value="lit">🛏️ Lit / Tête de lit</option></optgroup>
              <optgroup label="🎨 Déco">{[['tableau_bois','🖼️ Tableau bois'],['tableau_metal','🪞 Tableau métal'],['cuivre','🟡 Cuivre'],['resine','🧪 Résine']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</optgroup>
              <optgroup label="🌿 Jardin"><option value="pergola">⛱️ Pergola</option></optgroup>
              <option value="sur_mesure">✏️ Nouveau produit sur mesure</option>
            </select>
            <button onClick={() => { const k=detectWorkflow(art.nom); if(k){initArtSteps(art.id,initSteps(k));updateArt(art.id,{wfId:k})} else alert('Famille non détectée') }}
              style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid rgba(52,152,219,.3)', background:'rgba(52,152,219,.06)', color:'var(--bl)', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:600 }}>
              🤖 Détecter automatiquement pour "{art.nom}"
            </button>
          </div>
        )}

        {/* ── ÉTAPES ── */}
        {wf && steps.map((step, stepIdx) => {
          const stepAt = ATELIERS_MAP[step.at] || {}
          const isDone = step.status === 'done'
          const isExpanded = activeStep === stepIdx

          // Sessions actives (pas terminées)
          const runningSes = step.sessions.filter(s => !s.end && !s.pausedAt)
          const pausedSes  = step.sessions.filter(s => !s.end && s.pausedAt)
          const doneSes    = step.sessions.filter(s => s.end)
          const hasSessions = step.sessions.length > 0

          // Coût MO de cette étape (temps réel)
          const stepCoutMO = step.sessions.reduce((acc, ses) => {
            const emp = EMP.find(e => e.id === ses.eId)
            const rate = emp ? emp.tx : TX_DEFAUT
            let pMs = ses.totalPauseMs||0
            let raw = 0
            if (ses.end) raw = new Date(ses.end) - new Date(ses.t0) - pMs
            else if (ses.pausedAt) raw = new Date(ses.pausedAt) - new Date(ses.t0) - pMs
            else raw = Date.now() - new Date(ses.t0) - pMs
            return acc + Math.max(0, raw/3600000) * rate
          }, 0)

          const leftColor = isDone ? 'var(--gn)' : runningSes.length>0 ? (stepAt.color||'var(--or)') : pausedSes.length>0 ? 'var(--yw)' : 'rgba(196,113,79,.4)'

          return (
            <div key={stepIdx} style={{ border:'.5px solid var(--bd)', borderLeft:`4px solid ${leftColor}`, borderRadius:10, padding:'10px 12px', marginBottom:6 }}>

              {/* Header étape */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:hasSessions?8:0 }}>
                <span style={{ fontSize:18 }}>{step.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:stepAt.color||'var(--tx)' }}>Étape {stepIdx+1} — {stepAt.nom||step.at}</div>
                  <div style={{ fontSize:10, color:'var(--mu)' }}>{step.nom}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                  {isDone && <span style={{ fontSize:10, fontWeight:700, color:'var(--gn)' }}>✅ {dh(stepCoutMO)}</span>}
                  {runningSes.length>0 && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:20, background:'rgba(46,204,113,.12)', color:'var(--gn)', fontWeight:700 }}>🟢 {runningSes.length} actif{runningSes.length>1?'s':''}</span>}
                  {pausedSes.length>0 && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:20, background:'rgba(241,196,15,.12)', color:'var(--yw)', fontWeight:700 }}>⏸ {pausedSes.length}</span>}
                  {!isDone && <button onClick={() => setActiveStep(isExpanded?null:stepIdx)} style={{ fontSize:9, padding:'2px 8px', borderRadius:20, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--mu)', cursor:'pointer', fontFamily:'inherit' }}>
                    {isExpanded?'✕':'+ Ouvrier'}
                  </button>}
                  {(runningSes.length>0||pausedSes.length>0) && <button onClick={() => { completeStep(art.id, stepIdx); setActiveStep(null) }} style={{ fontSize:9, padding:'2px 8px', borderRadius:20, border:'1px solid rgba(46,204,113,.3)', background:'rgba(46,204,113,.06)', color:'var(--gn)', cursor:'pointer', fontFamily:'inherit' }}>✅ Terminer étape</button>}
                </div>
              </div>

              {/* Ligne ajout ouvrier (quand ouvert) */}
              {!isDone && isExpanded && (
                <div style={{ background:'var(--c2)', borderRadius:8, padding:8, marginBottom:8 }}>
                  {/* Sous-rôles peinture */}
                  {step.sousRoles && (
                    <div style={{ display:'flex', gap:5, marginBottom:7 }}>
                      {PEINTURE_ROLES.map(r => (
                        <button key={r.id} onClick={() => setWorkerRole(workerRole===r.id?null:r.id)} style={{ flex:1, padding:'5px', borderRadius:7, border:`1.5px solid ${workerRole===r.id?'var(--or)':'var(--bd)'}`, cursor:'pointer', fontFamily:'inherit', fontSize:10, fontWeight:700, background:workerRole===r.id?'rgba(196,113,79,.12)':'var(--c1)', color:workerRole===r.id?'var(--or)':'var(--tx)' }}>{r.icon} {r.label}</button>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                    {/* Recherche ouvrier */}
                    <div style={{ flex:1, position:'relative' }}>
                      <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--mu)' }}>🔍</span>
                      <input value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Rechercher ouvrier..."
                        style={{ width:'100%', background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:7, padding:'6px 6px 6px 24px', color:'var(--tx)', fontSize:11, outline:'none', fontFamily:'inherit' }}/>
                    </div>
                    {/* Estimation */}
                    <input type="number" min="0.5" step="0.5" value={estH} onChange={e => setEstH(+e.target.value||1)}
                      style={{ width:48, background:'var(--c1)', border:'1.5px solid var(--or)', borderRadius:7, padding:'6px 4px', color:'var(--or)', fontSize:12, outline:'none', fontFamily:'monospace', fontWeight:700, textAlign:'center' }}/>
                    <span style={{ fontSize:10, color:'var(--mu)', flexShrink:0 }}>h est.</span>
                  </div>

                  {/* Filtre atelier */}
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap', margin:'6px 0' }}>
                    {['','tapissier','menuisier','ferronier','peinture','pierre','cuivre','cnc','resine'].map(k => (
                      <button key={k} onClick={() => setWorkerAtFilter(k)} style={{ padding:'2px 7px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:9, fontWeight:700, background:workerAtFilter===k?'var(--or)':'var(--c1)', color:workerAtFilter===k?'#fff':'var(--mu)' }}>
                        {k===''?'Tous':(ATELIERS_MAP[k]?.nom||k)}
                      </button>
                    ))}
                  </div>

                  {/* Liste ouvriers */}
                  <div style={{ maxHeight:160, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
                    {EMP.filter(e => {
                      const q = workerSearch.toLowerCase()
                      const matchSearch = !q || e.n.toLowerCase().includes(q) || atI(e.at).n.toLowerCase().includes(q)
                      const matchAt = !workerAtFilter || e.at === workerAtFilter
                      const alreadyActive = step.sessions.some(s => s.eId===e.id && !s.end)
                      return matchSearch && matchAt && !alreadyActive
                    }).map(e => {
                      const busy = Object.values(stepProgress).some(sps => sps && sps.some(sp => sp.sessions && sp.sessions.some(ses => ses.eId===e.id && !ses.end)))
                      const isSelW = selWorker === e.id
                      const empAt = atI(e.at)
                      return (
                        <div key={e.id} onClick={() => !busy ? setSelWorker(isSelW?'':e.id) : null}
                          style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 8px', borderRadius:7, border:`1.5px solid ${isSelW?'var(--gn)':busy?'rgba(231,76,60,.15)':'var(--bd)'}`, background:isSelW?'rgba(46,204,113,.06)':'var(--c1)', cursor:busy?'not-allowed':'pointer' }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', background:`${empAt.c}22`, color:empAt.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>{empAt.e}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:11, fontWeight:isSelW?700:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.n}</div>
                            <div style={{ fontSize:9, color:empAt.c }}>{empAt.n} · {e.tx} DH/h</div>
                          </div>
                          {busy ? <span style={{ fontSize:9, color:'var(--rd)', fontWeight:700 }}>🔴</span>
                            : isSelW ? <span style={{ fontSize:13 }}>✅</span>
                            : <span style={{ fontSize:9, color:'var(--mu)', fontFamily:'monospace' }}>{dh(estH*e.tx)}</span>}
                        </div>
                      )
                    })}
                  </div>

                  <button onClick={() => {
                    const emp = EMP.find(e => e.id === selWorker)
                    if (!emp) return
                    const now = new Date()
                    const launchLabel = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}h${String(now.getMinutes()).padStart(2,'0')}`
                    const session = { id:Math.random().toString(36).slice(2), eId:selWorker, empN:emp.n,
                      role:workerRole&&step.sousRoles?(PEINTURE_ROLES.find(r=>r.id===workerRole)?.label||null):null,
                      t0:now.toISOString(), end:null, estimatedH:estH,
                      pausedAt:null, pauseReason:'', totalPauseMs:0, pauses:[], launchLabel }
                    startStep(art.id, stepIdx, session)
                    setStepEstimate(art.id, stepIdx, estH)
                    setSelWorker(''); setActiveStep(null); setWorkerSearch(''); setWorkerRole(null)
                  }} disabled={!selWorker}
                    style={{ width:'100%', marginTop:7, padding:'8px', borderRadius:8, border:'none', background:selWorker?'var(--gn)':'var(--bd)', color:'#fff', cursor:selWorker?'pointer':'not-allowed', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>
                    {selWorker ? `🔨 Lancer ${EMP.find(e=>e.id===selWorker)?.n.split(' ')[0]} — est. ${estH}h — coût ~${dh(estH*(EMP.find(e=>e.id===selWorker)?.tx||28))}` : 'Sélectionner un ouvrier ↑'}
                  </button>
                </div>
              )}

              {/* ── LIGNES PAR OUVRIER ── */}
              {step.sessions.map((ses) => {
                const emp = EMP.find(e => e.id === ses.eId)
                const rate = emp ? emp.tx : TX_DEFAUT
                const initials = ses.empN.split(' ').map(p=>p[0]||'').join('').toUpperCase().slice(0,2)
                const empAt2 = emp ? atI(emp.at) : { c:'#888', e:'👷', n:'' }

                const isRunning = !ses.end && !ses.pausedAt
                const isPaused  = !ses.end && !!ses.pausedAt
                const isFinished = !!ses.end

                // Temps travaillé réel (sans pauses)
                let pMs = ses.totalPauseMs || 0
                let rawMs = 0
                if (isFinished) rawMs = new Date(ses.end) - new Date(ses.t0) - pMs
                else if (isPaused) rawMs = new Date(ses.pausedAt) - new Date(ses.t0) - pMs
                else rawMs = Date.now() - new Date(ses.t0) - pMs
                const workMs = Math.max(0, rawMs)
                const estMs = (ses.estimatedH||step.estH||4)*3600000
                const pct = estMs>0 ? Math.min(100, Math.round(workMs/estMs*100)) : 0
                const overMs = workMs > estMs ? workMs - estMs : 0
                const sesCout = (workMs/3600000)*rate

                // Temps de pause actuelle
                const currentPauseMs = isPaused ? Date.now() - new Date(ses.pausedAt).getTime() : 0

                const showPauseFor = pausingSession?.sesId === ses.id && pausingSession?.stepIdx === stepIdx

                // ── COULEURS PAR STATUT/MOTIF ─────────────────────────────
                const PAUSE_COLORS = {
                  'Manque de marchandise': { bg:'rgba(234,88,12,.08)',  border:'rgba(234,88,12,.35)',  txt:'#EA580C', bar:'#EA580C', label:'🟠 Manque marchandise' },
                  'Matière non reçue':     { bg:'rgba(234,88,12,.08)',  border:'rgba(234,88,12,.35)',  txt:'#EA580C', bar:'#EA580C', label:'🟠 Matière non reçue' },
                  'Outil en panne':        { bg:'rgba(220,38,38,.08)',   border:'rgba(220,38,38,.35)',  txt:'#DC2626', bar:'#DC2626', label:'🔴 Outil en panne' },
                  'Autre atelier prioritaire': { bg:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.3)', txt:'#7C3AED', bar:'#7C3AED', label:'🟣 Autre prioritaire' },
                  'Fin de journée':        { bg:'rgba(100,116,139,.08)', border:'rgba(100,116,139,.3)', txt:'#64748B', bar:'#64748B', label:'⚫ Fin de journée' },
                }
                const STATUS_STYLES = {
                  running:  { bg:'rgba(22,163,74,.05)',  border:'rgba(22,163,74,.3)',   barCol:'#16A34A', dotColor:'#16A34A' },
                  idle:     { bg:'rgba(100,116,139,.04)',border:'rgba(100,116,139,.2)', barCol:'#94A3B8', dotColor:'#94A3B8' },
                  finished: { bg:'rgba(22,163,74,.04)',  border:'rgba(22,163,74,.2)',   barCol:'#16A34A', dotColor:'#16A34A' },
                }

                const pauseStyle = isPaused ? (PAUSE_COLORS[ses.pauseReason] || PAUSE_COLORS['Fin de journée']) : null
                const rowStyle = isFinished ? STATUS_STYLES.finished
                  : isRunning ? STATUS_STYLES.running
                  : isPaused ? { bg:pauseStyle.bg, border:pauseStyle.border, barCol:pauseStyle.bar, dotColor:pauseStyle.txt }
                  : STATUS_STYLES.idle

                return (
                  <div key={ses.id} style={{ border:`.5px solid ${rowStyle.border}`, borderLeft:`3px solid ${rowStyle.dotColor}`, borderRadius:9, marginBottom:5, overflow:'hidden', background:rowStyle.bg }}>

                    {/* Ligne principale */}
                    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px' }}>
                      {/* Dot statut */}
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:`${empAt2.c}22`, color:empAt2.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{initials}</div>
                        <span style={{ position:'absolute', bottom:-1, right:-1, width:9, height:9, borderRadius:'50%', background:rowStyle.dotColor, border:'1.5px solid var(--c1)' }}/>
                      </div>

                      {/* Nom + statut */}
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ses.empN.split(' ')[0]}</div>
                        <div style={{ fontSize:9, color: isPaused ? pauseStyle.txt : isRunning ? '#16A34A' : 'var(--mu)', fontWeight:600 }}>
                          {isPaused ? pauseStyle.label
                            : isRunning ? `🟢 En cours · ${ses.launchLabel||''}`
                            : isFinished ? '✅ Terminé'
                            : '⚫ En attente'}
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display:'flex', gap:0, flexShrink:0 }}>
                        {[
                          ['Travail', fHms(workMs), isRunning?'#16A34A':'var(--tx)'],
                          ['Pause', isPaused ? fHms(currentPauseMs) : pMs>0 ? fHms(pMs) : '—', isPaused?pauseStyle.txt:'var(--mu)'],
                          ['Estimé', `${ses.estimatedH||step.estH||4}h`, 'var(--mu)'],
                          ['Coût', dh(sesCout), 'var(--or)'],
                        ].map(([l,v,c],ki) => (
                          <div key={ki} style={{ textAlign:'center', minWidth:ki===3?52:40, borderLeft:ki>0?'.5px solid rgba(0,0,0,.08)':undefined, paddingLeft:ki>0?5:0 }}>
                            <div style={{ fontSize:8, color:'var(--mu)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:1 }}>{l}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:c, fontFamily:'monospace' }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Boutons */}
                      <div style={{ display:'flex', gap:3, marginLeft:6, flexShrink:0 }}>
                        {isRunning && (
                          <button onClick={() => { setPausingSession({stepIdx, sesId:ses.id}); setSelPauseReason('') }}
                            style={{ height:26, padding:'0 8px', borderRadius:6, border:'.5px solid rgba(217,119,6,.4)', background:'rgba(217,119,6,.06)', color:'#D97706', cursor:'pointer', fontSize:11, fontWeight:700 }}>⏸</button>
                        )}
                        {isPaused && (
                          <button onClick={() => resumeSession2(art.id, stepIdx, ses.id)}
                            style={{ height:26, padding:'0 8px', borderRadius:6, border:'.5px solid rgba(22,163,74,.4)', background:'rgba(22,163,74,.06)', color:'#16A34A', cursor:'pointer', fontSize:11, fontWeight:700 }}>▶ Reprendre</button>
                        )}
                        {!isFinished && (
                          <button onClick={() => finishSession(art.id, stepIdx, ses.id)}
                            style={{ height:26, padding:'0 7px', borderRadius:6, border:'.5px solid rgba(46,204,113,.3)', background:'rgba(46,204,113,.06)', color:'var(--gn)', cursor:'pointer', fontSize:11 }}>✓</button>
                        )}
                        {isFinished && <span style={{ fontSize:10, color:'var(--gn)', fontWeight:700 }}>✅ {fHms(workMs)}</span>}
                      </div>
                    </div>

                    {/* Barre progression + alerte dépassement */}
                    {!isFinished && (
                      <div style={{ padding:'0 10px 6px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:overMs>0?3:0 }}>
                          <div style={{ flex:1, height:4, background:'rgba(0,0,0,.08)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:pct+'%', background:overMs>0?'#DC2626':pct>=80?'#D97706':rowStyle.barCol, borderRadius:2 }}/>
                          </div>
                          <span style={{ fontSize:9, fontFamily:'monospace', color:overMs>0?'#DC2626':pct>=80?'#D97706':'var(--mu)', whiteSpace:'nowrap', fontWeight:overMs>0?700:400 }}>
                            {pct}%{overMs>0?' ⚠️ +'+fHms(overMs):''}
                          </span>
                        </div>
                        {/* Temps de pause visible */}
                        {isPaused && currentPauseMs > 0 && (
                          <div style={{ fontSize:9, color:pauseStyle.txt, fontWeight:700 }}>
                            {pauseStyle.label} depuis {fHms(currentPauseMs)}
                            {currentPauseMs > 3600000 && ' ⚠️ ALERTE +1h'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dropdown pause */}
                    {showPauseFor && (
                      <div style={{ borderTop:'.5px solid rgba(217,119,6,.25)', background:'rgba(217,119,6,.05)', padding:'8px 10px' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#D97706', marginBottom:6 }}>⏸ Motif — {ses.empN.split(' ')[0]}</div>
                        {[
                          {id:'fdj',   l:'Fin de journée',           ctr:false, col:'#64748B'},
                          {id:'manq',  l:'Manque de marchandise',     ctr:true,  col:'#EA580C'},
                          {id:'mnr',   l:'Matière non reçue',         ctr:true,  col:'#EA580C'},
                          {id:'outil', l:'Outil en panne',            ctr:true,  col:'#DC2626'},
                          {id:'prio',  l:'Autre atelier prioritaire', ctr:true,  col:'#7C3AED'},
                        ].map(p => {
                          const cnt = p.ctr ? (step.pauseCounters?.[p.id]||0) : null
                          const sel = selPauseReason === p.id
                          return (
                            <div key={p.id} onClick={() => setSelPauseReason(p.id)}
                              style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 8px', borderRadius:6, cursor:'pointer', marginBottom:3, background:sel?`${p.col}18`:'transparent', border:`.5px solid ${sel?p.col+'55':'transparent'}` }}>
                              <span style={{ width:10, height:10, borderRadius:'50%', background:sel?p.col:'transparent', border:`1.5px solid ${sel?p.col:'var(--bd)'}`, flexShrink:0, display:'block' }}/>
                              <span style={{ fontSize:11, flex:1, color:sel?p.col:'var(--tx)', fontWeight:sel?700:400 }}>{p.l}</span>
                              {p.ctr && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:20, fontFamily:'monospace', fontWeight:700, background:cnt===0?'var(--c2)':cnt<=2?`${p.col}18`:`${p.col}33`, color:cnt===0?'var(--mu)':p.col }}>×{cnt}</span>}
                            </div>
                          )
                        })}
                        <div style={{ display:'flex', gap:5, marginTop:7 }}>
                          <button onClick={() => { setPausingSession(null); setSelPauseReason('') }}
                            style={{ flex:1, padding:'7px', borderRadius:7, border:'.5px solid var(--bd)', background:'var(--c1)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontSize:11 }}>Annuler</button>
                          <button disabled={!selPauseReason} onClick={() => {
                            const labels = {fdj:'Fin de journée',manq:'Manque de marchandise',mnr:'Matière non reçue',outil:'Outil en panne',prio:'Autre atelier prioritaire'}
                            pauseSession(art.id, stepIdx, ses.id, labels[selPauseReason], selPauseReason!=='fdj'?selPauseReason:null)
                            setPausingSession(null); setSelPauseReason('')
                          }} style={{ flex:2, padding:'7px', borderRadius:7, border:'none', background:selPauseReason?'#D97706':'var(--bd)', color:'#fff', cursor:selPauseReason?'pointer':'not-allowed', fontFamily:'inherit', fontSize:11, fontWeight:700, opacity:selPauseReason?1:.5 }}>
                            ⏸ Confirmer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}



              {/* Coût MO de l'étape */}
              {step.sessions.length > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 2px', marginTop:2 }}>
                  <span style={{ fontSize:9, color:'var(--mu)' }}>Coût MO étape {stepIdx+1}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--or)', fontFamily:'monospace' }}>{dh(stepCoutMO)}</span>
                </div>
              )}
            </div>
          )
        })}

        {/* ── TOTAL COÛT DE REVIENT LIVE ── */}
        {wf && steps.some(s => s.sessions.length>0) && (() => {
          const totalMO = steps.reduce((acc, step) => {
            return acc + step.sessions.reduce((a2, ses) => {
              const emp = EMP.find(e => e.id === ses.eId)
              const rate = emp ? emp.tx : TX_DEFAUT
              let pMs = ses.totalPauseMs||0
              let raw = ses.end ? new Date(ses.end)-new Date(ses.t0)-pMs
                : ses.pausedAt ? new Date(ses.pausedAt)-new Date(ses.t0)-pMs
                : Date.now()-new Date(ses.t0)-pMs
              return a2 + Math.max(0,raw/3600000)*rate
            }, 0)
          }, 0)
          const totalMat = (mats[art.id]||[]).reduce((a,m)=>a+m.q*m.p,0)
          const chargesArt = CHARGE_PAR_ARTICLE
          const coutRevient = totalMO + totalMat + chargesArt
          const margePct = art.prix > 0 ? Math.round((art.prix-coutRevient)/art.prix*100) : null

          return (
            <div style={{ background:'rgba(196,113,79,.05)', border:'1px solid rgba(196,113,79,.2)', borderRadius:10, padding:'10px 12px', marginTop:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--or)', textTransform:'uppercase', marginBottom:8 }}>💰 Coût de revient temps réel</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:8 }}>
                {[
                  ['🧑‍🔧 Main d\'œuvre', totalMO, 'var(--or)'],
                  ['🧱 Matières', totalMat, 'var(--gn)'],
                  ['🏭 Charges fixes', chargesArt, 'var(--yw)'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:'var(--c1)', border:'.5px solid var(--bd)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--mu)', marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:c, fontFamily:'monospace' }}>{dh(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700 }}>Total coût revient</span>
                <span style={{ fontSize:18, fontWeight:900, color:'var(--or)', fontFamily:'monospace' }}>{dh(coutRevient)}</span>
              </div>
              {art.prix > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4, paddingTop:4, borderTop:'.5px solid var(--bd)' }}>
                  <span style={{ fontSize:11, color:'var(--mu)' }}>Prix vente {dh(art.prix)} → marge</span>
                  <span style={{ fontSize:14, fontWeight:700, color:margePct>=30?'var(--gn)':margePct>=20?'var(--yw)':'var(--rd)', fontFamily:'monospace' }}>{margePct}%</span>
                </div>
              )}
            </div>
          )
        })()}
      </div>



      {/* ── 3 BOUTONS PRINCIPAUX ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        <button onClick={() => setModal('timer')} style={{ padding:'10px', borderRadius:10, border:run?'2px solid var(--gn)':'none', background:run?'#081A0E':'var(--gn)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:11 }}>
          {run ? '⏱ Timer actif' : '▶ Timer libre'}
        </button>
        <button onClick={() => !matieresDispo ? setModal('matieres') : null}
          style={{ padding:'10px', borderRadius:10, border:`2px solid ${matieresDispo?'var(--gn)':'var(--rd)'}`, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:10, background:matieresDispo?'rgba(46,204,113,.08)':'rgba(231,76,60,.12)', color:matieresDispo?'var(--gn)':'var(--rd)' }}>
          {matieresDispo ? '✅ Matières OK' : '🔴 Matières manquantes'}
        </button>
      </div>

      {/* Timer libre actif */}
      {run && (
        <div style={{ background:'#081A0E', border:'2px solid var(--gn)', borderRadius:12, padding:12, marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'var(--gn)', fontWeight:700 }}>🟢 {run.empN}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'monospace', fontSize:20, color:'var(--gn)', fontWeight:700 }}><Timer from={run.t0}/></div>
            <button onClick={() => stopSession(run.id)} style={{ marginTop:4, padding:'4px 10px', borderRadius:7, border:'none', background:'var(--rd)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:10, fontWeight:700 }}>⏹ Stop</button>
          </div>
        </div>
      )}

      {/* Sessions timers libres */}
      {done.length > 0 && (
        <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:10, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:8 }}>Sessions timer libre ({done.length})</div>
          {done.map(s => { const ms=+new Date(s.end)-+new Date(s.t0); const emp=EMP.find(e=>e.id===s.eId); return (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'.5px solid var(--bd)' }}>
              <span style={{ fontSize:11, flex:1 }}>{s.empN}</span>
              <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--or)' }}>{fD(ms)}</span>
              {emp && <span style={{ fontSize:10, color:'var(--mu)' }}>{dh((ms/3600000)*emp.tx)}</span>}
            </div>
          )})}</div>
      )}

      {/* Matières */}
      {(mats[art.id]||[]).length > 0 && (
        <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:10, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:8 }}>Matières — {dh(matCost)}</div>
          {(mats[art.id]||[]).map(m => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'.5px solid var(--bd)' }}>
              <span style={{ flex:1, fontSize:11 }}>{m.n}</span>
              <span style={{ fontSize:10, color:'var(--mu)' }}>{m.q}{m.u}×{dh(m.p)}</span>
              <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--or)' }}>{dh(m.q*m.p)}</span>
              <button onClick={() => delMat(art.id, m.id)} style={{ background:'none', border:'none', color:'var(--rd)', cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
          ))}
          <button onClick={() => setModal('mat')} style={{ width:'100%', marginTop:8, padding:8, borderRadius:8, border:'1px dashed rgba(196,113,79,.3)', background:'rgba(196,113,79,.05)', color:'var(--or)', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>+ Ajouter matière</button>
        </div>
      )}
      {!(mats[art.id]||[]).length && (
        <button onClick={() => setModal('mat')} style={{ width:'100%', marginBottom:12, padding:10, borderRadius:10, border:'1.5px dashed rgba(196,113,79,.4)', background:'rgba(196,113,79,.05)', color:'var(--or)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>+ Ajouter matières premières</button>
      )}

      {/* Qualité */}
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        <button onClick={() => setModal('qual')} style={{ flex:1, padding:9, borderRadius:8, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>🔍 Qualité</button>
      </div>
      {q2 && <div style={{ background:q2.ok?'rgba(46,204,113,.08)':'rgba(231,76,60,.08)', border:`1px solid ${q2.ok?'rgba(46,204,113,.3)':'rgba(231,76,60,.3)'}`, borderRadius:10, padding:12, marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:700, color:q2.ok?'var(--gn)':'var(--rd)' }}>{q2.ok?'✅ Validé':'❌ Non conforme'} — {q2.par}</div>
        {q2.obs && <div style={{ fontSize:11, color:'var(--mu)', marginTop:4 }}>{q2.obs}</div>}
      </div>}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ background:'var(--c1)', borderRadius:'14px 14px 0 0', padding:20, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ width:32, height:3, background:'var(--bd)', borderRadius:2, margin:'0 auto 14px' }}/>

            {/* ── MODAL PAUSE ── */}
            {modal === 'pause' && (
              <>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>⏸ Raison de la pause ?</div>
                {['Attente matière première','Matière non reçue','Problème qualité matière','Outil en panne','Autre atelier prioritaire','Fin de journée'].map(r => (
                  <button key={r} onClick={() => setPauseReason(r)} style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:8, border:`1px solid ${pauseReason===r?'rgba(231,76,60,.4)':'var(--bd)'}`, background:pauseReason===r?'rgba(231,76,60,.08)':'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontSize:12, marginBottom:5 }}>
                    {pauseReason===r?'● ':''}{r}
                  </button>
                ))}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                  <button onClick={() => { setModal(null); setPauseReason(''); setActiveStep(null) }} style={{ padding:11, borderRadius:8, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Annuler</button>
                  <button disabled={!pauseReason} onClick={doPause} style={{ padding:11, borderRadius:8, border:'none', background:'var(--rd)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, opacity:pauseReason?1:.5 }}>⏸ Mettre en pause</button>
                </div>
              </>
            )}

            {/* ── MODAL TIMER LIBRE ── */}
            {modal === 'timer' && (
              <>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>▶ Timer libre — {art.nom}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16 }}>
                  {EMP.map(e => (
                    <button key={e.id} onClick={() => setSelWorker(selWorker===e.id?'':e.id)} style={{ padding:'6px 11px', borderRadius:20, border:'none', background:selWorker===e.id?atI(e.at).c:'var(--c2)', color:selWorker===e.id?'#fff':'var(--mu)', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                      {atI(e.at).e} {e.n.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={() => { setModal(null); setSelWorker('') }} style={{ padding:11, borderRadius:8, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Annuler</button>
                  <button disabled={!selWorker} onClick={() => {
                    const e = EMP.find(e => e.id === selWorker)
                    if (!e) return
                    addSession({ id: Math.random().toString(36).slice(2), aId: art.id, eId: e.id, empN: e.n, at: art.at, t0: new Date().toISOString(), end: null, st: 'run' })
                    updateArt(art.id, { st: 'wip' })
                    setModal(null); setSelWorker('')
                  }} style={{ padding:11, borderRadius:8, border:'none', background:'var(--or)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, opacity:selWorker?1:.5 }}>▶ Démarrer</button>
                </div>
              </>
            )}

            {/* ── MODAL MATIÈRES ── */}
            {modal === 'mat' || modal === 'matieres' ? (
              <>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>🟢 Matières — {art.nom}</div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:4 }}>Désignation *</div>
                  <input value={fMNom} onChange={e => setFMNom(e.target.value)} placeholder="Tissu, Laiton, Bois..."
                    style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:4 }}>Quantité</div>
                    <input type="number" min="0" step="0.1" value={fMQte} onChange={e => setFMQte(+e.target.value)} style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 8px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:4 }}>Unité</div>
                    <select value={fMU} onChange={e => setFMU(e.target.value)} style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 8px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit' }}>
                      {['pcs','m','m²','kg','L','barre','rouleau'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:4 }}>Prix unitaire (DH) *</div>
                  <input type="number" min="0" value={fMP} onChange={e => setFMP(+e.target.value)}
                    style={{ width:'100%', background:'var(--c2)', border:`1.5px solid ${fMP>0?'var(--gn)':'var(--rd)'}`, borderRadius:8, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                  {fMP===0 && <div style={{ fontSize:10, color:'var(--rd)', marginTop:3 }}>⚠️ Prix obligatoire pour le coût de revient</div>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={() => setModal(null)} style={{ padding:11, borderRadius:8, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Annuler</button>
                  <button disabled={!fMNom.trim()||fMP===0} onClick={() => {
                    addMat(art.id, { id: Math.random().toString(36).slice(2), n:fMNom.trim(), q:fMQte, u:fMU, p:fMP })
                    setModal(null); setFMNom(''); setFMQte(1); setFMU('pcs'); setFMP(0)
                  }} style={{ padding:11, borderRadius:8, border:'none', background:fMNom.trim()&&fMP>0?'var(--gn)':'var(--bd)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>✅ Enregistrer</button>
                </div>
              </>
            ) : null}

            {/* ── MODAL QUALITÉ ── */}
            {modal === 'qual' && (
              <>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>🔍 Qualité — {art.nom}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                  <button onClick={() => setFQOk(true)} style={{ padding:11, borderRadius:8, border:'none', background:fQOk?'var(--gn)':'var(--c2)', color:fQOk?'#fff':'var(--mu)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>✅ Validé</button>
                  <button onClick={() => setFQOk(false)} style={{ padding:11, borderRadius:8, border:'none', background:!fQOk?'var(--rd)':'var(--c2)', color:!fQOk?'#fff':'var(--mu)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>❌ Non conforme</button>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:4 }}>Vérifié par</div>
                  <input value={fQPar} onChange={e => setFQPar(e.target.value)} style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:4 }}>Observations</div>
                  <textarea value={fQObs} onChange={e => setFQObs(e.target.value)} rows={3} style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', resize:'vertical' }}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={() => setModal(null)} style={{ padding:11, borderRadius:8, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Annuler</button>
                  <button onClick={() => { saveQual(art.id,{ok:fQOk,par:fQPar,obs:fQObs,date:new Date().toISOString()}); setModal(null) }} style={{ padding:11, borderRadius:8, border:'none', background:fQOk?'var(--gn)':'var(--rd)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Enregistrer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



// ─── TEAM ────────────────────────────────────────────────────────
export function Team() {
  const { sessions } = useApp()
  const [search, setSearch] = useState('')
  const [filterAt, setFilterAt] = useState('all')

  const empAct = id => (sessions||[]).some(s => s.eId === id && s.st === 'run')

  const totalSal = EMP.reduce((s,e) => s+e.sal, 0)
  const totalActifs = EMP.filter(e => empAct(e.id)).length

  const filtered = EMP.filter(e => {
    const matchSearch = !search || e.n.toLowerCase().includes(search.toLowerCase()) || e.poste.toLowerCase().includes(search.toLowerCase())
    const matchAt = filterAt === 'all' || e.at === filterAt
    return matchSearch && matchAt
  })

  return (
    <div>
      {/* Stats header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'var(--tx)' }}>{EMP.length}</div>
          <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 2, textTransform: 'uppercase' }}>Ouvriers</div>
        </div>
        <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: totalActifs > 0 ? 'var(--gn)' : 'var(--mu)' }}>{totalActifs}</div>
          <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 2, textTransform: 'uppercase' }}>En travail</div>
        </div>
        <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--or)' }}>{Math.round(totalSal/1000)}k</div>
          <div style={{ fontSize: 9, color: 'var(--mu)', marginTop: 2, textTransform: 'uppercase' }}>Masse sal.</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--mu)' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un ouvrier..."
          style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 11px 8px 32px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {/* Atelier filter chips */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setFilterAt('all')} style={{
          padding: '4px 11px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 10, fontWeight: 700,
          background: filterAt === 'all' ? '#F0EEE8' : 'var(--c2)',
          color: filterAt === 'all' ? '#0E0E11' : 'var(--mu)'
        }}>Tous ({EMP.length})</button>
        {AT.map(at => {
          const n = EMP.filter(e => e.at === at.id).length
          if (!n) return null
          const isOn = filterAt === at.id
          return (
            <button key={at.id} onClick={() => setFilterAt(isOn ? 'all' : at.id)} style={{
              padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${isOn ? at.c : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
              background: isOn ? `${at.c}22` : 'var(--c2)',
              color: isOn ? at.c : 'var(--mu)'
            }}>{at.e} {at.n} ({n})</button>
          )
        })}
      </div>

      {/* Grouped by atelier */}
      {AT.map(at => {
        const es = filtered.filter(e => e.at === at.id)
        if (!es.length) return null
        const actifs = es.filter(e => empAct(e.id)).length
        const salAt = es.reduce((s,e) => s+e.sal, 0)
        const isChefs = es.filter(e => e.poste.toLowerCase().includes('chef') || e.poste.toLowerCase().includes('resp'))

        return (
          <div key={at.id} style={{ marginBottom: 16 }}>
            {/* Atelier header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: `${at.c}15`,
              border: `1px solid ${at.c}44`,
              borderLeft: `4px solid ${at.c}`,
              borderRadius: 10, marginBottom: 6
            }}>
              <span style={{ fontSize: 20 }}>{at.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: at.c }}>{at.n}</div>
                <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 1 }}>
                  {es.length} ouvrier{es.length > 1 ? 's' : ''} · {Math.round(salAt/1000)}k DH/mois
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {actifs > 0
                  ? <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gn)' }} className="pulse">🟢 {actifs} actif{actifs>1?'s':''}</div>
                  : <div style={{ fontSize: 10, color: 'var(--mu)' }}>Repos</div>
                }
              </div>
            </div>

            {/* Employees */}
            {es.map(e => {
              const ac = empAct(e.id)
              const ms = (sessions||[]).filter(s=>s.eId===e.id&&s.end).reduce((a,s)=>a+(+new Date(s.end)-+new Date(s.t0)),0)
              const isChef = e.poste.toLowerCase().includes('chef') || e.poste.toLowerCase().includes('resp')
              const txH = (e.tx||0).toFixed(1)

              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: ac ? `${at.c}08` : 'var(--c1)',
                  border: `1px solid ${ac ? at.c+'66' : isChef ? at.c+'33' : 'var(--bd)'}`,
                  borderLeft: `3px solid ${ac ? 'var(--gn)' : isChef ? at.c : 'transparent'}`,
                  borderRadius: 9, padding: '10px 12px', marginBottom: 5,
                  transition: 'all .2s'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${at.c}${ac ? '44' : '22'}`,
                    border: `2px solid ${at.c}${ac ? 'AA' : '55'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: at.c
                  }}>
                    {e.n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{e.n}</span>
                      {isChef && <span style={{
                        fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                        background: `${at.c}22`, color: at.c, textTransform: 'uppercase'
                      }}>Chef</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 1 }}>
                      {e.poste}
                      <span style={{ color: 'var(--bd)', margin: '0 4px' }}>·</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--or)' }}>{e.sal.toLocaleString('fr')} DH</span>
                      <span style={{ color: 'var(--bd)', margin: '0 4px' }}>·</span>
                      <span>{(e.sal/208).toFixed(2)} DH/h</span>
                      {e.paiement === 'semaine' && <span style={{ color: 'var(--yw)', marginLeft: 4 }}>📆</span>}
                    </div>
                  </div>

                  {/* Status / Timer */}
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
                    {ac
                      ? <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gn)', marginBottom: 2 }}>🟢 EN TRAVAIL</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gn)', fontWeight: 700 }} className="pulse">
                            {(() => {
                              const run = (sessions||[]).find(s=>s.eId===e.id&&s.st==='run')
                              return run ? <Timer from={run.t0}/> : '00:00:00'
                            })()}
                          </div>
                        </div>
                      : <div>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: ms > 0 ? 'var(--or)' : 'var(--mu)' }}>{fD(ms)}</div>
                          {ms > 0 && <div style={{ fontSize: 9, color: 'var(--mu)' }}>{dh((ms/3600000)*e.tx)}</div>}
                        </div>
                    }
                  </div>

                  {/* WhatsApp */}
                  {e.tel && (
                    <a href={`https://wa.me/${e.tel.replace(/\D/g,'')}?text=Salam+${encodeURIComponent(e.n.split(' ')[0])}!`}
                      target="_blank" rel="noreferrer"
                      onClick={ev => ev.stopPropagation()}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(37,211,102,.12)', border: '1.5px solid rgba(37,211,102,.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none', fontSize: 15
                      }}>📱</a>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--mu)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div>Aucun ouvrier trouvé</div>
        </div>
      )}
    </div>
  )
}

// ─── ALERTES ─────────────────────────────────────────────────────
export function Alertes() {
  const { orders, setSelRef } = useApp()
  const retards = orders.filter(o => o.late)
  const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'

  if (!retards.length) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Tout est sous contrôle</div>
      <div style={{ fontSize: 12 }}>Aucune alerte active</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--rd)', textTransform: 'uppercase', letterSpacing: '.08em' }}>🔴 Commandes en retard</span>
        <span style={{ background: 'rgba(231,76,60,.15)', color: 'var(--rd)', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{retards.length}</span>
      </div>
      {retards.map(o => (
        <div key={o.uuid} onClick={() => setSelRef(o.ref)}
          style={{ background: 'rgba(231,76,60,.05)', border: '1px solid rgba(231,76,60,.3)', borderLeft: '4px solid var(--rd)', borderRadius: 10, padding: 13, marginBottom: 8, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--or)' }}>{o.ref}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{o.cl}</span>
            <span style={{ background: 'rgba(231,76,60,.2)', color: 'var(--rd)', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>+{o.j}j</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--mu)' }}>👩 {o.com} · Solde {dh(o.sol)} · Prévu {o.liv||'—'}</div>
        </div>
      ))}
    </div>
  )
}

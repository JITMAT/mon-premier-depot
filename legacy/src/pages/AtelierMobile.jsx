import React, { useState, useEffect } from 'react'
import { useApp } from '../store'
import { EMP, atI } from '../data/employees'

const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'
function fTimer(ms) {
  if (!ms||ms<=0) return '00:00:00'
  const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60)
  return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}

export default function AtelierMobile() {
  const { arts, orders, stepProgress, pauseSession, resumeSession2, finishSession } = useApp()
  const [tick, setTick] = useState(0)
  const [sheet, setSheet] = useState(null)
  const [pauseFor, setPauseFor] = useState(null)
  const [selPause, setSelPause] = useState('')

  useEffect(() => {
    const t = setInterval(() => setTick(x=>x+1), 1000)
    return () => clearInterval(t)
  }, [])

  // Toutes les sessions actives
  const sessions = []
  Object.entries(stepProgress || {}).forEach(([artId, steps]) => {
    const art = arts[artId]
    const ord = orders.find(o => o.ref === art?.ref)
    ;(steps||[]).forEach((step, si) => {
      ;(step.sessions||[]).forEach(ses => {
        if (ses.end) return
        const emp = EMP.find(e => e.id === ses.eId)
        const rate = emp?.tx || 28
        const isPaused = !!ses.pausedAt
        let workMs = 0
        if (isPaused) workMs = new Date(ses.pausedAt)-new Date(ses.t0)-(ses.totalPauseMs||0)
        else workMs = Date.now()-new Date(ses.t0)-(ses.totalPauseMs||0)
        workMs = Math.max(0, workMs)
        const estMs = (ses.estimatedH||step.estH||4)*3600000
        const pct = estMs>0 ? Math.min(100,Math.round(workMs/estMs*100)) : 0
        const over = workMs > estMs
        const coutLive = (workMs/3600000)*rate
        const empAt = emp ? atI(emp.at) : { c:'#888', e:'👷', n:'?' }
        sessions.push({ ses, emp, empAt, rate, workMs, estMs, pct, over, coutLive, art, ord, step, si, artId, isPaused })
      })
    })
  })

  const actifs = sessions.filter(s => !s.isPaused)
  const enPause = sessions.filter(s => s.isPaused)
  const totalCout = sessions.reduce((a,s)=>a+s.coutLive,0)

  const PAUSES = [
    { id:'fdj',  l:'Fin de journée',           ctr:false },
    { id:'manq', l:'Manque de marchandise',     ctr:true  },
    { id:'mnr',  l:'Matière non reçue',         ctr:true  },
    { id:'outil',l:'Outil en panne',            ctr:true  },
    { id:'prio', l:'Autre atelier prioritaire', ctr:true  },
  ]
  const PAUSE_COL = { fdj:'#64748B', manq:'#EA580C', mnr:'#EA580C', outil:'#DC2626', prio:'#7C3AED' }

  function WorkerCard({ s }) {
    const col = s.isPaused
      ? (PAUSE_COL[Object.keys(PAUSE_COL).find(k => PAUSES.find(p=>p.id===k)?.l===s.ses.pauseReason)] || '#D97706')
      : s.over ? '#DC2626' : s.pct>=80 ? '#D97706' : '#16A34A'
    const ini = s.ses.empN.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
    return (
      <div className="worker-card" style={{ borderLeftColor:col }}>
        <div className="wc-head">
          <div className="wc-avatar" style={{ background:s.empAt.c+'18', color:s.empAt.c }}>
            {ini}
            <span className="wc-status-dot" style={{ background: s.isPaused?'#D97706':'#16A34A' }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="wc-name">{s.ses.empN.split(' ')[0]}</div>
            <div className="wc-atelier">{s.empAt.n}</div>
            <div className="wc-task">{s.step.icon} {s.step.nom}{s.ord ? ` → ${s.ord.client}` : ''}</div>
            {s.isPaused && <div style={{ fontSize:10, color:'#D97706', fontWeight:700 }}>⏸ {s.ses.pauseReason}</div>}
          </div>
          <div>
            <div className="wc-timer" style={{ color:s.isPaused?'#D97706':col }}>{fTimer(s.workMs)}</div>
            <div className="wc-cout">{dh(s.coutLive)}</div>
            <div style={{ fontSize:9, color:'#94A3B8', textAlign:'right' }}>{s.emp?.tx||28} DH/h</div>
          </div>
        </div>
        <div className="wc-bar-wrap">
          <div className="wc-bar" style={{ width:s.pct+'%', background:col }}/>
        </div>
        {s.over && <div style={{ fontSize:9, color:'#DC2626', fontWeight:700, marginTop:3 }}>⚠️ Dépassement +{fTimer(s.workMs-s.estMs)}</div>}
        <div style={{ display:'flex', gap:6, marginTop:8 }}>
          {!s.isPaused && (
            <button onClick={() => { setPauseFor(s); setSelPause('') }} style={{ flex:1, height:32, borderRadius:8, border:'1px solid rgba(217,119,6,.3)', background:'rgba(217,119,6,.06)', color:'#D97706', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>⏸ Pause</button>
          )}
          {s.isPaused && (
            <button onClick={() => resumeSession2(s.artId, s.si, s.ses.id)} style={{ flex:1, height:32, borderRadius:8, border:'none', background:'#16A34A', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>▶ Reprendre</button>
          )}
          <button onClick={() => finishSession(s.artId, s.si, s.ses.id)} style={{ flex:1, height:32, borderRadius:8, border:'1px solid rgba(22,163,74,.3)', background:'rgba(22,163,74,.06)', color:'#16A34A', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>✓ Terminer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="pg" style={{ paddingBottom:14 }}>
      {/* KPIs */}
      <div className="kpi-row" style={{ marginTop:12 }}>
        <div className="kpi-card" style={{ borderLeftColor:'#16A34A' }}>
          <div className="kpi-lbl">En cours</div>
          <div className="kpi-val" style={{ color:'#16A34A' }}>{actifs.length}</div>
          <div className="kpi-sub">{enPause.length} en pause</div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor:'#C4714F' }}>
          <div className="kpi-lbl">Coût MO live</div>
          <div className="kpi-val" style={{ color:'#C4714F', fontSize:16 }}>{dh(totalCout)}</div>
          <div className="kpi-sub">aujourd'hui</div>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="empty">
          <i className="ti ti-tool" aria-hidden="true"/>
          <p>Aucun ouvrier en production</p>
          <p style={{ marginTop:4, fontSize:11 }}>Lancer des étapes depuis les commandes</p>
        </div>
      )}

      {actifs.length > 0 && (
        <>
          <div className="stitle"><span>🟢 En cours ({actifs.length})</span></div>
          {actifs.map((s,i) => <WorkerCard key={i} s={s}/>)}
        </>
      )}

      {enPause.length > 0 && (
        <>
          <div className="stitle"><span>⏸ En pause ({enPause.length})</span></div>
          {enPause.map((s,i) => <WorkerCard key={i} s={s}/>)}
        </>
      )}

      {/* Sheet pause */}
      {pauseFor && (
        <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&setPauseFor(null)}>
          <div className="sheet">
            <div className="sheet-handle"/>
            <div className="sheet-title">⏸ Motif de la pause</div>
            <div className="sheet-sub">{pauseFor.ses.empN.split(' ')[0]} · {pauseFor.step.nom}</div>
            {PAUSES.map(p => (
              <button key={p.id} onClick={() => setSelPause(p.id)} style={{ width:'100%', padding:'12px 14px', borderRadius:9, border:`1.5px solid ${selPause===p.id?PAUSE_COL[p.id]:'#E2E8F0'}`, background:selPause===p.id?`${PAUSE_COL[p.id]}10`:'#fff', color:selPause===p.id?PAUSE_COL[p.id]:'#374151', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:selPause===p.id?700:400, textAlign:'left', marginBottom:6, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:14, height:14, borderRadius:'50%', background:selPause===p.id?PAUSE_COL[p.id]:'transparent', border:`2px solid ${selPause===p.id?PAUSE_COL[p.id]:'#E2E8F0'}`, display:'inline-block', flexShrink:0 }}/>
                {p.l}
              </button>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button className="sheet-btn secondary" style={{ flex:1, marginBottom:0 }} onClick={() => setPauseFor(null)}>Annuler</button>
              <button className="sheet-btn primary" style={{ flex:2, marginBottom:0, opacity:selPause?1:.4 }} disabled={!selPause} onClick={() => {
                if (!selPause) return
                const labels = {fdj:'Fin de journée',manq:'Manque de marchandise',mnr:'Matière non reçue',outil:'Outil en panne',prio:'Autre atelier prioritaire'}
                pauseSession(pauseFor.artId, pauseFor.si, pauseFor.ses.id, labels[selPause], selPause!=='fdj'?selPause:null)
                setPauseFor(null); setSelPause('')
              }}>⏸ Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

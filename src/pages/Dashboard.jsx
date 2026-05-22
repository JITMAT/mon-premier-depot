import React, { useState, useEffect } from 'react'
import { useApp } from '../store'
import { EMP, atI } from '../data/employees'

const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'
const fH = ms => { if(!ms||ms<=0) return '0h'; const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000); return h>0?`${h}h${m>0?m+'m':''}`:`${m}m` }
function fTimer(ms) {
  if(!ms||ms<=0) return '00:00:00'
  const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60)
  return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}

// Charges fixes par article (base 40 articles/mois)
const CHARGE_ART = 157430.83 / 40

export default function Dashboard() {
  const { orders, arts, stepProgress, mats, achats } = useApp()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(x => x+1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── 1. OUVRIERS ACTIFS ──────────────────────────────────────────
  const ouvriersActifs = []
  Object.entries(stepProgress || {}).forEach(([artId, steps]) => {
    const art = arts[artId]
    const ord = orders.find(o => o.ref === art?.ref)
    ;(steps || []).forEach((step, si) => {
      ;(step.sessions || []).forEach(ses => {
        if (ses.end) return
        const emp = EMP.find(e => e.id === ses.eId)
        const rate = emp?.tx || 28
        let workMs = Date.now() - new Date(ses.t0).getTime() - (ses.totalPauseMs||0)
        if (ses.pausedAt) workMs = new Date(ses.pausedAt) - new Date(ses.t0) - (ses.totalPauseMs||0)
        const coutLive = (Math.max(0,workMs)/3600000) * rate
        ouvriersActifs.push({
          ses, emp, rate, workMs: Math.max(0,workMs), coutLive,
          art, ord, step, si,
          isPaused: !!ses.pausedAt,
          estMs: (ses.estimatedH||step.estH||4)*3600000,
        })
      })
    })
  })

  // ── 2. COÛT DE REVIENT PAR COMMANDE ────────────────────────────
  const coutParCommande = orders.map(ord => {
    const artList = Object.values(arts).filter(a => a.ref === ord.ref)
    let totalMO = 0, totalMat = 0, totalAchat = 0
    artList.forEach(art => {
      const steps = stepProgress?.[art.id] || []
      steps.forEach(step => {
        ;(step.sessions || []).forEach(ses => {
          const emp = EMP.find(e => e.id === ses.eId)
          const rate = emp?.tx || 28
          let ms = 0
          if (ses.end) ms = new Date(ses.end) - new Date(ses.t0) - (ses.totalPauseMs||0)
          else if (ses.pausedAt) ms = new Date(ses.pausedAt) - new Date(ses.t0) - (ses.totalPauseMs||0)
          else ms = Date.now() - new Date(ses.t0) - (ses.totalPauseMs||0)
          totalMO += Math.max(0,ms/3600000) * rate
        })
      })
      totalMat += (mats?.[art.id] || []).reduce((a,m) => a + m.q*m.p, 0)
      totalAchat += (achats?.[art.id] || []).filter(a=>a.dateR).reduce((a,x)=>a+(x.prix||0)*(x.q||1),0)
    })
    const coutRevient = totalMO + totalMat + totalAchat + CHARGE_ART
    const prixVente = ord.total || 0
    const marge = prixVente > 0 ? prixVente - coutRevient : null
    const margePct = prixVente > 0 ? Math.round(marge/prixVente*100) : null
    return { ord, totalMO, totalMat: totalMat+totalAchat, coutRevient, prixVente, marge, margePct, artList }
  }).filter(c => c.artList.length > 0 || ouvriersActifs.some(o => o.ord?.ref === c.ord.ref))

  // ── 3. RENTABILITÉ GLOBALE ──────────────────────────────────────
  const totalMO = ouvriersActifs.reduce((a,o) => a + o.coutLive, 0)
  const totalCommandes = coutParCommande.length
  const commandesRentables = coutParCommande.filter(c => c.margePct !== null && c.margePct >= 30).length
  const margeGlobale = coutParCommande.reduce((a,c) => a + (c.marge||0), 0)

  return (
    <div>
      {/* ═══ 3 KPIs ESSENTIELS ═══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
        {[
          { t:'Ouvriers en production', v:ouvriersActifs.filter(o=>!o.isPaused).length+' actifs', s:`${ouvriersActifs.filter(o=>o.isPaused).length} en pause · ${EMP.length - ouvriersActifs.length} libres`, c:'#16A34A', bar: ouvriersActifs.filter(o=>!o.isPaused).length/37*100 },
          { t:'Coût MO live aujourd\'hui', v:dh(totalMO), s:`${ouvriersActifs.length} sessions en cours`, c:'#C4714F', bar:Math.min(100,totalMO/50000*100) },
          { t:'Commandes rentables', v:`${commandesRentables} / ${totalCommandes}`, s:margeGlobale>0?`Marge totale : ${dh(margeGlobale)}`:'Aucune donnée de vente', c:commandesRentables>0?'#16A34A':'#DC2626', bar:totalCommandes>0?commandesRentables/totalCommandes*100:0 },
        ].map((k,i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor:k.c }}>
            <div className="kpi-label">{k.t}</div>
            <div className="kpi-value" style={{ color:k.c, fontSize:20 }}>{k.v}</div>
            <div className="kpi-sub">{k.s}</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width:k.bar+'%', background:k.c }}/></div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* ═══ COL 1 : QUI FAIT QUOI ═══ */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
            👷 Ouvriers — qui fait quoi maintenant
          </div>

          {ouvriersActifs.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:30, color:'#94A3B8' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>👷</div>
              <div>Aucun ouvrier en production actuellement</div>
              <div style={{ fontSize:11, marginTop:4 }}>Lancer des étapes depuis les fiches articles</div>
            </div>
          )}

          {ouvriersActifs.map((o, i) => {
            const pct = o.estMs > 0 ? Math.min(100, Math.round(o.workMs/o.estMs*100)) : 0
            const over = o.workMs > o.estMs
            const empAt = o.emp ? atI(o.emp.at) : { c:'#888', e:'👷', n:'' }
            const ini = o.ses.empN.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
            const barCol = over ? '#DC2626' : pct>=80 ? '#D97706' : '#16A34A'

            return (
              <div key={i} className="wrow" style={{
                background: o.isPaused ? 'rgba(217,119,6,.04)' : '#fff',
                borderColor: o.isPaused ? '#D97706' : barCol,
                marginBottom:6, borderLeft:`3px solid ${o.isPaused ? '#D97706' : barCol}`
              }}>
                {/* Avatar */}
                <div style={{ width:36, height:36, borderRadius:'50%', background:`${empAt.c}18`, color:empAt.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, position:'relative' }}>
                  {ini}
                  <span style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background: o.isPaused?'#D97706':'#16A34A', border:'1.5px solid #fff' }}/>
                </div>

                {/* Infos */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {o.ses.empN.split(' ')[0]} <span style={{ fontSize:10, color:'#94A3B8', fontWeight:400 }}>· {empAt.n}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {o.step.icon} {o.step.nom} {o.ord ? `→ ${o.ord.client}` : ''}
                  </div>
                  {o.isPaused && o.ses.pauseReason && (
                    <div style={{ fontSize:9, color:'#D97706', fontWeight:700, marginTop:1 }}>⏸ {o.ses.pauseReason}</div>
                  )}
                  {/* Barre progression */}
                  <div style={{ height:3, background:'#F1F5F9', borderRadius:2, overflow:'hidden', marginTop:4 }}>
                    <div style={{ height:'100%', width:pct+'%', background:barCol, borderRadius:2 }}/>
                  </div>
                </div>

                {/* Stats droite */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color: o.isPaused?'#D97706':over?'#DC2626':'#16A34A' }}>
                    {fTimer(o.workMs)}
                  </div>
                  <div style={{ fontSize:10, color:'#64748B' }}>{dh(o.coutLive)}</div>
                  <div style={{ fontSize:9, color:'#94A3B8' }}>{o.emp?.tx||28} DH/h</div>
                </div>
              </div>
            )
          })}

          {/* Résumé coût MO */}
          {ouvriersActifs.length > 0 && (
            <div style={{ background:'rgba(196,113,79,.06)', border:'1px solid rgba(196,113,79,.2)', borderRadius:9, padding:'8px 12px', marginTop:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#C4714F' }}>Total coût MO en cours</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#C4714F', fontFamily:'monospace' }}>{dh(totalMO)}</span>
              </div>
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>
                {ouvriersActifs.filter(o=>!o.isPaused).length} actifs · {ouvriersActifs.filter(o=>o.isPaused).length} en pause · taux moyen {ouvriersActifs.length>0?Math.round(ouvriersActifs.reduce((a,o)=>a+(o.emp?.tx||28),0)/ouvriersActifs.length):28} DH/h
              </div>
            </div>
          )}
        </div>

        {/* ═══ COL 2 : COÛT DE REVIENT + RENTABILITÉ ═══ */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
            💰 Coût de revient & rentabilité par commande
          </div>

          {/* Charges fixes */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              ['Charges fixes/article', dh(CHARGE_ART), '#D97706'],
              ['Masse sal. ateliers', '202 800 DH/mois', '#3498DB'],
              ['Seuil rentabilité', '550 000 DH/mois', '#DC2626'],
            ].map(([l,v,c]) => (
              <div key={l} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:'8px 10px', borderTop:`2px solid ${c}` }}>
                <div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.04em' }}>{l}</div>
                <div style={{ fontSize:11, fontWeight:700, color:c, marginTop:3 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Commandes avec coût */}
          {coutParCommande.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:24, color:'#94A3B8' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>📋</div>
              <div style={{ fontSize:11 }}>Lancez des étapes de fabrication pour voir les coûts en temps réel</div>
            </div>
          )}

          {coutParCommande.slice(0,8).map((c, i) => {
            const hasData = c.totalMO > 0 || c.totalMat > 0
            const margePct = c.margePct
            const margeColor = margePct === null ? '#94A3B8' : margePct >= 35 ? '#16A34A' : margePct >= 20 ? '#D97706' : '#DC2626'

            return (
              <div key={i} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:9, padding:'10px 12px', marginBottom:6, borderLeft:`3px solid ${margeColor}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:hasData?6:0 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.ord.client}</div>
                    <div style={{ fontSize:9, color:'#94A3B8' }}>{c.ord.ref}</div>
                  </div>
                  {hasData ? (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'#C4714F', fontFamily:'monospace' }}>{dh(c.coutRevient)}</div>
                      <div style={{ fontSize:9, color:'#94A3B8' }}>coût de revient</div>
                    </div>
                  ) : (
                    <span style={{ fontSize:10, color:'#94A3B8' }}>Pas encore lancé</span>
                  )}
                </div>

                {hasData && (
                  <div>
                    {/* Détail coûts */}
                    <div style={{ display:'flex', gap:6, marginBottom:5 }}>
                      {[
                        ['🧑‍🔧 MO', dh(c.totalMO), '#C4714F'],
                        ['🧱 Mat.', dh(c.totalMat), '#16A34A'],
                        ['🏭 Charges', dh(CHARGE_ART), '#D97706'],
                      ].map(([l,v,col]) => (
                        <div key={l} style={{ flex:1, background:'#F8FAFC', borderRadius:6, padding:'4px 6px', textAlign:'center' }}>
                          <div style={{ fontSize:8, color:'#94A3B8' }}>{l}</div>
                          <div style={{ fontSize:10, fontWeight:700, color:col }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Prix vente + marge */}
                    {c.prixVente > 0 ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:5, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:Math.max(0,Math.min(100,c.coutRevient/c.prixVente*100))+'%', background:'#E2E8F0', borderRadius:3 }}/>
                        </div>
                        <div style={{ fontSize:10, flexShrink:0 }}>
                          <span style={{ color:'#64748B' }}>Vente {dh(c.prixVente)} → </span>
                          <span style={{ fontWeight:700, color:margeColor }}>Marge {margePct}%</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize:9, color:'#94A3B8', fontStyle:'italic' }}>Prix de vente non renseigné dans CreaJit</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Rentabilité globale mois */}
          <div style={{ background:'linear-gradient(135deg,#0F172A,#1E293B)', borderRadius:10, padding:14, marginTop:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>Rentabilité mensuelle CREAJIT</div>
            {[
              ['CA mai 2026', '318 843 DH', '#C4714F'],
              ['Charges fixes', '157 430 DH', '#D97706'],
              ['Masse salariale', '308 300 DH', '#D97706'],
              ['Total à couvrir', '465 730 DH', '#DC2626'],
              ['Seuil rentabilité', '550 000 DH', '#E2E8F0'],
              ['Déficit estimé', '– 231 157 DH', '#DC2626'],
            ].map(([l,v,c],i) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'4px 0', borderBottom:i<5?'1px solid #1E293B':'none' }}>
                <span style={{ color: i>=4?'#CBD5E1':'#64748B' }}>{l}</span>
                <span style={{ fontWeight:i>=4?800:600, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useApp } from '../store'
import { EMP } from '../data/employees'

const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'
const CHARGE_ART = 157430.83 / 40  // 3935 DH/article

export default function CoutMobile() {
  const { orders, arts, stepProgress, mats, achats } = useApp()
  const [tick, setTick] = useState(0)
  const [sheet, setSheet] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setTick(x=>x+1), 1000)
    return () => clearInterval(t)
  }, [])

  // Calcul coût par commande
  const couts = orders.map(ord => {
    const artList = Object.values(arts).filter(a => a.ref === ord.ref)
    let totalMO = 0, totalMat = 0
    artList.forEach(art => {
      const steps = stepProgress?.[art.id] || []
      steps.forEach(step => {
        ;(step.sessions||[]).forEach(ses => {
          const emp = EMP.find(e => e.id === ses.eId)
          const rate = emp?.tx || 28
          let ms = 0
          if (ses.end) ms = new Date(ses.end)-new Date(ses.t0)-(ses.totalPauseMs||0)
          else if (ses.pausedAt) ms = new Date(ses.pausedAt)-new Date(ses.t0)-(ses.totalPauseMs||0)
          else ms = Date.now()-new Date(ses.t0)-(ses.totalPauseMs||0)
          totalMO += Math.max(0,ms/3600000)*rate
        })
      })
      totalMat += (mats?.[art.id]||[]).reduce((a,m)=>a+m.q*m.p,0)
      totalMat += (achats?.[art.id]||[]).filter(a=>a.dateR).reduce((a,x)=>a+(x.prix||0)*(x.q||1),0)
    })
    const coutRevient = totalMO + totalMat + CHARGE_ART
    const pv = ord.total || 0
    const marge = pv > 0 ? pv - coutRevient : null
    const margePct = pv > 0 ? Math.round(marge/pv*100) : null
    return { ord, artList, totalMO, totalMat, coutRevient, pv, marge, margePct, hasData: totalMO > 0 || totalMat > 0 }
  }).sort((a,b) => (b.hasData?1:0)-(a.hasData?1:0))

  const avecDonnees = couts.filter(c => c.hasData)
  const sansData = couts.filter(c => !c.hasData)

  return (
    <div className="pg" style={{ paddingBottom:14 }}>
      {/* Charges fixes */}
      <div style={{ background:'#0F172A', borderRadius:12, padding:14, marginTop:12, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>Base de calcul CREAJIT</div>
        {[['Charges fixes / article', dh(CHARGE_ART),'#D97706'],['Masse sal. ateliers (37)','202 800 DH/mois','#3498DB'],['Seuil rentabilité','550 000 DH/mois','#DC2626'],['CA mai 2026','318 843 DH','#C4714F']].map(([l,v,c]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid #1E293B' }}>
            <span style={{ color:'#94A3B8' }}>{l}</span>
            <span style={{ fontWeight:700, color:c }}>{v}</span>
          </div>
        ))}
      </div>

      {avecDonnees.length > 0 && (
        <>
          <div className="stitle"><span>💰 Coût calculé ({avecDonnees.length})</span></div>
          {avecDonnees.map((c, i) => {
            const margeCol = c.margePct === null ? '#94A3B8' : c.margePct >= 35 ? '#16A34A' : c.margePct >= 20 ? '#D97706' : '#DC2626'
            return (
              <div key={i} className="cost-card" style={{ borderLeft:`4px solid ${margeCol}` }} onClick={() => setSheet(c)}>
                <div className="cost-head">
                  <div>
                    <div className="cost-client">{c.ord.client}</div>
                    <div style={{ fontSize:10, color:'#94A3B8' }}>{c.ord.ref}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div className="cost-total">{dh(c.coutRevient)}</div>
                    <div style={{ fontSize:9, color:'#94A3B8' }}>coût revient</div>
                  </div>
                </div>
                <div className="cost-grid">
                  {[['🧑‍🔧 MO',dh(c.totalMO),'#C4714F'],['🧱 Mat.',dh(c.totalMat),'#16A34A'],['🏭 Charges',dh(CHARGE_ART),'#D97706']].map(([l,v,col]) => (
                    <div key={l} className="cost-item">
                      <div className="cost-item-lbl">{l}</div>
                      <div className="cost-item-val" style={{ color:col }}>{v}</div>
                    </div>
                  ))}
                </div>
                {c.pv > 0 ? (
                  <>
                    <div className="margin-bar">
                      <div className="margin-bar-fill" style={{ width:Math.min(100,c.coutRevient/c.pv*100)+'%', background:'#E2E8F0' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                      <span style={{ color:'#64748B' }}>Vente : {dh(c.pv)}</span>
                      <span style={{ fontWeight:700, color:margeCol }}>Marge : {c.margePct}%</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:10, color:'#94A3B8', fontStyle:'italic' }}>Prix de vente non renseigné</div>
                )}
              </div>
            )
          })}
        </>
      )}

      {sansData.length > 0 && (
        <>
          <div className="stitle"><span>⏳ Pas encore lancé ({sansData.length})</span></div>
          {sansData.slice(0,5).map((c,i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'10px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{c.ord.client}</div>
                <div style={{ fontSize:10, color:'#94A3B8' }}>{c.ord.ref}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:10, color:'#94A3B8' }}>Charges fixes</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#D97706' }}>{dh(CHARGE_ART)}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Sheet détail */}
      {sheet && (
        <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&setSheet(null)}>
          <div className="sheet">
            <div className="sheet-handle"/>
            <div className="sheet-title">{sheet.ord.client}</div>
            <div className="sheet-sub">Analyse coût de revient</div>
            {[['Main d\'œuvre réelle', dh(sheet.totalMO)],['Matières premières', dh(sheet.totalMat)],['Quote-part charges fixes', dh(CHARGE_ART)],['= COÛT DE REVIENT', dh(sheet.coutRevient)],['Prix de vente', sheet.pv > 0 ? dh(sheet.pv) : 'Non renseigné'],sheet.marge !== null ? ['Marge brute', dh(sheet.marge)] : null,sheet.margePct !== null ? ['Marge %', sheet.margePct+'%'] : null].filter(Boolean).map(([l,v],i) => (
              <div key={l} className="sheet-row" style={{ fontWeight:i===3||i===6?700:400, background:i===3?'#FFF7F4':'' }}>
                <span style={{ color:i===3?'#C4714F':'#64748B' }}>{l}</span>
                <span style={{ color:i===3?'#C4714F':i===6?(sheet.margePct>=35?'#16A34A':sheet.margePct>=20?'#D97706':'#DC2626'):'#374151' }}>{v}</span>
              </div>
            ))}
            <button className="sheet-btn secondary" style={{ marginTop:14 }} onClick={() => setSheet(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

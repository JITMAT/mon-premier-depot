import React, { useState, useMemo } from 'react'
import { useApp } from '../store'

const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'
function daysLeft(d) {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / 86400000)
}
function fDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return String(dt.getDate()).padStart(2,'0') + '/' + String(dt.getMonth()+1).padStart(2,'0')
}

export default function CmdsMobile() {
  const { orders, setTab, setSelArt, selRef, arts } = useApp()
  const [filter, setFilter] = useState('all')  // all | retard | urgent | ok
  const [sheet, setSheet] = useState(null)

  const cmds = useMemo(() => {
    return orders.map(o => {
      const dl = daysLeft(o.liv)
      const isLate = dl !== null && dl < 0
      const isUrgent = !isLate && dl !== null && dl <= 3
      const artList = Object.values(arts).filter(a => a.ref === o.ref)
      return { ...o, dl, isLate, isUrgent, artList }
    }).sort((a,b) => {
      if (a.dl===null&&b.dl!==null) return 1
      if (a.dl!==null&&b.dl===null) return -1
      return (a.dl??999)-(b.dl??999)
    })
  }, [orders, arts])

  const filtered = cmds.filter(c => {
    if (filter==='retard') return c.isLate
    if (filter==='urgent') return c.isUrgent
    if (filter==='ok') return !c.isLate && !c.isUrgent && c.dl !== null
    return true
  })

  const retards = cmds.filter(c => c.isLate).length
  const urgents = cmds.filter(c => c.isUrgent).length

  function cardColor(c) {
    if (c.isLate) return '#DC2626'
    if (c.isUrgent) return '#D97706'
    if (c.dl !== null && c.dl <= 7) return '#C4714F'
    return '#16A34A'
  }

  return (
    <div className="pg" style={{ paddingBottom:14 }}>
      {/* KPIs */}
      <div className="kpi-row" style={{ marginTop:12 }}>
        <div className="kpi-card" style={{ borderLeftColor:'#DC2626' }}>
          <div className="kpi-lbl">En retard</div>
          <div className="kpi-val" style={{ color:'#DC2626' }}>{retards}</div>
          <div className="kpi-sub">commandes urgentes</div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor:'#D97706' }}>
          <div className="kpi-lbl">Cette semaine</div>
          <div className="kpi-val" style={{ color:'#D97706' }}>{urgents}</div>
          <div className="kpi-sub">livraisons ≤ 3j</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:2 }}>
        {[['all','Toutes',cmds.length],['retard','🔴 Retard',retards],['urgent','🟠 Urgent',urgents],['ok','🟢 OK',cmds.filter(c=>!c.isLate&&!c.isUrgent).length]].map(([k,l,n]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding:'6px 12px', borderRadius:20, border:'none', background:filter===k?'#0F172A':'#fff', color:filter===k?'#fff':'#64748B', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0, border:filter===k?'none':'1px solid #E2E8F0' }}>
            {l} ({n})
          </button>
        ))}
      </div>

      {/* Liste commandes */}
      {filtered.length === 0 && (
        <div className="empty">
          <i className="ti ti-clipboard-list" aria-hidden="true"/>
          <p>Aucune commande dans cette catégorie</p>
        </div>
      )}

      {filtered.map((cmd, i) => {
        const col = cardColor(cmd)
        const dl = cmd.dl
        return (
          <div key={i} className="order-card" style={{ borderLeftColor: col }} onClick={() => setSheet(cmd)}>
            <div className="oc-head">
              <div style={{ flex:1, minWidth:0 }}>
                <div className="oc-client">{cmd.client}</div>
                <div className="oc-ref">Réf {cmd.ref || '—'} · Liv. {fDate(cmd.liv)}</div>
              </div>
              {dl !== null ? (
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div className="oc-days" style={{ color:col }}>
                    {cmd.isLate ? '+' : ''}{Math.abs(dl)}
                  </div>
                  <div className="oc-days-lbl" style={{ color:col }}>
                    {cmd.isLate ? 'j retard' : 'j restants'}
                  </div>
                </div>
              ) : (
                <span style={{ fontSize:10, color:'#94A3B8', paddingTop:4 }}>Sans date</span>
              )}
            </div>
            <div className="oc-footer">
              <span className="oc-tag" style={{ background:col+'18', color:col }}>
                {cmd.isLate ? '🔴 En retard' : cmd.isUrgent ? '🟠 Urgent' : cmd.dl === null ? '⬜ Sans date' : '🟢 En cours'}
              </span>
              {cmd.artList.length > 0 && (
                <span className="oc-tag" style={{ background:'rgba(52,152,219,.1)', color:'#3498DB' }}>
                  {cmd.artList.length} article{cmd.artList.length>1?'s':''}
                </span>
              )}
              {cmd.total > 0 && <div className="oc-montant">{dh(cmd.total)}</div>}
            </div>
          </div>
        )
      })}

      {/* Bottom sheet détail commande */}
      {sheet && (
        <div className="sheet-overlay" onClick={e => e.target===e.currentTarget && setSheet(null)}>
          <div className="sheet">
            <div className="sheet-handle"/>
            <div className="sheet-title">{sheet.client}</div>
            <div className="sheet-sub">Réf {sheet.ref || '—'} · {fDate(sheet.liv)}</div>

            {/* Statut */}
            <div style={{ padding:'8px 12px', borderRadius:9, marginBottom:12, background: sheet.isLate?'#FEF2F2':sheet.isUrgent?'#FFFBEB':'#F0FDF4', border:`1px solid ${sheet.isLate?'#FECACA':sheet.isUrgent?'#FDE68A':'#BBF7D0'}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:sheet.isLate?'#DC2626':sheet.isUrgent?'#D97706':'#16A34A' }}>
                {sheet.isLate ? `🔴 Retard de ${Math.abs(sheet.dl)} jours` : sheet.isUrgent ? `🟠 Livraison dans ${sheet.dl} jour${sheet.dl>1?'s':''}` : sheet.dl!==null ? `🟢 Livraison dans ${sheet.dl} jours` : '⬜ Pas de date'}
              </div>
            </div>

            {/* Infos */}
            {[['Date commande', sheet.date ? new Date(sheet.date).toLocaleDateString('fr') : '—'],['Livraison prévue', fDate(sheet.liv)],['Total commande', sheet.total ? dh(sheet.total) : '—'],['Acompte', sheet.acompte ? dh(sheet.acompte) : '—'],['Solde restant', sheet.solde ? dh(sheet.solde) : '—'],['Statut', sheet.status || '—']].map(([l,v]) => (
              <div key={l} className="sheet-row">
                <span style={{ color:'#64748B' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}

            {/* Articles */}
            {sheet.artList?.length > 0 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8 }}>Articles ({sheet.artList.length})</div>
                {sheet.artList.map((art, ai) => (
                  <div key={ai} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#F8FAFC', borderRadius:8, marginBottom:4, cursor:'pointer' }}
                    onClick={() => { setSelArt(art.id); setSheet(null); setTab('cmd') }}>
                    {art.photo && <img src={art.photo} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:'cover' }}/>}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700 }}>{art.nom}</div>
                      <div style={{ fontSize:10, color:'#94A3B8' }}>{art.st === 'wip' ? '🟢 En fabrication' : art.st === 'ok' ? '✅ Terminé' : '⏳ À faire'}</div>
                    </div>
                    <i className="ti ti-chevron-right" style={{ color:'#94A3B8', fontSize:16 }} aria-hidden="true"/>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop:14 }}>
              <button className="sheet-btn success" onClick={() => { setSheet(null); setTab('atelier') }}>
                <i className="ti ti-tool" aria-hidden="true"/> Lancer fabrication
              </button>
              <button className="sheet-btn secondary" onClick={() => setSheet(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { useApp } from '../store'

export default function PlusMobile({ onLogout }) {
  const { setTab } = useApp()
  const modules = [
    { icon:'ti-clipboard-list', l:'Commandes',   t:'cmds',     c:'#3498DB' },
    { icon:'ti-tool',           l:'Atelier live', t:'atelier',  c:'#16A34A' },
    { icon:'ti-calculator',     l:'Coûts',        t:'cout',     c:'#C4714F' },
    { icon:'ti-calendar-week',  l:'Planning',     t:'planning', c:'#9B59B6' },
    { icon:'ti-packages',       l:'Stock',        t:'',         c:'#D97706' },
    { icon:'ti-truck',          l:'Livraisons',   t:'',         c:'#E74C3C' },
    { icon:'ti-chart-bar',      l:'Commerciales', t:'',         c:'#F39C12' },
    { icon:'ti-currency-dollar',l:'Finance',      t:'',         c:'#2ECC71' },
    { icon:'ti-brand-whatsapp', l:'WhatsApp',     t:'',         c:'#25D366' },
    { icon:'ti-settings',       l:'Config',       t:'',         c:'#64748B' },
  ]

  return (
    <div className="pg" style={{ paddingBottom:14, paddingTop:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
        {modules.map((m,i) => (
          <button key={i} onClick={() => m.t && setTab(m.t)} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'inherit', opacity:m.t?1:.5 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:m.c+'18', color:m.c, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className={`ti ${m.icon}`} style={{ fontSize:22 }} aria-hidden="true"/>
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>{m.l}</span>
          </button>
        ))}
      </div>
      <div style={{ background:'#0F172A', borderRadius:12, padding:14, marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:8 }}>CREAJIT MES v2</div>
        <div style={{ fontSize:11, color:'#64748B' }}>Pilotage fabrication · 37 ouvriers · 20 commandes actives</div>
        <div style={{ fontSize:11, color:'#C4714F', marginTop:4, fontWeight:600 }}>Driss Aarab — Direction</div>
      </div>
      <button onClick={onLogout} style={{ width:'100%', height:44, borderRadius:10, border:'1px solid #E2E8F0', background:'#fff', color:'#DC2626', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>
        Se déconnecter
      </button>
    </div>
  )
}

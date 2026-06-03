import React, { useState, useEffect } from 'react'
import { useAuth, useApp } from '../store'
import Orders from './Orders'
import { Cmd, ArtDetail, Team, Alertes } from './Cmd'
import Admin from './Admin'
import Achat from './Achat'
import Rentabilite from './Rentabilite'
import Planning from './Planning'
import Devis from './Devis'
import Pointeuse from './Pointeuse'

const TABS = [
  { id: 'orders',   ic: '📋', l: 'Commandes', roles: ['admin','production','commercial','livraison'] },
  { id: 'devis',    ic: '📝', l: 'Devis',     roles: ['admin','commercial','production','livraison','magasin'] },
  { id: 'team',     ic: '👷', l: 'Equipe',    roles: ['admin','production'] },
  { id: 'achat',    ic: '🛒', l: 'Achats',    roles: ['admin','production','magasin'] },
  { id: 'rent',     ic: '📊', l: 'Rentab.',   roles: ['admin'] },
  { id: 'planning', ic: '🗓️', l: 'Planning',  roles: ['admin','production'] },
  { id: 'pointeuse',ic: '⏱', l: 'Pointeuse', roles: ['admin','production'] },
  { id: 'alerts',   ic: '🔔', l: 'Alertes',   roles: ['admin','production','commercial','livraison','magasin'] },
  { id: 'admin',    ic: '⚙️', l: 'Admin',     roles: ['admin'] },
]

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTime(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0'))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="clk">{time}</span>
}

export default function Main() {
  const { user, logout } = useAuth()
  const { fetchOrders, tab, setTab, orders, ordersLastSync, selRef, selArt } = useApp()

  useEffect(() => {
    fetchOrders()
    const i = setInterval(fetchOrders, 5 * 60 * 1000)
    return () => clearInterval(i)
  }, [])

  const visibleTabs = TABS.filter(t => t.roles.includes(user?.role))
  const activeTab = ['cmd','art'].includes(tab) ? 'orders' : tab

  const syncAgo = ordersLastSync
    ? Math.floor((Date.now() - new Date(ordersLastSync)) / 60000) + 'min'
    : '—'

  return (
    <div className="app">
      {/* TOPBAR NOIR */}
      <div className="top">
        <div>
          <div className="logo">CREA<em>JIT</em> <span style={{color:'#475569',fontWeight:400,fontSize:10}}>MES v2</span></div>
          <div style={{fontSize:9,color:'#475569'}}>{orders.length} cmd · {syncAgo}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Clock />
          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(196,113,79,.2)',color:'#C4714F',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,cursor:'pointer'}} onClick={logout}>
            {user?.name?.slice(0,2).toUpperCase()||'DA'}
          </div>
        </div>
      </div>

      {/* PAGE */}
      <div className="body">
        {tab === 'orders'   && <Orders />}
        {tab === 'cmd'      && <Cmd />}
        {tab === 'art'      && <ArtDetail />}
        {tab === 'team'     && <Team />}
        {tab === 'achat'    && <Achat />}
        {tab === 'rent'     && user?.role === 'admin' && <Rentabilite />}
        {tab === 'planning' && <Planning />}
        {tab === 'devis'    && <Devis />}
        {tab === 'alerts'   && <Alertes />}
        {tab === 'admin'    && user?.role === 'admin' && <Admin />}
      </div>

      {/* NAV BAS NOIRE */}
      <div className="nav">
        {visibleTabs.map(t => (
          <button key={t.id} className={`nb ${activeTab===t.id?'on':''}`} onClick={() => setTab(t.id)}>
            <i>{t.ic}</i>{t.l}
          </button>
        ))}
      </div>
    </div>
  )
}

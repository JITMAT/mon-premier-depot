import React, { useState } from 'react'
import { useAuth, useApp } from '../store'

const ROLES = {
  admin:      { label: 'Administrateur', color: '#C4714F', ic: '👑' },
  production: { label: 'Resp. Production', color: '#9B59B6', ic: '🔨' },
  commercial: { label: 'Commerciale', color: '#3498DB', ic: '💼' },
  livraison:  { label: 'Livraison & SAV', color: '#27AE60', ic: '🚚' },
  magasin:    { label: 'Magasinier', color: '#F39C12', ic: '📦' },
}

const INITIAL_USERS = [
  { id: 'u1', name: 'Driss Aarab', email: 'driss@creajit.ma', role: 'admin', tel: '+33602088048', actif: true },
  { id: 'u2', name: 'Hanane Ajdi', email: 'hanane@creajit.ma', role: 'production', tel: '+212602434387', actif: true },
  { id: 'u3', name: 'Kenza Mokhantar', email: 'kenza@creajit.ma', role: 'commercial', tel: '+212626704669', actif: true },
  { id: 'u4', name: 'Ikram Benaddi', email: 'ikram@creajit.ma', role: 'commercial', tel: '+212711303969', actif: true },
  { id: 'u5', name: 'Laila Boudil', email: 'laila@creajit.ma', role: 'commercial', tel: '+212671171780', actif: true },
  { id: 'u6', name: 'Fatima Sedky', email: 'fatima@creajit.ma', role: 'livraison', tel: '+212626069989', actif: true },
  { id: 'u7', name: 'Mohamed Moumen', email: 'moumen@creajit.ma', role: 'magasin', tel: '+212605958012', actif: true },
]

function UserCard({ user, onEdit, onToggle }) {
  const role = ROLES[user.role]
  return (
    <div style={{
      background: 'var(--c1)', border: `1px solid ${user.actif ? 'var(--bd)' : 'rgba(231,76,60,.3)'}`,
      borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12,
      opacity: user.actif ? 1 : .6
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: `${role?.color || 'var(--or)'}22`,
        border: `2px solid ${role?.color || 'var(--or)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20
      }}>
        {role?.ic || '👤'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: 'var(--mu)' }}>{user.email}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: `${role?.color}22`, color: role?.color
          }}>{role?.label}</span>
          {!user.actif && <span style={{ fontSize: 9, color: 'var(--rd)', fontWeight: 700 }}>DÉSACTIVÉ</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onEdit(user)} style={{
          padding: '6px 12px', borderRadius: 8, border: '1px solid var(--bd)',
          background: 'var(--c2)', color: 'var(--tx)', cursor: 'pointer', fontSize: 11,
          fontFamily: 'inherit', fontWeight: 700
        }}>✏️ Modifier</button>
        <button onClick={() => onToggle(user.id)} style={{
          padding: '6px 12px', borderRadius: 8, border: 'none',
          background: user.actif ? 'rgba(231,76,60,.15)' : 'rgba(46,204,113,.15)',
          color: user.actif ? 'var(--rd)' : 'var(--gn)',
          cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 700
        }}>{user.actif ? '🚫' : '✅'}</button>
      </div>
    </div>
  )
}

export default function Admin() {
  const { user: currentUser } = useAuth()
  const { orders, arts, sessions, fetchOrders } = useApp()
  const { token } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState(INITIAL_USERS)
  const [editUser, setEditUser] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'commercial', tel: '', password: '' })

  const dh = n => Math.round(n || 0).toLocaleString('fr') + ' DH'

  const stats = {
    orders: orders.length,
    retards: orders.filter(o => o.late).length,
    totalCA: orders.reduce((s, o) => s + (o.tot || 0), 0),
    totalSol: orders.reduce((s, o) => s + (o.sol || 0), 0),
    articles: Object.keys(arts).length,
    sessions: sessions.filter(s => s.st === 'run').length,
    users: users.filter(u => u.actif).length,
  }

  return (
    <div>
      {/* Admin tabs */}
      <div style={{ display: 'flex', gap: 3, background: 'var(--c2)', borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {[
          { id: 'overview', l: '📊 Vue d\'ensemble' },
          { id: 'users',    l: '👥 Utilisateurs' },
          { id: 'sync',     l: '🔄 Synchronisation' },
          { id: 'settings', l: '⚙️ Paramètres' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none',
            background: activeTab === t.id ? 'var(--or)' : 'none',
            color: activeTab === t.id ? '#fff' : 'var(--mu)',
            cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit'
          }}>{t.l}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="fadeIn">
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 10 }}>
            Tableau de bord — {new Date().toLocaleDateString('fr')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { v: stats.orders, l: 'Commandes actives', c: 'var(--bl)', ic: '📋' },
              { v: stats.retards, l: 'En retard', c: 'var(--rd)', ic: '⚠️' },
              { v: dh(stats.totalCA), l: 'CA total', c: 'var(--or)', ic: '💰', small: true },
              { v: dh(stats.totalSol), l: 'À encaisser', c: 'var(--rd)', ic: '💳', small: true },
              { v: stats.articles, l: 'Articles en prod.', c: 'var(--pu)', ic: '🔨' },
              { v: stats.sessions, l: 'Timers actifs', c: 'var(--gn)', ic: '⏱' },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{s.ic}</span>
                  <span style={{ fontSize: 9, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: s.small ? 15 : 22, fontWeight: 700, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Per commercial */}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 10 }}>
            Performance par commerciale
          </div>
          {['Kenza','Ikram','Laila'].map(com => {
            const ords = orders.filter(o => o.com === com)
            const ca = ords.reduce((s,o) => s+(o.tot||0), 0)
            const sol = ords.reduce((s,o) => s+(o.sol||0), 0)
            return (
              <div key={com} style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(52,152,219,.15)', border: '1.5px solid var(--bl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--bl)' }}>
                    {com[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{com}</div>
                    <div style={{ fontSize: 10, color: 'var(--mu)' }}>{ords.length} commandes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--or)' }}>{dh(ca)}</div>
                    <div style={{ fontSize: 10, color: sol > 0 ? 'var(--rd)' : 'var(--gn)' }}>{sol > 0 ? dh(sol) + ' dû' : 'Tout encaissé'}</div>
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--bd)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'var(--or)', width: Math.min(100, (ca / 40000) * 100) + '%' }}/>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Users management */}
      {activeTab === 'users' && (
        <div className="fadeIn">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mu)', textTransform: 'uppercase' }}>
              {users.length} utilisateurs
            </div>
            <button onClick={() => setShowAddUser(true)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--or)', color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
            }}>＋ Ajouter utilisateur</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <UserCard key={u.id} user={u}
                onEdit={setEditUser}
                onToggle={id => setUsers(prev => prev.map(u => u.id === id ? {...u, actif: !u.actif} : u))}
              />
            ))}
          </div>

          {/* Add user modal */}
          {showAddUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ background: 'var(--c1)', borderRadius: '14px 14px 0 0', padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ width: 32, height: 3, background: 'var(--bd)', borderRadius: 2, margin: '0 auto 16px' }}/>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Ajouter un utilisateur</div>
                {[
                  { k: 'name', l: 'Nom complet', t: 'text', ph: 'Ahmed Benali' },
                  { k: 'email', l: 'Email', t: 'email', ph: 'ahmed@creajit.ma' },
                  { k: 'tel', l: 'Téléphone', t: 'tel', ph: '+212600000000' },
                  { k: 'password', l: 'Mot de passe', t: 'password', ph: '••••••••' },
                ].map(f => (
                  <div key={f.k} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{f.l}</div>
                    <input type={f.t} placeholder={f.ph} value={newUser[f.k] || ''}
                      onChange={e => setNewUser(p => ({...p, [f.k]: e.target.value}))}
                      style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '9px 12px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Rôle</div>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value}))}
                    style={{ width: '100%', background: 'var(--c2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '9px 12px', color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                    {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.ic} {v.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => setShowAddUser(false)} style={{ padding: '11px', borderRadius: 8, border: '1px solid var(--bd)', background: 'var(--c2)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Annuler</button>
                  <button onClick={() => {
                    if (!newUser.name || !newUser.email) return
                    setUsers(prev => [...prev, { ...newUser, id: 'u' + Date.now(), actif: true }])
                    setNewUser({ name: '', email: '', role: 'commercial', tel: '', password: '' })
                    setShowAddUser(false)
                  }} style={{ padding: '11px', borderRadius: 8, border: 'none', background: 'var(--or)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                    ✅ Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sync */}
      {activeTab === 'sync' && (
        <div className="fadeIn">
          <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔄 Synchronisation CreaJit</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12 }}>
              Connexion : driss@salle91.com · API : creajit.ma
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'var(--c2)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gn)' }}>{orders.length}</div>
                <div style={{ fontSize: 10, color: 'var(--mu)' }}>Commandes chargées</div>
              </div>
              <div style={{ background: 'var(--c2)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--or)' }}>{Object.keys(arts).length}</div>
                <div style={{ fontSize: 10, color: 'var(--mu)' }}>Articles chargés</div>
              </div>
            </div>
            <button onClick={() => fetchOrders(token)} style={{
              width: '100%', marginTop: 12, padding: 11, borderRadius: 8, border: 'none',
              background: 'var(--or)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700
            }}>
              🔄 Forcer synchronisation maintenant
            </button>
          </div>

          <div style={{ background: 'rgba(46,204,113,.06)', border: '1px solid rgba(46,204,113,.2)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gn)', marginBottom: 8 }}>✅ API Connectée</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', lineHeight: 1.6 }}>
              • Sync auto toutes les 5 minutes<br/>
              • 8 ateliers surveillés<br/>
              • Articles + photos + dimensions chargés<br/>
              • Noms clients réels depuis CreaJit
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="fadeIn">
          <div style={{ background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏢 Informations CREAJIT</div>
            {[
              { l: 'Entreprise', v: 'CREAJIT' },
              { l: 'Adresse', v: 'ZI Sidi Ghanem, Marrakech' },
              { l: 'Email', v: 'jitmat.contact@gmail.com' },
              { l: 'WhatsApp Direction', v: '+33 6 02 08 80 48' },
            ].map(f => (
              <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--mu)', width: 110, flexShrink: 0 }}>{f.l}</span>
                <span style={{ fontSize: 12, color: 'var(--tx)' }}>{f.v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(52,152,219,.06)', border: '1px solid rgba(52,152,219,.2)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--bl)', marginBottom: 8 }}>📱 Connexions actives</div>
            {[
              { ic: '🤖', l: 'Claude AI (Anthropic)', st: '✅ Connecté', c: 'var(--gn)' },
              { ic: '📲', l: 'WhatsApp (Wassenger)', st: '✅ Connecté', c: 'var(--gn)' },
              { ic: '⚙️', l: 'Make.com (Automation)', st: '✅ Connecté', c: 'var(--gn)' },
              { ic: '⏰', l: 'Pointeuse', st: '🔗 À configurer', c: 'var(--yw)' },
            ].map(c => (
              <div key={c.l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{c.ic}</span>
                <span style={{ flex: 1, fontSize: 12 }}>{c.l}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.c }}>{c.st}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

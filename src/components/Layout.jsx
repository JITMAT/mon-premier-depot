import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../store'
import { LIBELLE_ROLE } from '../data/equipe.js'
import { SNAPSHOT_DATE } from '../data/snapshot.js'

// Menu de gauche (CONTEXT §9 : menu à gauche pour les interfaces salarié,
// cockpit pour le patron). Pour le Module 2 on garde un menu commun simple.
const MENU = [
  { to: '/',            libelle: 'Tableau de bord', icone: '▦' },
  { to: '/commandes',   libelle: 'Commandes',       icone: '🧾' },
  { to: '/referentiel', libelle: 'Référentiel',     icone: '⚙' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div style={{ minHeight: '100%', display: 'flex' }}>
      {/* ── Menu de gauche ── */}
      <aside style={{
        width: 230, flexShrink: 0, borderRight: '1px solid var(--bordure)',
        padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 4,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '4px 8px 18px' }}>
          <div style={{ fontFamily: 'var(--f-titre)', fontSize: 22, fontWeight: 700 }}>
            CREAJIT <span style={{ color: 'var(--orange)' }}>IA</span>
          </div>
          <div className="faible" style={{ fontSize: 11 }}>Pilotage d'atelier</div>
        </div>

        {MENU.map(m => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 12px', borderRadius: 10, fontWeight: 600, fontSize: 15,
              color: isActive ? 'var(--texte)' : 'var(--texte-doux)',
              background: isActive ? 'var(--carte-2)' : 'transparent',
            })}
          >
            <span style={{ width: 18, textAlign: 'center' }}>{m.icone}</span>{m.libelle}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--bordure)', paddingTop: 14 }}>
          <div style={{ fontWeight: 600 }}>{user.nom}</div>
          <div className="muet" style={{ fontSize: 13, marginBottom: 10 }}>{LIBELLE_ROLE[user.role]}</div>
          <button className="btn btn-block" onClick={logout}>Déconnexion</button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main style={{ flex: 1, minWidth: 0, padding: '22px 26px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {children}
          <p className="faible" style={{ fontSize: 11, marginTop: 28, textAlign: 'center' }}>
            Données CREAJIT — instantané du {SNAPSHOT_DATE}
          </p>
        </div>
      </main>
    </div>
  )
}

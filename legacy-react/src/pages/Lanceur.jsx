import React from 'react'
import { useAuth } from '../store'
import { ROLES, LIBELLE_ROLE } from '../data/equipe.js'

// Lanceur : après connexion, donne accès aux écrans validés (les maquettes
// construites avec Driss). Chaque écran est une page complète servie depuis
// /ecrans/*.html. On met en avant l'écran principal selon le rôle.
const ECRANS = [
  { id: 'cockpit',   url: '/ecrans/cockpit.html',   titre: 'Cockpit Patron',  desc: 'Hanane · Ateliers · Boss live · Rentabilité', icone: '👁️', roles: [ROLES.PATRON, ROLES.COMPTABLE, ROLES.COMMERCIAL, ROLES.CHEF_ATELIER] },
  { id: 'ouvrier',   url: '/ecrans/ouvrier.html',   titre: 'Agent Ouvrier',   desc: 'File de travail, chrono, pauses, fabriqués, paie', icone: '👷', roles: [ROLES.OUVRIER] },
  { id: 'hanane',    url: '/ecrans/hanane.html',    titre: 'Agent Hanane',    desc: 'Vérifier et affecter les étapes aux ouvriers', icone: '🗂️', roles: [ROLES.EXPLOITATION] },
  { id: 'banc',      url: '/ecrans/banc-test.html', titre: 'Banc de test agents', desc: 'Les agents se parlent (dispatch → ouvrier → boss)', icone: '🔀', roles: [] },
]

export default function Lanceur() {
  const { user, logout } = useAuth()

  // Écran principal recommandé pour ce rôle (mis en premier)
  const recommande = ECRANS.find(e => e.roles.includes(user.role))?.id
  const liste = [...ECRANS].sort((a, b) => (a.id === recommande ? -1 : b.id === recommande ? 1 : 0))

  return (
    <div style={{ minHeight: '100%', maxWidth: 960, margin: '0 auto', padding: '28px 22px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: 'var(--f-titre)', fontSize: 24, fontWeight: 700 }}>
          CREAJIT <span style={{ color: 'var(--orange)' }}>IA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="muet">{user.nom} · {LIBELLE_ROLE[user.role]}</span>
          <button className="btn" onClick={logout}>Déconnexion</button>
        </div>
      </header>
      <p className="muet" style={{ marginTop: 0, marginBottom: 22 }}>Bonjour {user.nom} — choisis un écran à ouvrir.</p>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {liste.map(e => {
          const estRecommande = e.id === recommande
          return (
            <a key={e.id} href={e.url}
              style={{
                display: 'block', background: 'var(--carte)',
                border: `1px solid ${estRecommande ? 'var(--orange)' : 'var(--bordure)'}`,
                borderRadius: 16, padding: 20, transition: 'filter .15s',
              }}
              onMouseEnter={ev => ev.currentTarget.style.filter = 'brightness(1.12)'}
              onMouseLeave={ev => ev.currentTarget.style.filter = 'none'}
            >
              <div style={{ fontSize: 34, marginBottom: 10 }}>{e.icone}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--f-titre)', fontSize: 19, fontWeight: 700 }}>{e.titre}</span>
                {estRecommande && (
                  <span style={{ fontSize: 11, background: 'var(--orange)', color: '#1a0f08', borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>
                    Pour toi
                  </span>
                )}
              </div>
              <div className="muet" style={{ fontSize: 13, marginTop: 6 }}>{e.desc}</div>
              <div style={{ marginTop: 14, color: 'var(--orange)', fontWeight: 600, fontSize: 14 }}>Ouvrir →</div>
            </a>
          )
        })}
      </div>

      <p className="faible" style={{ fontSize: 12, marginTop: 26, textAlign: 'center' }}>
        Écrans validés avec Driss. Pour revenir ici depuis un écran, utilise le bouton « retour » du navigateur.
      </p>
    </div>
  )
}

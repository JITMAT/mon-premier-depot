import React from 'react'
import { useAuth } from '../store'
import { ATELIERS } from '../data/ateliers.js'
import { LIBELLE_ROLE, DIRECTION } from '../data/equipe.js'
import { CHARGES_FIXES, CHUTES, dh } from '../lib/calculs.js'

// Accueil du Socle (Module 1). Confirme que les fondations sont en place :
// équipe, ateliers et règles de calcul chargées. Les vrais modules
// (Ouvrier, Hanane, Cockpit…) viendront se brancher ensuite.
export default function Accueil() {
  const { user, logout } = useAuth()

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* En-tête */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px', borderBottom: '1px solid var(--bordure)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <strong style={{ fontFamily: 'var(--f-titre)', fontSize: 20 }}>
            CREAJIT <span style={{ color: 'var(--orange)' }}>IA</span>
          </strong>
          <span className="faible" style={{ fontSize: 12 }}>Module 1 — Socle</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="muet">{user.nom} · {LIBELLE_ROLE[user.role]}</span>
          <button className="btn" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main style={{ padding: 22, display: 'grid', gap: 18, maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div className="carte">
          <h2 style={{ fontSize: 22 }}>Bonjour {user.nom} 👋</h2>
          <p className="muet" style={{ marginBottom: 0 }}>
            Le socle est en place : authentification, modèle de données et règles de calcul.
            Les modules suivants (Agent Ouvrier, Hanane, Cockpit patron…) se brancheront ici.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Ateliers */}
          <section className="carte">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>Ateliers & taux horaires</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--texte-doux)' }}>
                  <th style={{ padding: '4px 0' }}>Code</th><th>Atelier</th><th>Chef</th><th style={{ textAlign: 'right' }}>DH/h</th>
                </tr>
              </thead>
              <tbody>
                {ATELIERS.map(a => (
                  <tr key={a.code} style={{ borderTop: '1px solid var(--bordure)' }}>
                    <td style={{ padding: '6px 0', color: 'var(--orange)', fontWeight: 600 }}>{a.code}</td>
                    <td>{a.nom}</td>
                    <td className="muet">{a.chef}</td>
                    <td style={{ textAlign: 'right' }}>{a.taux}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Règles de calcul */}
          <section className="carte">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>Règles de calcul</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.9 }}>
              <li>Main d'œuvre = heures × taux atelier</li>
              <li>Matières = qté × prix × (1 + chute)</li>
              <li>Charges fixes = <strong>{dh(CHARGES_FIXES)}</strong> / article</li>
              <li>Coût de revient = MO + matières + charges fixes</li>
              <li>Marge = prix de vente − coût de revient</li>
              <li>Prime salarié = 1% du bénéfice <span className="faible">(base à confirmer)</span></li>
            </ul>
            <div style={{ marginTop: 12, fontSize: 13 }} className="muet">
              Chutes : {Object.entries(CHUTES).map(([k, v]) => `${k} +${Math.round(v * 100)}%`).join(' · ')}
            </div>
          </section>

          {/* Équipe de direction */}
          <section className="carte">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>Équipe de direction</h3>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
              {DIRECTION.map(d => (
                <li key={d.id}>
                  <strong>{d.nom}</strong> <span className="muet">— {d.fonction}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}

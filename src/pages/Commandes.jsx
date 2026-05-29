import React from 'react'
import { COMMANDES, RETARDS, COMMANDE_REF } from '../data/snapshot.js'
import { dh } from '../lib/calculs.js'

// Map référence -> jours de retard (pour afficher un badge)
const RETARD_PAR_REF = Object.fromEntries(RETARDS.map(r => [r.ref, r.joursRetard]))

const LIBELLE_STATUT = { ready: 'Prête', confirmed: 'Confirmée' }

export default function Commandes() {
  const ref = COMMANDE_REF
  const totalArticles = ref.articles.reduce((t, a) => t + a.quantite * a.prix, 0)

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 2 }}>Commandes en fabrication</h1>
      <p className="muet" style={{ marginTop: 0, marginBottom: 20 }}>{COMMANDES.length} commandes en cours dans l'atelier.</p>

      {/* Liste des commandes */}
      <div className="carte" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--texte-doux)', background: 'var(--carte-2)' }}>
              <th style={{ padding: '11px 16px' }}>Référence</th>
              <th>Client</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right', padding: '11px 16px' }}>Livraison</th>
            </tr>
          </thead>
          <tbody>
            {COMMANDES.map(c => {
              const retard = RETARD_PAR_REF[c.ref]
              return (
                <tr key={c.ref + c.client} style={{ borderTop: '1px solid var(--bordure)' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 600 }}>{c.ref || '—'}</td>
                  <td className="muet">{c.client}</td>
                  <td>
                    <span style={{
                      fontSize: 12, padding: '3px 9px', borderRadius: 8,
                      background: c.statut === 'ready' ? 'rgba(47,189,116,.15)' : 'rgba(232,181,59,.15)',
                      color: c.statut === 'ready' ? 'var(--vert)' : 'var(--jaune)',
                    }}>
                      {LIBELLE_STATUT[c.statut] || c.statut}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '11px 16px' }}>
                    {retard
                      ? <span style={{ color: 'var(--rouge)', fontWeight: 600 }}>+{retard} j de retard</span>
                      : <span className="muet">{c.livraison || '—'}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Détail de la commande de référence */}
      <h2 style={{ fontSize: 19, marginTop: 28, marginBottom: 12 }}>Détail commande {ref.ref}</h2>
      <div className="carte">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{ref.client}</div>
            <div className="muet" style={{ fontSize: 14 }}>Commerciale : {ref.commercial} · {ref.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--f-titre)', fontSize: 26, fontWeight: 700 }}>{dh(ref.total)}</div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--vert)' }}>Payé {dh(ref.paye)}</span>
              {' · '}
              <span style={{ color: 'var(--rouge)' }}>Reste {dh(ref.restant)}</span>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--texte-doux)' }}>
              <th style={{ padding: '6px 0' }}>Article</th>
              <th style={{ textAlign: 'right' }}>Qté</th>
              <th style={{ textAlign: 'right' }}>Prix unit.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ref.articles.map(a => (
              <tr key={a.nom} style={{ borderTop: '1px solid var(--bordure)' }}>
                <td style={{ padding: '8px 0' }}>{a.nom}</td>
                <td style={{ textAlign: 'right' }}>{a.quantite}</td>
                <td style={{ textAlign: 'right' }} className="muet">{dh(a.prix)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{dh(a.quantite * a.prix)}</td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid var(--bordure)' }}>
              <td colSpan={3} style={{ padding: '8px 0', fontWeight: 600 }}>Total articles</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--orange)' }}>{dh(totalArticles)}</td>
            </tr>
          </tbody>
        </table>

        {ref.notes && <p className="muet" style={{ fontSize: 13, marginTop: 14, marginBottom: 0 }}>📝 {ref.notes}</p>}
      </div>
    </div>
  )
}

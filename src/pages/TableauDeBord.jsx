import React from 'react'
import { useAuth } from '../store'
import { CarteChiffre } from '../components/Carte.jsx'
import { RH, PRODUCTION, SYSTEME, RETARDS } from '../data/snapshot.js'
import { dh } from '../lib/calculs.js'

// Tableau de bord (cockpit-lite, CONTEXT §3 Agent Patron) — chiffres du jour
// réels + alertes commandes en retard.
export default function TableauDeBord() {
  const { user } = useAuth()

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 2 }}>Tableau de bord</h1>
      <p className="muet" style={{ marginTop: 0, marginBottom: 20 }}>Bonjour {user.nom} — voici l'atelier aujourd'hui.</p>

      {/* Chiffres du jour */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <CarteChiffre titre="En fabrication"    valeur={PRODUCTION.enFabrication} sous="commandes en cours" />
        <CarteChiffre titre="Livrées ce mois"   valeur={PRODUCTION.livreesCeMois} couleur="var(--vert)" />
        <CarteChiffre titre="En retard"         valeur={PRODUCTION.enRetard} couleur="var(--rouge)" sous="à surveiller" />
        <CarteChiffre titre="Employés"          valeur={RH.totalEmployes} sous={`${RH.actifs} actifs`} />
        <CarteChiffre titre="Avances du mois"   valeur={dh(RH.avancesMois)} couleur="var(--jaune)" sous={`${RH.nbAvances} avances`} />
        <CarteChiffre titre="Stock bas"         valeur={SYSTEME.alertesStockBas} couleur="var(--orange)" sous={`sur ${SYSTEME.produits} produits`} />
      </div>

      {/* Alertes : commandes en retard */}
      <div className="carte" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18 }}>⚠️ Commandes en retard</h2>
          <span className="muet" style={{ fontSize: 13 }}>{RETARDS.length} commandes</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--texte-doux)' }}>
              <th style={{ padding: '6px 0' }}>Référence</th><th>Client</th><th style={{ textAlign: 'right' }}>Retard</th>
            </tr>
          </thead>
          <tbody>
            {RETARDS.map(r => (
              <tr key={r.ref} style={{ borderTop: '1px solid var(--bordure)' }}>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>{r.ref}</td>
                <td className="muet">{r.client}</td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{
                    background: r.joursRetard >= 21 ? 'var(--rouge)' : 'var(--jaune)',
                    color: '#1a0f08', borderRadius: 8, padding: '3px 9px', fontWeight: 700, fontSize: 13,
                  }}>
                    {r.joursRetard} j
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

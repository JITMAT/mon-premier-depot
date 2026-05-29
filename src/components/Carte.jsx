import React from 'react'

// Petite carte « gros chiffre » pour le tableau de bord (CONTEXT §9).
export function CarteChiffre({ titre, valeur, sous, couleur }) {
  return (
    <div className="carte" style={{ padding: 16 }}>
      <div className="muet" style={{ fontSize: 13 }}>{titre}</div>
      <div style={{ fontFamily: 'var(--f-titre)', fontSize: 34, fontWeight: 700, color: couleur || 'var(--texte)', lineHeight: 1.1, marginTop: 4 }}>
        {valeur}
      </div>
      {sous && <div className="faible" style={{ fontSize: 12, marginTop: 2 }}>{sous}</div>}
    </div>
  )
}

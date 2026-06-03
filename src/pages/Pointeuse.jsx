import React from 'react'

// Onglet « Pointeuse » du MES.
// La pointeuse est une application autonome (monofichier creajit-app.html,
// persistance localStorage). On l'intègre telle quelle via un iframe : son
// code n'est PAS modifié. Pour mettre la version définitive, il suffit de
// remplacer public/creajit-app.html — cet onglet l'affichera à l'identique.
export default function Pointeuse() {
  return (
    <div style={{ margin: -14 }}>
      <iframe
        src="/creajit-app.html"
        title="CREAJIT — Pointage & RH"
        style={{
          width: '100%',
          height: 'calc(100dvh - 104px)',
          border: 'none',
          display: 'block',
          background: '#0B1120',
        }}
        allow="camera; fullscreen"
      />
    </div>
  )
}

import React, { useState } from 'react'
import { useAuth } from '../store'
import { DIRECTION, LIBELLE_ROLE } from '../data/equipe.js'

// Écran de connexion (Socle). Sélection du compte + code PIN simple.
export default function Login() {
  const { login } = useAuth()
  const [id, setId] = useState(DIRECTION[0].id)
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    setErr('')
    try {
      login(id, pin)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form className="carte" onSubmit={onSubmit} style={{ width: 360, maxWidth: '100%' }}>
        <h1 style={{ fontSize: 30, marginBottom: 4 }}>CREAJIT <span style={{ color: 'var(--orange)' }}>IA</span></h1>
        <p className="muet" style={{ marginTop: 0, marginBottom: 22 }}>Pilotage d'atelier — connexion</p>

        <label className="label">Compte</label>
        <select className="champ" value={id} onChange={e => setId(e.target.value)} style={{ marginBottom: 14 }}>
          {DIRECTION.map(d => (
            <option key={d.id} value={d.id}>{d.nom} — {LIBELLE_ROLE[d.role]}</option>
          ))}
        </select>

        <label className="label">Code</label>
        <input
          className="champ"
          type="password"
          inputMode="numeric"
          placeholder="••••"
          value={pin}
          onChange={e => setPin(e.target.value)}
          style={{ marginBottom: 14 }}
          autoFocus
        />

        {err && <p style={{ color: 'var(--rouge)', margin: '0 0 12px' }}>{err}</p>}

        <button className="btn btn-primaire btn-block" type="submit">Se connecter</button>

        <p className="faible" style={{ fontSize: 12, marginTop: 16, marginBottom: 0 }}>
          Code d'accès partagé : 0000
        </p>
      </form>
    </div>
  )
}

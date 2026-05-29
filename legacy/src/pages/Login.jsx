import React, { useState } from 'react'
import { useAuth } from '../store'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--c1)', border: '1px solid var(--bd)', borderRadius: 16,
        padding: 36, boxShadow: 'var(--shadow)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: 'var(--mu)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            Système de Gestion
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>
            CREA<span style={{ color: 'var(--or)' }}>JIT</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
            Manufacturing Execution System
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com" required autoComplete="email"
              style={{
                width: '100%', background: 'var(--c2)', border: '1.5px solid var(--bd)',
                borderRadius: 8, padding: '11px 14px', color: 'var(--tx)', fontSize: 14,
                outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--or)'}
              onBlur={e => e.target.style.borderColor = 'var(--bd)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{
                width: '100%', background: 'var(--c2)', border: '1.5px solid var(--bd)',
                borderRadius: 8, padding: '11px 44px 11px 14px', color: 'var(--tx)', fontSize: 14,
                outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--or)'}
              onBlur={e => e.target.style.borderColor = 'var(--bd)'}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 12, top: 30, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mu)', fontSize: 16 }}>
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--rd)', textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: loading ? 'var(--bd)' : 'var(--or)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'opacity .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin"/>
                Connexion...
              </>
            ) : '🔐 Se connecter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--mu)' }}>
          CREAJIT MES v2.0 — Marrakech 🇲🇦
        </div>
      </div>
    </div>
  )
}

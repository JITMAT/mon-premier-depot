import React, { useEffect } from 'react'
import { useAuth, useApp } from './store'
import { DEMO_USER, DEMO_ORDERS, DEMO_ARTS } from './demo'
import Login from './pages/Login'
import Main from './pages/Main'

export default function App() {
  const { user, token } = useAuth()
  const { fetchOrders } = useApp()

  // ── MODE DÉMO (branche demo uniquement) ──────────────────────────
  // Faux login + données d'exemple pour pouvoir naviguer sans backend.
  useEffect(() => {
    useAuth.setState({ user: DEMO_USER, token: 'demo' })
    useApp.setState(s => ({ orders: DEMO_ORDERS, arts: { ...DEMO_ARTS, ...s.arts } }))
  }, [])

  // Auto-sync orders every 5 minutes (désactivé en démo : pas de backend)
  useEffect(() => {
    if (!token || token === 'demo') return
    fetchOrders(token)
    const interval = setInterval(() => fetchOrders(token), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token])

  if (!user) return <Login />
  return <Main />
}

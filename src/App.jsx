import React, { useEffect } from 'react'
import { useAuth, useApp } from './store'
import Login from './pages/Login'
import Main from './pages/Main'

export default function App() {
  const { user, token } = useAuth()
  const { fetchOrders } = useApp()

  // Auto-sync orders every 5 minutes
  useEffect(() => {
    if (!token) return
    fetchOrders(token)
    const interval = setInterval(() => fetchOrders(token), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token])

  if (!user) return <Login />
  return <Main />
}

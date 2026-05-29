import React from 'react'
import { useAuth } from './store'
import Login from './pages/Login'
import Lanceur from './pages/Lanceur'

// Porte d'authentification. Après connexion, le lanceur donne accès aux
// écrans validés (Cockpit, Agent Ouvrier, Agent Hanane, Banc de test).
export default function App() {
  const { user } = useAuth()
  if (!user) return <Login />
  return <Lanceur />
}

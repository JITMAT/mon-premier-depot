import React from 'react'
import { useAuth } from './store'
import Login from './pages/Login'
import Accueil from './pages/Accueil'

// Module 1 (Socle) : porte d'authentification simple.
// Tant qu'aucun utilisateur n'est connecté, on affiche l'écran de connexion.
export default function App() {
  const { user } = useAuth()
  if (!user) return <Login />
  return <Accueil />
}

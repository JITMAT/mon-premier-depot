import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store'
import Login from './pages/Login'
import Layout from './components/Layout'
import TableauDeBord from './pages/TableauDeBord'
import Commandes from './pages/Commandes'
import Referentiel from './pages/Referentiel'

// Porte d'authentification + routage (menu de gauche).
export default function App() {
  const { user } = useAuth()
  if (!user) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TableauDeBord />} />
        <Route path="/commandes" element={<Commandes />} />
        <Route path="/referentiel" element={<Referentiel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import MainLayout from '@/layouts/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Dossiers from '@/pages/Dossiers'
import DossierDetail from '@/pages/DossierDetail'
import Demandes from '@/pages/Demandes'
import Avocats from '@/pages/Avocats'
import Users from '@/pages/Users'

// Placeholder components for other pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Cette page sera implémentée prochainement.</p>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="demandes" element={<Demandes />} />
          <Route path="dossiers" element={<Dossiers />} />
          <Route path="dossiers/:id" element={<DossierDetail />} />
          <Route path="decisions" element={<PlaceholderPage title="Décisions" />} />
          <Route path="conventions" element={<PlaceholderPage title="Conventions" />} />
          <Route path="paiements" element={<PlaceholderPage title="Paiements" />} />
          <Route path="avocats" element={<Avocats />} />
          <Route path="suivi-2-mois" element={<PlaceholderPage title="Suivi 2 mois" />} />
          
          {/* Admin routes */}
          <Route
            path="utilisateurs"
            element={
              <ProtectedRoute adminOnly>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="sgami"
            element={
              <ProtectedRoute adminOnly>
                <PlaceholderPage title="SGAMI" />
              </ProtectedRoute>
            }
          />
          <Route
            path="badges"
            element={
              <ProtectedRoute adminOnly>
                <PlaceholderPage title="Badges" />
              </ProtectedRoute>
            }
          />
          <Route
            path="parametres"
            element={
              <ProtectedRoute adminOnly>
                <PlaceholderPage title="Paramètres" />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
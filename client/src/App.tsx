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
import Badges from '@/pages/Badges'
import SGAMIPage from '@/pages/SGAMI'
import PCEPage from '@/pages/PCE'
import VisaPage from '@/pages/Visa'
import DiligencesPage from '@/pages/Diligences'
import Decisions from '@/pages/Decisions'
import Conventions from '@/pages/Conventions'
import GradesPage from '@/pages/Grades'

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
          <Route path="decisions" element={<Decisions />} />
          <Route path="conventions" element={<Conventions />} />
          <Route path="paiements" element={<PlaceholderPage title="Paiements" />} />
          <Route path="avocats" element={<Avocats />} />
          <Route path="revue" element={<PlaceholderPage title="Revue" />} />
          <Route path="statistiques" element={<PlaceholderPage title="Statistiques" />} />
          
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
                <SGAMIPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="badges"
            element={
              <ProtectedRoute adminOnly>
                <Badges />
              </ProtectedRoute>
            }
          />
          <Route
            path="pce"
            element={
              <ProtectedRoute adminOnly>
                <PCEPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="visa"
            element={
              <ProtectedRoute adminOnly>
                <VisaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="diligences"
            element={
              <ProtectedRoute adminOnly>
                <DiligencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="grades"
            element={
              <ProtectedRoute adminOnly>
                <GradesPage />
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
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import MainLayout from '@/layouts/MainLayout'

// Lazy load all pages
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Dossiers = lazy(() => import('@/pages/Dossiers'))
const DossierDetail = lazy(() => import('@/pages/DossierDetail'))
const Demandes = lazy(() => import('@/pages/Demandes'))
const Avocats = lazy(() => import('@/pages/Avocats'))
const Decisions = lazy(() => import('@/pages/Decisions'))
const Conventions = lazy(() => import('@/pages/Conventions'))
const Paiements = lazy(() => import('@/pages/Paiements'))
const Revue = lazy(() => import('@/pages/Revue'))
const Statistiques = lazy(() => import('@/pages/Statistiques'))

// Admin pages (loaded only when needed)
const Users = lazy(() => import('@/pages/Users'))
const Badges = lazy(() => import('@/pages/Badges'))
const BAPPage = lazy(() => import('@/pages/BAP'))
const SGAMIPage = lazy(() => import('@/pages/SGAMI'))
const PCEPage = lazy(() => import('@/pages/PCE'))
const VisaPage = lazy(() => import('@/pages/Visa'))
const DiligencesPage = lazy(() => import('@/pages/Diligences'))
const GradesPage = lazy(() => import('@/pages/Grades'))
const Templates = lazy(() => import('@/pages/Templates'))
const Logs = lazy(() => import('@/pages/Logs'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p className="mt-2 text-sm text-gray-600">Chargement...</p>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
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
          <Route path="paiements" element={<Paiements />} />
          <Route path="avocats" element={<Avocats />} />
          <Route path="revue" element={<Revue />} />
          <Route path="statistiques" element={<Statistiques />} />
          
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
            path="bap"
            element={
              <ProtectedRoute adminOnly>
                <BAPPage />
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
            path="templates"
            element={
              <ProtectedRoute adminOnly>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="logs"
            element={
              <ProtectedRoute adminOnly>
                <Logs />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
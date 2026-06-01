import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Animales from './pages/Animales'
import AnimalDetalle from './pages/AnimalDetalle'
import Recordatorios from './pages/Recordatorios'
import Adopciones from './pages/Adopciones'
import Informes from './pages/Informes'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0]">
      <div className="text-center">
        <div className="text-4xl mb-4">🐾</div>
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/animales" element={
        <ProtectedRoute>
          <Layout>
            <Animales />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/animales/:id" element={
        <ProtectedRoute>
          <Layout>
            <AnimalDetalle />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/recordatorios" element={
        <ProtectedRoute>
          <Layout>
            <Recordatorios />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/adopciones" element={
        <ProtectedRoute>
          <Layout>
            <Adopciones />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/informes" element={
        <ProtectedRoute>
          <Layout>
            <Informes />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

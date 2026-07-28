import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './screens/Login'
import TrainerDashboard from './screens/TrainerDashboard'
import ClientList from './screens/ClientList'
import ClientCard from './screens/ClientCard'
import ClientPortal from './screens/ClientPortal'
import Layout from './components/Layout'

function Gate() {
  const { session, profile, loading } = useAuth()

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Завантаження...</div>
  if (!session) return <Login />
  if (!profile) return <div style={{ padding: 40, textAlign: 'center' }}>Профіль не знайдено. Зверніться до тренера.</div>

  const isTrainer = profile.role === 'trainer' || profile.role === 'assistant'

  return (
    <Layout>
      <Routes>
        {isTrainer ? (
          <>
            <Route path="/" element={<TrainerDashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientCard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<ClientPortal />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  )
}

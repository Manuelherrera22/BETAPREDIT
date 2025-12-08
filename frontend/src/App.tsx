import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import MyBets from './pages/MyBets'
import ResponsibleGaming from './pages/ResponsibleGaming'
import OddsComparison from './pages/OddsComparison'
import Statistics from './pages/Statistics'
import Alerts from './pages/Alerts'
import Pricing from './pages/Pricing'
import FAQ from './pages/FAQ'
import Profile from './pages/Profile'
import BankrollAnalysis from './pages/BankrollAnalysis'
import PredictionHistory from './pages/PredictionHistory'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Layout>
                <Home />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/events"
          element={
            isAuthenticated ? (
              <Layout>
                <Events />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/events/:eventId"
          element={
            isAuthenticated ? (
              <Layout>
                <EventDetail />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/my-bets"
          element={
            isAuthenticated ? (
              <Layout>
                <MyBets />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/responsible-gaming"
          element={
            isAuthenticated ? (
              <Layout>
                <ResponsibleGaming />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/odds-comparison"
          element={
            isAuthenticated ? (
              <Layout>
                <OddsComparison />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/statistics"
          element={
            isAuthenticated ? (
              <Layout>
                <Statistics />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/alerts"
          element={
            isAuthenticated ? (
              <Layout>
                <Alerts />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Layout>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/bankroll"
          element={
            isAuthenticated ? (
              <Layout>
                <BankrollAnalysis />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/predictions"
          element={
            isAuthenticated ? (
              <Layout>
                <PredictionHistory />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App


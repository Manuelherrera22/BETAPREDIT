import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import SkeletonLoader from './components/SkeletonLoader'
import { useAuthStore } from './store/authStore'

// Lazy load all page components for code splitting
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const MyBets = lazy(() => import('./pages/MyBets'))
const ResponsibleGaming = lazy(() => import('./pages/ResponsibleGaming'))
const OddsComparison = lazy(() => import('./pages/OddsComparison'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Pricing = lazy(() => import('./pages/Pricing'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Profile = lazy(() => import('./pages/Profile'))
const BankrollAnalysis = lazy(() => import('./pages/BankrollAnalysis'))
const PredictionHistory = lazy(() => import('./pages/PredictionHistory'))
const PredictionTracking = lazy(() => import('./pages/PredictionTracking'))
const Predictions = lazy(() => import('./pages/Predictions'))
const Arbitrage = lazy(() => import('./pages/Arbitrage'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Referrals = lazy(() => import('./pages/Referrals'))
const TwoFactorAuth = lazy(() => import('./pages/TwoFactorAuth'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <SkeletonLoader type="card" count={3} />
  </div>
)

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<SkeletonLoader type="card" count={3} />}>
                    <Home />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="list" count={5} />}>
                    <Events />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="card" count={2} />}>
                    <EventDetail />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="table" />}>
                    <MyBets />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="card" />}>
                    <ResponsibleGaming />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="table" />}>
                    <OddsComparison />
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/arbitrage"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<SkeletonLoader type="card" count={3} />}>
                    <Arbitrage />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="card" count={4} />}>
                    <Statistics />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="list" count={5} />}>
                    <Alerts />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="card" />}>
                    <Profile />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="card" count={3} />}>
                    <BankrollAnalysis />
                  </Suspense>
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
                  <Suspense fallback={<SkeletonLoader type="card" count={4} />}>
                    <Predictions />
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/prediction-history"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<SkeletonLoader type="list" count={5} />}>
                    <PredictionHistory />
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/prediction-tracking"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<SkeletonLoader type="card" count={3} />}>
                    <PredictionTracking />
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/referrals"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<SkeletonLoader type="card" />}>
                    <Referrals />
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/2fa"
            element={
              isAuthenticated ? (
                <Layout>
                  <Suspense fallback={<SkeletonLoader type="card" />}>
                    <TwoFactorAuth />
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  )
}

export default App


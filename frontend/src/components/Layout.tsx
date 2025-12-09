import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import QuickAddBet from './QuickAddBet'
import OnboardingTour from './OnboardingTour'
import { useOnboarding } from '../hooks/useOnboarding'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { shouldShow, completeOnboarding } = useOnboarding()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Onboarding Tour - Persists across all authenticated pages */}
      {shouldShow && <OnboardingTour onComplete={completeOnboarding} />}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center space-x-2 px-2 py-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-white drop-shadow-lg">
                  BETAPREDIT
                </span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Inicio
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Eventos
                </Link>
                <Link
                  to="/odds-comparison"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Comparar Cuotas
                </Link>
                <Link
                  to="/arbitrage"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Arbitraje
                  <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">Nuevo</span>
                </Link>
                <Link
                  to="/statistics"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Estadísticas
                </Link>
                <Link
                  to="/predictions"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Predicciones
                  <span className="ml-1 px-1.5 py-0.5 bg-gold-500 text-white text-xs rounded-full font-black">🏆</span>
                </Link>
                <Link
                  to="/alerts"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white relative"
                >
                  Alertas
                  <span className="ml-1 px-1.5 py-0.5 bg-accent-500 text-white text-xs rounded-full">3</span>
                </Link>
                <Link
                  to="/referrals"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Referidos
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="text-sm text-gray-300 hover:text-white"
              >
                {user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Quick Add Bet Button */}
      <QuickAddBet />
    </div>
  )
}


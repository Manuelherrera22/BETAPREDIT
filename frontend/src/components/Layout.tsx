import { ReactNode, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import QuickAddBet from './QuickAddBet'
import OnboardingTour from './OnboardingTour'
import { useOnboarding } from '../hooks/useOnboarding'
import Icon, { type IconName } from './icons/IconSystem'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { shouldShow, completeOnboarding } = useOnboarding()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  // Organized navigation - grouped by category
  const navigationItems = [
    // Main
    { to: '/dashboard', label: 'Inicio', icon: 'home' as IconName },
    { to: '/events', label: 'Eventos', icon: 'events' as IconName },
    
    // Predictions (grouped)
    { to: '/predictions', label: 'Predicciones', icon: 'predictions' as IconName, badge: 'Pro', badgeColor: 'bg-gold-500' },
    { to: '/prediction-tracking', label: 'Seguimiento', icon: 'tracking' as IconName },
    
    // Betting Tools
    { to: '/odds-comparison', label: 'Comparar Cuotas', icon: 'odds' as IconName },
    { to: '/arbitrage', label: 'Arbitraje', icon: 'arbitrage' as IconName },
    { to: '/my-bets', label: 'Mis Apuestas', icon: 'bets' as IconName },
    
    // Analytics
    { to: '/statistics', label: 'Estadísticas', icon: 'statistics' as IconName },
    { to: '/bankroll', label: 'Bankroll', icon: 'bankroll' as IconName },
    
    // Alerts & Account
    { to: '/alerts', label: 'Alertas', icon: 'alerts' as IconName },
    { to: '/profile', label: 'Perfil', icon: 'profile' as IconName },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Onboarding Tour - Persists across all authenticated pages */}
      {shouldShow && <OnboardingTour onComplete={completeOnboarding} />}
      
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center flex-1">
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-2 px-2 py-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-lg sm:text-xl font-black text-white drop-shadow-lg">
                  <span className="hidden sm:inline">BETAPREDIT</span>
                  <span className="sm:hidden">BETA</span>
                </span>
              </Link>
              
              {/* Desktop Navigation - Show main items only */}
              <div className="hidden lg:ml-6 lg:flex lg:space-x-1 xl:space-x-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.to)
                        ? 'bg-primary-500/20 text-white border border-primary-500/40'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon name={item.icon} className="mr-1 xl:mr-1.5" size={16} />
                    <span className="hidden xl:inline">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-1 xl:ml-1.5 px-1.5 py-0.5 ${item.badgeColor} text-white text-xs rounded-full`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side - User info and mobile menu button */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User email - hidden on mobile */}
              <Link
                to="/profile"
                className="hidden md:block text-sm text-gray-300 hover:text-white truncate max-w-[150px]"
              >
                {user?.email}
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle menu"
              >
                <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={24} />
              </button>

              {/* Logout button - hidden on mobile (will be in mobile menu) */}
              <button
                onClick={handleLogout}
                className="hidden lg:block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-slate-800 border-l border-slate-700 z-50 lg:hidden overflow-y-auto">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <span className="text-lg font-black text-white">Menú</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    <Icon name="close" size={24} />
                  </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-slate-700 bg-slate-700/30">
                  <p className="text-sm text-gray-400 mb-1">Conectado como</p>
                  <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto">
                  <nav className="p-4 space-y-1">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.to)
                            ? 'bg-primary-500/20 text-white border border-primary-500/40'
                            : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                      <div className="flex items-center space-x-3">
                        <Icon name={item.icon} className="text-gray-300" size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                        {item.badge && (
                          <span className={`px-2 py-0.5 ${item.badgeColor} text-white text-xs rounded-full font-semibold`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      <main className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Quick Add Bet Button */}
      <QuickAddBet />
    </div>
  )
}


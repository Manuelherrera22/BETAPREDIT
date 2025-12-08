import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import SportPattern from '../components/SportPattern'
import SportIcon from '../components/SportIcon'
import { oauthService } from '../services/oauthService'

// Credenciales demo predefinidas
const DEMO_ACCOUNTS = [
  { email: 'demo@betapredit.com', password: 'demo123', label: 'Cuenta Demo Estándar' },
  { email: 'admin@betapredit.com', password: 'admin123', label: 'Cuenta Admin' },
  { email: 'trader@betapredit.com', password: 'trader123', label: 'Cuenta Trader' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.data.user, data.data.accessToken)
      toast.success('Inicio de sesión exitoso')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email: demoEmail, password: demoPassword })
      login(data.data.user, data.data.accessToken)
      toast.success('Inicio de sesión exitoso')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await oauthService.initiateGoogle()
    } catch (error: any) {
      toast.error('Error al iniciar sesión con Google')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <SportPattern />
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full space-y-4">
        {/* Banner de Modo Demo */}
        <div className="bg-gradient-to-r from-accent-500/20 via-gold-500/20 to-primary-500/20 border border-accent-400/30 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center">
                <div className="w-3 h-3 bg-accent-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1">Modo Demo Activo</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Puedes iniciar sesión con cualquier email y contraseña. El sistema creará tu cuenta automáticamente.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-500/20 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 mb-5 shadow-xl shadow-primary-500/30">
              <SportIcon sport="all" className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3 tracking-tight relative">
              <span className="absolute inset-0 bg-gradient-to-r from-primary-400 via-accent-500 to-gold-400 bg-clip-text text-transparent blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-primary-200 via-accent-300 to-gold-200 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                BETAPREDIT
              </span>
            </h1>
            <p className="text-gray-400 font-medium">Inicia sesión en tu cuenta</p>
          </div>

          {/* Acceso Rápido Demo */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Acceso Rápido Demo</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((account, index) => (
                <button
                  key={index}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-primary-500/50 text-left rounded-lg transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">
                        {account.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{account.email}</p>
                    </div>
                    <span className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900/90 text-gray-400">O ingresa manualmente</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-500"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-500"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 12m3.29-5.71L12 12m-5.71-5.71L12 3m0 0l3.29 3.29M12 12l3.29 3.29m0 0L21 12m-5.71 5.71L12 21m5.71-5.71L21 21M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 px-4 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:via-primary-700 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-black shadow-xl shadow-primary-500/40 hover:shadow-primary-500/60 text-lg border border-primary-400/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Regístrate gratis
              </Link>
            </p>
            <Link to="/" className="text-sm text-primary-400 hover:text-primary-300 transition-colors inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


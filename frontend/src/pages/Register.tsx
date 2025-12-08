import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import SportPattern from '../components/SportPattern'
import SportIcon from '../components/SportIcon'
import { oauthService } from '../services/oauthService'

export default function Register() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    referralCode: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    // Check for referral code in URL
    const refCode = searchParams.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Send registration data (including referral code if present)
      const { referralCode, ...registerData } = formData
      const payload = referralCode ? { ...registerData, referralCode } : registerData
      const { data } = await api.post('/auth/register', payload)
      // Auto login after registration
      if (data.data.user && data.data.accessToken) {
        login(data.data.user, data.data.accessToken)
        toast.success('Registro exitoso')
        navigate('/dashboard')
      } else {
        toast.success('Registro exitoso. Por favor inicia sesión.')
        navigate('/login')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      await oauthService.initiateGoogle()
      // No need to set loading to false here as we're redirecting
    } catch (error: any) {
      setLoading(false)
      const errorMessage = error.message || 'Error al registrarse con Google'
      toast.error(errorMessage)
      console.error('Google OAuth error:', error)
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
      
      <div className="max-w-md w-full">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-500/20 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 mb-5 shadow-xl shadow-primary-500/30">
              <SportIcon sport="all" className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3 tracking-tight relative">
              <span className="absolute inset-0 bg-gradient-to-r from-primary-400 via-accent-500 to-gold-400 bg-clip-text text-transparent blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-primary-200 via-accent-300 to-gold-200 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                Crear Cuenta
              </span>
            </h1>
            <p className="text-gray-400 font-medium">Únete a BETAPREDIT hoy</p>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-3 mb-6"
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
              <span className="px-4 bg-slate-900/90 text-gray-400">O regístrate con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Apellido
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:via-primary-700 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 transition-all duration-300 font-black shadow-xl shadow-primary-500/40 hover:shadow-primary-500/60 text-lg border border-primary-400/20"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
          </form>
          {formData.referralCode && (
            <div className="mt-4 p-3 bg-primary-500/20 border border-primary-500/30 rounded-lg">
              <p className="text-sm text-primary-300">
                🎁 Código de referido detectado: <span className="font-bold">{formData.referralCode}</span>
              </p>
            </div>
          )}
          <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              Inicia sesión
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


import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import SportPattern from '../components/SportPattern'
import SportIcon from '../components/SportIcon'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/register', formData)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      <SportPattern />
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-500/20 p-10">
        <div className="text-center mb-10">
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
        <div className="mt-4 text-center space-y-2">
          <p className="text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              Inicia sesión
            </Link>
          </p>
          <Link to="/" className="text-sm text-primary-400 hover:text-primary-300">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}


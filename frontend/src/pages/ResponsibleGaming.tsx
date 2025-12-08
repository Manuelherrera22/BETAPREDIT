import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ResponsibleGaming() {
  const [depositLimit, setDepositLimit] = useState('')
  const [lossLimit, setLossLimit] = useState('')
  const [sessionLimit, setSessionLimit] = useState('')

  const { data: rgStatus, isLoading } = useQuery({
    queryKey: ['rgStatus'],
    queryFn: async () => {
      const { data } = await api.get('/rg/status')
      return data.data
    },
  })

  const handleSetDepositLimit = async () => {
    try {
      await api.post('/rg/deposit-limit', {
        amount: parseFloat(depositLimit),
        period: 'daily',
      })
      toast.success('Límite de depósito establecido')
      setDepositLimit('')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al establecer límite')
    }
  }

  const handleSetLossLimit = async () => {
    try {
      await api.post('/rg/loss-limit', {
        amount: parseFloat(lossLimit),
        period: 'daily',
      })
      toast.success('Límite de pérdidas establecido')
      setLossLimit('')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al establecer límite')
    }
  }

  const handleSetSessionLimit = async () => {
    try {
      await api.post('/rg/session-limit', {
        minutes: parseInt(sessionLimit),
      })
      toast.success('Límite de sesión establecido')
      setSessionLimit('')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al establecer límite')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-6">Juego Responsable</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Estado Actual</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Límite de Depósito</p>
              <p className="text-white font-semibold">
                {rgStatus?.depositLimit
                  ? `$${rgStatus.depositLimit} ${rgStatus.depositPeriod}`
                  : 'No establecido'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Límite de Pérdidas</p>
              <p className="text-white font-semibold">
                {rgStatus?.lossLimit
                  ? `$${rgStatus.lossLimit} ${rgStatus.lossPeriod}`
                  : 'No establecido'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Límite de Sesión</p>
              <p className="text-white font-semibold">
                {rgStatus?.sessionLimit
                  ? `${rgStatus.sessionLimit} minutos`
                  : 'No establecido'}
              </p>
            </div>
            {rgStatus?.currentSessionMinutes && (
              <div>
                <p className="text-gray-400 text-sm">Sesión Actual</p>
                <p className="text-white font-semibold">
                  {rgStatus.currentSessionMinutes} minutos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Set Limits */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Establecer Límites</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Límite de Depósito Diario ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={depositLimit}
                  onChange={(e) => setDepositLimit(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSetDepositLimit}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Establecer
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Límite de Pérdidas Diario ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={lossLimit}
                  onChange={(e) => setLossLimit(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSetLossLimit}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Establecer
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Límite de Tiempo de Sesión (minutos)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={sessionLimit}
                  onChange={(e) => setSessionLimit(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSetSessionLimit}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Establecer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {rgStatus?.alerts && rgStatus.alerts.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 col-span-full">
            <h2 className="text-xl font-semibold text-yellow-500 mb-4">Alertas</h2>
            <div className="space-y-2">
              {rgStatus.alerts.map((alert: any, index: number) => (
                <div key={index} className="text-yellow-400">
                  <p className="font-medium">{alert.type}</p>
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


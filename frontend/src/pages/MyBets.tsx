import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { externalBetsService, type ExternalBet } from '../services/externalBetsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function MyBets() {
  const queryClient = useQueryClient()
  const [resolvingBetId, setResolvingBetId] = useState<string | null>(null)
  
  const { data: bets, isLoading } = useQuery({
    queryKey: ['externalBets'],
    queryFn: () => externalBetsService.getMyBets({ limit: 100 }),
    refetchInterval: 30000,
  })

  // Mutation para resolver apuesta
  const resolveBetMutation = useMutation({
    mutationFn: ({ betId, result, actualWin }: { betId: string; result: 'WON' | 'LOST' | 'VOID'; actualWin?: number }) =>
      externalBetsService.resolveBet(betId, result, actualWin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalBets'] })
      queryClient.invalidateQueries({ queryKey: ['roiTracking'] })
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] })
      toast.success('Apuesta resuelta correctamente')
      setResolvingBetId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Error al resolver apuesta')
      setResolvingBetId(null)
    },
  })

  const handleResolveBet = (betId: string, result: 'WON' | 'LOST' | 'VOID', actualWin?: number) => {
    setResolvingBetId(betId)
    resolveBetMutation.mutate({ betId, result, actualWin })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando apuestas...</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return 'bg-green-500/20 border-green-500/40 text-green-400'
      case 'LOST':
        return 'bg-red-500/20 border-red-500/40 text-red-400'
      case 'PENDING':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
      case 'VOID':
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400'
      case 'CANCELLED':
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400'
      default:
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'WON': return 'Ganada'
      case 'LOST': return 'Perdida'
      case 'PENDING': return 'Pendiente'
      case 'VOID': return 'Anulada'
      case 'CANCELLED': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Mis Apuestas</h1>
        <p className="text-gray-400">Registra y gestiona tus apuestas externas</p>
      </div>

      {bets && bets.length > 0 ? (
        <div className="space-y-4">
          {bets.map((bet: ExternalBet) => {
            const potentialWin = bet.stake * bet.odds - bet.stake
            const isResolving = resolvingBetId === bet.id
            
            return (
              <div key={bet.id} className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {bet.valueBetAlert && (
                        <span className="px-2 py-1 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-full text-xs font-bold">
                          Value Bet +{bet.valueBetAlert.valuePercentage.toFixed(1)}%
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(bet.status)}`}>
                        {getStatusLabel(bet.status)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-1">
                      {bet.event 
                        ? `${bet.event.homeTeam} vs ${bet.event.awayTeam}`
                        : bet.selection}
                    </h3>
                    <p className="text-gray-400 mb-1">
                      {bet.selection} @ {bet.odds.toFixed(2)} en {bet.platform}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(bet.betPlacedAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary-500/20">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Stake</p>
                    <p className="text-white font-bold">€{bet.stake.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Ganancia Potencial</p>
                    <p className="text-white font-bold">
                      €{potentialWin.toFixed(2)}
                    </p>
                  </div>
                  {bet.status === 'WON' && bet.actualWin && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Ganancia Real</p>
                      <p className="text-green-400 font-bold">
                        €{(bet.actualWin - bet.stake).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {bet.status === 'LOST' && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Pérdida</p>
                      <p className="text-red-400 font-bold">
                        -€{bet.stake.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón para resolver si está pendiente */}
                {bet.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-primary-500/20">
                    <p className="text-sm text-gray-400 mb-3">¿Ya se resolvió esta apuesta?</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const actualWin = bet.stake * bet.odds
                          handleResolveBet(bet.id, 'WON', actualWin)
                        }}
                        disabled={isResolving}
                        className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg font-semibold hover:bg-green-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isResolving && resolvingBetId === bet.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Marcar como Ganada
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleResolveBet(bet.id, 'LOST')}
                        disabled={isResolving}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg font-semibold hover:bg-red-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isResolving && resolvingBetId === bet.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Marcar como Perdida
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleResolveBet(bet.id, 'VOID')}
                        disabled={isResolving}
                        className="px-4 py-2 bg-gray-500/20 border border-gray-500/40 text-gray-300 rounded-lg font-semibold hover:bg-gray-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isResolving && resolvingBetId === bet.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Anular
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20 text-center">
          <p className="text-gray-400 mb-2">No tienes apuestas registradas aún</p>
          <p className="text-sm text-gray-500">
            Registra tus apuestas para trackear tu ROI y ver tu progreso
          </p>
        </div>
      )}
    </div>
  )
}


import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { betsService } from '../services/betsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const [selectedOdds, setSelectedOdds] = useState<{
    oddsId: string
    marketId: string
    selection: string
    decimal: number
  } | null>(null)
  const [stake, setStake] = useState('')
  const [placing, setPlacing] = useState(false)

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventDetails(eventId!),
    enabled: !!eventId,
    refetchInterval: 10000, // Refresh every 10 seconds for live odds
  })

  const handlePlaceBet = async () => {
    if (!selectedOdds || !stake || parseFloat(stake) <= 0) {
      toast.error('Selecciona una apuesta y un monto válido')
      return
    }

    setPlacing(true)
    try {
      await betsService.placeBet({
        eventId: eventId!,
        marketId: selectedOdds.marketId,
        oddsId: selectedOdds.oddsId,
        type: 'SINGLE',
        selection: selectedOdds.selection,
        stake: parseFloat(stake),
      })
      toast.success('Apuesta colocada exitosamente')
      setSelectedOdds(null)
      setStake('')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al colocar apuesta')
    } finally {
      setPlacing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando evento...</div>
      </div>
    )
  }

  if (!event) {
    return <div className="text-white">Evento no encontrado</div>
  }

  return (
    <div className="px-4 py-6">
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">{event.sport?.name}</p>
            <h1 className="text-3xl font-bold text-white mb-2">
              {event.homeTeam} vs {event.awayTeam}
            </h1>
            <p className="text-gray-400">
              {format(new Date(event.startTime), 'dd MMM yyyy, HH:mm', { locale: es })}
            </p>
            {event.status === 'LIVE' && (
              <p className="text-red-500 font-semibold mt-2">
                EN VIVO - {event.homeScore} - {event.awayScore}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              event.status === 'LIVE'
                ? 'bg-red-500 text-white'
                : event.status === 'SCHEDULED'
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {event.status}
          </span>
        </div>
      </div>

      {/* Markets and Odds */}
      <div className="space-y-6">
        {event.markets?.map((market) => (
          <div key={market.id} className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">{market.name}</h2>
            {market.isSuspended && (
              <p className="text-red-500 mb-4">Mercado suspendido</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {market.odds?.map((odd) => (
                <button
                  key={odd.id}
                  onClick={() =>
                    setSelectedOdds({
                      oddsId: odd.id,
                      marketId: market.id,
                      selection: odd.selection,
                      decimal: odd.decimal,
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedOdds?.oddsId === odd.id
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                  disabled={market.isSuspended || !odd.isActive}
                >
                  <p className="text-gray-400 text-sm mb-2">{odd.selection}</p>
                  <p className="text-2xl font-bold text-white">{odd.decimal.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(odd.probability * 100).toFixed(1)}%
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bet Slip */}
      {selectedOdds && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {selectedOdds.selection} @ {selectedOdds.decimal.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">
                  Ganancia potencial: $
                  {selectedOdds.decimal * parseFloat(stake || '0') - parseFloat(stake || '0')}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="Monto"
                  min="1"
                  step="0.01"
                  className="px-4 py-2 bg-slate-700 text-white rounded-md w-32 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handlePlaceBet}
                  disabled={placing || !stake || parseFloat(stake) <= 0}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {placing ? 'Colocando...' : 'Apostar'}
                </button>
                <button
                  onClick={() => {
                    setSelectedOdds(null)
                    setStake('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


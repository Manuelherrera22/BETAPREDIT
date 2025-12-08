import { useQuery } from '@tanstack/react-query'
import { betsService } from '../services/betsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function MyBets() {
  const { data: bets, isLoading } = useQuery({
    queryKey: ['myBets'],
    queryFn: () => betsService.getMyBets(),
    refetchInterval: 30000,
  })

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
        return 'bg-green-500'
      case 'LOST':
        return 'bg-red-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'CANCELLED':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-6">Mis Apuestas</h1>

      {bets && bets.length > 0 ? (
        <div className="space-y-4">
          {bets.map((bet) => (
            <div key={bet.id} className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {bet.event?.homeTeam} vs {bet.event?.awayTeam}
                  </h3>
                  <p className="text-gray-400">
                    {bet.selection} @ {bet.odds.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {format(new Date(bet.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium text-white ${getStatusColor(
                    bet.status
                  )}`}
                >
                  {bet.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-sm text-gray-400">Stake</p>
                  <p className="text-white font-semibold">${bet.stake.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ganancia Potencial</p>
                  <p className="text-white font-semibold">
                    ${bet.potentialWin.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Retorno Total</p>
                  <p className="text-white font-semibold">
                    ${(bet.potentialWin + bet.stake).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No tienes apuestas aún</p>
        </div>
      )}
    </div>
  )
}


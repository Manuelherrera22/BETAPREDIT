import { useQuery } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Events() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['allEvents'],
    queryFn: async () => {
      try {
        const result = await eventsService.getUpcomingEvents(undefined, undefined, true)
        return Array.isArray(result) ? result : []
      } catch (err: any) {
        console.error('Error loading events:', err)
        toast.error('Error al cargar eventos. Intenta recargar la página.')
        return []
      }
    },
    refetchInterval: 300000, // 5 minutes
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando eventos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-6">Eventos Deportivos</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">Error al cargar eventos</p>
          <p className="text-sm text-gray-400">Por favor, intenta recargar la página</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-6">Eventos Deportivos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events && events.length > 0 ? (
          events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-lg p-6 border border-primary-500/20 hover:border-primary-500/40 transition"
            >
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">{event.sport?.name || 'Deporte'}</p>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {event.homeTeam} vs {event.awayTeam}
                </h3>
                <p className="text-sm text-gray-400">
                  {format(new Date(event.startTime), 'dd MMM yyyy, HH:mm', { locale: es })}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    event.status === 'LIVE'
                      ? 'bg-red-500 text-white'
                      : event.status === 'SCHEDULED'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {event.status}
                </span>
                {event.markets && event.markets.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {event.markets.length} mercados
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20 text-center">
            <p className="text-gray-400 mb-2">No hay eventos disponibles en este momento</p>
            <p className="text-sm text-gray-500">
              Los eventos se actualizan automáticamente. Intenta recargar la página más tarde.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


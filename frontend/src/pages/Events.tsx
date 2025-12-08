import { useQuery } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export default function Events() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => eventsService.getUpcomingEvents(),
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando eventos...</div>
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
              className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition"
            >
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">{event.sport?.name}</p>
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
          <p className="text-gray-400 col-span-full">No hay eventos disponibles</p>
        )}
      </div>
    </div>
  )
}


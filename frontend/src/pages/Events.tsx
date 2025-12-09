import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { theOddsApiService } from '../services/theOddsApiService'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Events() {
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'upcoming' | 'live'>('upcoming')
  const queryClient = useQueryClient()

  // Get available sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => theOddsApiService.getSports(),
    staleTime: 3600000, // 1 hour
  })

  // Get events
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['allEvents', selectedSport, viewMode],
    queryFn: async () => {
      try {
        if (viewMode === 'live') {
          const result = await eventsService.getLiveEvents(selectedSport !== 'all' ? selectedSport : undefined)
          return Array.isArray(result) ? result : []
        } else {
          const result = await eventsService.getUpcomingEvents(
            selectedSport !== 'all' ? selectedSport : undefined,
            undefined,
            true
          )
          return Array.isArray(result) ? result : []
        }
      } catch (err: any) {
        console.error('Error loading events:', err)
        toast.error('Error al cargar eventos. Intenta recargar la página.')
        return []
      }
    },
    refetchInterval: 300000, // 5 minutes
    retry: 1,
  })

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['allEvents'] })
    await refetch()
    toast.success('Eventos actualizados')
  }

  const handleSyncEvents = async () => {
    try {
      toast.loading('Sincronizando eventos desde The Odds API...')
      await eventsService.syncEvents()
      toast.dismiss()
      toast.success('Eventos sincronizados correctamente')
      // Refetch events after sync
      await queryClient.invalidateQueries({ queryKey: ['allEvents'] })
      await refetch()
    } catch (error: any) {
      toast.dismiss()
      toast.error(`Error al sincronizar: ${error.message || 'Error desconocido'}`)
    }
  }

  if (isLoading && !events) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <div className="text-white">Cargando eventos...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Eventos Deportivos</h1>
          <p className="text-gray-400">Explora eventos en vivo y próximos partidos</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* View Mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Vista</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'upcoming'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 border border-primary-500/30 text-gray-300 hover:border-primary-500/50'
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setViewMode('live')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'live'
                  ? 'bg-red-500 text-white'
                  : 'bg-dark-800 border border-red-500/30 text-gray-300 hover:border-red-500/50'
              }`}
            >
              En Vivo
            </button>
          </div>
        </div>

        {/* Sport Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Deporte</label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todos los deportes</option>
            {sports?.filter(s => s.active).map((sport) => (
              <option key={sport.key} value={sport.key}>
                {sport.title}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Estadísticas</label>
          <div className="px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg">
            <div className="text-white font-semibold">{events?.length || 0} eventos</div>
            <div className="text-xs text-gray-400">
              {viewMode === 'live' ? 'En vivo ahora' : 'Próximos 7 días'}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center mb-6">
          <p className="text-red-400 mb-2">Error al cargar eventos</p>
          <p className="text-sm text-gray-400 mb-4">Por favor, intenta recargar la página</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events && events.length > 0 ? (
          events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition-all hover:shadow-lg hover:shadow-primary-500/10"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-semibold">
                    {event.sport?.name || 'Deporte'}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'LIVE'
                        ? 'bg-red-500 text-white animate-pulse'
                        : event.status === 'SCHEDULED'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {event.status === 'LIVE' ? '🔴 EN VIVO' : event.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  {event.homeTeam} vs {event.awayTeam}
                </h3>
                {event.status === 'LIVE' && (event.homeScore !== undefined || event.awayScore !== undefined) && (
                  <div className="text-2xl font-black text-primary-400 mb-2">
                    {event.homeScore ?? 0} - {event.awayScore ?? 0}
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  {format(new Date(event.startTime), 'dd MMM yyyy, HH:mm', { locale: es })}
                </p>
                {event.status === 'SCHEDULED' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(event.startTime), { addSuffix: true, locale: es })}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-primary-500/10">
                {event.markets && event.markets.length > 0 ? (
                  <span className="text-sm text-gray-400">
                    {event.markets.length} mercado{event.markets.length !== 1 ? 's' : ''} disponible{event.markets.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Sin mercados</span>
                )}
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-12 border border-primary-500/20 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2 text-lg font-semibold">
              {viewMode === 'live' ? 'No hay eventos en vivo' : 'No hay eventos próximos'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {viewMode === 'live'
                ? 'No hay eventos en vivo en este momento. Intenta cambiar a "Próximos" para ver eventos programados.'
                : 'Los eventos se actualizan automáticamente. Si no ves eventos, intenta sincronizar desde The Odds API.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSyncEvents}
                className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-semibold"
              >
                🔄 Sincronizar desde API
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold"
              >
                🔄 Recargar Eventos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


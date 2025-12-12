import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { theOddsApiService } from '../services/theOddsApiService'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import SkeletonLoader from '../components/SkeletonLoader'
import { useWebSocket } from '../hooks/useWebSocket'

export default function Events() {
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'upcoming' | 'live'>('upcoming')
  const queryClient = useQueryClient()

  // WebSocket para actualizaciones en tiempo real
  const { isConnected, lastMessage, subscribe, unsubscribe } = useWebSocket({
    autoConnect: true,
    channels: viewMode === 'live' ? ['events:live'] : [],
  })

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
        let result;
        if (viewMode === 'live') {
          result = await eventsService.getLiveEvents(selectedSport !== 'all' ? selectedSport : undefined);
        } else {
          result = await eventsService.getUpcomingEvents(
            selectedSport !== 'all' ? selectedSport : undefined,
            undefined,
            true
          );
        }
        
        // Validate result is an array
        if (!Array.isArray(result)) {
          if (import.meta.env.DEV) {
            console.warn('Events service returned non-array:', result);
          }
          return [];
        }
        
        return result;
      } catch (err: any) {
        // Always show error to user, but only log details in dev
        const errorMessage = err.message || 'Error desconocido';
        if (import.meta.env.DEV) {
          console.error('Error loading events:', err);
        }
        toast.error(`Error al cargar eventos: ${errorMessage}`);
        return [];
      }
    },
    refetchInterval: viewMode === 'live' ? 30000 : 300000, // 30 segundos para eventos en vivo, 5 minutos para próximos
    retry: 2,
    retryDelay: 1000,
    staleTime: viewMode === 'live' ? 10000 : 60000, // 10 segundos para eventos en vivo, 1 minuto para próximos
  })

  // Suscribirse a eventos en vivo cuando cambia el modo
  useEffect(() => {
    if (viewMode === 'live' && isConnected) {
      subscribe('events:live')
      return () => {
        unsubscribe('events:live')
      }
    }
  }, [viewMode, isConnected, subscribe, unsubscribe])

  // Actualizar eventos cuando llega mensaje por WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'event:update' && viewMode === 'live') {
      // Invalidar query para recargar eventos
      queryClient.invalidateQueries({ queryKey: ['allEvents', selectedSport, viewMode] })
      
      // Mostrar notificación si es un cambio importante (score, estado)
      const eventData = lastMessage.data
      if (eventData.status === 'LIVE' && (eventData.homeScore !== undefined || eventData.awayScore !== undefined)) {
        toast.success(`⚽ ${eventData.name || 'Evento'} actualizado`, {
          icon: eventData.homeScore !== undefined && eventData.awayScore !== undefined 
            ? `${eventData.homeScore} - ${eventData.awayScore}`
            : '⚽',
          duration: 3000,
        })
      }
    }
  }, [lastMessage, viewMode, queryClient, selectedSport])

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['allEvents'] })
    await refetch()
    toast.success('Eventos actualizados')
  }

  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  const handleSyncEvents = async () => {
    // ⚠️ PROTECCIÓN: Prevenir múltiples clics simultáneos
    if (isSyncing) {
      toast('Ya se está sincronizando. Por favor espera...', { icon: '⏳' })
      return
    }

    // ⚠️ PROTECCIÓN: Cooldown de 10 minutos entre sincronizaciones manuales
    if (lastSyncTime) {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000
      if (lastSyncTime > tenMinutesAgo) {
        const remainingMinutes = Math.ceil((lastSyncTime + 10 * 60 * 1000 - Date.now()) / 60000)
        toast(`Debes esperar ${remainingMinutes} minuto(s) antes de sincronizar nuevamente. Esto protege nuestros créditos de API.`, {
          icon: '⏰',
          duration: 5000,
        })
        return
      }
    }

    setIsSyncing(true)
    try {
      toast.loading('Sincronizando eventos desde The Odds API...')
      await eventsService.syncEvents()
      toast.dismiss()
      toast.success('Eventos sincronizados correctamente')
      setLastSyncTime(Date.now())
      // Refetch events after sync
      await queryClient.invalidateQueries({ queryKey: ['allEvents'] })
      await refetch()
    } catch (error: any) {
      toast.dismiss()
      // Manejar error 429 (rate limit) específicamente
      if (error.message?.includes('429') || error.message?.includes('esperar')) {
        toast.error(error.message || 'Debes esperar antes de sincronizar nuevamente')
      } else {
        toast.error(`Error al sincronizar: ${error.message || 'Error desconocido'}`)
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Show loading only on initial load, not on refetch
  if (isLoading && !events && !error) {
    return (
      <div className="px-4 py-6">
        <div className="mb-8">
          <SkeletonLoader type="text" />
        </div>
        <SkeletonLoader type="list" count={8} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2">Eventos Deportivos</h1>
            <p className="text-sm sm:text-base text-gray-400">Explora eventos en vivo y próximos partidos</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* WebSocket Status */}
          {viewMode === 'live' && (
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <span className="relative">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></span>
                  </span>
                  <span className="text-green-400 font-semibold">Tiempo Real</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="text-gray-500">Polling</span>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 sm:px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-xs sm:text-sm font-semibold disabled:opacity-50 w-full sm:w-auto"
          >
            {isLoading ? 'Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-xl p-4 sm:p-6 text-center mb-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {events && events.length > 0 ? (
          events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50 hover:border-primary-500/40 transition-all hover:shadow-lg hover:shadow-primary-500/10"
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
                <h3 className="text-lg sm:text-xl font-black text-white mb-2 line-clamp-2">
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
          <div className="col-span-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-8 sm:p-12 border-2 border-slate-700/50 text-center">
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSyncEvents}
                disabled={isSyncing || !!(lastSyncTime && Date.now() - lastSyncTime < 10 * 60 * 1000)}
                className={`w-full sm:w-auto px-4 py-2 border rounded-lg transition-colors text-sm font-semibold ${
                  isSyncing || !!(lastSyncTime && Date.now() - lastSyncTime < 10 * 60 * 1000)
                    ? 'bg-gray-500/20 border-gray-500/40 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30'
                }`}
              >
                {isSyncing ? '⏳ Sincronizando...' : '🔄 Sincronizar desde API'}
              </button>
              <button
                onClick={handleRefresh}
                className="w-full sm:w-auto px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold"
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


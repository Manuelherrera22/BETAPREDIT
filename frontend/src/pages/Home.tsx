import { useQuery } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import ValueBetCalculator from '../components/ValueBetCalculator'
import StatsCard from '../components/StatsCard'
import { useLiveEvents, useMockAlerts, generateMockEvents } from '../hooks/useMockData'
import { useState, useEffect } from 'react'

export default function Home() {
  // Usar datos mock para el demo
  const mockLiveEvents = useLiveEvents()
  const mockAlerts = useMockAlerts()
  const [mockUpcomingEvents] = useState(() => generateMockEvents(8))
  
  // Stats dinámicos que se actualizan
  const [stats, setStats] = useState({
    winRate: 75,
    roi: 23,
    valueBets: 12,
    bankroll: 2450,
  })

  useEffect(() => {
    // Simular actualizaciones periódicas de stats
    const interval = setInterval(() => {
      setStats(prev => ({
        winRate: Math.min(100, prev.winRate + (Math.random() - 0.5) * 0.5),
        roi: prev.roi + (Math.random() - 0.5) * 0.3,
        valueBets: prev.valueBets + (Math.random() > 0.8 ? 1 : 0),
        bankroll: prev.bankroll + (Math.random() - 0.4) * 10,
      }))
    }, 10000) // Cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  // Intentar cargar datos reales, pero usar mock como fallback
  const { data: liveEvents, isLoading } = useQuery({
    queryKey: ['liveEvents'],
    queryFn: () => eventsService.getLiveEvents(),
    refetchInterval: 30000,
    retry: false,
  })

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => eventsService.getUpcomingEvents(),
    retry: false,
  })

  // Usar datos mock si no hay datos reales
  const displayLiveEvents = liveEvents && liveEvents.length > 0 ? liveEvents : mockLiveEvents.map(e => ({
    id: e.id,
    homeTeam: e.homeTeam,
    awayTeam: e.awayTeam,
    sport: { name: e.homeTeam.includes('vs') ? 'Fútbol' : 'Basketball' },
    status: e.status,
    homeScore: e.homeScore,
    awayScore: e.awayScore,
    startTime: new Date().toISOString(),
  }))

  const displayUpcomingEvents = upcomingEvents && upcomingEvents.length > 0 
    ? upcomingEvents 
    : mockUpcomingEvents.map(e => ({
        id: e.id,
        homeTeam: e.home,
        awayTeam: e.away,
        sport: { name: e.sport },
        startTime: e.startTime,
      }))

  if (isLoading && !liveEvents) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando eventos...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-400">Bienvenido a tu panel de análisis predictivo</p>
      </div>

      {/* Quick Stats - Dinámicos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          change="+5% esta semana"
          trend="up"
        />
        <StatsCard
          title="ROI Mensual"
          value={`+${stats.roi.toFixed(1)}%`}
          change="+3% vs mes anterior"
          trend="up"
        />
        <StatsCard
          title="Value Bets"
          value={stats.valueBets.toString()}
          subtitle="Hoy"
        />
        <StatsCard
          title="Bankroll"
          value={`€${stats.bankroll.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          change="+18% este mes"
          trend="up"
        />
      </div>

      {/* Alertas en tiempo real */}
      {mockAlerts.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-accent-500/20 to-primary-500/20 rounded-xl p-4 border border-accent-500/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="relative">
                <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                <span className="absolute top-0 left-0 w-2 h-2 bg-accent-400 rounded-full animate-ping opacity-75"></span>
              </span>
              Alertas en Tiempo Real
            </h3>
            <span className="text-xs text-gray-400">{mockAlerts.length} nuevas</span>
          </div>
          <div className="space-y-2">
            {mockAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="bg-dark-900/50 rounded-lg p-3 border border-primary-500/20 animate-pulse-slow"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    alert.type === 'value_bet' ? 'bg-gold-400' :
                    alert.type === 'odds_change' ? 'bg-primary-400' :
                    'bg-accent-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/odds-comparison"
          className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-6 border border-primary-500/40 hover:border-primary-400/60 transition-all"
        >
          <h3 className="text-xl font-black text-white mb-2">Comparar Cuotas</h3>
          <p className="text-gray-400 text-sm">Encuentra las mejores cuotas de múltiples plataformas</p>
        </Link>
        <Link
          to="/statistics"
          className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 rounded-xl p-6 border border-accent-500/40 hover:border-accent-400/60 transition-all"
        >
          <h3 className="text-xl font-black text-white mb-2">Ver Estadísticas</h3>
          <p className="text-gray-400 text-sm">Analiza tu rendimiento y evolución</p>
        </Link>
      </div>

      {/* Value Bet Calculator */}
      <div className="mb-8">
        <ValueBetCalculator />
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">
        Eventos
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Events */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Eventos en Vivo
          </h2>
          <div className="space-y-4">
            {displayLiveEvents && displayLiveEvents.length > 0 ? (
              displayLiveEvents.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 hover:from-slate-700 hover:to-slate-800 transition-all border border-primary-500/20 hover:border-primary-400/40 group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{event.sport?.name}</p>
                        {event.status === 'LIVE' && (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-xs font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-white font-bold text-base mb-1">
                        {event.homeTeam} vs {event.awayTeam}
                      </p>
                      {event.status === 'LIVE' && event.homeScore !== undefined && event.awayScore !== undefined && (
                        <p className="text-2xl font-black bg-gradient-to-r from-primary-300 via-accent-300 to-gold-300 bg-clip-text text-transparent">
                          {event.homeScore} - {event.awayScore}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-400">
                        {format(new Date(event.startTime || new Date()), 'HH:mm', { locale: es })}
                      </p>
                      {event.status === 'LIVE' && (
                        <span className="inline-block mt-2 text-primary-400 group-hover:translate-x-1 transition-transform">→</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-400">No hay eventos en vivo</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Próximos Eventos
          </h2>
          <div className="space-y-4">
            {displayUpcomingEvents && displayUpcomingEvents.length > 0 ? (
              displayUpcomingEvents.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 hover:from-slate-700 hover:to-slate-800 transition-all border border-primary-500/20 hover:border-primary-400/40 group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{event.sport?.name}</p>
                      <p className="text-white font-bold text-base">
                        {event.homeTeam} vs {event.awayTeam}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-400">
                        {format(new Date(event.startTime), 'dd MMM HH:mm', { locale: es })}
                      </p>
                      <span className="inline-block mt-2 text-primary-400 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-400">No hay eventos próximos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


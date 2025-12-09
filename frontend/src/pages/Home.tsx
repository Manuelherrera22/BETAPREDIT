import { useQuery } from '@tanstack/react-query'
import { eventsService } from '../services/eventsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import ValueBetCalculator from '../components/ValueBetCalculator'
import StatsCard from '../components/StatsCard'
import { useOnboarding } from '../hooks/useOnboarding'
import QuickValueBetDemo from '../components/QuickValueBetDemo'
import SocialProof from '../components/SocialProof'
import CasualDashboard from '../components/CasualDashboard'
import DailyTip from '../components/DailyTip'
import { useAuthStore } from '../store/authStore'
import { userStatisticsService } from '../services/userStatisticsService'
import { valueBetAlertsService } from '../services/valueBetAlertsService'
import { notificationsService } from '../services/notificationsService'
import { userProfileService } from '../services/userProfileService'

export default function Home() {
  const { shouldShow } = useOnboarding()
  const { user } = useAuthStore()
  
  // Obtener perfil completo para modo
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userProfileService.getProfile(),
    enabled: !!user,
    staleTime: 30000, // Cache por 30 segundos
  })
  
  // Determinar modo (casual o pro) - usar perfil completo o fallback
  const userMode = userProfile?.preferredMode || (user as any)?.preferredMode || 'pro'
  const isCasualMode = userMode === 'casual'
  
  // Obtener estadísticas reales
  const { data: userStats } = useQuery({
    queryKey: ['userStatistics', 'monthly'],
    queryFn: () => userStatisticsService.getMyStatistics('month'),
    refetchInterval: 60000, // Actualizar cada minuto
    enabled: !!user,
  })
  
  // Obtener alertas reales
  const { data: valueBetAlerts } = useQuery({
    queryKey: ['valueBetAlerts'],
    queryFn: () => valueBetAlertsService.getMyAlerts({}),
    refetchInterval: 30000, // Actualizar cada 30 segundos
    enabled: !!user,
  })
  
  // Obtener notificaciones reales (opcional - puede fallar si el servicio no está disponible)
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getMyNotifications({ limit: 5 }),
    refetchInterval: 30000,
    enabled: !!user,
    retry: false, // No reintentar si falla
  })
  
  // Combinar alertas y notificaciones
  const allAlerts = [
    ...(valueBetAlerts || []).map((alert: any) => ({
      id: alert.id,
      type: 'value_bet',
      title: 'Value Bet Detectado',
      message: `${alert.event?.name || 'Evento'} - ${alert.selection} con +${alert.valuePercentage.toFixed(1)}% de valor`,
      timestamp: alert.createdAt,
    })),
    ...(Array.isArray(notifications) ? notifications : []).map((notif: any) => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: notif.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

  // Cargar eventos reales
  const { data: liveEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['liveEvents'],
    queryFn: () => eventsService.getLiveEvents(),
    refetchInterval: 30000,
    retry: false,
  })

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => eventsService.getUpcomingEvents(),
    refetchInterval: 30000,
    retry: false,
  })

  // Calcular stats para mostrar
  const displayStats = {
    winRate: userStats?.winRate || 0,
    roi: userStats?.roi || 0,
    valueBets: userStats?.valueBetsFound || 0,
    bankroll: userStats?.totalStaked || 0,
  }

  if (eventsLoading && !liveEvents) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando eventos...</div>
      </div>
    )
  }
  
  // Si es modo casual, mostrar dashboard simplificado
  if (isCasualMode) {
    return (
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Tu Dashboard
          </h1>
          <p className="text-gray-400">Vista simplificada para apostadores casuales</p>
        </div>
        
        <CasualDashboard />
        
        <div className="mt-8">
          <DailyTip />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-400">Bienvenido a tu panel de análisis predictivo</p>
      </div>

      {/* Quick Value Bet Demo for New Users */}
      {shouldShow && (
        <div className="mb-8">
          <QuickValueBetDemo />
        </div>
      )}

      {/* Quick Stats - Reales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Win Rate"
          value={`${displayStats.winRate.toFixed(1)}%`}
          change={userStats ? `${userStats.totalWins} ganadas de ${userStats.totalBets} apuestas` : 'Sin datos'}
          trend={displayStats.winRate > 50 ? "up" : "down"}
        />
        <StatsCard
          title="ROI Mensual"
          value={`${displayStats.roi >= 0 ? '+' : ''}${displayStats.roi.toFixed(1)}%`}
          change={userStats ? `€${userStats.netProfit >= 0 ? '+' : ''}${userStats.netProfit.toFixed(2)}` : 'Sin datos'}
          trend={displayStats.roi > 0 ? "up" : "down"}
        />
        <StatsCard
          title="Value Bets"
          value={displayStats.valueBets.toString()}
          subtitle="Este mes"
        />
        <StatsCard
          title="Total Apostado"
          value={`€${displayStats.bankroll.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          change={userStats ? `${userStats.totalBets} apuestas` : 'Sin datos'}
        />
      </div>

      {/* Alertas en tiempo real - Reales */}
      {allAlerts.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-accent-500/20 to-primary-500/20 rounded-xl p-4 border border-accent-500/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="relative">
                <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                <span className="absolute top-0 left-0 w-2 h-2 bg-accent-400 rounded-full animate-ping opacity-75"></span>
              </span>
              Alertas en Tiempo Real
            </h3>
            <span className="text-xs text-gray-400">{allAlerts.length} nuevas</span>
          </div>
          <div className="space-y-2">
            {allAlerts.slice(0, 3).map((alert) => (
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

      {/* Social Proof - Show after onboarding or for returning users */}
      {!shouldShow && (
        <div className="mb-8">
          <SocialProof />
        </div>
      )}

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
            {liveEvents && liveEvents.length > 0 ? (
              liveEvents.slice(0, 5).map((event) => (
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
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 5).map((event) => (
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
    </>
  )
}


import { useQuery } from '@tanstack/react-query'
import { eventsService, type Event } from '../services/eventsService'
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
import Icon, { type IconName } from '../components/icons/IconSystem'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'

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

  // Loading state mejorado con skeleton
  if (eventsLoading && !liveEvents) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader type="card" count={4} />
        </div>
        <SkeletonLoader type="list" count={3} />
      </div>
    )
  }
  
  // Si es modo casual, mostrar dashboard simplificado
  if (isCasualMode) {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-2">
            Tu Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">Vista simplificada para apostadores casuales</p>
        </div>
        
        <CasualDashboard />
        
        <div className="mt-4 sm:mt-6 md:mt-8">
          <DailyTip />
        </div>
      </div>
    )
  }

  // Quick access tools - Organized and essential only
  const quickTools = [
    { to: '/predictions', label: 'Predicciones', icon: 'predictions' as IconName, color: 'from-gold-500/20 to-gold-600/20', borderColor: 'border-gold-500/40', badge: 'Pro' },
    { to: '/events', label: 'Eventos', icon: 'events' as IconName, color: 'from-primary-500/20 to-primary-600/20', borderColor: 'border-primary-500/40' },
    { to: '/odds-comparison', label: 'Comparar Cuotas', icon: 'odds' as IconName, color: 'from-accent-500/20 to-accent-600/20', borderColor: 'border-accent-500/40' },
    { to: '/my-bets', label: 'Mis Apuestas', icon: 'bets' as IconName, color: 'from-purple-500/20 to-purple-600/20', borderColor: 'border-purple-500/40' },
    { to: '/statistics', label: 'Estadísticas', icon: 'statistics' as IconName, color: 'from-blue-500/20 to-blue-600/20', borderColor: 'border-blue-500/40' },
    { to: '/alerts', label: 'Alertas', icon: 'alerts' as IconName, color: 'from-red-500/20 to-red-600/20', borderColor: 'border-red-500/40' },
  ]

  return (
    <>
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-2">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">Bienvenido a tu panel de análisis predictivo</p>
        </div>

        {/* Quick Value Bet Demo for New Users */}
        {shouldShow && (
          <div className="mb-6 sm:mb-8">
            <QuickValueBetDemo />
          </div>
        )}

        {/* Quick Stats - Reales - Enhanced design */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-6 sm:mb-8 md:mb-10">
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

        {/* Alertas en tiempo real - Enhanced design */}
        {allAlerts.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-br from-accent-500/10 via-primary-500/10 to-accent-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-accent-500/30 shadow-lg shadow-accent-500/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <span className="relative flex-shrink-0">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-400 rounded-full animate-pulse"></span>
                  <span className="absolute top-0 left-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-400 rounded-full animate-ping opacity-75"></span>
                </span>
                <span className="hidden sm:inline">Alertas en Tiempo Real</span>
                <span className="sm:hidden">Alertas</span>
              </h3>
              <Link
                to="/alerts"
                className="text-xs sm:text-sm text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors"
              >
                {allAlerts.length} nuevas
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {allAlerts.slice(0, 3).map((alert) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  className="block bg-slate-900/60 hover:bg-slate-900/80 rounded-lg p-3.5 border border-primary-500/20 hover:border-primary-500/40 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                      alert.type === 'value_bet' ? 'bg-gold-400 shadow-lg shadow-gold-400/50' :
                      alert.type === 'odds_change' ? 'bg-primary-400 shadow-lg shadow-primary-400/50' :
                      'bg-accent-400 shadow-lg shadow-accent-400/50'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate mb-1">{alert.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid - Better Organization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
          {/* Left Column - Quick Tools */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Quick Access Tools Grid - Enhanced */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-slate-700/50 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Icon name="zap" size={24} className="text-primary-400" />
                  Herramientas Rápidas
                </h2>
                <Link
                  to="/alerts"
                  className="text-sm text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  Ver todas
                  <Icon name="arrow-right" size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {quickTools.map((tool) => (
                  <Link
                    key={tool.to}
                    to={tool.to}
                    className={`bg-gradient-to-br ${tool.color} rounded-xl p-4 sm:p-5 border-2 ${tool.borderColor} hover:border-opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 group min-h-[110px] sm:min-h-[130px] flex flex-col items-center justify-center relative shadow-md hover:shadow-xl overflow-hidden`}
                  >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {tool.badge && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-gold-500/40 text-gold-200 text-xs font-bold rounded-full border border-gold-500/60 shadow-md z-10">
                        {tool.badge}
                      </span>
                    )}
                    <div className="mb-2 sm:mb-3 flex items-center justify-center relative z-10">
                      <div className="p-3 rounded-xl bg-white/10 group-hover:bg-white/20 transition-all duration-200 shadow-lg">
                        <Icon name={tool.icon} size={26} className="text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white text-center leading-tight relative z-10">{tool.label}</h3>
                  </Link>
                ))}
              </div>
            </div>

            {/* Value Bet Calculator - Enhanced */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-slate-700/50 shadow-lg backdrop-blur-sm">
              <ValueBetCalculator />
            </div>
          </div>

          {/* Right Column - Social Proof - Enhanced */}
          <div className="lg:col-span-1">
            {!shouldShow && (
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-slate-700/50 shadow-lg backdrop-blur-sm sticky top-20">
                <SocialProof />
              </div>
            )}
          </div>
        </div>

        {/* Events Section - Enhanced design */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-700/50 shadow-lg backdrop-blur-sm mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Icon name="events" size={28} className="text-primary-400" />
              Eventos
            </h2>
            <Link
              to="/events"
              className="text-sm sm:text-base text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-2 flex-shrink-0 transition-colors hover:gap-3"
            >
              Ver todos
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {/* Live Events */}
            <div className="w-full">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 sm:mb-3 md:mb-4">
                Eventos en Vivo
              </h3>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {liveEvents && liveEvents.length > 0 ? (
                  liveEvents.slice(0, 5).map((event: Event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2.5 sm:p-3 md:p-4 hover:from-slate-700 hover:to-slate-800 transition-all border border-primary-500/20 hover:border-primary-400/40 group active:scale-95"
                    >
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">{event.sport?.name}</p>
                            {event.status === 'LIVE' && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-[10px] sm:text-xs font-bold flex items-center gap-1 flex-shrink-0">
                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-white font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 line-clamp-2 leading-tight">
                            {event.homeTeam} vs {event.awayTeam}
                          </p>
                          {event.status === 'LIVE' && event.homeScore !== undefined && event.awayScore !== undefined && (
                            <p className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-primary-300 via-accent-300 to-gold-300 bg-clip-text text-transparent">
                              {event.homeScore} - {event.awayScore}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                            {format(new Date(event.startTime || new Date()), 'HH:mm', { locale: es })}
                          </p>
                          {event.status === 'LIVE' && (
                            <span className="inline-block mt-1 sm:mt-2 text-primary-400 group-hover:translate-x-1 transition-transform text-xs sm:text-sm">→</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    icon="events"
                    title="No hay eventos en vivo"
                    message="No hay eventos en curso en este momento. Revisa los próximos eventos o vuelve más tarde."
                    actionLabel="Ver Próximos Eventos"
                    actionTo="/events"
                  />
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="w-full">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 sm:mb-3 md:mb-4">
                Próximos Eventos
              </h3>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 5).map((event: Event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2.5 sm:p-3 md:p-4 hover:from-slate-700 hover:to-slate-800 transition-all border border-primary-500/20 hover:border-primary-400/40 group active:scale-95"
                    >
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">{event.sport?.name}</p>
                          <p className="text-white font-bold text-xs sm:text-sm md:text-base line-clamp-2 leading-tight">
                            {event.homeTeam} vs {event.awayTeam}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                            {format(new Date(event.startTime), 'dd MMM HH:mm', { locale: es })}
                          </p>
                          <span className="inline-block mt-1 sm:mt-2 text-primary-400 group-hover:translate-x-1 transition-transform text-xs sm:text-sm">→</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    icon="events"
                    title="No hay eventos próximos"
                    message="No hay eventos programados en este momento. Los eventos aparecerán aquí cuando estén disponibles."
                    actionLabel="Explorar Eventos"
                    actionTo="/events"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


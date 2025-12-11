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
        {/* Header - Premium Design */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Icon name="activity" size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 ml-0 sm:ml-16">
                Bienvenido a tu panel de análisis predictivo
              </p>
            </div>
            {userStats && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Última actualización</p>
                  <p className="text-sm font-semibold text-gray-400">Hace un momento</p>
                </div>
                <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Value Bet Demo for New Users */}
        {shouldShow && (
          <div className="mb-6 sm:mb-8">
            <QuickValueBetDemo />
          </div>
        )}

        {/* Quick Stats - Premium Design with Icons */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-6 sm:mb-8 md:mb-10">
          <StatsCard
            title="Win Rate"
            value={`${displayStats.winRate.toFixed(1)}%`}
            change={userStats ? `${userStats.totalWins} ganadas de ${userStats.totalBets} apuestas` : 'Sin datos'}
            trend={displayStats.winRate > 50 ? "up" : "down"}
            icon="trending-up"
            gradient="from-emerald-500/20 to-green-500/20"
          />
          <StatsCard
            title="ROI Mensual"
            value={`${displayStats.roi >= 0 ? '+' : ''}${displayStats.roi.toFixed(1)}%`}
            change={userStats ? `€${userStats.netProfit >= 0 ? '+' : ''}${userStats.netProfit.toFixed(2)}` : 'Sin datos'}
            trend={displayStats.roi > 0 ? "up" : "down"}
            icon="chart"
            gradient="from-primary-500/20 to-accent-500/20"
          />
          <StatsCard
            title="Value Bets"
            value={displayStats.valueBets.toString()}
            subtitle="Este mes"
            icon="zap"
            gradient="from-gold-500/20 to-amber-500/20"
          />
          <StatsCard
            title="Total Apostado"
            value={`€${displayStats.bankroll.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
            change={userStats ? `${userStats.totalBets} apuestas` : 'Sin datos'}
            icon="wallet"
            gradient="from-blue-500/20 to-cyan-500/20"
          />
        </div>

        {/* Alertas en tiempo real - Premium Design */}
        {allAlerts.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-br from-accent-500/15 via-primary-500/10 to-accent-500/15 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 border-2 border-accent-500/30 shadow-xl shadow-accent-500/10 backdrop-blur-md relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
            
            <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/30 to-primary-500/30 flex items-center justify-center shadow-lg">
                    <Icon name="alerts" size={20} className="text-accent-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    Alertas en Tiempo Real
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Actualizaciones instantáneas</p>
                </div>
              </div>
              <Link
                to="/alerts"
                className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/40 rounded-lg text-primary-300 hover:text-primary-200 font-semibold text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105 flex-shrink-0"
              >
                {allAlerts.length} nuevas
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
            <div className="space-y-3 relative z-10">
              {allAlerts.slice(0, 3).map((alert, idx) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  className="block bg-slate-900/70 hover:bg-slate-900/90 rounded-xl p-4 border border-primary-500/20 hover:border-primary-500/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group backdrop-blur-sm"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 shadow-lg ${
                      alert.type === 'value_bet' ? 'bg-gold-400 shadow-gold-400/50' :
                      alert.type === 'odds_change' ? 'bg-primary-400 shadow-primary-400/50' :
                      'bg-accent-400 shadow-accent-400/50'
                    } animate-pulse`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-bold text-white">{alert.title}</p>
                        {alert.type === 'value_bet' && (
                          <span className="px-2 py-0.5 bg-gold-500/20 text-gold-300 text-[10px] font-bold rounded-full border border-gold-500/40">
                            VALUE BET
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{alert.message}</p>
                    </div>
                    <Icon name="arrow-right" size={16} className="text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
            {/* Quick Access Tools Grid - Premium Design */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl sm:rounded-2xl p-6 sm:p-7 border border-slate-700/50 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center shadow-lg">
                    <Icon name="zap" size={24} className="text-primary-300" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Herramientas Rápidas</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Acceso rápido a funciones principales</p>
                  </div>
                </div>
                <Link
                  to="/alerts"
                  className="text-sm text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5 transition-colors hover:gap-2"
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
                    className={`bg-gradient-to-br ${tool.color} rounded-xl p-4 sm:p-5 border-2 ${tool.borderColor} hover:border-opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 group min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center relative shadow-lg hover:shadow-2xl overflow-hidden`}
                  >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300`}></div>
                    
                    {tool.badge && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-gold-500/50 text-gold-100 text-[10px] font-black rounded-full border border-gold-400/60 shadow-lg z-10 uppercase tracking-wide">
                        {tool.badge}
                      </span>
                    )}
                    <div className="mb-3 flex items-center justify-center relative z-10">
                      <div className="p-3.5 rounded-xl bg-white/10 group-hover:bg-white/20 transition-all duration-300 shadow-xl group-hover:scale-110">
                        <Icon name={tool.icon} size={28} className="text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white text-center leading-tight relative z-10 group-hover:text-primary-200 transition-colors">{tool.label}</h3>
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
            {/* Live Events - Premium Cards */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  Eventos en Vivo
                </h3>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {liveEvents && liveEvents.length > 0 ? (
                  liveEvents.slice(0, 5).map((event: Event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-3 sm:p-4 border border-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 hover:scale-[1.02] group backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-slate-700/50 rounded-md text-[10px] sm:text-xs text-gray-300 uppercase tracking-wider font-semibold">
                              {event.sport?.name}
                            </span>
                            {event.status === 'LIVE' && (
                              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded-full text-red-300 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                                EN VIVO
                              </span>
                            )}
                          </div>
                          <p className="text-white font-bold text-sm sm:text-base md:text-lg mb-1.5 line-clamp-2 leading-tight">
                            {event.homeTeam} <span className="text-gray-500 font-normal">vs</span> {event.awayTeam}
                          </p>
                          {event.status === 'LIVE' && event.homeScore !== undefined && event.awayScore !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 via-primary-400 to-accent-400 bg-clip-text text-transparent">
                                {event.homeScore}
                              </span>
                              <span className="text-gray-500">-</span>
                              <span className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 via-primary-400 to-accent-400 bg-clip-text text-transparent">
                                {event.awayScore}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end justify-between min-h-[60px]">
                          <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap mb-2">
                            {format(new Date(event.startTime || new Date()), 'HH:mm', { locale: es })}
                          </p>
                          <Icon name="arrow-right" size={18} className="text-primary-400 group-hover:text-primary-300 group-hover:translate-x-1 transition-all" />
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

            {/* Upcoming Events - Premium Cards */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full"></div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Icon name="clock" size={18} className="text-primary-400" />
                  Próximos Eventos
                </h3>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 5).map((event: Event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-3 sm:p-4 border border-primary-500/20 hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-200 hover:scale-[1.02] group backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-slate-700/50 rounded-md text-[10px] sm:text-xs text-gray-300 uppercase tracking-wider font-semibold mb-2">
                            {event.sport?.name}
                          </span>
                          <p className="text-white font-bold text-sm sm:text-base md:text-lg line-clamp-2 leading-tight mb-1">
                            {event.homeTeam} <span className="text-gray-500 font-normal">vs</span> {event.awayTeam}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Icon name="clock" size={14} className="text-gray-500" />
                            <p className="text-xs text-gray-400">
                              {format(new Date(event.startTime), 'dd MMM, HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center">
                          <Icon name="arrow-right" size={18} className="text-primary-400 group-hover:text-primary-300 group-hover:translate-x-1 transition-all" />
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


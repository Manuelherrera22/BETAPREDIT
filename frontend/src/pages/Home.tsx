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

  // Cargar eventos en vivo - actualización más frecuente
  const { data: liveEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['liveEvents'],
    queryFn: () => eventsService.getLiveEvents(),
    refetchInterval: 15000, // Actualizar cada 15 segundos para eventos en vivo
    retry: false,
  })

  // Cargar eventos próximos - incluir los que empiezan pronto
  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      const events = await eventsService.getUpcomingEvents();
      // Filtrar eventos que empiezan en las próximas 2 horas para mostrar como "preview"
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      return events.filter((event: Event) => {
        const startTime = new Date(event.startTime);
        return startTime <= twoHoursFromNow && event.status === 'SCHEDULED';
      }).sort((a: Event, b: Event) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
    retry: false,
  })

  // Filtrar eventos realmente en vivo (con status LIVE)
  const trulyLiveEvents = (liveEvents || []).filter((event: Event) => 
    event.status === 'LIVE' || (event.homeScore !== undefined && event.awayScore !== undefined)
  )

  // Eventos que están por empezar (próximos 30 minutos) - Preview
  const previewEvents = (upcomingEvents || []).filter((event: Event) => {
    const startTime = new Date(event.startTime);
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    return startTime >= now && startTime <= thirtyMinutesFromNow;
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
        {/* Header - Elegant Design */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-primary-500/30 via-primary-600/30 to-accent-500/30 flex items-center justify-center shadow-md border border-primary-500/40">
                  <Icon name="activity" size={16} className="text-primary-200" strokeWidth={2} />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 ml-0 sm:ml-11">
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center shadow-md border border-accent-500/30">
                    <Icon name="alerts" size={16} className="text-accent-300" strokeWidth={2} />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
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

        {/* Main Content - Better Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Left Column - Main Content (8 columns) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Quick Access Tools Grid */}
            <div className="bg-slate-800/50 rounded-xl p-5 sm:p-6 border border-slate-700/40 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-primary-500/30">
                    <Icon name="zap" size={14} className="text-primary-300" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Herramientas Rápidas</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Acceso rápido</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickTools.map((tool) => (
                  <Link
                    key={tool.to}
                    to={tool.to}
                    className={`bg-gradient-to-br ${tool.color} rounded-lg p-3.5 sm:p-4 border ${tool.borderColor} hover:border-opacity-100 transition-all duration-200 hover:scale-[1.02] group min-h-[100px] sm:min-h-[110px] flex flex-col items-center justify-center relative shadow-md hover:shadow-lg overflow-hidden`}
                  >
                    {tool.badge && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-gold-500/40 text-gold-200 text-[9px] font-bold rounded-full border border-gold-500/50 z-10">
                        {tool.badge}
                      </span>
                    )}
                    <div className="mb-2 flex items-center justify-center relative z-10">
                      <div className="p-2 rounded-lg bg-white/8 group-hover:bg-white/12 transition-all duration-200 border border-white/10">
                        <Icon name={tool.icon} size={18} className="text-white/90" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-white text-center leading-tight relative z-10">{tool.label}</h3>
                  </Link>
                ))}
              </div>
            </div>

            {/* Value Bet Calculator */}
            <div className="bg-slate-800/50 rounded-xl p-5 sm:p-6 border border-slate-700/40 shadow-lg">
              <ValueBetCalculator />
            </div>
          </div>

          {/* Right Column - Social Proof (4 columns) */}
          <div className="lg:col-span-4">
            {!shouldShow && (
              <div className="bg-slate-800/50 rounded-xl p-4 sm:p-5 border border-slate-700/40 shadow-lg backdrop-blur-sm sticky top-20">
                <SocialProof />
              </div>
            )}
          </div>
        </div>

        {/* Events Section - Live & Upcoming */}
        <div className="space-y-6 mb-4 sm:mb-6 md:mb-8">
          {/* Live Events Section - Priority */}
          <div className="bg-slate-900/40 rounded-2xl p-5 sm:p-6 border-2 border-red-500/20 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center shadow-md border border-red-500/30">
                  <Icon name="activity" size={16} className="text-red-300" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    Eventos en Vivo
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Actualización cada 15 segundos</p>
                </div>
              </div>
              <Link
                to="/events?status=LIVE"
                className="text-sm text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-2 transition-colors"
              >
                Ver todos
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
            
            <div className="space-y-2.5">
              {trulyLiveEvents.length > 0 ? (
                trulyLiveEvents
                  .sort((a: Event, b: Event) => {
                    // Priorizar eventos con más importancia (más mercados, más recientes)
                    const aImportance = (a.markets?.length || 0) + (a.homeScore !== undefined ? 10 : 0);
                    const bImportance = (b.markets?.length || 0) + (b.homeScore !== undefined ? 10 : 0);
                    return bImportance - aImportance;
                  })
                  .slice(0, 5)
                  .map((event: Event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-gradient-to-br from-red-900/30 via-slate-800/90 to-slate-900/90 rounded-xl p-3.5 sm:p-4 border-2 border-red-500/30 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-200 hover:scale-[1.01] group backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded-md text-[10px] sm:text-xs text-red-300 uppercase tracking-wider font-bold">
                              {event.sport?.name}
                            </span>
                            <span className="px-2 py-0.5 bg-red-500/30 border border-red-500/60 rounded-full text-red-200 text-[10px] sm:text-xs font-black flex items-center gap-1.5 shadow-lg shadow-red-500/30">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                              EN VIVO
                            </span>
                          </div>
                          <p className="text-white font-bold text-sm sm:text-base md:text-lg mb-2 line-clamp-2 leading-tight">
                            {event.homeTeam} <span className="text-gray-500 font-normal">vs</span> {event.awayTeam}
                          </p>
                          {event.homeScore !== undefined && event.awayScore !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-red-400 via-red-300 to-accent-400 bg-clip-text text-transparent">
                                {event.homeScore}
                              </span>
                              <span className="text-gray-500 text-lg">-</span>
                              <span className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-red-400 via-red-300 to-accent-400 bg-clip-text text-transparent">
                                {event.awayScore}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end justify-between min-h-[60px]">
                          <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap mb-2">
                            {format(new Date(event.startTime || new Date()), 'HH:mm', { locale: es })}
                          </p>
                          <Icon name="arrow-right" size={18} className="text-red-400 group-hover:text-red-300 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))
              ) : (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/40 text-center">
                  <Icon name="events" size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-400 mb-1">No hay eventos en vivo</p>
                  <p className="text-xs text-gray-500 mb-4">Los eventos aparecerán aquí cuando estén en curso</p>
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/40 rounded-lg text-primary-300 text-sm font-semibold transition-colors"
                  >
                    Ver Próximos Eventos
                    <Icon name="arrow-right" size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Preview Events - Starting Soon */}
          {previewEvents.length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-5 sm:p-6 border border-amber-500/20 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
                    <Icon name="clock" size={14} className="text-amber-300" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Empiezan Pronto</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Próximos 30 minutos</p>
                  </div>
                </div>
                <Link
                  to="/events"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
                >
                  Ver todos
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
              <div className="space-y-2">
                {previewEvents.slice(0, 3).map((event: Event) => {
                  const startTime = new Date(event.startTime);
                  const now = new Date();
                  const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
                  
                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-slate-900/50 rounded-lg p-3 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-200 hover:scale-[1.01] group"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-slate-700/50 rounded-md text-[10px] text-gray-300 uppercase tracking-wider font-semibold mb-1.5">
                            {event.sport?.name}
                          </span>
                          <p className="text-white font-semibold text-sm line-clamp-2 leading-tight mb-1">
                            {event.homeTeam} <span className="text-gray-500 font-normal">vs</span> {event.awayTeam}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Icon name="clock" size={12} className="text-amber-400" />
                            <p className="text-xs text-amber-300 font-semibold">
                              {minutesUntilStart > 0 ? `En ${minutesUntilStart} min` : 'Empezando ahora'}
                            </p>
                          </div>
                        </div>
                        <Icon name="arrow-right" size={16} className="text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          <div className="bg-slate-800/50 rounded-2xl p-5 sm:p-6 border border-slate-700/40 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-primary-500/30">
                  <Icon name="events" size={14} className="text-primary-300" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Próximos Eventos</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Próximas 2 horas</p>
                </div>
              </div>
              <Link
                to="/events"
                className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5"
              >
                Ver todos
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 5).map((event: Event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block bg-slate-900/50 rounded-lg p-3 border border-primary-500/20 hover:border-primary-500/40 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 bg-slate-700/50 rounded-md text-[10px] text-gray-300 uppercase tracking-wider font-semibold mb-1.5">
                          {event.sport?.name}
                        </span>
                        <p className="text-white font-semibold text-sm line-clamp-2 leading-tight mb-1">
                          {event.homeTeam} <span className="text-gray-500 font-normal">vs</span> {event.awayTeam}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Icon name="clock" size={12} className="text-gray-500" />
                          <p className="text-xs text-gray-400">
                            {format(new Date(event.startTime), 'dd MMM, HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <Icon name="arrow-right" size={16} className="text-primary-400 group-hover:text-primary-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">No hay eventos próximos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


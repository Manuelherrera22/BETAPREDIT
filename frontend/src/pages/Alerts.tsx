import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { valueBetAlertsService, type ValueBetAlert } from '../services/valueBetAlertsService';
import { notificationsService } from '../services/notificationsService';
import { useWebSocket } from '../hooks/useWebSocket';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuthStore } from '../store/authStore';
import Icon from '../components/icons/IconSystem';
import EmptyState from '../components/EmptyState';
import RegisterBetForm from '../components/RegisterBetForm';

interface Alert {
  id: string;
  type: 'value_bet' | 'odds_change' | 'new_event' | 'prediction';
  title: string;
  message: string;
  event?: string;
  value?: number;
  timestamp: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
  source?: 'value_bet_alert' | 'notification';
  valueBetAlertData?: ValueBetAlert; // Datos completos del value bet alert
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id);
  const [isRegisterBetOpen, setIsRegisterBetOpen] = useState(false);
  const [selectedValueBetAlert, setSelectedValueBetAlert] = useState<ValueBetAlert | null>(null);

  // WebSocket para alertas en tiempo real
  const { isConnected, lastMessage, subscribe, unsubscribe } = useWebSocket({
    autoConnect: true,
    channels: userId ? [`value-bets:${userId}`, `notifications:${userId}`] : [],
  });

  // Push notifications
  const { showValueBetNotification, showGenericNotification, isGranted } = usePushNotifications();

  // Cargar alertas y notificaciones
  useEffect(() => {
    const loadAlerts = async () => {
      if (!userId) {
        setLoading(false);
        setAlerts([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Cargar value bet alerts
        let valueBetAlerts: any[] = [];
        try {
          const alertsResult = await valueBetAlertsService.getMyAlerts({ status: 'ACTIVE' });
          valueBetAlerts = Array.isArray(alertsResult) ? alertsResult : [];
        } catch (err: any) {
          console.error('Error loading value bet alerts:', err);
          // Don't fail completely, just log and continue
        }
        
        // Cargar notificaciones
        let notifications: any[] = [];
        try {
          const notifResult = await notificationsService.getMyNotifications({ read: false, limit: 50 });
          notifications = Array.isArray(notifResult) ? notifResult : [];
        } catch (err: any) {
          console.error('Error loading notifications:', err);
          // Don't fail completely, just log and continue
        }

        // Validar que sean arrays (defensive programming)
        const safeValueBetAlerts = Array.isArray(valueBetAlerts) ? valueBetAlerts : [];
        const safeNotifications = Array.isArray(notifications) ? notifications : [];

        // Convertir value bet alerts a formato de alerta
        const valueBetAlertsFormatted: Alert[] = safeValueBetAlerts.map(alert => ({
          id: alert.id,
          type: 'value_bet' as const,
          title: 'Value Bet Detectado',
          message: `${alert.event?.homeTeam || 'Equipo 1'} vs ${alert.event?.awayTeam || 'Equipo 2'} - ${alert.selection} @ ${alert.bookmakerOdds.toFixed(2)} (${alert.bookmakerPlatform})`,
          event: alert.event ? `${alert.event.homeTeam} vs ${alert.event.awayTeam}` : undefined,
          value: alert.valuePercentage,
          timestamp: alert.createdAt,
          read: alert.status !== 'ACTIVE',
          priority: alert.valuePercentage > 10 ? 'high' : alert.valuePercentage > 5 ? 'medium' : 'low',
          source: 'value_bet_alert' as const,
          valueBetAlertData: alert, // Guardar datos completos
        }));

        // Convertir notificaciones a formato de alerta
        const notificationsFormatted: Alert[] = safeNotifications.map(notif => ({
          id: notif.id,
          type: (notif.type === 'VALUE_BET_DETECTED' ? 'value_bet' :
                 notif.type === 'ODDS_CHANGED' ? 'odds_change' :
                 notif.type === 'PREDICTION_READY' ? 'prediction' :
                 'new_event') as 'value_bet' | 'odds_change' | 'prediction' | 'new_event',
          title: notif.title,
          message: notif.message,
          timestamp: notif.createdAt,
          read: notif.read,
          priority: notif.type === 'VALUE_BET_DETECTED' ? 'high' : 'medium',
          source: 'notification' as const,
        }));

        // Combinar y ordenar por timestamp
        const allAlerts = [...valueBetAlertsFormatted, ...notificationsFormatted]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setAlerts(allAlerts);
      } catch (err: any) {
        console.error('Error loading alerts:', err);
        setError('Error al cargar las alertas');
        // Sin datos mock, mostrar array vacío si hay error
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    // Actualizar cada 30 segundos (fallback si WebSocket falla)
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Suscribirse a WebSocket cuando el usuario está disponible
  useEffect(() => {
    if (userId && isConnected) {
      subscribe(`value-bets:${userId}`);
      subscribe(`notifications:${userId}`);
      return () => {
        unsubscribe(`value-bets:${userId}`);
        unsubscribe(`notifications:${userId}`);
      };
    }
  }, [userId, isConnected, subscribe, unsubscribe]);

  // Actualizar alertas cuando llega mensaje por WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'value-bet:alert') {
      const alertData = lastMessage.data;
      const newAlert: Alert = {
        id: alertData.id,
        type: 'value_bet',
        title: 'Value Bet Detectado',
        message: `${alertData.event?.homeTeam || 'Equipo 1'} vs ${alertData.event?.awayTeam || 'Equipo 2'} - ${alertData.selection} @ ${alertData.bookmakerOdds} (${alertData.bookmakerPlatform})`,
        event: alertData.event ? `${alertData.event.homeTeam} vs ${alertData.event.awayTeam}` : undefined,
        value: alertData.valuePercentage,
        timestamp: alertData.timestamp || new Date().toISOString(),
        read: false,
        priority: alertData.valuePercentage > 10 ? 'high' : alertData.valuePercentage > 5 ? 'medium' : 'low',
        source: 'value_bet_alert',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      // Show browser notification if permission granted
      if (isGranted && alertData.valuePercentage) {
        showValueBetNotification({
          id: alertData.id,
          eventName: alertData.event ? `${alertData.event.homeTeam} vs ${alertData.event.awayTeam}` : undefined,
          selection: alertData.selection,
          bookmakerOdds: alertData.bookmakerOdds,
          bookmakerPlatform: alertData.bookmakerPlatform,
          valuePercentage: alertData.valuePercentage,
          eventId: alertData.eventId,
        });
      }
    } else if (lastMessage?.type === 'notification:new') {
      const notifData = lastMessage.data;
      const newAlert: Alert = {
        id: notifData.id,
        type: (notifData.type === 'VALUE_BET_DETECTED' ? 'value_bet' :
               notifData.type === 'ODDS_CHANGED' ? 'odds_change' :
               notifData.type === 'PREDICTION_READY' ? 'prediction' :
               'new_event') as any,
        title: notifData.title,
        message: notifData.message,
        timestamp: notifData.timestamp || new Date().toISOString(),
        read: false,
        priority: notifData.type === 'VALUE_BET_DETECTED' ? 'high' : 'medium',
        source: 'notification',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      // Show browser notification if permission granted
      if (isGranted) {
        const notificationType = notifData.type === 'VALUE_BET_DETECTED' ? 'success' :
                                 notifData.type === 'ODDS_CHANGED' ? 'info' :
                                 notifData.type === 'PREDICTION_READY' ? 'info' : 'info';
        showGenericNotification(notifData.title, notifData.message, notificationType);
      }
    }
  }, [lastMessage, isGranted, showValueBetNotification, showGenericNotification]);

  const [filters, setFilters] = useState<{
    type: string;
    read: string;
  }>({
    type: 'all',
    read: 'all',
  });

  const markAsRead = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    try {
      if (alert.source === 'value_bet_alert') {
        await valueBetAlertsService.markAsClicked(id);
      } else if (alert.source === 'notification') {
        await notificationsService.markAsRead(id);
      }
      setAlerts(alerts.map(a => (a.id === id ? { ...a, read: true } : a)));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      // Actualizar UI de todas formas
      setAlerts(alerts.map(a => (a.id === id ? { ...a, read: true } : a)));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setAlerts(alerts.map(alert => ({ ...alert, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      setAlerts(alerts.map(alert => ({ ...alert, read: true })));
    }
  };

  const deleteAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    try {
      if (alert.source === 'notification') {
        await notificationsService.deleteNotification(id);
      }
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting alert:', error);
      setAlerts(alerts.filter(a => a.id !== id));
    }
  };

  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    if (filters.read === 'unread' && alert.read) return false;
    if (filters.read === 'read' && !alert.read) return false;
    if (priorityFilter !== 'all' && alert.priority !== priorityFilter) return false;
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'value_bet':
        return (
          <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'odds_change':
        return (
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        );
      case 'new_event':
        return (
          <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'value_bet':
        return 'border-gold-500/40 bg-gold-500/10';
      case 'odds_change':
        return 'border-primary-500/40 bg-primary-500/10';
      case 'new_event':
        return 'border-accent-500/40 bg-accent-500/10';
      default:
        return 'border-primary-500/40 bg-primary-500/10';
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;
  const highPriorityCount = alerts.filter(a => !a.read && a.priority === 'high').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">Alertas y Notificaciones</h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-accent-500 text-white rounded-full text-sm font-black animate-pulse">
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
            {highPriorityCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-black animate-pulse">
                {highPriorityCount} alta prioridad
              </span>
            )}
          </div>
            <p className="text-sm sm:text-base text-gray-400">Mantente informado de value bets y cambios importantes</p>
          </div>
          {/* WebSocket Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="relative">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></span>
              </span>
              <span className="text-green-400">Tiempo real</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="text-gray-500">Polling</span>
            </div>
          )}
        </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 sm:px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-xs sm:text-sm font-semibold w-full sm:w-auto"
              >
            Marcar todas como leídas
          </button>
        )}
      </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Tipo de Alerta</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todas ({alerts.length})</option>
            <option value="value_bet">Value Bets ({alerts.filter(a => a.type === 'value_bet').length})</option>
            <option value="odds_change">Cambios de Cuotas ({alerts.filter(a => a.type === 'odds_change').length})</option>
            <option value="new_event">Nuevos Eventos ({alerts.filter(a => a.type === 'new_event').length})</option>
            <option value="prediction">Predicciones ({alerts.filter(a => a.type === 'prediction').length})</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Estado</label>
          <select
            value={filters.read}
            onChange={(e) => setFilters({ ...filters, read: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todas</option>
            <option value="unread">No leídas ({unreadCount})</option>
            <option value="read">Leídas ({alerts.length - unreadCount})</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Prioridad</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todas</option>
            <option value="high">Alta ({alerts.filter(a => a.priority === 'high').length})</option>
            <option value="medium">Media ({alerts.filter(a => a.priority === 'medium').length})</option>
            <option value="low">Baja ({alerts.filter(a => a.priority === 'low').length})</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Acciones</label>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex-1 px-4 py-3 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Alerts List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg ${
                  alert.read
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : `${getAlertColor(alert.type)} border-opacity-60 shadow-lg`
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-black text-white break-words">{alert.title}</h3>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                      {alert.value !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-lg text-sm font-black">
                            +{typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}% Valor
                          </span>
                          {typeof alert.value === 'number' && alert.value > 10 && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold animate-pulse">
                              🔥 Oportunidad Premium
                            </span>
                          )}
                        </div>
                      )}
                      {alert.event && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-400">Evento: {alert.event}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-primary-500/10">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: es })}
                      </span>
                      {alert.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          alert.priority === 'medium' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                        }`}>
                          <span className="flex items-center gap-1.5">
                            {alert.priority === 'high' ? (
                              <>
                                <Icon name="zap" size={14} />
                                <span>Alta Prioridad</span>
                              </>
                            ) : alert.priority === 'medium' ? (
                              <>
                                <Icon name="chart" size={14} />
                                <span>Media Prioridad</span>
                              </>
                            ) : (
                              <>
                                <Icon name="alert" size={14} />
                                <span>Baja Prioridad</span>
                              </>
                            )}
                          </span>
                        </span>
                      )}
                      {alert.source === 'value_bet_alert' && (
                        <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs font-semibold">
                          Value Bet
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {alert.type === 'value_bet' && alert.valueBetAlertData && (
                        <button
                          onClick={() => {
                            setSelectedValueBetAlert(alert.valueBetAlertData!);
                            setIsRegisterBetOpen(true);
                          }}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-all hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Registrar Apuesta
                        </button>
                      )}
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors font-semibold"
                        >
                          ✓ Leída
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-semibold"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : alerts.length === 0 ? (
          <EmptyState
            icon="alerts"
            title="No tienes alertas todavía"
            message="Las alertas de value bets aparecerán aquí cuando nuestro sistema detecte oportunidades de valor en tiempo real."
            actionLabel="Explorar Predicciones"
            actionTo="/predictions"
          />
        ) : (
          <EmptyState
            icon="search"
            title="No hay alertas que coincidan con los filtros"
            message="Intenta ajustar los filtros para ver más resultados."
            actionLabel="Limpiar Filtros"
            actionOnClick={() => setFilters({ type: 'all', read: 'all' })}
          />
        )}
        </div>

        {/* Register Bet Form Modal */}
      {selectedValueBetAlert && (
        <RegisterBetForm
          isOpen={isRegisterBetOpen}
          onClose={() => {
            setIsRegisterBetOpen(false);
            setSelectedValueBetAlert(null);
          }}
          valueBetAlertId={selectedValueBetAlert.id}
          initialData={{
            eventId: selectedValueBetAlert.eventId,
            platform: selectedValueBetAlert.bookmakerPlatform,
            selection: selectedValueBetAlert.selection,
            odds: selectedValueBetAlert.bookmakerOdds,
            marketType: selectedValueBetAlert.market?.type || 'Match Winner',
            betPlacedAt: new Date().toISOString(),
            notes: `Value Bet: +${selectedValueBetAlert.valuePercentage.toFixed(1)}% valor, ${(selectedValueBetAlert.confidence * 100).toFixed(1)}% confianza`,
            metadata: {
              valuePercentage: selectedValueBetAlert.valuePercentage,
              expectedValue: selectedValueBetAlert.expectedValue,
              predictedProbability: selectedValueBetAlert.predictedProbability,
              confidence: selectedValueBetAlert.confidence,
            },
          }}
        />
      )}
    </div>
  );
}


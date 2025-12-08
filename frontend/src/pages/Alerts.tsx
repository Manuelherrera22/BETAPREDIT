import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { valueBetAlertsService } from '../services/valueBetAlertsService';
import { notificationsService } from '../services/notificationsService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';

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
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id);

  // WebSocket para alertas en tiempo real
  const { isConnected, lastMessage, subscribe, unsubscribe } = useWebSocket({
    autoConnect: true,
    channels: userId ? [`value-bets:${userId}`, `notifications:${userId}`] : [],
  });

  // Cargar alertas y notificaciones
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Cargar value bet alerts
        const valueBetAlerts = await valueBetAlertsService.getMyAlerts({ status: 'ACTIVE' });
        
        // Cargar notificaciones
        const notifications = await notificationsService.getMyNotifications({ read: false, limit: 50 });

        // Convertir value bet alerts a formato de alerta
        const valueBetAlertsFormatted: Alert[] = valueBetAlerts.map(alert => ({
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
        }));

        // Convertir notificaciones a formato de alerta
        const notificationsFormatted: Alert[] = notifications.map(notif => ({
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
        setError('Error al cargar las alertas. Usando datos de ejemplo.');
        // Fallback a datos mock si hay error
        setAlerts([
          {
            id: '1',
            type: 'value_bet',
            title: 'Value Bet Detectado',
            message: 'Real Madrid vs Barcelona - Cuota 2.15 con +12% de valor',
            event: 'Real Madrid vs Barcelona',
            value: 12,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'high',
          },
        ]);
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
    }
  }, [lastMessage]);

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

  const filteredAlerts = alerts.filter(alert => {
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    if (filters.read === 'unread' && alert.read) return false;
    if (filters.read === 'read' && !alert.read) return false;
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
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-white">Alertas y Notificaciones</h1>
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
          <p className="text-gray-400">Mantente informado de value bets y cambios importantes</p>
        </div>
        {/* WebSocket Status */}
        <div className="flex items-center gap-2">
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
            className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Tipo de Alerta</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todas</option>
            <option value="value_bet">Value Bets</option>
            <option value="odds_change">Cambios de Cuotas</option>
            <option value="new_event">Nuevos Eventos</option>
            <option value="prediction">Predicciones</option>
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
            <option value="read">Leídas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Prioridad</label>
          <select
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todas</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl p-6 border-2 transition-all ${
                alert.read
                  ? 'bg-dark-900/50 border-primary-500/20'
                  : `${getAlertColor(alert.type)} border-opacity-60`
              }`}
            >
              <div className="flex items-start gap-4">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-black text-white mb-1">{alert.title}</h3>
                      <p className="text-gray-400 text-sm">{alert.message}</p>
                      {alert.value && (
                        <div className="mt-2">
                          <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-lg text-sm font-semibold">
                            +{alert.value}% Valor
                          </span>
                        </div>
                      )}
                    </div>
                    {!alert.read && (
                      <div className="w-3 h-3 bg-accent-400 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: es })}
                      </span>
                      {alert.priority && (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          alert.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          alert.priority === 'medium' ? 'bg-gold-500/20 text-gold-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-3 py-1 text-xs bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
                        >
                          Marcar leída
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-dark-900/50 rounded-xl border border-primary-500/20">
            <p className="text-gray-400">No hay alertas que coincidan con los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}


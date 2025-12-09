/**
 * Hook for Browser Push Notifications
 * Handles permission requests and notification display
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración del navegador.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificaciones activadas');
        return true;
      } else {
        toast.error('Permiso de notificaciones denegado');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error al solicitar permiso de notificaciones');
      return false;
    }
  }, []);

  /**
   * Show a browser notification
   */
  const showNotification = useCallback(
    (options: NotificationOptions) => {
      if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return null;
      }

      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        // Fallback to toast
        toast(`${options.title}: ${options.body}`, {
          icon: options.icon || '🔔',
          duration: 5000,
        });
        return null;
      }

      const notificationOptions: NotificationOptions = {
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options,
      };

      const notification = new Notification(options.title, notificationOptions);

      // Auto-close after 5 seconds (unless requireInteraction is true)
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate if data contains route
        if (options.data?.route) {
          window.location.href = options.data.route;
        }
      };

      return notification;
    },
    []
  );

  /**
   * Show value bet alert notification
   */
  const showValueBetNotification = useCallback(
    (alert: {
      id: string;
      eventName?: string;
      selection: string;
      bookmakerOdds: number;
      bookmakerPlatform: string;
      valuePercentage: number;
      eventId?: string;
    }) => {
      const title = '🎯 Value Bet Detectado!';
      const body = `${alert.eventName || 'Evento'} - ${alert.selection} @ ${alert.bookmakerOdds} (${alert.bookmakerPlatform}) - Valor: +${alert.valuePercentage.toFixed(1)}%`;

      return showNotification({
        title,
        body,
        icon: '/favicon.ico',
        tag: `value-bet-${alert.id}`,
        requireInteraction: true,
        data: {
          type: 'value_bet',
          alertId: alert.id,
          eventId: alert.eventId,
          route: alert.eventId ? `/alerts?alert=${alert.id}` : '/alerts',
        },
      });
    },
    [showNotification]
  );

  /**
   * Show generic notification
   */
  const showGenericNotification = useCallback(
    (title: string, message: string, _type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      return showNotification({
        title,
        body: message,
        icon: '/favicon.ico',
        tag: `notification-${Date.now()}`,
        data: {
          type: _type,
        },
      });
    },
    [showNotification]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showValueBetNotification,
    showGenericNotification,
    isGranted: permission === 'granted',
  };
}


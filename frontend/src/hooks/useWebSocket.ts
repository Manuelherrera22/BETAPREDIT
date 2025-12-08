/**
 * WebSocket Hook
 * Manages Socket.IO connection for real-time updates
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  channels?: string[];
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, channels = [] } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const token = useAuthStore((state) => state.token);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return; // Already connected
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token || undefined,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);

      // Subscribe to channels
      channels.forEach((channel) => {
        if (channel.startsWith('odds:')) {
          const eventId = channel.replace('odds:', '');
          socket.emit('subscribe:odds', eventId);
        } else if (channel.startsWith('value-bets:')) {
          const userId = channel.replace('value-bets:', '');
          socket.emit('subscribe:value-bets', userId || undefined);
        } else if (channel.startsWith('notifications:')) {
          const userId = channel.replace('notifications:', '');
          socket.emit('subscribe:notifications', userId);
        } else if (channel === 'events:live') {
          socket.emit('subscribe:events');
        } else if (channel.startsWith('sport:')) {
          const sport = channel.replace('sport:', '');
          socket.emit('subscribe:sport', sport);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for odds updates
    socket.on('odds:update', (data) => {
      console.log('Odds update received:', data);
      setLastMessage({ type: 'odds:update', data });
    });

    // Listen for value bet alerts
    socket.on('value-bet:alert', (data) => {
      console.log('Value bet alert received:', data);
      setLastMessage({ type: 'value-bet:alert', data });
    });

    // Listen for notifications
    socket.on('notification:new', (data) => {
      console.log('Notification received:', data);
      setLastMessage({ type: 'notification:new', data });
    });

    // Listen for event updates
    socket.on('event:update', (data) => {
      console.log('Event update received:', data);
      setLastMessage({ type: 'event:update', data });
    });

    // Listen for sport updates
    socket.on('sport:update', (data) => {
      console.log('Sport update received:', data);
      setLastMessage({ type: 'sport:update', data });
    });

    // Listen for arbitrage opportunities
    socket.on('arbitrage:opportunity', (data) => {
      console.log('Arbitrage opportunity received:', data);
      setLastMessage({ type: 'arbitrage:opportunity', data });
    });

    socketRef.current = socket;
  }, [token, channels]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot subscribe');
      return;
    }

    if (channel.startsWith('odds:')) {
      const eventId = channel.replace('odds:', '');
      socketRef.current.emit('subscribe:odds', eventId);
    } else if (channel.startsWith('value-bets:')) {
      const userId = channel.replace('value-bets:', '');
      socketRef.current.emit('subscribe:value-bets', userId || undefined);
    } else if (channel.startsWith('notifications:')) {
      const userId = channel.replace('notifications:', '');
      socketRef.current.emit('subscribe:notifications', userId);
    } else if (channel === 'events:live') {
      socketRef.current.emit('subscribe:events');
    } else if (channel.startsWith('sport:')) {
      const sport = channel.replace('sport:', '');
      socketRef.current.emit('subscribe:sport', sport);
    } else if (channel.startsWith('arbitrage:')) {
      const sport = channel.replace('arbitrage:', '');
      socketRef.current.emit('subscribe:arbitrage', sport || undefined);
    } else if (channel === 'arbitrage:all') {
      socketRef.current.emit('subscribe:arbitrage');
    }
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (!socketRef.current?.connected) {
      return;
    }
    socketRef.current.emit('unsubscribe', channel);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connected: isConnected, // Alias for compatibility
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}


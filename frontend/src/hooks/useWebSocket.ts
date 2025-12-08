/**
 * WebSocket Hook
 * Manages Socket.IO connection for real-time updates
 * Uses singleton pattern to prevent multiple connections
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// Extract base URL without /api suffix
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Remove /api if present
  return apiUrl.replace(/\/api$/, '');
};

const SOCKET_URL = getSocketUrl();

// Singleton socket instance
let globalSocket: Socket | null = null;
let connectionListeners: Set<(connected: boolean) => void> = new Set();
let messageListeners: Set<(message: any) => void> = new Set();
let isConnecting = false;

interface UseWebSocketOptions {
  autoConnect?: boolean;
  channels?: string[];
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, channels = [] } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const token = useAuthStore((state) => state.token);
  const channelsRef = useRef<string[]>(channels);

  // Update channels ref when they change
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  // Connection state listener
  useEffect(() => {
    const listener = (connected: boolean) => {
      setIsConnected(connected);
    };
    connectionListeners.add(listener);
    return () => {
      connectionListeners.delete(listener);
    };
  }, []);

  // Message listener
  useEffect(() => {
    const listener = (message: any) => {
      setLastMessage(message);
    };
    messageListeners.add(listener);
    return () => {
      messageListeners.delete(listener);
    };
  }, []);

  // Initialize socket connection (singleton)
  useEffect(() => {
    if (!autoConnect || isConnecting || (globalSocket && globalSocket.connected)) {
      return;
    }

    isConnecting = true;

    // If socket exists but disconnected, reconnect
    if (globalSocket && !globalSocket.connected) {
      globalSocket.connect();
      isConnecting = false;
      return;
    }

    // Create new socket if it doesn't exist
    if (!globalSocket) {
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: token || undefined,
        },
        reconnection: true,
        reconnectionDelay: 2000, // Increased delay
        reconnectionDelayMax: 10000, // Max delay
        reconnectionAttempts: 10, // More attempts
        timeout: 20000,
        forceNew: false, // Reuse connection
      });

      socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
        isConnecting = false;
        connectionListeners.forEach((listener) => listener(true));

        // Subscribe to initial channels
        channelsRef.current.forEach((channel) => {
          subscribeToChannel(socket, channel);
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        connectionListeners.forEach((listener) => listener(false));
        
        // Only reconnect if it's not a manual disconnect
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        isConnecting = false;
        connectionListeners.forEach((listener) => listener(false));
      });

      // Listen for all message types
      const messageHandlers = [
        'odds:update',
        'value-bet:alert',
        'notification:new',
        'event:update',
        'sport:update',
        'arbitrage:opportunity',
      ];

      messageHandlers.forEach((event) => {
        socket.on(event, (data) => {
          messageListeners.forEach((listener) =>
            listener({ type: event, data })
          );
        });
      });

      globalSocket = socket;
    }

    return () => {
      // Don't disconnect on unmount, let it stay connected
      // Only disconnect when explicitly called
    };
  }, [autoConnect, token]); // Removed channels from dependencies

  // Subscribe to channels when they change
  useEffect(() => {
    if (!globalSocket || !globalSocket.connected) {
      return;
    }

    channels.forEach((channel) => {
      subscribeToChannel(globalSocket!, channel);
    });
  }, [channels]);

  // Helper function to subscribe to a channel
  const subscribeToChannel = (socket: Socket, channel: string) => {
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
    } else if (channel.startsWith('arbitrage:')) {
      const options = channel === 'arbitrage:all' 
        ? undefined 
        : { sport: channel.replace('arbitrage:', '') };
      socket.emit('subscribe:arbitrage', options);
    }
  };

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (globalSocket?.connected) {
      return;
    }
    if (globalSocket) {
      globalSocket.connect();
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      connectionListeners.forEach((listener) => listener(false));
    }
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    if (!globalSocket?.connected) {
      console.warn('Socket not connected, cannot subscribe');
      return;
    }
    subscribeToChannel(globalSocket, channel);
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (!globalSocket?.connected) {
      return;
    }
    globalSocket.emit('unsubscribe', channel);
  }, []);

  return {
    socket: globalSocket,
    isConnected,
    connected: isConnected, // Alias for compatibility
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

// Export function to manually disconnect (useful for logout)
export function disconnectWebSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    connectionListeners.forEach((listener) => listener(false));
  }
}


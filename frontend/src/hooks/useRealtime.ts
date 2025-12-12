/**
 * Supabase Realtime Hook
 * Manages Supabase Realtime subscriptions for real-time updates
 * Replaces Socket.IO for production use
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  autoConnect?: boolean;
  channels?: string[];
}

interface RealtimeMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { autoConnect = true, channels = [] } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const userId = useAuthStore((state) => state.user?.id);

  // Update channels when they change
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsConnected(false);
      return;
    }

    if (!autoConnect) {
      return;
    }

    // Subscribe to channels
    const subscriptions: RealtimeChannel[] = [];
    let hasConnectedChannel = false;

    channels.forEach((channelName) => {
      let channel: RealtimeChannel | null = null;

      // Subscribe based on channel type
      if (channelName === 'events:live') {
        // Subscribe to Event table changes where status = 'LIVE'
        channel = supabase
          .channel(`events:live-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Event',
              filter: 'status=eq.LIVE',
            },
            (payload) => {
              setLastMessage({
                type: 'event:update',
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              hasConnectedChannel = true;
              setIsConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false);
            }
          });
      } else if (channelName.startsWith('notifications:')) {
        const targetUserId = channelName.replace('notifications:', '') || userId;
        if (targetUserId) {
          // Subscribe to Notification table changes for this user
          channel = supabase
            .channel(`notifications:${targetUserId}-${Date.now()}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'Notification',
                filter: `userId=eq.${targetUserId}`,
              },
              (payload) => {
                setLastMessage({
                  type: 'notification:new',
                  data: payload.new,
                  timestamp: new Date().toISOString(),
                });
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'Notification',
                filter: `userId=eq.${targetUserId}`,
              },
              (payload) => {
                setLastMessage({
                  type: 'notification:update',
                  data: payload.new,
                  timestamp: new Date().toISOString(),
                });
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                hasConnectedChannel = true;
                setIsConnected(true);
              } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setIsConnected(false);
              }
            });
        }
      } else if (channelName.startsWith('value-bets:')) {
        const targetUserId = channelName.replace('value-bets:', '') || userId;
        if (targetUserId) {
          // Subscribe to ValueBetAlert table changes for this user
          channel = supabase
            .channel(`value-bets:${targetUserId}-${Date.now()}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'ValueBetAlert',
                filter: `userId=eq.${targetUserId}`,
              },
              (payload) => {
                setLastMessage({
                  type: 'value-bet:alert',
                  data: payload.new,
                  timestamp: new Date().toISOString(),
                });
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'ValueBetAlert',
                filter: `userId=eq.${targetUserId}`,
              },
              (payload) => {
                setLastMessage({
                  type: 'value-bet:update',
                  data: payload.new,
                  timestamp: new Date().toISOString(),
                });
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                hasConnectedChannel = true;
                setIsConnected(true);
              } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setIsConnected(false);
              }
            });
        }
      } else if (channelName.startsWith('odds:')) {
        const eventId = channelName.replace('odds:', '');
        // Subscribe to Odds table changes for this event
        channel = supabase
          .channel(`odds:${eventId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Odds',
              filter: `eventId=eq.${eventId}`,
            },
            (payload) => {
              setLastMessage({
                type: 'odds:update',
                data: {
                  eventId,
                  odds: payload.new || payload.old,
                },
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              hasConnectedChannel = true;
              setIsConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false);
            }
          });
      } else if (channelName.startsWith('predictions:')) {
        const eventId = channelName.replace('predictions:', '');
        if (eventId === 'all') {
          // Subscribe to all Prediction changes
          channel = supabase
            .channel(`predictions:all-${Date.now()}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'Prediction',
              },
              (payload) => {
                setLastMessage({
                  type: 'prediction:update',
                  data: payload.new || payload.old,
                  timestamp: new Date().toISOString(),
                });
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                hasConnectedChannel = true;
                setIsConnected(true);
              } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setIsConnected(false);
              }
            });
        } else {
          // Subscribe to Prediction changes for specific event
          channel = supabase
            .channel(`predictions:${eventId}-${Date.now()}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'Prediction',
                filter: `eventId=eq.${eventId}`,
              },
              (payload) => {
                setLastMessage({
                  type: 'prediction:update',
                  data: payload.new || payload.old,
                  timestamp: new Date().toISOString(),
                });
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                hasConnectedChannel = true;
                setIsConnected(true);
              } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setIsConnected(false);
              }
            });
        }
      }

      if (channel) {
        subscriptions.push(channel);
        channelsRef.current.set(channelName, channel);
      }
    });

    // Cleanup: unsubscribe from all channels
    return () => {
      subscriptions.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [channels, autoConnect, userId]);

  // Subscribe to a channel
  const subscribe = useCallback((channelName: string, handler?: (data: any) => void) => {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured, cannot subscribe');
      return;
    }

    if (channelsRef.current.has(channelName)) {
      console.warn(`Already subscribed to channel: ${channelName}`);
      return;
    }

    // Similar logic to useEffect above, but for manual subscription
    // This is a simplified version - full implementation would match the useEffect logic
    console.log(`Subscribing to channel: ${channelName}`);
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channelName: string) => {
    const channel = channelsRef.current.get(channelName);
    if (channel && supabase) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelName);
    }
  }, []);

  // Connect (no-op for Realtime, it connects automatically)
  const connect = useCallback(() => {
    // Realtime connects automatically when subscribing
    setIsConnected(true);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    channelsRef.current.forEach((channel) => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    });
    channelsRef.current.clear();
    setIsConnected(false);
  }, []);

  return {
    socket: null, // Not applicable for Realtime
    isConnected,
    connected: isConnected,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

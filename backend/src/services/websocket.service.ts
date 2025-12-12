/**
 * WebSocket Service
 * Handles real-time updates via Socket.IO (development)
 * Also emits to Supabase Realtime for production
 */
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase';

class WebSocketService {
  private io: Server | null = null;

  /**
   * Initialize WebSocket service with Socket.IO instance
   */
  initialize(ioInstance: Server) {
    this.io = ioInstance;
    logger.info('WebSocket service initialized');
  }

  /**
   * Helper to emit to Supabase Realtime (via database updates)
   * In production, updates to database tables automatically trigger Realtime
   */
  private async emitToSupabaseRealtime(table: string, event: string, data: any) {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      
      // For Realtime, we don't emit directly - instead, we update the database
      // and Supabase Realtime automatically broadcasts the changes
      // This is handled by the services that update the database
      
      logger.debug(`Supabase Realtime will broadcast ${event} for table ${table}`);
    } catch (error: any) {
      logger.warn('Error emitting to Supabase Realtime:', error.message);
    }
  }

  /**
   * Emit odds update to subscribers
   */
  emitOddsUpdate(eventId: string, oddsData: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.to(`odds:${eventId}`).emit('odds:update', {
      eventId,
      odds: oddsData,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Odds update emitted for event ${eventId}`);
  }

  /**
   * Emit value bet alert
   */
  emitValueBetAlert(userId: string, alert: any) {
    // Emit via Socket.IO (development)
    if (this.io) {
      // Emit to specific user
      this.io.to(`value-bets:${userId}`).emit('value-bet:alert', {
        ...alert,
        timestamp: new Date().toISOString(),
      });

      // Also emit to general channel
      this.io.to('value-bets:all').emit('value-bet:alert', {
        ...alert,
        timestamp: new Date().toISOString(),
      });
    }

    // For production, the database insert will trigger Realtime automatically
    // This is handled by value-bet-alerts.service when it creates the alert
    this.emitToSupabaseRealtime('ValueBetAlert', 'value-bet:alert', alert);

    logger.debug(`Value bet alert emitted for user ${userId}`);
  }

  /**
   * Emit notification
   */
  emitNotification(userId: string, notification: any) {
    // Emit via Socket.IO (development)
    if (this.io) {
      this.io.to(`notifications:${userId}`).emit('notification:new', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
    }

    // For production, the database insert will trigger Realtime automatically
    // This is handled by notifications.service when it creates the notification
    this.emitToSupabaseRealtime('Notification', 'notification:new', notification);

    logger.debug(`Notification emitted for user ${userId}`);
  }

  /**
   * Emit live event update
   */
  emitLiveEventUpdate(event: any) {
    // Emit via Socket.IO (development)
    if (this.io) {
      this.io.to('events:live').emit('event:update', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    }

    // For production, the database update will trigger Realtime automatically
    // This is handled by the event sync service when it updates the Event table
    this.emitToSupabaseRealtime('Event', 'event:update', event);

    logger.debug(`Live event update emitted`);
  }

  /**
   * Emit sport-specific update
   */
  emitSportUpdate(sport: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.to(`sport:${sport}`).emit('sport:update', {
      sport,
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Sport update emitted for ${sport}`);
  }

  /**
   * Get connected clients count
   */
  getConnectedClients(): number {
    if (!this.io) {
      return 0;
    }

    return this.io.sockets.sockets.size;
  }

  /**
   * Emit arbitrage opportunity alert
   */
  emitArbitrageOpportunity(opportunity: any, sport?: string) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    const alert = {
      ...opportunity,
      timestamp: new Date().toISOString(),
    };

    // Emit to sport-specific channel if provided
    if (sport) {
      this.io.to(`arbitrage:${sport}`).emit('arbitrage:opportunity', alert);
    }

    // Always emit to general channel
    this.io.to('arbitrage:all').emit('arbitrage:opportunity', alert);

    logger.debug(`Arbitrage opportunity emitted for event ${opportunity.eventId}`);
  }

  /**
   * Emit prediction update
   * Notifies when predictions are created or updated
   */
  emitPredictionUpdate(eventId: string, prediction: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    // Emit to event-specific channel
    this.io.to(`predictions:${eventId}`).emit('prediction:update', {
      eventId,
      prediction,
      timestamp: new Date().toISOString(),
    });

    // Also emit to general predictions channel
    this.io.to('predictions:all').emit('prediction:update', {
      eventId,
      prediction,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Prediction update emitted for event ${eventId}`);
  }

  /**
   * Emit prediction batch update
   * Notifies when multiple predictions are updated at once
   */
  emitPredictionBatchUpdate(updates: Array<{ eventId: string; predictions: any[] }>) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.to('predictions:all').emit('prediction:batch-update', {
      updates,
      timestamp: new Date().toISOString(),
    });

    // Also emit to specific event channels
    updates.forEach(({ eventId, predictions }) => {
      this.io?.to(`predictions:${eventId}`).emit('prediction:update', {
        eventId,
        predictions,
        timestamp: new Date().toISOString(),
      });
    });

    logger.debug(`Prediction batch update emitted for ${updates.length} events`);
  }

  /**
   * Broadcast message to all connected clients or specific channel
   */
  broadcast(event: string, data: any, channel?: string) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    if (channel) {
      this.io.to(channel).emit(event, data);
      logger.debug(`Broadcasted ${event} to channel ${channel}`);
    } else {
      this.io.emit(event, data);
      logger.debug(`Broadcasted ${event} to all clients`);
    }
  }
}

// Export singleton
export const webSocketService = new WebSocketService();


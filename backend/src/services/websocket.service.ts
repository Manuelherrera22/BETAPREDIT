/**
 * WebSocket Service
 * Handles real-time updates via Socket.IO
 */
import { Server } from 'socket.io';
import { logger } from '../utils/logger';

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
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

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

    logger.debug(`Value bet alert emitted for user ${userId}`);
  }

  /**
   * Emit notification
   */
  emitNotification(userId: string, notification: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.to(`notifications:${userId}`).emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Notification emitted for user ${userId}`);
  }

  /**
   * Emit live event update
   */
  emitLiveEventUpdate(event: any) {
    if (!this.io) {
      logger.warn('WebSocket service not initialized');
      return;
    }

    this.io.to('events:live').emit('event:update', {
      ...event,
      timestamp: new Date().toISOString(),
    });

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


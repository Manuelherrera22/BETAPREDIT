import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket.service';
// import { emailService } from './email.service'; // Not used directly, handled by notifications service
import { notificationsService } from './notifications.service';
import { userPreferencesService } from './user-preferences.service';

interface CreateValueBetAlertData {
  userId?: string;
  eventId: string;
  marketId: string;
  selection: string;
  bookmakerOdds: number;
  bookmakerPlatform: string;
  predictedProbability: number;
  expectedValue: number;
  valuePercentage: number;
  confidence: number;
  factors?: any;
  expiresAt: Date;
}

class ValueBetAlertsService {
  /**
   * Create a new value bet alert
   */
  async createAlert(data: CreateValueBetAlertData) {
    try {
      // Verify event and market exist
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      const market = await prisma.market.findUnique({
        where: { id: data.marketId },
      });

      if (!market) {
        throw new AppError('Market not found', 404);
      }

      // Check if alert already exists for this event/market/selection
      const existing = await prisma.valueBetAlert.findFirst({
        where: {
          eventId: data.eventId,
          marketId: data.marketId,
          selection: data.selection,
          status: 'ACTIVE',
          userId: data.userId || null,
        },
      });

      if (existing) {
        // Update existing alert instead of creating duplicate
        return await prisma.valueBetAlert.update({
          where: { id: existing.id },
          data: {
            bookmakerOdds: data.bookmakerOdds,
            bookmakerPlatform: data.bookmakerPlatform,
            predictedProbability: data.predictedProbability,
            expectedValue: data.expectedValue,
            valuePercentage: data.valuePercentage,
            confidence: data.confidence,
            factors: data.factors,
            expiresAt: data.expiresAt,
          },
        });
      }

      const alert = await prisma.valueBetAlert.create({
        data: {
          userId: data.userId,
          eventId: data.eventId,
          marketId: data.marketId,
          selection: data.selection,
          bookmakerOdds: data.bookmakerOdds,
          bookmakerPlatform: data.bookmakerPlatform,
          predictedProbability: data.predictedProbability,
          expectedValue: data.expectedValue,
          valuePercentage: data.valuePercentage,
          confidence: data.confidence,
          factors: data.factors,
          expiresAt: data.expiresAt,
          status: 'ACTIVE',
        },
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          market: true,
        },
      });

      logger.info(`Value bet alert created: ${alert.id} for event ${data.eventId}`);

      // Check user preferences before sending notifications
      if (data.userId) {
        try {
          const preferences = await userPreferencesService.getValueBetPreferences(data.userId);
          const notificationThreshold = (preferences.notificationThreshold || 0.10) * 100; // Convert to percentage
          
          // Only send notifications if value meets user's threshold
          if (alert.valuePercentage >= notificationThreshold) {
            // Send WebSocket notification
            webSocketService.emitValueBetAlert(data.userId, {
              id: alert.id,
              eventId: alert.eventId,
              selection: alert.selection,
              bookmakerOdds: alert.bookmakerOdds,
              bookmakerPlatform: alert.bookmakerPlatform,
              valuePercentage: alert.valuePercentage,
              predictedProbability: alert.predictedProbability,
              event: alert.event,
            });

            // Create in-app notification
            try {
              await notificationsService.createNotification({
                userId: data.userId,
                type: 'VALUE_BET_DETECTED',
                title: 'Value Bet Detectado',
                message: `${alert.event?.homeTeam || 'Equipo 1'} vs ${alert.event?.awayTeam || 'Equipo 2'} - ${alert.selection} @ ${alert.bookmakerOdds} (${alert.bookmakerPlatform}) - Valor: +${alert.valuePercentage.toFixed(1)}%`,
                data: {
                  alertId: alert.id,
                  eventId: alert.eventId,
                  valuePercentage: alert.valuePercentage,
                },
              });
            } catch (error) {
              logger.error('Error creating notification for value bet alert:', error);
            }
          } else {
            logger.info(`Alert ${alert.id} below user threshold (${alert.valuePercentage.toFixed(1)}% < ${notificationThreshold.toFixed(1)}%)`);
          }
        } catch (error) {
          logger.warn('Error checking user preferences, sending notification anyway:', error);
          // Fallback: send notification if preferences check fails
          webSocketService.emitValueBetAlert(data.userId, {
            id: alert.id,
            eventId: alert.eventId,
            selection: alert.selection,
            bookmakerOdds: alert.bookmakerOdds,
            bookmakerPlatform: alert.bookmakerPlatform,
            valuePercentage: alert.valuePercentage,
            predictedProbability: alert.predictedProbability,
            event: alert.event,
          });
        }
      }

      return alert;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating value bet alert:', error);
      throw new AppError('Failed to create value bet alert', 500);
    }
  }

  /**
   * Get active value bet alerts for a user
   */
  async getUserAlerts(
    userId: string,
    options: {
      minValue?: number;
      sportId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    // Get user preferences for default filtering
    let userMinValue = options.minValue;
    let userPreferredSports: string[] = [];
    
    try {
      const preferences = await userPreferencesService.getValueBetPreferences(userId);
      if (userMinValue === undefined) {
        userMinValue = (preferences.minValue || 0.05) * 100; // Convert to percentage
      }
      userPreferredSports = preferences.sports || [];
    } catch (error) {
      logger.warn('Error getting user preferences, using defaults:', error);
      if (userMinValue === undefined) {
        userMinValue = 5; // 5% default
      }
    }

    const { sportId, limit = 50, offset = 0 } = options;

    const where: any = {
      OR: [{ userId }, { userId: null }], // User-specific or public alerts
      status: 'ACTIVE',
      valuePercentage: { gte: userMinValue },
      expiresAt: { gt: new Date() },
    };

    // Filter by sport if specified or if user has preferred sports
    if (sportId) {
      where.event = { sportId };
    } else if (userPreferredSports.length > 0) {
      // Filter by user's preferred sports
      const sports = await prisma.sport.findMany({
        where: {
          slug: { in: userPreferredSports },
        },
        select: { id: true },
      });
      
      if (sports.length > 0) {
        where.event = {
          sportId: { in: sports.map(s => s.id) },
        };
      }
    }

      // Optimized query: use select instead of include to reduce data transfer
      const alerts = await prisma.valueBetAlert.findMany({
        where,
        select: {
          id: true,
          userId: true,
          eventId: true,
          marketId: true,
          selection: true,
          bookmakerOdds: true,
          bookmakerPlatform: true,
          predictedProbability: true,
          expectedValue: true,
          valuePercentage: true,
          confidence: true,
          status: true,
          notifiedAt: true,
          clickedAt: true,
          betPlaced: true,
          externalBetId: true,
          factors: true,
          createdAt: true,
          expiresAt: true,
          event: {
            select: {
              id: true,
              name: true,
              homeTeam: true,
              awayTeam: true,
              startTime: true,
              status: true,
              sport: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          market: {
            select: {
              id: true,
              type: true,
              name: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          valuePercentage: 'desc',
        },
        take: limit,
        skip: offset,
      });

    return alerts;
  }

  /**
   * Mark alert as clicked
   */
  async markAsClicked(alertId: string, userId?: string) {
    const alert = await prisma.valueBetAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    // Verify user has access (if userId provided)
    if (userId && alert.userId && alert.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return await prisma.valueBetAlert.update({
      where: { id: alertId },
      data: {
        clickedAt: new Date(),
      },
    });
  }

  /**
   * Mark alert as taken (user placed a bet)
   */
  async markAsTaken(alertId: string, externalBetId: string) {
    const alert = await prisma.valueBetAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    return await prisma.valueBetAlert.update({
      where: { id: alertId },
      data: {
        status: 'TAKEN',
        betPlaced: true,
        externalBetId,
      },
    });
  }

  /**
   * Expire old alerts
   */
  async expireOldAlerts() {
    const expired = await prisma.valueBetAlert.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    logger.info(`Expired ${expired.count} value bet alerts`);
    return expired.count;
  }

  /**
   * Invalidate alerts when odds change significantly
   */
  async invalidateAlert(alertId: string, reason: string) {
    return await prisma.valueBetAlert.update({
      where: { id: alertId },
      data: {
        status: 'INVALID',
        factors: {
          invalidationReason: reason,
          invalidatedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get alert statistics for a user
   */
  async getUserAlertStats(userId: string) {
    const alerts = await prisma.valueBetAlert.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      select: {
        status: true,
        valuePercentage: true,
        betPlaced: true,
        externalBetId: true,
      },
    });

    const stats = {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((a: any) => a.status === 'ACTIVE').length,
      takenAlerts: alerts.filter((a: any) => a.status === 'TAKEN').length,
      expiredAlerts: alerts.filter((a: any) => a.status === 'EXPIRED').length,
      averageValue: alerts.length > 0
        ? alerts.reduce((sum: number, a: any) => sum + a.valuePercentage, 0) / alerts.length
        : 0,
      betsPlaced: alerts.filter((a: any) => a.betPlaced).length,
    };

    return stats;
  }
}

export const valueBetAlertsService = new ValueBetAlertsService();


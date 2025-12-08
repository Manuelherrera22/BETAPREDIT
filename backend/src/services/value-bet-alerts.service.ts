import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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
    const { minValue = 0, sportId, limit = 50, offset = 0 } = options;

    const where: any = {
      OR: [{ userId }, { userId: null }], // User-specific or public alerts
      status: 'ACTIVE',
      valuePercentage: { gte: minValue },
      expiresAt: { gt: new Date() },
    };

    if (sportId) {
      where.event = { sportId };
    }

    const alerts = await prisma.valueBetAlert.findMany({
      where,
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
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
      activeAlerts: alerts.filter((a) => a.status === 'ACTIVE').length,
      takenAlerts: alerts.filter((a) => a.status === 'TAKEN').length,
      expiredAlerts: alerts.filter((a) => a.status === 'EXPIRED').length,
      averageValue: alerts.length > 0
        ? alerts.reduce((sum, a) => sum + a.valuePercentage, 0) / alerts.length
        : 0,
      betsPlaced: alerts.filter((a) => a.betPlaced).length,
    };

    return stats;
  }
}

export const valueBetAlertsService = new ValueBetAlertsService();


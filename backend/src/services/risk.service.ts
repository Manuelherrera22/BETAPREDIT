import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';

class RiskService {
  // Get risk dashboard
  async getRiskDashboard() {
    const [
      totalExposure,
      activeEvents,
      fraudAlerts,
      recentBets,
    ] = await Promise.all([
      prisma.riskExposure.aggregate({
        _sum: {
          potentialLiability: true,
        },
      }),
      prisma.event.count({
        where: {
          status: 'LIVE',
        },
      }),
      prisma.fraudAlert.count({
        where: {
          resolved: false,
        },
      }),
      prisma.bet.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      }),
    ]);

    return {
      totalExposure: totalExposure._sum.potentialLiability || 0,
      activeEvents,
      fraudAlerts,
      recentBets,
      timestamp: new Date(),
    };
  }

  // Get exposure for a specific event
  async getEventExposure(eventId: string) {
    const exposure = await prisma.riskExposure.findMany({
      where: { eventId },
      orderBy: {
        potentialLiability: 'desc',
      },
    });

    const total = exposure.reduce((sum, exp) => sum + exp.potentialLiability, 0);

    return {
      eventId,
      exposures: exposure,
      totalExposure: total,
      timestamp: new Date(),
    };
  }

  // Update exposure when a bet is placed
  async updateExposure(
    eventId: string,
    marketId: string,
    selection: string,
    stake: number,
    potentialWin: number
  ) {
    await prisma.riskExposure.upsert({
      where: {
        eventId_marketId_selection: {
          eventId,
          marketId,
          selection,
        },
      },
      update: {
        totalStake: {
          increment: stake,
        },
        potentialLiability: {
          increment: potentialWin,
        },
        betCount: {
          increment: 1,
        },
      },
      create: {
        eventId,
        marketId,
        selection,
        totalStake: stake,
        potentialLiability: potentialWin,
        betCount: 1,
      },
    });
  }

  // Adjust odds manually
  async adjustOdds(adjustment: {
    eventId: string;
    marketId: string;
    selection: string;
    newDecimal: number;
    reason: string;
  }) {
    // This would call the odds service to update odds
    // For now, we'll just log it
    logger.info('Manual odds adjustment:', adjustment);

    // In a real implementation, this would:
    // 1. Update the odds
    // 2. Suspend the market temporarily
    // 3. Notify ML service
    // 4. Log the adjustment

    return { success: true, adjustment };
  }

  // Suspend a market
  async suspendMarket(marketId: string, reason: string) {
    const market = await prisma.market.update({
      where: { id: marketId },
      data: {
        isSuspended: true,
      },
    });

    logger.warn(`Market ${marketId} suspended: ${reason}`);

    return market;
  }

  // Check bet pattern for fraud
  async checkBetPattern(userId: string, bet: any) {
    // Check for suspicious patterns
    const recentBets = await prisma.bet.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    // Pattern 1: Too many bets in short time
    if (recentBets.length > 50) {
      await this.createFraudAlert({
        type: 'ARBITRAGE',
        severity: 'MEDIUM',
        description: `User ${userId} placed ${recentBets.length} bets in the last hour`,
        userId,
      });
    }

    // Pattern 2: Large bet on unlikely outcome
    if (bet.stake > 1000 && bet.odds > 10) {
      await this.createFraudAlert({
        type: 'MATCH_FIXING',
        severity: 'HIGH',
        description: `Large bet (${bet.stake}) on high odds (${bet.odds})`,
        userId,
        betId: bet.id,
        eventId: bet.eventId,
      });
    }

    // Pattern 3: Multiple users betting same selection with high odds
    const similarBets = await prisma.bet.findMany({
      where: {
        eventId: bet.eventId,
        marketId: bet.marketId,
        selection: bet.selection,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (similarBets.length > 10) {
      await this.createFraudAlert({
        type: 'COLLUSION',
        severity: 'HIGH',
        description: `${similarBets.length} users bet on same selection in last 5 minutes`,
        eventId: bet.eventId,
      });
    }
  }

  // Create fraud alert
  async createFraudAlert(alert: {
    type: string;
    severity: string;
    description: string;
    userId?: string;
    eventId?: string;
    betId?: string;
  }) {
    const fraudAlert = await prisma.fraudAlert.create({
      data: {
        type: alert.type as any,
        severity: alert.severity as any,
        description: alert.description,
        userId: alert.userId,
        eventId: alert.eventId,
        metadata: {
          betId: alert.betId,
        },
      },
    });

    logger.warn('Fraud alert created:', fraudAlert);

    // In a real implementation, this would:
    // 1. Notify admins
    // 2. Possibly suspend user/event
    // 3. Trigger ML fraud detection service

    return fraudAlert;
  }

  // Get fraud alerts
  async getFraudAlerts(options: {
    limit?: number;
    severity?: string;
  }) {
    const { limit = 50, severity } = options;

    const where: any = {};
    if (severity) {
      where.severity = severity;
    }

    const alerts = await prisma.fraudAlert.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return alerts;
  }
}

export const riskService = new RiskService();


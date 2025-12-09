import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface RegisterExternalBetData {
  eventId?: string;
  externalEventId?: string;
  platform: string;
  platformBetId?: string;
  platformUrl?: string;
  marketType: string;
  selection: string;
  odds: number;
  stake: number;
  currency?: string;
  betPlacedAt: Date;
  notes?: string;
  tags?: string[];
  metadata?: any;
  valueBetAlertId?: string; // Para vincular con value bet alert
}

class ExternalBetsService {
  /**
   * Register a bet placed on an external platform
   */
  async registerBet(userId: string, betData: RegisterExternalBetData) {
    try {
      // Validate required fields
      if (!betData.platform || !betData.selection || !betData.odds || !betData.stake) {
        throw new AppError('Missing required fields: platform, selection, odds, stake', 400);
      }

      // If eventId is provided, verify it exists
      if (betData.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: betData.eventId },
        });

        if (!event) {
          throw new AppError('Event not found', 404);
        }
      }

      // Verify value bet alert if provided
      if (betData.valueBetAlertId) {
        const valueBetAlert = await prisma.valueBetAlert.findFirst({
          where: {
            id: betData.valueBetAlertId,
            userId, // Ensure it belongs to the user
          },
        });

        if (!valueBetAlert) {
          throw new AppError('Value bet alert not found or does not belong to user', 404);
        }
      }

      // Create the external bet
      const bet = await prisma.externalBet.create({
        data: {
          userId,
          eventId: betData.eventId,
          externalEventId: betData.externalEventId,
          platform: betData.platform,
          platformBetId: betData.platformBetId,
          platformUrl: betData.platformUrl,
          marketType: betData.marketType,
          selection: betData.selection,
          odds: betData.odds,
          stake: betData.stake,
          currency: betData.currency || 'USD',
          betPlacedAt: betData.betPlacedAt,
          notes: betData.notes,
          tags: betData.tags || [],
          metadata: betData.metadata,
          status: 'PENDING',
          valueBetAlertId: betData.valueBetAlertId || null,
        },
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update user cached stats (async, don't wait)
      this.updateUserStats(userId).catch((err) => {
        logger.error('Error updating user stats:', err);
      });

      logger.info(`External bet registered: ${bet.id} by user ${userId}`);
      return bet;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error registering external bet:', error);
      throw new AppError('Failed to register external bet', 500);
    }
  }

  /**
   * Get user's external bets
   */
  async getUserBets(
    userId: string,
    options: {
      status?: string;
      platform?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const {
      status,
      platform,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
    } = options;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    if (startDate || endDate) {
      where.betPlacedAt = {};
      if (startDate) {
        where.betPlacedAt.gte = startDate;
      }
      if (endDate) {
        where.betPlacedAt.lte = endDate;
      }
    }

      const bets = await prisma.externalBet.findMany({
        where,
        include: {
          event: {
            include: {
              sport: true,
            },
          },
          valueBetAlert: {
            select: {
              id: true,
              valuePercentage: true,
            },
          },
        },
        orderBy: {
          betPlacedAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

    return bets;
  }

  /**
   * Update bet result when event finishes
   */
  async updateBetResult(
    betId: string,
    userId: string,
    result: 'WON' | 'LOST' | 'VOID' | 'CANCELLED',
    actualWin?: number
  ) {
    try {
      const bet = await prisma.externalBet.findFirst({
        where: {
          id: betId,
          userId,
        },
      });

      if (!bet) {
        throw new AppError('Bet not found', 404);
      }

      if (bet.status !== 'PENDING') {
        throw new AppError('Bet result already set', 400);
      }

      // Calculate actual win if not provided
      const calculatedWin = result === 'WON' 
        ? (actualWin !== undefined ? actualWin : bet.stake * bet.odds)
        : null;

      const updated = await prisma.externalBet.update({
        where: { id: betId },
        data: {
          status: result,
          result: result === 'WON' ? 'WON' : result === 'LOST' ? 'LOST' : 'VOID',
          actualWin: calculatedWin,
          settledAt: new Date(),
        },
        include: {
          valueBetAlert: {
            select: {
              id: true,
              valuePercentage: true,
            },
          },
        },
      });

      // Update user cached stats (async)
      this.updateUserStats(userId).catch((err) => {
        logger.error('Error updating user stats:', err);
      });

      logger.info(`External bet result updated: ${betId} -> ${result}`);
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating bet result:', error);
      throw new AppError('Failed to update bet result', 500);
    }
  }

  /**
   * Get bet statistics for a user
   */
  async getUserBetStats(userId: string, period?: 'week' | 'month' | 'year' | 'all') {
    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const where: any = { userId };
    if (startDate) {
      where.betPlacedAt = { gte: startDate };
    }

    const bets = await prisma.externalBet.findMany({
      where,
      select: {
        status: true,
        result: true,
        stake: true,
        actualWin: true,
        odds: true,
        platform: true,
      },
    });

    const stats = {
      totalBets: bets.length,
      totalWins: bets.filter((b: any) => b.status === 'WON').length,
      totalLosses: bets.filter((b: any) => b.status === 'LOST').length,
      totalVoids: bets.filter((b: any) => b.status === 'VOID').length,
      totalStaked: bets.reduce((sum: number, b: any) => sum + b.stake, 0),
      totalWon: bets
        .filter((b: any) => b.status === 'WON' && b.actualWin)
        .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0),
      totalLost: bets
        .filter((b: any) => b.status === 'LOST')
        .reduce((sum: number, b: any) => sum + b.stake, 0),
      winRate:
        bets.length > 0
          ? (bets.filter((b: any) => b.status === 'WON').length / bets.length) * 100
          : 0,
      roi:
        bets.length > 0
          ? ((bets
              .filter((b: any) => b.status === 'WON' && b.actualWin)
              .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0) -
              bets.reduce((sum: number, b: any) => sum + b.stake, 0)) /
              bets.reduce((sum: number, b: any) => sum + b.stake, 0)) *
            100
          : 0,
      byPlatform: {} as Record<string, any>,
    };

    // Calculate stats by platform
    const platforms = [...new Set(bets.map((b) => b.platform))];
    platforms.forEach((platform) => {
      const platformBets = bets.filter((b: any) => b.platform === platform);
      (stats.byPlatform as any)[platform as string] = {
        totalBets: platformBets.length,
        wins: platformBets.filter((b: any) => b.status === 'WON').length,
        losses: platformBets.filter((b: any) => b.status === 'LOST').length,
        totalStaked: platformBets.reduce((sum: number, b: any) => sum + b.stake, 0),
        totalWon: platformBets
          .filter((b: any) => b.status === 'WON' && b.actualWin)
          .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0),
      };
    });

    return stats;
  }

  /**
   * Update user cached statistics (async helper)
   */
  private async updateUserStats(userId: string) {
    try {
      const stats = await this.getUserBetStats(userId, 'all');

      await prisma.user.update({
        where: { id: userId },
        data: {
          totalBets: stats.totalBets,
          totalWins: stats.totalWins,
          totalLosses: stats.totalLosses,
          totalStaked: stats.totalStaked,
          totalWon: stats.totalWon,
          roi: stats.roi,
          winRate: stats.winRate,
          lastStatsUpdate: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating user cached stats:', error);
      // Don't throw, this is a background operation
    }
  }

  /**
   * Delete an external bet
   */
  async deleteBet(betId: string, userId: string) {
    const bet = await prisma.externalBet.findFirst({
      where: {
        id: betId,
        userId,
      },
    });

    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    await prisma.externalBet.delete({
      where: { id: betId },
    });

    // Update user stats
    this.updateUserStats(userId).catch((err) => {
      logger.error('Error updating user stats:', err);
    });

    return { success: true };
  }
}

export const externalBetsService = new ExternalBetsService();


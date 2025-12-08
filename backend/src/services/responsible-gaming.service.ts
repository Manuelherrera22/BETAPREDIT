import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

class ResponsibleGamingService {
  // Get RG status for user
  async getRGStatus(userId: string) {
    let rgSettings = await prisma.responsibleGaming.findUnique({
      where: { userId },
    });

    if (!rgSettings) {
      rgSettings = await prisma.responsibleGaming.create({
        data: { userId },
      });
    }

    // Calculate current session time
    const recentBets = await prisma.bet.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const sessionStart = recentBets[0]?.createdAt || new Date();
    const sessionMinutes = Math.floor(
      (Date.now() - sessionStart.getTime()) / (60 * 1000)
    );

    // Calculate deposits and losses
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const deposits = transactions
      .filter((t) => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const losses = transactions
      .filter((t) => t.type === 'BET_PLACED' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...rgSettings,
      currentSessionMinutes: sessionMinutes,
      deposits24h: deposits,
      losses24h: losses,
      alerts: await this.checkRGPatterns(userId, rgSettings, {
        sessionMinutes,
        deposits,
        losses,
      }),
    };
  }

  // Check bet limits before placing bet
  async checkBetLimits(userId: string, stake: number) {
    const rgSettings = await prisma.responsibleGaming.findUnique({
      where: { userId },
    });

    if (!rgSettings) {
      return; // No limits set
    }

    // Check self-exclusion
    if (rgSettings.selfExcluded) {
      if (rgSettings.selfExclusionUntil && rgSettings.selfExclusionUntil > new Date()) {
        throw new AppError('Account is self-excluded', 403);
      }
    }

    // Check deposit limit
    if (rgSettings.depositLimit) {
      const periodStart = this.getPeriodStart(rgSettings.depositPeriod || 'daily');
      const deposits = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: {
            gte: periodStart,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalDeposits = deposits._sum.amount || 0;
      if (totalDeposits + stake > rgSettings.depositLimit) {
        throw new AppError('Deposit limit exceeded', 400);
      }
    }

    // Check loss limit
    if (rgSettings.lossLimit) {
      const periodStart = this.getPeriodStart(rgSettings.lossPeriod || 'daily');
      const losses = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'BET_PLACED',
          status: 'COMPLETED',
          createdAt: {
            gte: periodStart,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalLosses = losses._sum.amount || 0;
      if (totalLosses + stake > rgSettings.lossLimit) {
        throw new AppError('Loss limit exceeded', 400);
      }
    }

    // Check session limit
    if (rgSettings.sessionLimit) {
      const recentBets = await prisma.bet.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 1,
      });

      if (recentBets.length > 0) {
        const sessionStart = recentBets[0].createdAt;
        const sessionMinutes = Math.floor(
          (Date.now() - sessionStart.getTime()) / (60 * 1000)
        );

        if (sessionMinutes >= rgSettings.sessionLimit) {
          throw new AppError('Session time limit exceeded', 400);
        }
      }
    }
  }

  // Set deposit limit
  async setDepositLimit(userId: string, amount: number, period: string) {
    const rgSettings = await prisma.responsibleGaming.upsert({
      where: { userId },
      update: {
        depositLimit: amount,
        depositPeriod: period,
      },
      create: {
        userId,
        depositLimit: amount,
        depositPeriod: period,
      },
    });

    logger.info(`Deposit limit set for user ${userId}: ${amount} ${period}`);

    return rgSettings;
  }

  // Set loss limit
  async setLossLimit(userId: string, amount: number, period: string) {
    const rgSettings = await prisma.responsibleGaming.upsert({
      where: { userId },
      update: {
        lossLimit: amount,
        lossPeriod: period,
      },
      create: {
        userId,
        lossLimit: amount,
        lossPeriod: period,
      },
    });

    logger.info(`Loss limit set for user ${userId}: ${amount} ${period}`);

    return rgSettings;
  }

  // Set session limit
  async setSessionLimit(userId: string, minutes: number) {
    const rgSettings = await prisma.responsibleGaming.upsert({
      where: { userId },
      update: {
        sessionLimit: minutes,
      },
      create: {
        userId,
        sessionLimit: minutes,
      },
    });

    logger.info(`Session limit set for user ${userId}: ${minutes} minutes`);

    return rgSettings;
  }

  // Request self-exclusion
  async requestSelfExclusion(userId: string, period: string, reason?: string) {
    const exclusionUntil = this.calculateExclusionDate(period);

    const rgSettings = await prisma.responsibleGaming.update({
      where: { userId },
      data: {
        selfExcluded: true,
        selfExclusionUntil: exclusionUntil,
      },
    });

    logger.warn(`Self-exclusion requested for user ${userId} until ${exclusionUntil}`);

    return rgSettings;
  }

  // Get RG alerts
  async getRGAlerts(userId: string) {
    const rgSettings = await prisma.responsibleGaming.findUnique({
      where: { userId },
    });

    if (!rgSettings) {
      return [];
    }

    return rgSettings.alerts || [];
  }

  // Check RG patterns (ML-based detection)
  private async checkRGPatterns(
    userId: string,
    rgSettings: any,
    current: {
      sessionMinutes: number;
      deposits: number;
      losses: number;
    }
  ): Promise<any[]> {
    const alerts: any[] = [];

    // Pattern 1: Loss chasing (betting more after losses)
    const recentBets = await prisma.bet.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (recentBets.length >= 3) {
      const lastThree = recentBets.slice(0, 3);
      const allLost = lastThree.every((bet) => bet.status === 'LOST');
      const increasingStakes = lastThree[0].stake > lastThree[2].stake;

      if (allLost && increasingStakes) {
        alerts.push({
          type: 'LOSS_CHASING',
          severity: 'MEDIUM',
          message: 'Pattern detected: Increasing bets after losses',
        });
      }
    }

    // Pattern 2: Late night gambling
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) {
      alerts.push({
        type: 'LATE_NIGHT',
        severity: 'LOW',
        message: 'Gambling during late night hours detected',
      });
    }

    // Pattern 3: Rapid betting
    if (recentBets.length >= 5) {
      const timeSpan = recentBets[0].createdAt.getTime() - recentBets[4].createdAt.getTime();
      const minutes = timeSpan / (60 * 1000);
      if (minutes < 10) {
        alerts.push({
          type: 'RAPID_BETTING',
          severity: 'MEDIUM',
          message: 'Rapid betting pattern detected',
        });
      }
    }

    // Update alerts in database
    if (alerts.length > 0) {
      await prisma.responsibleGaming.update({
        where: { userId },
        data: {
          alerts: alerts,
        },
      });
    }

    return alerts;
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        now.setHours(0, 0, 0, 0);
        return now;
      case 'weekly':
        const day = now.getDay();
        now.setDate(now.getDate() - day);
        now.setHours(0, 0, 0, 0);
        return now;
      case 'monthly':
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now;
      default:
        now.setHours(0, 0, 0, 0);
        return now;
    }
  }

  private calculateExclusionDate(period: string): Date {
    const date = new Date();
    switch (period) {
      case '24h':
        date.setHours(date.getHours() + 24);
        break;
      case '7d':
        date.setDate(date.getDate() + 7);
        break;
      case '30d':
        date.setDate(date.getDate() + 30);
        break;
      case '6m':
        date.setMonth(date.getMonth() + 6);
        break;
      case '1y':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'permanent':
        date.setFullYear(date.getFullYear() + 100);
        break;
      default:
        date.setDate(date.getDate() + 7);
    }
    return date;
  }
}

export const rgService = new ResponsibleGamingService();


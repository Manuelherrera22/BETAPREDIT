import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { riskService } from './risk.service';
import { rgService } from './responsible-gaming.service';

class BetsService {
  async placeBet(userId: string, betData: {
    eventId: string;
    marketId: string;
    oddsId: string;
    type: string;
    selection: string;
    stake: number;
  }) {
    // Validate RG limits
    await rgService.checkBetLimits(userId, betData.stake);

    // Get odds to calculate potential win
    const odds = await prisma.odds.findUnique({
      where: { id: betData.oddsId },
      include: { event: true, market: true },
    });

    if (!odds || !odds.isActive) {
      throw new AppError('Odds no longer available', 400);
    }

    if (odds.event.status !== 'SCHEDULED' && odds.event.status !== 'LIVE') {
      throw new AppError('Event is not available for betting', 400);
    }

    if (odds.market.isSuspended) {
      throw new AppError('Market is suspended', 400);
    }

    // Calculate potential win
    const potentialWin = betData.stake * odds.decimal;

    // Check user balance (would need transaction service)
    // For now, we'll assume balance check happens elsewhere

    // Create bet
    const bet = await prisma.bet.create({
      data: {
        userId,
        eventId: betData.eventId,
        marketId: betData.marketId,
        oddsId: betData.oddsId,
        type: betData.type as any,
        selection: betData.selection,
        stake: betData.stake,
        potentialWin,
        odds: odds.decimal,
        status: 'PENDING',
      },
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
        odds: true,
      },
    });

    // Update risk exposure
    await riskService.updateExposure(betData.eventId, betData.marketId, betData.selection, betData.stake, potentialWin);

    // Check for fraud patterns
    await riskService.checkBetPattern(userId, bet);

    logger.info(`Bet placed: ${bet.id} by user ${userId}`);

    return bet;
  }

  async getUserBets(
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const { status, limit = 20, offset = 0 } = options;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const bets = await prisma.bet.findMany({
      where,
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
        odds: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return bets;
  }

  async getBetDetails(betId: string, userId: string) {
    const bet = await prisma.bet.findFirst({
      where: {
        id: betId,
        userId,
      },
      include: {
        event: {
          include: {
            sport: true,
          },
        },
        market: true,
        odds: true,
      },
    });

    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    return bet;
  }

  async cancelBet(betId: string, userId: string) {
    const bet = await prisma.bet.findFirst({
      where: {
        id: betId,
        userId,
      },
    });

    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    if (bet.status !== 'PENDING') {
      throw new AppError('Bet cannot be cancelled', 400);
    }

    // Check if event has started
    const event = await prisma.event.findUnique({
      where: { id: bet.eventId },
    });

    if (event && event.status === 'LIVE') {
      throw new AppError('Cannot cancel bet on live event', 400);
    }

    const updated = await prisma.bet.update({
      where: { id: betId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Update risk exposure
    await riskService.updateExposure(
      bet.eventId,
      bet.marketId,
      bet.selection,
      -bet.stake,
      -bet.potentialWin
    );

    return updated;
  }

  async getBetHistory(userId: string, filters: any) {
    const where: any = { userId };

    if (filters.startDate) {
      where.createdAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.eventId) {
      where.eventId = filters.eventId;
    }

    const bets = await prisma.bet.findMany({
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
        createdAt: 'desc',
      },
      take: filters.limit ? parseInt(filters.limit) : 50,
    });

    return bets;
  }
}

export const betsService = new BetsService();


/**
 * Bets Service Tests
 * Tests for bets service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { betsService } from '../services/bets.service';
import { prisma } from '../config/database';
import { riskService } from '../services/risk.service';
import { rgService } from '../services/responsible-gaming.service';
import { AppError } from '../middleware/errorHandler';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    odds: {
      findUnique: jest.fn(),
    },
    bet: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../services/risk.service', () => ({
  riskService: {
    updateExposure: jest.fn(),
    checkBetPattern: jest.fn(),
  },
}));

jest.mock('../services/responsible-gaming.service', () => ({
  rgService: {
    checkBetLimits: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('BetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('placeBet', () => {
    it('should place a bet successfully', async () => {
      const mockOdds = {
        id: 'odds-1',
        decimal: 2.0,
        isActive: true,
        event: {
          id: 'event-1',
          status: 'SCHEDULED',
        },
        market: {
          id: 'market-1',
          isSuspended: false,
        },
      };

      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        stake: 100,
        potentialWin: 200,
        status: 'PENDING',
      };

      (rgService.checkBetLimits as jest.Mock).mockResolvedValue(undefined);
      (prisma.odds.findUnique as jest.Mock).mockResolvedValue(mockOdds);
      (prisma.bet.create as jest.Mock).mockResolvedValue(mockBet);
      (riskService.updateExposure as jest.Mock).mockResolvedValue(undefined);
      (riskService.checkBetPattern as jest.Mock).mockResolvedValue(undefined);

      const result = await betsService.placeBet('user-1', {
        eventId: 'event-1',
        marketId: 'market-1',
        oddsId: 'odds-1',
        type: 'MATCH_WINNER',
        selection: 'home',
        stake: 100,
      });

      expect(rgService.checkBetLimits).toHaveBeenCalledWith('user-1', 100);
      expect(prisma.bet.create).toHaveBeenCalled();
      expect(result).toEqual(mockBet);
    });

    it('should throw error when odds not available', async () => {
      (rgService.checkBetLimits as jest.Mock).mockResolvedValue(undefined);
      (prisma.odds.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        betsService.placeBet('user-1', {
          eventId: 'event-1',
          marketId: 'market-1',
          oddsId: 'odds-1',
          type: 'MATCH_WINNER',
          selection: 'home',
          stake: 100,
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error when odds not active', async () => {
      const mockOdds = {
        id: 'odds-1',
        decimal: 2.0,
        isActive: false,
      };

      (rgService.checkBetLimits as jest.Mock).mockResolvedValue(undefined);
      (prisma.odds.findUnique as jest.Mock).mockResolvedValue(mockOdds);

      await expect(
        betsService.placeBet('user-1', {
          eventId: 'event-1',
          marketId: 'market-1',
          oddsId: 'odds-1',
          type: 'MATCH_WINNER',
          selection: 'home',
          stake: 100,
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error when event not available for betting', async () => {
      const mockOdds = {
        id: 'odds-1',
        decimal: 2.0,
        isActive: true,
        event: {
          id: 'event-1',
          status: 'FINISHED',
        },
        market: {
          id: 'market-1',
          isSuspended: false,
        },
      };

      (rgService.checkBetLimits as jest.Mock).mockResolvedValue(undefined);
      (prisma.odds.findUnique as jest.Mock).mockResolvedValue(mockOdds);

      await expect(
        betsService.placeBet('user-1', {
          eventId: 'event-1',
          marketId: 'market-1',
          oddsId: 'odds-1',
          type: 'MATCH_WINNER',
          selection: 'home',
          stake: 100,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserBets', () => {
    it('should return user bets', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId: 'user-1',
          status: 'PENDING',
        },
      ];

      (prisma.bet.findMany as jest.Mock).mockResolvedValue(mockBets);

      const result = await betsService.getUserBets('user-1', {});

      expect(prisma.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
          },
        })
      );
      expect(result).toEqual(mockBets);
    });

    it('should filter by status', async () => {
      (prisma.bet.findMany as jest.Mock).mockResolvedValue([]);

      await betsService.getUserBets('user-1', {
        status: 'PENDING',
        limit: 10,
        offset: 0,
      });

      expect(prisma.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            status: 'PENDING',
          },
          take: 10,
          skip: 0,
        })
      );
    });
  });

  describe('getBetDetails', () => {
    it('should return bet details', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        stake: 100,
        status: 'PENDING',
      };

      (prisma.bet.findUnique as jest.Mock).mockResolvedValue(mockBet);

      const result = await betsService.getBetDetails('bet-1', 'user-1');

      expect(prisma.bet.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'bet-1',
            userId: 'user-1',
          },
        })
      );
      expect(result).toEqual(mockBet);
    });

    it('should throw error when bet not found', async () => {
      (prisma.bet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        betsService.getBetDetails('non-existent', 'user-1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancelBet', () => {
    it('should cancel a bet', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        status: 'PENDING',
      };

      (prisma.bet.findUnique as jest.Mock).mockResolvedValue(mockBet);
      (prisma.bet.update as jest.Mock).mockResolvedValue({
        ...mockBet,
        status: 'CANCELLED',
      });

      const result = await betsService.cancelBet('bet-1', 'user-1');

      expect(prisma.bet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'bet-1',
            userId: 'user-1',
          },
          data: {
            status: 'CANCELLED',
          },
        })
      );
      expect(result.status).toBe('CANCELLED');
    });
  });
});


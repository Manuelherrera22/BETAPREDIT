/**
 * User Statistics Service Tests
 * Tests for user statistics calculation service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { userStatisticsService } from '../services/user-statistics.service';
import { prisma } from '../config/database';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    externalBet: {
      findMany: jest.fn(),
    },
    userStatistics: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
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

describe('UserStatisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateUserStatistics', () => {
    it('should calculate daily statistics correctly', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId: 'user-1',
          stake: 100,
          status: 'WON',
          actualWin: 200,
          betPlacedAt: new Date(),
          event: {
            sport: { name: 'Football' },
          },
        },
        {
          id: 'bet-2',
          userId: 'user-1',
          stake: 50,
          status: 'LOST',
          actualWin: null,
          betPlacedAt: new Date(),
          event: {
            sport: { name: 'Football' },
          },
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.userStatistics.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userStatistics.create as jest.Mock).mockResolvedValue({
        id: 'stats-1',
        userId: 'user-1',
        period: 'daily',
        totalBets: 2,
        totalWins: 1,
        totalLosses: 1,
        totalStaked: 150,
        totalWon: 200,
        totalLost: 50,
        netProfit: 50,
        roi: 33.33,
        winRate: 50,
      });

      const result = await userStatisticsService.calculateUserStatistics('user-1', 'daily');

      expect(result.totalBets).toBe(2);
      expect(result.totalWins).toBe(1);
      expect(result.totalLosses).toBe(1);
      expect(result.totalStaked).toBe(150);
      expect(result.totalWon).toBe(200);
      expect(result.netProfit).toBe(50);
      expect(result.winRate).toBe(50);
    });

    it('should calculate ROI correctly', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId: 'user-1',
          stake: 100,
          status: 'WON',
          actualWin: 150,
          betPlacedAt: new Date(),
          event: {
            sport: { name: 'Football' },
          },
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.userStatistics.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userStatistics.create as jest.Mock).mockResolvedValue({
        id: 'stats-1',
        roi: 50,
      });

      const result = await userStatisticsService.calculateUserStatistics('user-1', 'daily');

      // ROI = (150 - 100) / 100 * 100 = 50%
      expect(result.roi).toBe(50);
    });

    it('should handle empty bets array', async () => {
      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userStatistics.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userStatistics.create as jest.Mock).mockResolvedValue({
        id: 'stats-1',
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        totalStaked: 0,
        totalWon: 0,
        netProfit: 0,
        roi: 0,
        winRate: 0,
      });

      const result = await userStatisticsService.calculateUserStatistics('user-1', 'daily');

      expect(result.totalBets).toBe(0);
      expect(result.roi).toBe(0);
      expect(result.winRate).toBe(0);
    });

    it('should calculate statistics by sport', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId: 'user-1',
          stake: 100,
          status: 'WON',
          actualWin: 200,
          betPlacedAt: new Date(),
          event: {
            sport: { name: 'Football' },
          },
        },
        {
          id: 'bet-2',
          userId: 'user-1',
          stake: 50,
          status: 'WON',
          actualWin: 100,
          betPlacedAt: new Date(),
          event: {
            sport: { name: 'Basketball' },
          },
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.userStatistics.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userStatistics.create as jest.Mock).mockResolvedValue({
        id: 'stats-1',
        statsBySport: {
          Football: { bets: 1, wins: 1, staked: 100, won: 200 },
          Basketball: { bets: 1, wins: 1, staked: 50, won: 100 },
        },
      });

      const result = await userStatisticsService.calculateUserStatistics('user-1', 'monthly');

      expect(result.statsBySport).toBeDefined();
      expect(result.statsBySport['Football']).toBeDefined();
      expect(result.statsBySport['Basketball']).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.externalBet.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw, but return empty stats
      const result = await userStatisticsService.calculateUserStatistics('user-1', 'daily');

      expect(result.totalBets).toBe(0);
    });
  });

  describe('getMyStatistics', () => {
    it('should get user statistics for a period', async () => {
      const mockStats = {
        id: 'stats-1',
        userId: 'user-1',
        period: 'monthly',
        totalBets: 10,
        totalWins: 7,
        totalLosses: 3,
        totalStaked: 1000,
        totalWon: 1200,
        netProfit: 200,
        roi: 20,
        winRate: 70,
      };

      (prisma.userStatistics.findFirst as jest.Mock).mockResolvedValue(mockStats);

      const result = await userStatisticsService.getMyStatistics('user-1', 'monthly');

      expect(prisma.userStatistics.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          period: 'monthly',
        },
        orderBy: {
          periodStart: 'desc',
        },
      });
      expect(result).toEqual(mockStats);
    });

    it('should return null if no statistics found', async () => {
      (prisma.userStatistics.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await userStatisticsService.getMyStatistics('user-1', 'monthly');

      expect(result).toBeNull();
    });
  });
});


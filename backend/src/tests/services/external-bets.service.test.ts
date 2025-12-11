/**
 * External Bets Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { externalBetsService } from '../services/external-bets.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    externalBet: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ExternalBetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerBet', () => {
    it('should register a new external bet', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        platform: 'Bet365',
        stake: 100,
        odds: 2.0,
      };

      (prisma.externalBet.create as jest.Mock).mockResolvedValue(mockBet);

      const result = await externalBetsService.registerBet('user-1', {
        platform: 'Bet365',
        marketType: 'Match Winner',
        selection: 'home',
        odds: 2.0,
        stake: 100,
      });

      expect(prisma.externalBet.create).toHaveBeenCalled();
      expect(result).toEqual(mockBet);
    });
  });

  describe('getUserBets', () => {
    it('should return user bets', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId: 'user-1',
          platform: 'Bet365',
          status: 'PENDING',
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);

      const result = await externalBetsService.getUserBets('user-1', {});

      expect(prisma.externalBet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
          },
        })
      );
      expect(result).toEqual(mockBets);
    });

    it('should filter by status', async () => {
      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue([]);

      await externalBetsService.getUserBets('user-1', {
        status: 'WON',
      });

      expect(prisma.externalBet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'WON',
          }),
        })
      );
    });
  });

  describe('updateBet', () => {
    it('should update bet', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        status: 'WON',
      };

      (prisma.externalBet.findUnique as jest.Mock).mockResolvedValue(mockBet);
      (prisma.externalBet.update as jest.Mock).mockResolvedValue({
        ...mockBet,
        result: 'win',
      });

      const result = await externalBetsService.updateBet('bet-1', 'user-1', {
        status: 'WON',
        result: 'win',
      });

      expect(prisma.externalBet.update).toHaveBeenCalled();
      expect(result.status).toBe('WON');
    });

    it('should throw error when bet not found', async () => {
      (prisma.externalBet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        externalBetsService.updateBet('non-existent', 'user-1', {})
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteBet', () => {
    it('should delete bet', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
      };

      (prisma.externalBet.findUnique as jest.Mock).mockResolvedValue(mockBet);
      (prisma.externalBet.delete as jest.Mock).mockResolvedValue(mockBet);

      await externalBetsService.deleteBet('bet-1', 'user-1');

      expect(prisma.externalBet.delete).toHaveBeenCalledWith({
        where: {
          id: 'bet-1',
          userId: 'user-1',
        },
      });
    });
  });
});


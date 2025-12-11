/**
 * Bets Controller Tests
 * Tests for bets API controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { betsController } from '../../api/controllers/bets.controller';
import { betsService } from '../../services/bets.service';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/bets.service', () => ({
  betsService: {
    placeBet: jest.fn(),
    getUserBets: jest.fn(),
    getBetDetails: jest.fn(),
    cancelBet: jest.fn(),
    getBetHistory: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('BetsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
    } as Partial<Request>;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  describe('placeBet', () => {
    it('should place a new bet', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        stake: 100,
        status: 'PENDING',
      };

      (betsService.placeBet as jest.Mock).mockResolvedValue(mockBet);
      mockReq.body = {
        eventId: 'event-1',
        marketId: 'market-1',
        oddsId: 'odds-1',
        type: 'MATCH_WINNER',
        selection: 'home',
        stake: 100,
      };

      await betsController.placeBet(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(betsService.placeBet).toHaveBeenCalledWith('user-1', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockBet,
        })
      );
    });

    it('should handle service errors', async () => {
      (betsService.placeBet as jest.Mock).mockRejectedValue(
        new AppError('Insufficient balance', 400)
      );
      mockReq.body = {
        eventId: 'event-1',
        stake: 100,
      };

      await betsController.placeBet(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getMyBets', () => {
    it('should return user bets', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId: 'user-1',
          status: 'PENDING',
        },
      ];

      (betsService.getUserBets as jest.Mock).mockResolvedValue(mockBets);
      mockReq.query = {};

      await betsController.getMyBets(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(betsService.getUserBets).toHaveBeenCalledWith('user-1', {
        status: undefined,
        limit: 20,
        offset: 0,
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockBets,
        })
      );
    });

    it('should apply filters from query parameters', async () => {
      (betsService.getUserBets as jest.Mock).mockResolvedValue([]);
      mockReq.query = {
        status: 'PENDING',
        limit: '10',
        offset: '5',
      };

      await betsController.getMyBets(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(betsService.getUserBets).toHaveBeenCalledWith('user-1', {
        status: 'PENDING',
        limit: 10,
        offset: 5,
      });
    });
  });

  describe('getBetDetails', () => {
    it('should return bet details', async () => {
      const mockBet = {
        id: 'bet-1',
        userId: 'user-1',
        stake: 100,
        status: 'PENDING',
        event: {
          name: 'Team A vs Team B',
        },
      };

      (betsService.getBetDetails as jest.Mock).mockResolvedValue(mockBet);
      mockReq.params = { betId: 'bet-1' };

      await betsController.getBetDetails(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(betsService.getBetDetails).toHaveBeenCalledWith('bet-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockBet,
        })
      );
    });
  });

  describe('cancelBet', () => {
    it('should cancel a bet', async () => {
      (betsService.cancelBet as jest.Mock).mockResolvedValue({
        id: 'bet-1',
        status: 'CANCELLED',
      });
      mockReq.params = { betId: 'bet-1' };

      await betsController.cancelBet(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(betsService.cancelBet).toHaveBeenCalledWith('bet-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('getBetHistory', () => {
    it('should return bet history', async () => {
      const mockHistory = [
        {
          id: 'bet-1',
          status: 'WON',
          createdAt: new Date(),
        },
      ];

      (betsService.getBetHistory as jest.Mock).mockResolvedValue(mockHistory);
      mockReq.query = {};

      await betsController.getBetHistory(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(betsService.getBetHistory).toHaveBeenCalledWith('user-1', {});
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockHistory,
        })
      );
    });
  });
});


/**
 * Odds Controller Tests
 * Tests for odds API controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { oddsController } from '../../api/controllers/odds.controller';
import { oddsService } from '../../services/odds.service';
import { oddsComparisonService } from '../../services/odds-comparison.service';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/odds.service', () => ({
  oddsService: {
    getEventOdds: jest.fn(),
    getMultipleEventsOdds: jest.fn(),
    getLiveOdds: jest.fn(),
    getOddsHistory: jest.fn(),
  },
}));

jest.mock('../../services/odds-comparison.service', () => ({
  oddsComparisonService: {
    fetchAndUpdateComparison: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  prisma: {
    oddsHistory: {
      findMany: jest.fn(),
    },
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

describe('OddsController', () => {
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

  describe('getEventOdds', () => {
    it('should return odds for an event', async () => {
      const mockOdds = [
        {
          id: 'odds-1',
          selection: 'home',
          decimal: 2.0,
          isActive: true,
        },
      ];

      (oddsService.getEventOdds as jest.Mock).mockResolvedValue(mockOdds);
      mockReq.params = { eventId: 'event-1' };

      await oddsController.getEventOdds(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oddsService.getEventOdds).toHaveBeenCalledWith('event-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockOdds,
        })
      );
    });
  });

  describe('getMultipleEventsOdds', () => {
    it('should return odds for multiple events', async () => {
      const mockOddsMap = {
        'event-1': [{ id: 'odds-1', decimal: 2.0 }],
        'event-2': [{ id: 'odds-2', decimal: 2.5 }],
      };

      (oddsService.getMultipleEventsOdds as jest.Mock).mockResolvedValue(mockOddsMap);
      mockReq.body = { eventIds: ['event-1', 'event-2'] };

      await oddsController.getMultipleEventsOdds(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oddsService.getMultipleEventsOdds).toHaveBeenCalledWith(['event-1', 'event-2']);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockOddsMap,
        })
      );
    });

    it('should throw error when eventIds is not an array', async () => {
      mockReq.body = { eventIds: 'not-an-array' };

      await oddsController.getMultipleEventsOdds(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getOddsHistory', () => {
    it('should return odds history for an event', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          timestamp: new Date(),
          decimal: 2.0,
        },
      ];

      (oddsService.getOddsHistory as jest.Mock).mockResolvedValue(mockHistory);
      mockReq.params = { eventId: 'event-1' };
      mockReq.query = {};

      await oddsController.getOddsHistory(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oddsService.getOddsHistory).toHaveBeenCalledWith('event-1', {});
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockHistory,
        })
      );
    });

    it('should filter history by marketId and selection', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          timestamp: new Date(),
          decimal: 2.0,
        },
      ];

      (prisma.oddsHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);
      mockReq.params = { eventId: 'event-1' };
      mockReq.query = {
        marketId: 'market-1',
        selection: 'home',
        limit: '50',
      };

      await oddsController.getOddsHistory(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(prisma.oddsHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventId: 'event-1',
            marketId: 'market-1',
            selection: 'home',
          }),
        })
      );
    });
  });

  describe('compareOddsFromAPI', () => {
    it('should fetch and compare odds from API', async () => {
      const mockComparison = {
        comparisons: {
          home: { bestOdds: { bookmaker: 'Bet365', odds: 2.0 } },
        },
      };

      (oddsComparisonService.fetchAndUpdateComparison as jest.Mock).mockResolvedValue(mockComparison);
      mockReq.params = { sport: 'soccer_epl', eventId: 'event-1' };
      mockReq.query = { market: 'h2h' };

      await oddsController.compareOddsFromAPI(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oddsComparisonService.fetchAndUpdateComparison).toHaveBeenCalledWith(
        'soccer_epl',
        'event-1',
        'h2h'
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockComparison,
        })
      );
    });
  });
});


/**
 * User Statistics Controller Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { userStatisticsController } from '../../api/controllers/user-statistics.controller';
import { userStatisticsService } from '../../services/user-statistics.service';

// Mock dependencies
jest.mock('../../services/user-statistics.service', () => ({
  userStatisticsService: {
    getUserStatistics: jest.fn(),
    calculateUserStatistics: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserStatisticsController', () => {
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

  describe('getMyStatistics', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalBets: 100,
        totalWins: 65,
        winRate: 0.65,
        roi: 12.5,
      };

      (userStatisticsService.getUserStatistics as jest.Mock).mockResolvedValue(mockStats);
      mockReq.query = { period: 'month' };

      await userStatisticsController.getMyStatistics(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userStatisticsService.getUserStatistics).toHaveBeenCalledWith('user-1', 'month');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats,
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await userStatisticsController.getMyStatistics(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('recalculateStatistics', () => {
    it('should recalculate user statistics', async () => {
      const mockStats = {
        totalBets: 100,
        totalWins: 65,
        winRate: 0.65,
      };

      (userStatisticsService.calculateUserStatistics as jest.Mock).mockResolvedValue(mockStats);
      mockReq.body = { period: 'all_time' };

      await userStatisticsController.recalculateStatistics(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userStatisticsService.calculateUserStatistics).toHaveBeenCalledWith('user-1', 'all_time');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats,
        })
      );
    });
  });

  describe('getStatisticsBySport', () => {
    it('should return statistics by sport', async () => {
      const mockStats = {
        statsBySport: {
          soccer: { totalBets: 50, winRate: 0.70 },
          basketball: { totalBets: 30, winRate: 0.60 },
        },
      };

      (userStatisticsService.getUserStatistics as jest.Mock).mockResolvedValue(mockStats);
      mockReq.query = { period: 'month' };

      await userStatisticsController.getStatisticsBySport(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats.statsBySport,
        })
      );
    });
  });

  describe('getStatisticsByPlatform', () => {
    it('should return statistics by platform', async () => {
      const mockStats = {
        statsByPlatform: {
          Bet365: { totalBets: 40, winRate: 0.68 },
          Betfair: { totalBets: 35, winRate: 0.65 },
        },
      };

      (userStatisticsService.getUserStatistics as jest.Mock).mockResolvedValue(mockStats);
      mockReq.query = { period: 'month' };

      await userStatisticsController.getStatisticsByPlatform(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats.statsByPlatform,
        })
      );
    });
  });
});


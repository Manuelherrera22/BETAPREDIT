/**
 * Value Bet Detection Controller Tests
 * Tests for value bet detection API controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { valueBetDetectionController } from '../../api/controllers/value-bet-detection.controller';
import { valueBetDetectionService } from '../../services/value-bet-detection.service';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/value-bet-detection.service', () => ({
  valueBetDetectionService: {
    detectValueBetsForSport: jest.fn(),
    scanAllSports: jest.fn(),
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

describe('ValueBetDetectionController', () => {
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

  describe('detectForSport', () => {
    it('should detect value bets for a sport', async () => {
      const mockValueBets = [
        {
          id: 'vb-1',
          eventId: 'event-1',
          selection: 'home',
          valuePercentage: 15.5,
        },
      ];

      (valueBetDetectionService.detectValueBetsForSport as jest.Mock).mockResolvedValue(mockValueBets);
      mockReq.params = { sport: 'soccer_epl' };
      mockReq.query = {};

      await valueBetDetectionController.detectForSport(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetDetectionService.detectValueBetsForSport).toHaveBeenCalledWith({
        sport: 'soccer_epl',
        minValue: 0.05,
        maxEvents: 20,
        autoCreateAlerts: false,
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockValueBets,
          count: 1,
        })
      );
    });

    it('should apply query parameters', async () => {
      (valueBetDetectionService.detectValueBetsForSport as jest.Mock).mockResolvedValue([]);
      mockReq.params = { sport: 'soccer_epl' };
      mockReq.query = {
        minValue: '0.10',
        maxEvents: '50',
        autoCreateAlerts: 'true',
      };

      await valueBetDetectionController.detectForSport(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetDetectionService.detectValueBetsForSport).toHaveBeenCalledWith({
        sport: 'soccer_epl',
        minValue: 0.10,
        maxEvents: 50,
        autoCreateAlerts: true,
      });
    });

    it('should handle service errors', async () => {
      (valueBetDetectionService.detectValueBetsForSport as jest.Mock).mockRejectedValue(
        new AppError('Service error', 500)
      );
      mockReq.params = { sport: 'soccer_epl' };

      await valueBetDetectionController.detectForSport(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('scanAll', () => {
    it('should scan all sports for value bets', async () => {
      const mockValueBets = [
        { id: 'vb-1', sport: 'soccer_epl' },
        { id: 'vb-2', sport: 'basketball_nba' },
      ];

      (valueBetDetectionService.scanAllSports as jest.Mock).mockResolvedValue(mockValueBets);
      mockReq.query = {};

      await valueBetDetectionController.scanAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetDetectionService.scanAllSports).toHaveBeenCalledWith({
        minValue: 0.05,
        maxEvents: 20,
        autoCreateAlerts: false,
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockValueBets,
          count: 2,
        })
      );
    });
  });
});


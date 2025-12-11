/**
 * Value Bet Alerts Controller Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { valueBetAlertsController } from '../../api/controllers/value-bet-alerts.controller';
import { valueBetAlertsService } from '../../services/value-bet-alerts.service';

// Mock dependencies
jest.mock('../../services/value-bet-alerts.service', () => ({
  valueBetAlertsService: {
    getUserAlerts: jest.fn(),
    markAsClicked: jest.fn(),
    markAsTaken: jest.fn(),
    getUserAlertStats: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ValueBetAlertsController', () => {
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

  describe('getMyAlerts', () => {
    it('should return user alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          valuePercentage: 15.5,
          event: { name: 'Team A vs Team B' },
        },
      ];

      (valueBetAlertsService.getUserAlerts as jest.Mock).mockResolvedValue(mockAlerts);
      mockReq.query = { minValue: '10', limit: '20' };

      await valueBetAlertsController.getMyAlerts(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetAlertsService.getUserAlerts).toHaveBeenCalledWith('user-1', {
        minValue: 10,
        sportId: undefined,
        limit: 20,
        offset: undefined,
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAlerts,
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await valueBetAlertsController.getMyAlerts(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('markAsClicked', () => {
    it('should mark alert as clicked', async () => {
      const mockAlert = {
        id: 'alert-1',
        clickedAt: new Date(),
      };

      (valueBetAlertsService.markAsClicked as jest.Mock).mockResolvedValue(mockAlert);
      mockReq.params = { alertId: 'alert-1' };

      await valueBetAlertsController.markAsClicked(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetAlertsService.markAsClicked).toHaveBeenCalledWith('alert-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAlert,
        })
      );
    });
  });

  describe('markAsTaken', () => {
    it('should mark alert as taken', async () => {
      const mockAlert = {
        id: 'alert-1',
        takenAt: new Date(),
        externalBetId: 'bet-1',
      };

      (valueBetAlertsService.markAsTaken as jest.Mock).mockResolvedValue(mockAlert);
      mockReq.params = { alertId: 'alert-1' };
      mockReq.body = { externalBetId: 'bet-1' };

      await valueBetAlertsController.markAsTaken(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetAlertsService.markAsTaken).toHaveBeenCalledWith('alert-1', 'bet-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAlert,
        })
      );
    });
  });

  describe('getAlertStats', () => {
    it('should return alert statistics', async () => {
      const mockStats = {
        total: 50,
        clicked: 30,
        taken: 20,
        conversionRate: 0.40,
      };

      (valueBetAlertsService.getUserAlertStats as jest.Mock).mockResolvedValue(mockStats);

      await valueBetAlertsController.getAlertStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(valueBetAlertsService.getUserAlertStats).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats,
        })
      );
    });
  });
});


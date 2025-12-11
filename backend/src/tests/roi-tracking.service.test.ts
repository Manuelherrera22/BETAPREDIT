/**
 * ROI Tracking Service Tests
 * Tests for ROI tracking service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { roiTrackingService } from '../services/roi-tracking.service';
import { prisma } from '../config/database';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    externalBet: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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

describe('ROITrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getROITracking', () => {
    it('should calculate ROI tracking for user', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          stake: 100,
          odds: 2.0,
          status: 'WON',
          valueBetAlert: null,
        },
        {
          id: 'bet-2',
          stake: 100,
          odds: 2.5,
          status: 'LOST',
          valueBetAlert: null,
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.externalBet.findFirst as jest.Mock).mockResolvedValue({
        registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const result = await roiTrackingService.getROITracking('user-1', 'month');

      expect(result).toHaveProperty('totalROI');
      expect(result).toHaveProperty('valueBetsROI');
      expect(result).toHaveProperty('normalBetsROI');
      expect(result).toHaveProperty('totalBets');
      expect(result).toHaveProperty('netProfit');
    });

    it('should separate value bets from normal bets', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          stake: 100,
          odds: 2.0,
          status: 'WON',
          valueBetAlert: { id: 'alert-1' },
        },
        {
          id: 'bet-2',
          stake: 100,
          odds: 2.5,
          status: 'LOST',
          valueBetAlert: null,
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.externalBet.findFirst as jest.Mock).mockResolvedValue({
        registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const result = await roiTrackingService.getROITracking('user-1', 'month');

      expect(result.valueBetsMetrics.totalBets).toBe(1);
      expect(result.totalBets).toBe(2);
    });

    it('should calculate ROI correctly', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          stake: 100,
          odds: 2.0,
          status: 'WON',
          valueBetAlert: null,
        },
      ];

      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.externalBet.findFirst as jest.Mock).mockResolvedValue({
        registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const result = await roiTrackingService.getROITracking('user-1', 'month');

      // Won bet: stake 100, odds 2.0 = return 200, profit 100
      // ROI = (profit / total staked) * 100 = (100 / 100) * 100 = 100%
      expect(result.totalROI).toBeGreaterThan(0);
    });

    it('should handle different time periods', async () => {
      const mockBets = [];
      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue(mockBets);
      (prisma.externalBet.findFirst as jest.Mock).mockResolvedValue(null);

      const weekResult = await roiTrackingService.getROITracking('user-1', 'week');
      const monthResult = await roiTrackingService.getROITracking('user-1', 'month');
      const yearResult = await roiTrackingService.getROITracking('user-1', 'year');
      const allTimeResult = await roiTrackingService.getROITracking('user-1', 'all_time');

      expect(weekResult).toBeDefined();
      expect(monthResult).toBeDefined();
      expect(yearResult).toBeDefined();
      expect(allTimeResult).toBeDefined();
    });

    it('should handle empty bets list', async () => {
      (prisma.externalBet.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.externalBet.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await roiTrackingService.getROITracking('user-1', 'month');

      expect(result.totalBets).toBe(0);
      expect(result.totalROI).toBe(0);
      expect(result.netProfit).toBe(0);
    });
  });
});


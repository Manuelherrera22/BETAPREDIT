/**
 * Platform Metrics Service Tests
 * Tests for platform-wide metrics calculation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { platformMetricsService } from '../services/platform-metrics.service';
import { prisma } from '../config/database';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    valueBetAlert: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    externalBet: {
      aggregate: jest.fn(),
    },
    prediction: {
      aggregate: jest.fn(),
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

describe('PlatformMetricsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatformMetrics', () => {
    it('should calculate platform metrics correctly', async () => {
      (prisma.valueBetAlert.count as jest.Mock)
        .mockResolvedValueOnce(10) // valueBetsToday
        .mockResolvedValueOnce(8) // valueBetsYesterday
        .mockResolvedValueOnce(1000); // totalValueBets

      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(50) // usersWithRecentLogin
        .mockResolvedValueOnce(30) // usersWithRecentBets
        .mockResolvedValueOnce(60) // uniqueActiveUsers
        .mockResolvedValueOnce(500); // totalUsers

      (prisma.externalBet.aggregate as jest.Mock).mockResolvedValue({
        _avg: { roi: 15.5 },
      });

      (prisma.prediction.aggregate as jest.Mock).mockResolvedValue({
        _avg: { accuracy: 0.68 },
      });

      const result = await platformMetricsService.getPlatformMetrics();

      expect(result).toHaveProperty('valueBetsFoundToday');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('averageROI');
      expect(result).toHaveProperty('averageAccuracy');
      expect(result).toHaveProperty('totalValueBetsFound');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('trends');

      expect(result.valueBetsFoundToday).toBe(10);
      expect(result.activeUsers).toBe(60);
      expect(result.totalUsers).toBe(500);
    });

    it('should calculate trends correctly', async () => {
      (prisma.valueBetAlert.count as jest.Mock)
        .mockResolvedValueOnce(10) // valueBetsToday
        .mockResolvedValueOnce(8) // valueBetsYesterday
        .mockResolvedValueOnce(1000); // totalValueBets

      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(500);

      (prisma.externalBet.aggregate as jest.Mock).mockResolvedValue({
        _avg: { roi: 15.5 },
      });

      (prisma.prediction.aggregate as jest.Mock).mockResolvedValue({
        _avg: { accuracy: 0.68 },
      });

      const result = await platformMetricsService.getPlatformMetrics();

      // Value bets increased from 8 to 10 = +25%
      expect(result.trends.valueBetsChange).toContain('+');
    });

    it('should handle zero values gracefully', async () => {
      (prisma.valueBetAlert.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (prisma.externalBet.aggregate as jest.Mock).mockResolvedValue({
        _avg: { roi: null },
      });

      (prisma.prediction.aggregate as jest.Mock).mockResolvedValue({
        _avg: { accuracy: null },
      });

      const result = await platformMetricsService.getPlatformMetrics();

      expect(result.valueBetsFoundToday).toBe(0);
      expect(result.activeUsers).toBe(0);
      expect(result.averageROI).toBe(0);
      expect(result.averageAccuracy).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      (prisma.valueBetAlert.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(platformMetricsService.getPlatformMetrics()).rejects.toThrow();
    });
  });
});


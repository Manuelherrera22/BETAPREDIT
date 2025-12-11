/**
 * User Statistics Service Tests
 * Tests for user statistics service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userStatisticsService } from '../../services/userStatisticsService';
import api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('UserStatisticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyStatistics', () => {
    it('should fetch user statistics', async () => {
      const mockStats = {
        totalBets: 100,
        totalWins: 65,
        winRate: 0.65,
        roi: 15.5,
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockStats,
        },
      });

      const result = await userStatisticsService.getMyStatistics('month');

      expect(api.get).toHaveBeenCalledWith(
        '/user-statistics/my-statistics',
        expect.objectContaining({
          params: { period: 'month' },
        })
      );
      expect(result).toEqual(mockStats);
    });

    it('should handle errors gracefully', async () => {
      (api.get as any).mockRejectedValue(new Error('API error'));

      await expect(
        userStatisticsService.getMyStatistics('month')
      ).rejects.toThrow();
    });
  });

  describe('getStatisticsByPeriod', () => {
    it('should fetch statistics by period', async () => {
      const mockPeriodStats = [
        { periodStart: new Date(), roi: 10.5, winRate: 0.60 },
        { periodStart: new Date(), roi: 15.2, winRate: 0.65 },
      ];

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockPeriodStats,
        },
      });

      const result = await userStatisticsService.getStatisticsByPeriod('month');

      expect(api.get).toHaveBeenCalledWith(
        '/user-statistics/by-period',
        expect.objectContaining({
          params: { period: 'month' },
        })
      );
      expect(result).toEqual(mockPeriodStats);
    });
  });

  describe('getStatisticsBySport', () => {
    it('should fetch statistics by sport', async () => {
      const mockSportStats = {
        'soccer_epl': { totalBets: 50, winRate: 0.65 },
        'basketball_nba': { totalBets: 30, winRate: 0.70 },
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockSportStats,
        },
      });

      const result = await userStatisticsService.getStatisticsBySport('month');

      expect(api.get).toHaveBeenCalledWith(
        '/user-statistics/by-sport',
        expect.objectContaining({
          params: { period: 'month' },
        })
      );
      expect(result).toEqual(mockSportStats);
    });
  });
});


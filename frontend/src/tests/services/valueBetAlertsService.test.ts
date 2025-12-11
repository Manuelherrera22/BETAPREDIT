/**
 * Value Bet Alerts Service Tests
 * Tests for value bet alerts service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { valueBetAlertsService } from '../../services/valueBetAlertsService';
import api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ValueBetAlertsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyAlerts', () => {
    it('should fetch user alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          eventId: 'event-1',
          selection: 'home',
          valuePercentage: 15.5,
          status: 'ACTIVE',
        },
      ];

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockAlerts,
        },
      });

      const result = await valueBetAlertsService.getMyAlerts({});

      expect(api.get).toHaveBeenCalledWith(
        '/value-bet-alerts/my-alerts',
        expect.objectContaining({
          params: {},
        })
      );
      expect(result).toEqual(mockAlerts);
    });

    it('should apply filters when provided', async () => {
      const filters = {
        status: 'ACTIVE',
        minValue: 10,
        sportId: 'sport-1',
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      await valueBetAlertsService.getMyAlerts(filters);

      expect(api.get).toHaveBeenCalledWith(
        '/value-bet-alerts/my-alerts',
        expect.objectContaining({
          params: filters,
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      (api.post as any).mockResolvedValue({
        data: {
          success: true,
        },
      });

      await valueBetAlertsService.markAsRead('alert-1');

      expect(api.post).toHaveBeenCalledWith('/value-bet-alerts/alert-1/mark-read');
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert', async () => {
      (api.delete as any).mockResolvedValue({
        data: {
          success: true,
        },
      });

      await valueBetAlertsService.deleteAlert('alert-1');

      expect(api.delete).toHaveBeenCalledWith('/value-bet-alerts/alert-1');
    });
  });
});


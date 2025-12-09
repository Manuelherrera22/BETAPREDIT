/**
 * Events Service Tests
 * Basic tests for events service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventsService } from '../../services/eventsService';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock Supabase config
vi.mock('../../config/supabase', () => ({
  isSupabaseConfigured: () => false,
  supabase: null,
}));

describe('eventsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLiveEvents', () => {
    it('should return an array of events', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Event 1',
          status: 'LIVE',
        },
      ];

      const api = await import('../../services/api');
      vi.mocked(api.default.get).mockResolvedValue({
        data: { data: mockEvents },
      });

      const result = await eventsService.getLiveEvents();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const api = await import('../../services/api');
      vi.mocked(api.default.get).mockRejectedValue(new Error('Network error'));

      await expect(eventsService.getLiveEvents()).rejects.toThrow();
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return an array of events', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Event 1',
          status: 'SCHEDULED',
        },
      ];

      const api = await import('../../services/api');
      vi.mocked(api.default.get).mockResolvedValue({
        data: { data: mockEvents },
      });

      const result = await eventsService.getUpcomingEvents();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});


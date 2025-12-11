/**
 * External Bets Service Tests
 * Tests for external bets service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { externalBetsService } from '../../services/externalBetsService';
import api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../config/supabase', () => ({
  isSupabaseConfigured: () => false,
  supabase: null,
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    token: 'test-token',
  }),
}));

describe('ExternalBetsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyBets', () => {
    it('should fetch user bets', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          platform: 'Bet365',
          stake: 100,
          status: 'PENDING',
        },
      ];

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockBets,
        },
      });

      const result = await externalBetsService.getMyBets({});

      expect(api.get).toHaveBeenCalledWith('/external-bets/my-bets', expect.any(Object));
      expect(result).toEqual(mockBets);
    });

    it('should apply filters when provided', async () => {
      const filters = {
        platform: 'Bet365',
        status: 'PENDING',
        limit: 10,
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      await externalBetsService.getMyBets(filters);

      expect(api.get).toHaveBeenCalledWith(
        '/external-bets/my-bets',
        expect.objectContaining({
          params: filters,
        })
      );
    });
  });

  describe('registerBet', () => {
    it('should register a new bet', async () => {
      const betData = {
        platform: 'Bet365',
        marketType: 'Match Winner',
        selection: 'home',
        odds: 2.5,
        stake: 100,
      };

      (api.post as any).mockResolvedValue({
        data: {
          success: true,
          data: { id: 'bet-1', ...betData },
        },
      });

      const result = await externalBetsService.registerBet(betData);

      expect(api.post).toHaveBeenCalledWith('/external-bets/register', betData);
      expect(result).toBeDefined();
    });
  });

  describe('updateBet', () => {
    it('should update an existing bet', async () => {
      const betData = {
        status: 'WON',
        result: 'win',
      };

      (api.patch as any).mockResolvedValue({
        data: {
          success: true,
          data: { id: 'bet-1', ...betData },
        },
      });

      const result = await externalBetsService.updateBet('bet-1', betData);

      expect(api.patch).toHaveBeenCalledWith('/external-bets/bet-1', betData);
      expect(result).toBeDefined();
    });
  });

  describe('deleteBet', () => {
    it('should delete a bet', async () => {
      (api.delete as any).mockResolvedValue({
        data: {
          success: true,
        },
      });

      await externalBetsService.deleteBet('bet-1');

      expect(api.delete).toHaveBeenCalledWith('/external-bets/bet-1');
    });
  });
});


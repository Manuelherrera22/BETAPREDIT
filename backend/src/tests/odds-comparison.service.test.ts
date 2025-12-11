/**
 * Odds Comparison Service Tests
 * Tests for odds comparison service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { oddsComparisonService } from '../services/odds-comparison.service';
import { prisma } from '../config/database';
import { getTheOddsAPIService } from '../services/integrations/the-odds-api.service';
import { AppError } from '../middleware/errorHandler';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    event: {
      findFirst: jest.fn(),
    },
    market: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    oddsComparison: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(),
}));

jest.mock('../services/event-sync.service', () => ({
  eventSyncService: {
    syncEventFromTheOddsAPI: jest.fn(),
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

describe('OddsComparisonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAndUpdateComparison', () => {
    it('should fetch and update odds comparison', async () => {
      const mockComparison = {
        comparisons: {
          home: {
            bestOdds: { bookmaker: 'Bet365', odds: 2.0 },
            allOdds: [
              { bookmaker: 'Bet365', odds: 2.0 },
              { bookmaker: 'Betfair', odds: 2.1 },
            ],
          },
        },
        event: {
          home_team: 'Team A',
          away_team: 'Team B',
          sport_key: 'soccer_epl',
        },
      };

      const mockEvent = {
        id: 'event-1',
        externalId: 'ext-1',
      };

      const mockMarket = {
        id: 'market-1',
        type: 'MATCH_WINNER',
      };

      const mockOddsService = {
        compareOdds: jest.fn().mockResolvedValue(mockComparison),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsService);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findFirst as jest.Mock).mockResolvedValue(mockMarket);
      (prisma.oddsComparison.upsert as jest.Mock).mockResolvedValue({
        id: 'comp-1',
      });

      const result = await oddsComparisonService.fetchAndUpdateComparison(
        'soccer_epl',
        'ext-1',
        'h2h'
      );

      expect(mockOddsService.compareOdds).toHaveBeenCalledWith('soccer_epl', 'ext-1', 'h2h');
      expect(prisma.oddsComparison.upsert).toHaveBeenCalled();
    });

    it('should handle event not found in database', async () => {
      const mockComparison = {
        comparisons: {
          home: {
            bestOdds: { bookmaker: 'Bet365', odds: 2.0 },
            allOdds: [{ bookmaker: 'Bet365', odds: 2.0 }],
          },
        },
        event: {
          home_team: 'Team A',
          away_team: 'Team B',
          sport_key: 'soccer_epl',
        },
      };

      const mockOddsService = {
        compareOdds: jest.fn().mockResolvedValue(mockComparison),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsService);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock event sync service
      const { eventSyncService } = await import('../services/event-sync.service');
      (eventSyncService.syncEventFromTheOddsAPI as jest.Mock).mockResolvedValue({
        id: 'event-1',
      });

      await oddsComparisonService.fetchAndUpdateComparison('soccer_epl', 'ext-1', 'h2h');

      expect(eventSyncService.syncEventFromTheOddsAPI).toHaveBeenCalled();
    });

    it('should throw error when The Odds API service not configured', async () => {
      (getTheOddsAPIService as jest.Mock).mockReturnValue(null);

      await expect(
        oddsComparisonService.fetchAndUpdateComparison('soccer_epl', 'ext-1', 'h2h')
      ).rejects.toThrow(AppError);
    });

    it('should handle API errors gracefully', async () => {
      const mockOddsService = {
        compareOdds: jest.fn().mockRejectedValue(new Error('API error')),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsService);

      await expect(
        oddsComparisonService.fetchAndUpdateComparison('soccer_epl', 'ext-1', 'h2h')
      ).rejects.toThrow();
    });
  });
});


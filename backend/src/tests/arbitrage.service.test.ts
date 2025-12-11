/**
 * Arbitrage Service Tests
 * Tests for arbitrage detection service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { arbitrageService } from '../services/arbitrage/arbitrage.service';
import { getTheOddsAPIService } from '../services/integrations/the-odds-api.service';
import { prisma } from '../config/database';

// Mock dependencies
jest.mock('../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(),
}));

jest.mock('../config/database', () => ({
  prisma: {
    arbitrageOpportunity: {
      create: jest.fn(),
      findMany: jest.fn(),
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

describe('ArbitrageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectArbitrageOpportunities', () => {
    it('should detect arbitrage opportunities', async () => {
      const mockOddsService = {
        getOdds: jest.fn().mockResolvedValue([
          {
            id: 'event-1',
            bookmakers: [
              {
                key: 'bet365',
                markets: [
                  {
                    key: 'h2h',
                    outcomes: [
                      { name: 'Team A', price: 2.0 },
                      { name: 'Team B', price: 2.0 },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsService);

      const result = await arbitrageService.detectArbitrageOpportunities('soccer_epl');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no opportunities found', async () => {
      const mockOddsService = {
        getOdds: jest.fn().mockResolvedValue([]),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsService);

      const result = await arbitrageService.detectArbitrageOpportunities('soccer_epl');

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const mockOddsService = {
        getOdds: jest.fn().mockRejectedValue(new Error('API error')),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsService);

      const result = await arbitrageService.detectArbitrageOpportunities('soccer_epl');

      expect(result).toEqual([]);
    });
  });

  describe('calculateArbitrageProfit', () => {
    it('should calculate profit correctly', () => {
      const odds = {
        home: { bookmaker: 'bet365', odds: 2.0 },
        away: { bookmaker: 'betfair', odds: 2.1 },
      };

      const profit = arbitrageService.calculateArbitrageProfit(odds, 100);

      expect(profit).toBeGreaterThan(0);
    });

    it('should return 0 when no arbitrage opportunity', () => {
      const odds = {
        home: { bookmaker: 'bet365', odds: 1.5 },
        away: { bookmaker: 'betfair', odds: 1.6 },
      };

      const profit = arbitrageService.calculateArbitrageProfit(odds, 100);

      expect(profit).toBeLessThanOrEqual(0);
    });
  });
});

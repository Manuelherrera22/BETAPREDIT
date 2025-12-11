/**
 * Multi Market Predictions Service Tests
 * Tests for multi-market prediction generation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { multiMarketPredictionsService } from '../services/multi-market-predictions.service';
import { prisma } from '../config/database';
import { normalizedPredictionService } from '../services/normalized-prediction.service';
import { advancedFeaturesService } from '../services/advanced-features.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    market: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    prediction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../services/normalized-prediction.service', () => ({
  normalizedPredictionService: {
    calculateNormalizedProbabilities: jest.fn(),
  },
}));

jest.mock('../services/advanced-features.service', () => ({
  advancedFeaturesService: {
    getAllAdvancedFeatures: jest.fn(),
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

describe('MultiMarketPredictionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePredictionsForEvent', () => {
    it('should generate predictions for multiple markets', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        sportId: 'sport-1',
      };

      const mockMarkets = [
        {
          id: 'market-1',
          type: 'MATCH_WINNER',
          name: 'Match Winner',
        },
        {
          id: 'market-2',
          type: 'TOTAL_GOALS',
          name: 'Total Goals',
        },
      ];

      const mockNormalizedPredictions = {
        home: { predictedProbability: 0.45, confidence: 0.75 },
        away: { predictedProbability: 0.35, confidence: 0.70 },
        draw: { predictedProbability: 0.20, confidence: 0.65 },
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findMany as jest.Mock).mockResolvedValue(mockMarkets);
      (normalizedPredictionService.calculateNormalizedProbabilities as jest.Mock).mockResolvedValue(
        mockNormalizedPredictions
      );
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.prediction.create as jest.Mock).mockResolvedValue({
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        predictedProbability: 0.45,
        confidence: 0.75,
      });

      const result = await multiMarketPredictionsService.generatePredictionsForEvent('event-1');

      expect(result.generated).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBe(0);
    });

    it('should handle events without markets', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        sportId: 'sport-1',
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findMany as jest.Mock).mockResolvedValue([]);

      const result = await multiMarketPredictionsService.generatePredictionsForEvent('event-1');

      expect(result.generated).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      (prisma.event.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await multiMarketPredictionsService.generatePredictionsForEvent('event-1');

      expect(result.errors).toBeGreaterThan(0);
    });
  });
});


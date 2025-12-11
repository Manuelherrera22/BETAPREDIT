/**
 * Predictions Service Tests
 * Unit tests for predictions.service.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { predictionsService } from '../services/predictions.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { validatePredictionData, sanitizePredictionForDisplay } from '../utils/prediction-data-validator';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    prediction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    market: {
      findUnique: jest.fn(),
    },
  },
}));

describe('PredictionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrediction', () => {
    it('should create a new prediction successfully', async () => {
      const mockEvent = { id: 'event-1', name: 'Test Event' };
      const mockMarket = { id: 'market-1', type: 'match_winner' };
      const mockPrediction = {
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        predictedProbability: 0.65,
        confidence: 0.75,
        modelVersion: 'v1.0',
        factors: {},
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.prediction.create as jest.Mock).mockResolvedValue(mockPrediction);

      const result = await predictionsService.createPrediction({
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        predictedProbability: 0.65,
        confidence: 0.75,
        modelVersion: 'v1.0',
      });

      expect(result).toEqual(mockPrediction);
      expect(prisma.prediction.create).toHaveBeenCalled();
    });

    it('should throw error if event not found', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        predictionsService.createPrediction({
          eventId: 'invalid-event',
          marketId: 'market-1',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
          modelVersion: 'v1.0',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error if market not found', async () => {
      const mockEvent = { id: 'event-1', name: 'Test Event' };
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        predictionsService.createPrediction({
          eventId: 'event-1',
          marketId: 'invalid-market',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
          modelVersion: 'v1.0',
        })
      ).rejects.toThrow(AppError);
    });

    it('should update existing prediction if it already exists', async () => {
      const mockEvent = { id: 'event-1', name: 'Test Event' };
      const mockMarket = { id: 'market-1', type: 'match_winner' };
      const existingPrediction = {
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
      };
      const updatedPrediction = {
        ...existingPrediction,
        predictedProbability: 0.70,
        confidence: 0.80,
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(existingPrediction);
      (prisma.prediction.update as jest.Mock).mockResolvedValue(updatedPrediction);

      const result = await predictionsService.createPrediction({
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        predictedProbability: 0.70,
        confidence: 0.80,
        modelVersion: 'v1.0',
      });

      expect(result).toEqual(updatedPrediction);
      expect(prisma.prediction.update).toHaveBeenCalled();
      expect(prisma.prediction.create).not.toHaveBeenCalled();
    });
  });

  describe('getEventPredictions', () => {
    it('should return predictions with validated data', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          marketId: 'market-1',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
          factors: {
            advancedFeatures: {
              homeForm: { winRate5: 0.6, isRealData: true },
              awayForm: { winRate5: 0.4, isRealData: true },
            },
            marketAverage: { home: 0.6, away: 0.4 },
          },
          market: { id: 'market-1', type: 'match_winner' },
          event: {
            id: 'event-1',
            name: 'Test Event',
            sport: { id: 'sport-1', name: 'Soccer' },
          },
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);

      const result = await predictionsService.getEventPredictions('event-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('dataQuality');
      expect(result[0].dataQuality).toHaveProperty('isValid');
      expect(result[0].dataQuality).toHaveProperty('completeness');
      expect(result[0].dataQuality).toHaveProperty('canDisplay');
    });

    it('should sanitize prediction data', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          predictedProbability: 1.5, // Invalid: > 1
          confidence: 0.99, // Valid
          factors: {},
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);

      const result = await predictionsService.getEventPredictions('event-1');

      expect(result[0].predictedProbability).toBeLessThanOrEqual(1);
      expect(result[0].predictedProbability).toBeGreaterThanOrEqual(0);
    });

    it('should handle predictions with missing factors', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          predictedProbability: 0.65,
          confidence: 0.75,
          factors: null, // Missing factors
          market: { id: 'market-1' },
          event: { id: 'event-1', sport: { id: 'sport-1' } },
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);

      const result = await predictionsService.getEventPredictions('event-1');

      expect(result[0].factors).toEqual({});
      expect(result[0].dataQuality.canDisplay).toBe(false);
    });
  });

  describe('submitUserFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockPrediction = {
        id: 'pred-1',
        factors: {},
      };
      const updatedPrediction = {
        ...mockPrediction,
        factors: {
          userFeedback: {
            userId: 'user-1',
            wasCorrect: true,
            submittedAt: expect.any(String),
          },
        },
      };

      (prisma.prediction.findUnique as jest.Mock).mockResolvedValue(mockPrediction);
      (prisma.prediction.update as jest.Mock).mockResolvedValue(updatedPrediction);

      const result = await predictionsService.submitUserFeedback(
        'pred-1',
        'user-1',
        {
          wasCorrect: true,
          userConfidence: 0.8,
        }
      );

      expect(result).toEqual(updatedPrediction);
      expect(prisma.prediction.update).toHaveBeenCalled();
    });

    it('should throw error if prediction not found', async () => {
      (prisma.prediction.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        predictionsService.submitUserFeedback('invalid-pred', 'user-1', {
          wasCorrect: true,
        })
      ).rejects.toThrow(AppError);
    });
  });
});

describe('Prediction Data Validator', () => {
  describe('validatePredictionFactors', () => {
    it('should validate complete prediction factors', () => {
      const factors = {
        marketAverage: { home: 0.6, away: 0.4 },
        advancedFeatures: {
          homeForm: { winRate5: 0.6, isRealData: true },
          awayForm: { winRate5: 0.4, isRealData: true },
          h2h: { team1WinRate: 0.5, isRealData: true },
          marketIntelligence: { consensus: 0.6 },
        },
        advancedAnalysis: { home: { keyFactors: [] } },
        formAdvantage: 0.2,
        goalsAdvantage: 0.1,
      };

      const result = validatePredictionData({
        predictedProbability: 0.65,
        confidence: 0.75,
        factors,
      });

      expect(result.isValid).toBe(true);
      expect(result.quality.completeness).toBeGreaterThan(0.7);
      expect(result.canDisplay).toBe(true);
    });

    it('should detect missing factors', () => {
      const factors = {
        // Missing most fields
      };

      const result = validatePredictionData({
        predictedProbability: 0.65,
        confidence: 0.75,
        factors,
      });

      expect(result.isValid).toBe(false);
      expect(result.quality.completeness).toBeLessThan(0.5);
      expect(result.quality.missingFields.length).toBeGreaterThan(0);
    });

    it('should validate probability and confidence ranges', () => {
      const result1 = validatePredictionData({
        predictedProbability: 1.5, // Invalid
        confidence: 0.75,
        factors: {},
      });

      expect(result1.valueErrors.length).toBeGreaterThan(0);

      const result2 = validatePredictionData({
        predictedProbability: 0.65,
        confidence: 0.99, // Invalid (> 0.95)
        factors: {},
      });

      expect(result2.valueErrors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizePredictionForDisplay', () => {
    it('should sanitize probability to valid range', () => {
      const prediction = {
        predictedProbability: 1.5, // Invalid
        confidence: 0.75,
        factors: {},
      };

      const sanitized = sanitizePredictionForDisplay(prediction);

      expect(sanitized.predictedProbability).toBeLessThanOrEqual(1);
      expect(sanitized.predictedProbability).toBeGreaterThanOrEqual(0);
    });

    it('should sanitize confidence to valid range', () => {
      const prediction = {
        predictedProbability: 0.65,
        confidence: 0.99, // Invalid
        factors: {},
      };

      const sanitized = sanitizePredictionForDisplay(prediction);

      expect(sanitized.confidence).toBeLessThanOrEqual(0.95);
      expect(sanitized.confidence).toBeGreaterThanOrEqual(0.45);
    });

    it('should ensure factors is always an object', () => {
      const prediction = {
        predictedProbability: 0.65,
        confidence: 0.75,
        factors: null,
      };

      const sanitized = sanitizePredictionForDisplay(prediction);

      expect(sanitized.factors).toEqual({});
    });
  });
});


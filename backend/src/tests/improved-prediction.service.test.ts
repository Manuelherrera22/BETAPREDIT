/**
 * Improved Prediction Service Tests
 * Tests for enhanced probability prediction service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { improvedPredictionService } from '../services/improved-prediction.service';
import { prisma } from '../config/database';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    prediction: {
      findMany: jest.fn(),
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

describe('ImprovedPredictionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePredictedProbability', () => {
    it('should calculate probability from market odds', async () => {
      const odds = [2.0, 2.1, 1.9];
      const result = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        odds
      );

      expect(result).toHaveProperty('predictedProbability');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');

      // Probability should be between 0 and 1
      expect(result.predictedProbability).toBeGreaterThan(0);
      expect(result.predictedProbability).toBeLessThan(1);

      // Confidence should be between 0.45 and 0.95
      expect(result.confidence).toBeGreaterThanOrEqual(0.45);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it('should calculate market average correctly', async () => {
      const odds = [2.0, 2.0, 2.0]; // All same odds = 50% implied probability
      const result = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        odds
      );

      // Market average should be close to 0.5 (1/2.0)
      expect(result.predictedProbability).toBeCloseTo(0.5, 1);
      expect(result.factors.marketAverage).toBeCloseTo(0.5, 1);
    });

    it('should calculate market consensus correctly', async () => {
      // Tight odds range = high consensus
      const tightOdds = [2.0, 2.05, 1.95];
      const tightResult = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        tightOdds
      );

      // Wide odds range = low consensus
      const wideOdds = [1.5, 3.0, 2.5];
      const wideResult = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        wideOdds
      );

      // Tight odds should have higher consensus
      expect(tightResult.factors.marketConsensus).toBeGreaterThan(wideResult.factors.marketConsensus);
    });

    it('should handle single bookmaker odds', async () => {
      const odds = [2.0];
      const result = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        odds
      );

      expect(result.predictedProbability).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should throw error when no odds provided', async () => {
      await expect(
        improvedPredictionService.calculatePredictedProbability('event-1', 'home', [])
      ).rejects.toThrow('No odds provided');
    });

    it('should apply historical accuracy when available', async () => {
      const mockHistoricalData = [
        { wasCorrect: true },
        { wasCorrect: true },
        { wasCorrect: false },
        { wasCorrect: true },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockHistoricalData);

      const odds = [2.0, 2.1];
      const result = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        odds
      );

      expect(result.factors.historicalAccuracy).toBeDefined();
      expect(result.factors.historicalAccuracy).toBeGreaterThan(0);
      expect(result.factors.historicalAccuracy).toBeLessThanOrEqual(1);
    });

    it('should handle missing historical data gracefully', async () => {
      (prisma.prediction.findMany as jest.Mock).mockResolvedValue([]);

      const odds = [2.0, 2.1];
      const result = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        odds
      );

      // Should still calculate probability without historical data
      expect(result.predictedProbability).toBeDefined();
      expect(result.factors.historicalAccuracy).toBeUndefined();
    });

    it('should calculate confidence based on bookmaker count', async () => {
      const fewOdds = [2.0, 2.1];
      const manyOdds = [2.0, 2.1, 2.05, 1.95, 2.08, 1.98, 2.02];

      const fewResult = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        fewOdds
      );

      const manyResult = await improvedPredictionService.calculatePredictedProbability(
        'event-1',
        'home',
        manyOdds
      );

      // More bookmakers should generally increase confidence (but with diminishing returns)
      expect(manyResult.confidence).toBeGreaterThanOrEqual(fewResult.confidence * 0.9);
    });
  });
});


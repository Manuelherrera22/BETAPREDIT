/**
 * Normalized Prediction Service Tests
 * Tests for probability normalization service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { normalizedPredictionService } from '../services/normalized-prediction.service';
import { advancedFeaturesService } from '../services/advanced-features.service';
import { advancedPredictionAnalysisService } from '../services/advanced-prediction-analysis.service';

// Mock dependencies
jest.mock('../services/advanced-features.service', () => ({
  advancedFeaturesService: {
    getAllAdvancedFeatures: jest.fn(),
  },
}));

jest.mock('../services/advanced-prediction-analysis.service', () => ({
  advancedPredictionAnalysisService: {
    analyzeAndPredict: jest.fn(),
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

describe('NormalizedPredictionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNormalizedProbabilities', () => {
    it('should normalize probabilities to sum to ~100%', async () => {
      const mockFeatures = {
        homeForm: { winRate5: 0.6, isRealData: true },
        awayForm: { winRate5: 0.4, isRealData: true },
        h2h: { team1WinRate: 0.5, isRealData: true },
        market: { consensus: 0.8, efficiency: 0.9 },
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);
      (advancedPredictionAnalysisService.analyzeAndPredict as jest.Mock)
        .mockResolvedValueOnce({ adjustedProbability: 0.45, confidence: 0.75 })
        .mockResolvedValueOnce({ adjustedProbability: 0.35, confidence: 0.70 })
        .mockResolvedValueOnce({ adjustedProbability: 0.20, confidence: 0.65 });

      const selections = {
        home: [2.2, 2.1, 2.3],
        away: [3.0, 2.9, 3.1],
        draw: [3.5, 3.4, 3.6],
      };

      const result = await normalizedPredictionService.calculateNormalizedProbabilities(
        'event-1',
        'Team A vs Team B',
        'Team A',
        'Team B',
        'sport-1',
        selections
      );

      expect(result).toHaveProperty('home');
      expect(result).toHaveProperty('away');
      expect(result).toHaveProperty('draw');

      // Probabilities should sum to approximately 1.0 (accounting for bookmaker margin)
      const total = result.home.predictedProbability + 
                   result.away.predictedProbability + 
                   (result.draw?.predictedProbability || 0);
      
      expect(total).toBeGreaterThan(0.95);
      expect(total).toBeLessThan(1.05);
    });

    it('should handle markets without draw option', async () => {
      const mockFeatures = {
        homeForm: { winRate5: 0.6, isRealData: true },
        awayForm: { winRate5: 0.4, isRealData: true },
        h2h: { team1WinRate: 0.5, isRealData: true },
        market: { consensus: 0.8, efficiency: 0.9 },
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);
      (advancedPredictionAnalysisService.analyzeAndPredict as jest.Mock)
        .mockResolvedValueOnce({ adjustedProbability: 0.55, confidence: 0.75 })
        .mockResolvedValueOnce({ adjustedProbability: 0.45, confidence: 0.70 });

      const selections = {
        home: [1.8, 1.85, 1.82],
        away: [2.0, 2.05, 1.98],
      };

      const result = await normalizedPredictionService.calculateNormalizedProbabilities(
        'event-1',
        'Team A vs Team B',
        'Team A',
        'Team B',
        'sport-1',
        selections
      );

      expect(result).toHaveProperty('home');
      expect(result).toHaveProperty('away');
      expect(result.draw).toBeUndefined();

      // Probabilities should sum to approximately 1.0
      const total = result.home.predictedProbability + result.away.predictedProbability;
      expect(total).toBeGreaterThan(0.95);
      expect(total).toBeLessThan(1.05);
    });

    it('should handle missing advanced features gracefully', async () => {
      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockRejectedValue(
        new Error('Features unavailable')
      );
      (advancedPredictionAnalysisService.analyzeAndPredict as jest.Mock)
        .mockResolvedValueOnce({ adjustedProbability: 0.5, confidence: 0.6 })
        .mockResolvedValueOnce({ adjustedProbability: 0.5, confidence: 0.6 });

      const selections = {
        home: [2.0, 2.0],
        away: [2.0, 2.0],
      };

      const result = await normalizedPredictionService.calculateNormalizedProbabilities(
        'event-1',
        'Team A vs Team B',
        'Team A',
        'Team B',
        'sport-1',
        selections
      );

      expect(result).toBeDefined();
      expect(result.home).toBeDefined();
      expect(result.away).toBeDefined();
    });

    it('should calculate confidence correctly for each selection', async () => {
      const mockFeatures = {
        homeForm: { winRate5: 0.6, isRealData: true },
        awayForm: { winRate5: 0.4, isRealData: true },
        h2h: { team1WinRate: 0.5, isRealData: true },
        market: { consensus: 0.8, efficiency: 0.9 },
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);
      (advancedPredictionAnalysisService.analyzeAndPredict as jest.Mock)
        .mockResolvedValueOnce({ adjustedProbability: 0.45, confidence: 0.80 })
        .mockResolvedValueOnce({ adjustedProbability: 0.35, confidence: 0.75 })
        .mockResolvedValueOnce({ adjustedProbability: 0.20, confidence: 0.70 });

      const selections = {
        home: [2.2],
        away: [3.0],
        draw: [3.5],
      };

      const result = await normalizedPredictionService.calculateNormalizedProbabilities(
        'event-1',
        'Team A vs Team B',
        'Team A',
        'Team B',
        'sport-1',
        selections
      );

      expect(result.home.confidence).toBeGreaterThanOrEqual(0.45);
      expect(result.home.confidence).toBeLessThanOrEqual(0.95);
      expect(result.away.confidence).toBeGreaterThanOrEqual(0.45);
      expect(result.away.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});


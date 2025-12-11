/**
 * Prediction Data Validator Tests
 * Unit tests for prediction-data-validator.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  validatePredictionFactors,
  validatePredictionValues,
  validatePredictionData,
  sanitizePredictionForDisplay,
} from '../utils/prediction-data-validator';

describe('Prediction Data Validator', () => {
  describe('validatePredictionFactors', () => {
    it('should return valid for complete factors', () => {
      const factors = {
        marketAverage: { home: 0.6, away: 0.4, draw: 0.2 },
        advancedFeatures: {
          marketOdds: {
            bookmakerCount: 5,
            minOdds: 1.5,
            maxOdds: 2.0,
          },
          homeForm: {
            winRate5: 0.6,
            goalsForAvg5: 1.5,
            isRealData: true,
          },
          awayForm: {
            winRate5: 0.4,
            goalsForAvg5: 1.2,
            isRealData: true,
          },
          h2h: {
            team1WinRate: 0.5,
            totalMatches: 10,
            isRealData: true,
          },
          marketIntelligence: {
            consensus: 0.6,
            efficiency: 0.95,
          },
        },
        advancedAnalysis: {
          home: { keyFactors: [] },
        },
        formAdvantage: 0.2,
        goalsAdvantage: 0.1,
      };

      const result = validatePredictionFactors(factors);

      expect(result.isValid).toBe(true);
      expect(result.completeness).toBeGreaterThan(0.7);
      expect(result.canDisplay).toBe(true);
      expect(result.missingFields.length).toBe(0);
    });

    it('should detect missing marketAverage and marketOdds', () => {
      const factors = {
        advancedFeatures: {
          homeForm: { winRate5: 0.6 },
        },
      };

      const result = validatePredictionFactors(factors);

      expect(result.missingFields).toContain('marketAverage o advancedFeatures.marketOdds');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect missing advancedFeatures', () => {
      const factors = {
        marketAverage: { home: 0.6 },
      };

      const result = validatePredictionFactors(factors);

      expect(result.missingFields).toContain('advancedFeatures');
      expect(result.completeness).toBeLessThan(0.5);
    });

    it('should detect when data is not real (isRealData: false)', () => {
      const factors = {
        marketAverage: { home: 0.6 },
        advancedFeatures: {
          homeForm: {
            winRate5: 0.6,
            isRealData: false, // Not real data
          },
        },
      };

      const result = validatePredictionFactors(factors);

      expect(result.warnings.some(w => w.includes('datos por defecto'))).toBe(true);
    });

    it('should return invalid for null or undefined factors', () => {
      const result1 = validatePredictionFactors(null);
      expect(result1.isValid).toBe(false);
      expect(result1.canDisplay).toBe(false);
      expect(result1.missingFields).toContain('factors');

      const result2 = validatePredictionFactors(undefined);
      expect(result2.isValid).toBe(false);
      expect(result2.canDisplay).toBe(false);
    });
  });

  describe('validatePredictionValues', () => {
    it('should validate correct probability and confidence', () => {
      const result = validatePredictionValues(0.65, 0.75);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect invalid probability (< 0)', () => {
      const result = validatePredictionValues(-0.1, 0.75);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Probabilidad');
    });

    it('should detect invalid probability (> 1)', () => {
      const result = validatePredictionValues(1.5, 0.75);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid confidence (< 0.45)', () => {
      const result = validatePredictionValues(0.65, 0.3);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Confianza');
    });

    it('should detect invalid confidence (> 0.95)', () => {
      const result = validatePredictionValues(0.65, 0.99);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePredictionData', () => {
    it('should return valid for complete and correct data', () => {
      const prediction = {
        predictedProbability: 0.65,
        confidence: 0.75,
        factors: {
          marketAverage: { home: 0.6 },
          advancedFeatures: {
            homeForm: { winRate5: 0.6, isRealData: true },
            awayForm: { winRate5: 0.4, isRealData: true },
          },
        },
      };

      const result = validatePredictionData(prediction);

      expect(result.isValid).toBe(true);
      expect(result.canDisplay).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return message when completeness is low', () => {
      const prediction = {
        predictedProbability: 0.65,
        confidence: 0.75,
        factors: {}, // Empty factors
      };

      const result = validatePredictionData(prediction);

      expect(result.canDisplay).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Datos insuficientes');
    });

    it('should return message when values are invalid', () => {
      const prediction = {
        predictedProbability: 1.5, // Invalid
        confidence: 0.75,
        factors: {
          marketAverage: { home: 0.6 },
        },
      };

      const result = validatePredictionData(prediction);

      expect(result.isValid).toBe(false);
      expect(result.valueErrors.length).toBeGreaterThan(0);
      expect(result.message).toContain('inválidos');
    });
  });

  describe('sanitizePredictionForDisplay', () => {
    it('should sanitize probability to [0, 1] range', () => {
      const prediction1 = { predictedProbability: 1.5, confidence: 0.75, factors: {} };
      const sanitized1 = sanitizePredictionForDisplay(prediction1);
      expect(sanitized1.predictedProbability).toBe(1);

      const prediction2 = { predictedProbability: -0.1, confidence: 0.75, factors: {} };
      const sanitized2 = sanitizePredictionForDisplay(prediction2);
      expect(sanitized2.predictedProbability).toBe(0);
    });

    it('should sanitize confidence to [0.45, 0.95] range', () => {
      const prediction1 = { predictedProbability: 0.65, confidence: 0.99, factors: {} };
      const sanitized1 = sanitizePredictionForDisplay(prediction1);
      expect(sanitized1.confidence).toBe(0.95);

      const prediction2 = { predictedProbability: 0.65, confidence: 0.3, factors: {} };
      const sanitized2 = sanitizePredictionForDisplay(prediction2);
      expect(sanitized2.confidence).toBe(0.45);
    });

    it('should ensure factors is always an object', () => {
      const prediction1 = { predictedProbability: 0.65, confidence: 0.75, factors: null };
      const sanitized1 = sanitizePredictionForDisplay(prediction1);
      expect(sanitized1.factors).toEqual({});

      const prediction2 = { predictedProbability: 0.65, confidence: 0.75, factors: undefined };
      const sanitized2 = sanitizePredictionForDisplay(prediction2);
      expect(sanitized2.factors).toEqual({});
    });

    it('should preserve valid values', () => {
      const prediction = {
        predictedProbability: 0.65,
        confidence: 0.75,
        factors: { test: 'value' },
      };

      const sanitized = sanitizePredictionForDisplay(prediction);

      expect(sanitized.predictedProbability).toBe(0.65);
      expect(sanitized.confidence).toBe(0.75);
      expect(sanitized.factors).toEqual({ test: 'value' });
    });
  });
});


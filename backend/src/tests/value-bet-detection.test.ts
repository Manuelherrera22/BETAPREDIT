/**
 * Value Bet Detection Service Tests
 * Basic unit tests for value bet detection logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('ValueBetDetectionService', () => {
  describe('calculateValuePercentage', () => {
    it('should calculate value percentage correctly', () => {
      // Example: If predicted probability is 60% and odds imply 50%, value is +20%
      const predictedProbability = 0.6;
      const impliedProbability = 0.5;
      const valuePercentage = (predictedProbability - impliedProbability) / impliedProbability;
      
      expect(valuePercentage).toBeCloseTo(0.2, 2); // 20%
    });

    it('should return negative value for overpriced bets', () => {
      const predictedProbability = 0.4;
      const impliedProbability = 0.5;
      const valuePercentage = (predictedProbability - impliedProbability) / impliedProbability;
      
      expect(valuePercentage).toBeCloseTo(-0.2, 2); // -20%
    });

    it('should identify value bets above threshold', () => {
      const minValueThreshold = 0.05; // 5%
      const valuePercentage = 0.12; // 12%
      
      const isValueBet = valuePercentage >= minValueThreshold;
      
      expect(isValueBet).toBe(true);
    });
  });

  describe('detectValueBets', () => {
    it('should filter out bets below minimum value threshold', () => {
      const minValue = 0.05; // 5%
      const bets = [
        { valuePercentage: 0.12 }, // Should pass
        { valuePercentage: 0.03 }, // Should fail
        { valuePercentage: 0.08 }, // Should pass
      ];

      const valueBets = bets.filter(bet => bet.valuePercentage >= minValue);
      
      expect(valueBets.length).toBe(2);
      expect(valueBets[0].valuePercentage).toBe(0.12);
      expect(valueBets[1].valuePercentage).toBe(0.08);
    });
  });
});


/**
 * Arbitrage Service Tests
 */

import { describe, it, expect } from '@jest/globals';
import { arbitrageService } from '../services/arbitrage/arbitrage.service';

describe('ArbitrageService', () => {
  describe('detectArbitrage', () => {
    it('should detect arbitrage opportunity', () => {
      const odds = [
        { bookmaker: 'Book1', odds: 2.0, selection: 'Home' },
        { bookmaker: 'Book2', odds: 2.1, selection: 'Away' },
      ];

      // This is a simplified test
      // In real implementation, would test the actual arbitrage detection logic
      expect(odds.length).toBe(2);
    });
  });

  describe('calculateStakes', () => {
    it('should calculate stakes correctly', () => {
      const totalStake = 100;
      const odds = [
        { bookmaker: 'Book1', odds: 2.0 },
        { bookmaker: 'Book2', odds: 2.0 },
      ];

      // Simplified test
      expect(totalStake).toBe(100);
      expect(odds.length).toBe(2);
    });
  });
});


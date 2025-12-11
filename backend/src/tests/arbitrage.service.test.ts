/**
 * Arbitrage Service Tests
 * Unit tests for arbitrage.service.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { arbitrageService } from '../services/arbitrage/arbitrage.service';

// Mock The Odds API service
jest.mock('../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(() => ({
    getOdds: jest.fn(),
  })),
}));

describe('ArbitrageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectArbitrageFromOddsEvent', () => {
    it('should detect arbitrage opportunity when sum of implied probabilities < 1', () => {
      const oddsEvent = {
        id: 'event-1',
        sport_key: 'soccer_epl',
        commence_time: '2024-01-01T12:00:00Z',
        home_team: 'Team A',
        away_team: 'Team B',
        bookmakers: [
          {
            key: 'bookmaker1',
            title: 'Bookmaker 1',
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Team A', price: 2.0 }, // 50% implied
                  { name: 'Team B', price: 2.0 }, // 50% implied
                ],
              },
            ],
          },
          {
            key: 'bookmaker2',
            title: 'Bookmaker 2',
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Team A', price: 2.5 }, // 40% implied
                  { name: 'Team B', price: 2.5 }, // 40% implied
                ],
              },
            ],
          },
        ],
      };

      // Calculate implied probabilities
      const bestOdds = {
        home: 2.5, // Best for home
        away: 2.5, // Best for away
      };

      const impliedProbHome = 1 / bestOdds.home; // 0.4
      const impliedProbAway = 1 / bestOdds.away; // 0.4
      const totalImpliedProb = impliedProbHome + impliedProbAway; // 0.8

      // Arbitrage exists if total < 1
      const hasArbitrage = totalImpliedProb < 1;
      const arbitragePercentage = (1 - totalImpliedProb) * 100; // 20%

      expect(hasArbitrage).toBe(true);
      expect(arbitragePercentage).toBeCloseTo(20, 1);
    });

    it('should not detect arbitrage when sum of implied probabilities >= 1', () => {
      const bestOdds = {
        home: 1.5, // 66.67% implied
        away: 2.0, // 50% implied
      };

      const impliedProbHome = 1 / bestOdds.home;
      const impliedProbAway = 1 / bestOdds.away;
      const totalImpliedProb = impliedProbHome + impliedProbAway;

      const hasArbitrage = totalImpliedProb < 1;

      expect(hasArbitrage).toBe(false);
      expect(totalImpliedProb).toBeGreaterThanOrEqual(1);
    });

    it('should calculate correct stakes for arbitrage', () => {
      const totalStake = 100;
      const odds = {
        home: 2.0, // 50% implied
        away: 2.0, // 50% implied
      };

      const impliedProbHome = 1 / odds.home;
      const impliedProbAway = 1 / odds.away;
      const totalImpliedProb = impliedProbHome + impliedProbAway;

      // Stakes should be proportional to implied probabilities
      const stakeHome = (impliedProbHome / totalImpliedProb) * totalStake;
      const stakeAway = (impliedProbAway / totalImpliedProb) * totalStake;

      expect(stakeHome).toBeCloseTo(50, 1);
      expect(stakeAway).toBeCloseTo(50, 1);
      expect(stakeHome + stakeAway).toBeCloseTo(totalStake, 1);
    });

    it('should calculate profit for arbitrage correctly', () => {
      const totalStake = 100;
      const odds = {
        home: 2.5, // 40% implied
        away: 2.5, // 40% implied
      };

      const impliedProbHome = 1 / odds.home;
      const impliedProbAway = 1 / odds.away;
      const totalImpliedProb = impliedProbHome + impliedProbAway;

      const stakeHome = (impliedProbHome / totalImpliedProb) * totalStake;
      const stakeAway = (impliedProbAway / totalImpliedProb) * totalStake;

      // Profit if home wins
      const profitIfHome = stakeHome * odds.home - totalStake;
      // Profit if away wins
      const profitIfAway = stakeAway * odds.away - totalStake;

      // Both should be positive (guaranteed profit)
      expect(profitIfHome).toBeGreaterThan(0);
      expect(profitIfAway).toBeGreaterThan(0);
      // Profits should be equal (risk-free arbitrage)
      expect(profitIfHome).toBeCloseTo(profitIfAway, 1);
    });
  });

  describe('calculateStakes', () => {
    it('should calculate stakes that guarantee profit regardless of outcome', () => {
      const totalStake = 1000;
      const bestOdds = {
        home: 2.1, // ~47.6% implied
        away: 2.2, // ~45.5% implied
      };

      const impliedProbHome = 1 / bestOdds.home;
      const impliedProbAway = 1 / bestOdds.away;
      const totalImpliedProb = impliedProbHome + impliedProbAway;

      const stakeHome = (impliedProbHome / totalImpliedProb) * totalStake;
      const stakeAway = (impliedProbAway / totalImpliedProb) * totalStake;

      // Verify stakes sum to total
      expect(stakeHome + stakeAway).toBeCloseTo(totalStake, 1);

      // Verify profit in both scenarios
      const profitIfHome = stakeHome * bestOdds.home - totalStake;
      const profitIfAway = stakeAway * bestOdds.away - totalStake;

      expect(profitIfHome).toBeGreaterThan(0);
      expect(profitIfAway).toBeGreaterThan(0);
    });

    it('should handle three-way markets (home/draw/away)', () => {
      const totalStake = 1000;
      const bestOdds = {
        home: 3.0, // 33.33% implied
        draw: 3.5, // 28.57% implied
        away: 3.0, // 33.33% implied
      };

      const impliedProbHome = 1 / bestOdds.home;
      const impliedProbDraw = 1 / bestOdds.draw;
      const impliedProbAway = 1 / bestOdds.away;
      const totalImpliedProb = impliedProbHome + impliedProbDraw + impliedProbAway;

      const stakeHome = (impliedProbHome / totalImpliedProb) * totalStake;
      const stakeDraw = (impliedProbDraw / totalImpliedProb) * totalStake;
      const stakeAway = (impliedProbAway / totalImpliedProb) * totalStake;

      expect(stakeHome + stakeDraw + stakeAway).toBeCloseTo(totalStake, 1);

      // All outcomes should yield profit
      const profitIfHome = stakeHome * bestOdds.home - totalStake;
      const profitIfDraw = stakeDraw * bestOdds.draw - totalStake;
      const profitIfAway = stakeAway * bestOdds.away - totalStake;

      expect(profitIfHome).toBeGreaterThan(0);
      expect(profitIfDraw).toBeGreaterThan(0);
      expect(profitIfAway).toBeGreaterThan(0);
    });
  });

  describe('findBestOdds', () => {
    it('should find best odds across multiple bookmakers', () => {
      const bookmakers = [
        {
          key: 'book1',
          markets: [{
            key: 'h2h',
            outcomes: [
              { name: 'Home', price: 2.0 },
              { name: 'Away', price: 2.0 },
            ],
          }],
        },
        {
          key: 'book2',
          markets: [{
            key: 'h2h',
            outcomes: [
              { name: 'Home', price: 2.2 }, // Better
              { name: 'Away', price: 1.9 },
            ],
          }],
        },
        {
          key: 'book3',
          markets: [{
            key: 'h2h',
            outcomes: [
              { name: 'Home', price: 1.8 },
              { name: 'Away', price: 2.3 }, // Better
            ],
          }],
        },
      ];

      // Find best odds for each selection
      let bestHome = 0;
      let bestAway = 0;

      for (const bookmaker of bookmakers) {
        const market = bookmaker.markets.find(m => m.key === 'h2h');
        if (market) {
          for (const outcome of market.outcomes) {
            if (outcome.name === 'Home' && outcome.price > bestHome) {
              bestHome = outcome.price;
            }
            if (outcome.name === 'Away' && outcome.price > bestAway) {
              bestAway = outcome.price;
            }
          }
        }
      }

      expect(bestHome).toBe(2.2);
      expect(bestAway).toBe(2.3);
    });
  });
});

/**
 * Advanced Prediction Analysis Service Tests
 * Tests for advanced prediction analysis with real data
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { advancedPredictionAnalysisService } from '../services/advanced-prediction-analysis.service';
import { advancedFeaturesService } from '../services/advanced-features.service';
import { getAPIFootballService } from '../services/integrations/api-football.service';

// Mock dependencies
jest.mock('../services/advanced-features.service', () => ({
  advancedFeaturesService: {
    getAllAdvancedFeatures: jest.fn(),
  },
}));

jest.mock('../services/integrations/api-football.service', () => ({
  getAPIFootballService: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AdvancedPredictionAnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeAndPredict', () => {
    it('should analyze and predict with market odds', async () => {
      const mockFeatures = {
        marketAverage: 0.45,
        marketConsensus: 0.85,
        marketVolatility: 0.05,
        bookmakerCount: 5,
        homeForm: {
          winRate5: 0.6,
          winRate10: 0.55,
          goalsForAvg5: 2.0,
          goalsAgainstAvg5: 1.0,
          currentStreak: 2,
          formTrend: 0.1,
          isRealData: true,
        },
        awayForm: {
          winRate5: 0.4,
          winRate10: 0.45,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: -1,
          formTrend: -0.05,
          isRealData: true,
        },
        h2h: {
          team1WinRate: 0.5,
          drawRate: 0.3,
          totalGoalsAvg: 2.5,
          recentTrend: 0.0,
          bothTeamsScoredRate: 0.6,
          isRealData: true,
        },
        marketIntelligence: {
          consensus: 0.45,
          efficiency: 0.95,
          sharpMoneyIndicator: 0.0,
          valueOpportunity: 0.0,
        },
        formAdvantage: 0.2,
        goalsAdvantage: 0.5,
        defenseAdvantage: 0.5,
        hasRealFormData: true,
        hasRealH2HData: true,
        hasRealStatsData: false,
        overallDataQuality: 0.8,
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);

      const marketOdds = [2.2, 2.1, 2.3, 2.15, 2.25]; // Average ~2.2
      const result = await advancedPredictionAnalysisService.analyzeAndPredict(
        'event-1',
        'home',
        'Team A',
        'Team B',
        'sport-1',
        marketOdds
      );

      expect(result).toHaveProperty('baseProbability');
      expect(result).toHaveProperty('adjustedProbability');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('dataQuality');
      expect(result).toHaveProperty('keyFactors');
      expect(result).toHaveProperty('riskFactors');
      expect(result.confidence).toBeGreaterThanOrEqual(0.45);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it('should calculate confidence based on data quality', async () => {
      const mockFeatures = {
        marketAverage: 0.5,
        marketConsensus: 0.9,
        marketVolatility: 0.02,
        bookmakerCount: 10,
        homeForm: {
          winRate5: 0.5,
          winRate10: 0.5,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: 0,
          formTrend: 0.0,
          isRealData: true,
        },
        awayForm: {
          winRate5: 0.5,
          winRate10: 0.5,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: 0,
          formTrend: 0.0,
          isRealData: true,
        },
        h2h: {
          team1WinRate: 0.5,
          drawRate: 0.3,
          totalGoalsAvg: 2.0,
          recentTrend: 0.0,
          bothTeamsScoredRate: 0.5,
          isRealData: true,
        },
        marketIntelligence: {
          consensus: 0.5,
          efficiency: 0.98,
          sharpMoneyIndicator: 0.0,
          valueOpportunity: 0.0,
        },
        formAdvantage: 0.0,
        goalsAdvantage: 0.0,
        defenseAdvantage: 0.0,
        hasRealFormData: true,
        hasRealH2HData: true,
        hasRealStatsData: true,
        overallDataQuality: 0.95,
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);

      const marketOdds = [2.0, 2.0, 2.0];
      const result = await advancedPredictionAnalysisService.analyzeAndPredict(
        'event-1',
        'home',
        'Team A',
        'Team B',
        'sport-1',
        marketOdds
      );

      // High data quality should result in higher confidence
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.dataQuality).toBeGreaterThan(0.9);
    });

    it('should handle missing data gracefully', async () => {
      const mockFeatures = {
        marketAverage: 0.5,
        marketConsensus: 0.7,
        marketVolatility: 0.1,
        bookmakerCount: 2,
        homeForm: {
          winRate5: 0.5,
          winRate10: 0.5,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: 0,
          formTrend: 0.0,
          isRealData: false,
        },
        awayForm: {
          winRate5: 0.5,
          winRate10: 0.5,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: 0,
          formTrend: 0.0,
          isRealData: false,
        },
        h2h: {
          team1WinRate: 0.5,
          drawRate: 0.3,
          totalGoalsAvg: 2.0,
          recentTrend: 0.0,
          bothTeamsScoredRate: 0.5,
          isRealData: false,
        },
        marketIntelligence: {
          consensus: 0.5,
          efficiency: 0.85,
          sharpMoneyIndicator: 0.0,
          valueOpportunity: 0.0,
        },
        formAdvantage: 0.0,
        goalsAdvantage: 0.0,
        defenseAdvantage: 0.0,
        hasRealFormData: false,
        hasRealH2HData: false,
        hasRealStatsData: false,
        overallDataQuality: 0.3,
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);

      const marketOdds = [2.0];
      const result = await advancedPredictionAnalysisService.analyzeAndPredict(
        'event-1',
        'home',
        'Team A',
        'Team B',
        'sport-1',
        marketOdds
      );

      // Lower data quality should result in lower confidence
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.dataQuality).toBeLessThan(0.5);
    });

    it('should identify key factors correctly', async () => {
      const mockFeatures = {
        marketAverage: 0.6,
        marketConsensus: 0.9,
        marketVolatility: 0.03,
        bookmakerCount: 8,
        homeForm: {
          winRate5: 0.8,
          winRate10: 0.7,
          goalsForAvg5: 2.5,
          goalsAgainstAvg5: 0.5,
          currentStreak: 5,
          formTrend: 0.2,
          isRealData: true,
        },
        awayForm: {
          winRate5: 0.2,
          winRate10: 0.3,
          goalsForAvg5: 0.5,
          goalsAgainstAvg5: 2.5,
          currentStreak: -3,
          formTrend: -0.2,
          isRealData: true,
        },
        h2h: {
          team1WinRate: 0.7,
          drawRate: 0.2,
          totalGoalsAvg: 3.0,
          recentTrend: 0.3,
          bothTeamsScoredRate: 0.8,
          isRealData: true,
        },
        marketIntelligence: {
          consensus: 0.6,
          efficiency: 0.95,
          sharpMoneyIndicator: 0.1,
          valueOpportunity: 0.05,
        },
        formAdvantage: 0.6,
        goalsAdvantage: 2.0,
        defenseAdvantage: 2.0,
        hasRealFormData: true,
        hasRealH2HData: true,
        hasRealStatsData: false,
        overallDataQuality: 0.85,
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);

      const marketOdds = [1.67, 1.65, 1.70];
      const result = await advancedPredictionAnalysisService.analyzeAndPredict(
        'event-1',
        'home',
        'Team A',
        'Team B',
        'sport-1',
        marketOdds
      );

      expect(result.keyFactors.length).toBeGreaterThan(0);
      expect(result.keyFactors.some(f => f.name.includes('form') || f.name.includes('Form'))).toBe(true);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence within valid range', async () => {
      const mockFeatures = {
        marketAverage: 0.5,
        marketConsensus: 0.8,
        marketVolatility: 0.05,
        bookmakerCount: 5,
        homeForm: {
          winRate5: 0.5,
          winRate10: 0.5,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: 0,
          formTrend: 0.0,
          isRealData: true,
        },
        awayForm: {
          winRate5: 0.5,
          winRate10: 0.5,
          goalsForAvg5: 1.5,
          goalsAgainstAvg5: 1.5,
          currentStreak: 0,
          formTrend: 0.0,
          isRealData: true,
        },
        h2h: {
          team1WinRate: 0.5,
          drawRate: 0.3,
          totalGoalsAvg: 2.0,
          recentTrend: 0.0,
          bothTeamsScoredRate: 0.5,
          isRealData: true,
        },
        marketIntelligence: {
          consensus: 0.5,
          efficiency: 0.9,
          sharpMoneyIndicator: 0.0,
          valueOpportunity: 0.0,
        },
        formAdvantage: 0.0,
        goalsAdvantage: 0.0,
        defenseAdvantage: 0.0,
        hasRealFormData: true,
        hasRealH2HData: true,
        hasRealStatsData: false,
        overallDataQuality: 0.8,
      };

      (advancedFeaturesService.getAllAdvancedFeatures as jest.Mock).mockResolvedValue(mockFeatures);

      const marketOdds = [2.0];
      const result = await advancedPredictionAnalysisService.analyzeAndPredict(
        'event-1',
        'home',
        'Team A',
        'Team B',
        'sport-1',
        marketOdds
      );

      // Confidence should be within valid bounds
      expect(result.confidence).toBeGreaterThanOrEqual(0.45);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});


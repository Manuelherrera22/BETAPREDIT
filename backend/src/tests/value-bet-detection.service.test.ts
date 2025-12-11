/**
 * Value Bet Detection Service Tests
 * Tests for value bet detection service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { valueBetDetectionService } from '../services/value-bet-detection.service';
import { prisma } from '../config/database';
import { improvedPredictionService } from '../services/improved-prediction.service';
import { valueBetAlertsService } from '../services/value-bet-alerts.service';
import { userPreferencesService } from '../services/user-preferences.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    sport: {
      findFirst: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/improved-prediction.service', () => ({
  improvedPredictionService: {
    calculatePredictedProbability: jest.fn(),
  },
}));

jest.mock('../services/value-bet-alerts.service', () => ({
  valueBetAlertsService: {
    createAlert: jest.fn(),
  },
}));

jest.mock('../services/user-preferences.service', () => ({
  userPreferencesService: {
    getValueBetPreferences: jest.fn(),
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

describe('ValueBetDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectValueBetsForEventsFromDB', () => {
    it('should detect value bets from database events', async () => {
      const mockSport = {
        id: 'sport-1',
        name: 'Football',
        slug: 'soccer_epl',
      };

      const mockEvent = {
        id: 'event-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        markets: [
          {
            id: 'market-1',
            type: 'MATCH_WINNER',
            odds: [
              { selection: 'home', decimal: 2.5, isActive: true },
            ],
          },
        ],
        Prediction: [
          {
            id: 'pred-1',
            selection: 'home',
            predictedProbability: 0.5,
            confidence: 0.75,
          },
        ],
      };

      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (improvedPredictionService.calculatePredictedProbability as jest.Mock).mockResolvedValue({
        predictedProbability: 0.5,
        confidence: 0.75,
      });

      const result = await valueBetDetectionService.detectValueBetsForEventsFromDB({
        sport: 'soccer_epl',
        minValue: 0.05,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply user preferences when userId is provided', async () => {
      const mockPreferences = {
        minValue: 0.10,
        maxEvents: 10,
        sports: ['soccer_epl'],
      };

      (userPreferencesService.getValueBetPreferences as jest.Mock).mockResolvedValue(mockPreferences);
      (prisma.sport.findFirst as jest.Mock).mockResolvedValue({ id: 'sport-1', slug: 'soccer_epl' });
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await valueBetDetectionService.detectValueBetsForEventsFromDB({
        userId: 'user-1',
        sport: 'soccer_epl',
      });

      expect(userPreferencesService.getValueBetPreferences).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array when sport not found', async () => {
      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await valueBetDetectionService.detectValueBetsForEventsFromDB({
        sport: 'non-existent',
      });

      expect(result).toEqual([]);
    });

    it('should create alerts when autoCreateAlerts is true', async () => {
      const mockSport = { id: 'sport-1', slug: 'soccer_epl' };
      const mockEvent = {
        id: 'event-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        markets: [
          {
            id: 'market-1',
            type: 'MATCH_WINNER',
            odds: [
              { selection: 'home', decimal: 2.5, isActive: true },
            ],
          },
        ],
        Prediction: [
          {
            id: 'pred-1',
            selection: 'home',
            predictedProbability: 0.5,
            confidence: 0.75,
          },
        ],
      };

      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (improvedPredictionService.calculatePredictedProbability as jest.Mock).mockResolvedValue({
        predictedProbability: 0.5,
        confidence: 0.75,
      });
      (valueBetAlertsService.createAlert as jest.Mock).mockResolvedValue({
        id: 'alert-1',
      });

      await valueBetDetectionService.detectValueBetsForEventsFromDB({
        autoCreateAlerts: true,
        minValue: 0.05,
      });

      // Should attempt to create alerts if value bets are detected
      expect(valueBetAlertsService.createAlert).toHaveBeenCalled();
    });
  });
});


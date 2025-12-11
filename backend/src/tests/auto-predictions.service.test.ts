/**
 * Auto Predictions Service Tests
 * Tests for automatic prediction generation service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { autoPredictionsService } from '../services/auto-predictions.service';
import { prisma } from '../config/database';
import { getTheOddsAPIService } from '../services/integrations/the-odds-api.service';
import { improvedPredictionService } from '../services/improved-prediction.service';
import { normalizedPredictionService } from '../services/normalized-prediction.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    sport: {
      findMany: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    market: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    prediction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(),
}));

jest.mock('../services/improved-prediction.service', () => ({
  improvedPredictionService: {
    calculatePrediction: jest.fn(),
  },
}));

jest.mock('../services/normalized-prediction.service', () => ({
  normalizedPredictionService: {
    calculateNormalizedProbabilities: jest.fn(),
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

describe('AutoPredictionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePredictionsForUpcomingEvents', () => {
    it('should return zero results when no active sports found', async () => {
      (prisma.sport.findMany as jest.Mock).mockResolvedValue([]);

      const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();

      expect(result).toEqual({
        generated: 0,
        updated: 0,
        errors: 0,
      });
      expect(prisma.sport.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 10,
      });
    });

    it('should generate predictions for active sports', async () => {
      const mockSports = [
        { id: 'sport-1', slug: 'soccer_epl', name: 'Premier League', isActive: true },
        { id: 'sport-2', slug: 'basketball_nba', name: 'NBA', isActive: true },
      ];

      const mockEvents = [
        {
          id: 'event-1',
          sportId: 'sport-1',
          name: 'Team A vs Team B',
          startTime: new Date(Date.now() + 3600000), // 1 hour from now
          status: 'SCHEDULED',
          homeTeam: 'Team A',
          awayTeam: 'Team B',
        },
      ];

      const mockMarkets = [
        {
          id: 'market-1',
          eventId: 'event-1',
          type: 'MATCH_WINNER',
          name: 'Match Winner',
          isActive: true,
        },
      ];

      (prisma.sport.findMany as jest.Mock).mockResolvedValue(mockSports);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.market.findMany as jest.Mock).mockResolvedValue(mockMarkets);
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(null);
      (normalizedPredictionService.calculateNormalizedProbabilities as jest.Mock).mockResolvedValue({
        home: { probability: 0.45, confidence: 0.75 },
        away: { probability: 0.35, confidence: 0.70 },
        draw: { probability: 0.20, confidence: 0.65 },
      });
      (prisma.prediction.create as jest.Mock).mockResolvedValue({
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'Team A',
        predictedProbability: 0.45,
        confidence: 0.75,
      });

      const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();

      expect(result.generated).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
    });

    it('should handle errors gracefully when generating predictions', async () => {
      const mockSports = [
        { id: 'sport-1', slug: 'soccer_epl', name: 'Premier League', isActive: true },
      ];

      (prisma.sport.findMany as jest.Mock).mockResolvedValue(mockSports);
      (prisma.event.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await autoPredictionsService.generatePredictionsForUpcomingEvents();

      expect(result.errors).toBeGreaterThan(0);
    });
  });

  describe('generatePredictionsForSyncedEvents', () => {
    it('should generate predictions for synced event IDs', async () => {
      const eventIds = ['event-1', 'event-2'];
      const mockEvents = [
        {
          id: 'event-1',
          sportId: 'sport-1',
          name: 'Team A vs Team B',
          startTime: new Date(),
          status: 'SCHEDULED',
        },
        {
          id: 'event-2',
          sportId: 'sport-1',
          name: 'Team C vs Team D',
          startTime: new Date(),
          status: 'SCHEDULED',
        },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.market.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await autoPredictionsService.generatePredictionsForSyncedEvents(eventIds);

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: eventIds },
          status: 'SCHEDULED',
        },
        include: {
          sport: true,
          markets: true,
        },
      });
      expect(result).toHaveProperty('generated');
      expect(result).toHaveProperty('errors');
    });

    it('should return zero results when no events found', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      const result = await autoPredictionsService.generatePredictionsForSyncedEvents(['event-1']);

      expect(result.generated).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  describe('updatePredictionsForChangedOdds', () => {
    it('should update predictions when odds change', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          marketId: 'market-1',
          selection: 'Team A',
          predictedProbability: 0.45,
          confidence: 0.75,
          event: {
            id: 'event-1',
            status: 'SCHEDULED',
            startTime: new Date(Date.now() + 3600000),
          },
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);
      (normalizedPredictionService.calculateNormalizedProbabilities as jest.Mock).mockResolvedValue({
        home: { probability: 0.50, confidence: 0.80 },
      });
      (prisma.prediction.update as jest.Mock).mockResolvedValue({
        ...mockPredictions[0],
        predictedProbability: 0.50,
        confidence: 0.80,
      });

      const result = await autoPredictionsService.updatePredictionsForChangedOdds();

      expect(result.updated).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBe(0);
    });

    it('should handle errors when updating predictions', async () => {
      (prisma.prediction.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await autoPredictionsService.updatePredictionsForChangedOdds();

      expect(result.errors).toBeGreaterThan(0);
    });
  });

  describe('generatePredictionsForSportFromDB', () => {
    it('should generate predictions for a specific sport from database', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          sportId: 'sport-1',
          name: 'Team A vs Team B',
          startTime: new Date(Date.now() + 3600000),
          status: 'SCHEDULED',
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          sport: {
            id: 'sport-1',
            slug: 'soccer_epl',
            name: 'Premier League',
          },
        },
      ];

      const mockMarkets = [
        {
          id: 'market-1',
          eventId: 'event-1',
          type: 'MATCH_WINNER',
          name: 'Match Winner',
          isActive: true,
        },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.market.findMany as jest.Mock).mockResolvedValue(mockMarkets);
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(null);
      (normalizedPredictionService.calculateNormalizedProbabilities as jest.Mock).mockResolvedValue({
        home: { probability: 0.45, confidence: 0.75 },
        away: { probability: 0.35, confidence: 0.70 },
        draw: { probability: 0.20, confidence: 0.65 },
      });
      (prisma.prediction.create as jest.Mock).mockResolvedValue({
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'Team A',
        predictedProbability: 0.45,
        confidence: 0.75,
      });

      const result = await autoPredictionsService.generatePredictionsForSportFromDB('soccer_epl');

      expect(result).toHaveProperty('generated');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('errors');
    });

    it('should return zero results when no events found for sport', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      const result = await autoPredictionsService.generatePredictionsForSportFromDB('soccer_epl');

      expect(result.generated).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});


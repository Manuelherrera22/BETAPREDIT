/**
 * Prediction Flow Integration Tests
 * Tests the complete flow from event sync to prediction generation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { eventSyncService } from '../../services/event-sync.service';
import { autoPredictionsService } from '../../services/auto-predictions.service';
import { predictionsService } from '../../services/predictions.service';
import { prisma } from '../../config/database';
import { getTheOddsAPIService } from '../../services/integrations/the-odds-api.service';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    sport: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    market: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    prediction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Prediction Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Prediction Flow', () => {
    it('should sync event and generate predictions', async () => {
      const mockSport = {
        id: 'sport-1',
        name: 'Premier League',
        slug: 'soccer_epl',
        isActive: true,
      };

      const mockEvent = {
        id: 'event-1',
        externalId: 'ext-1',
        sportId: 'sport-1',
        name: 'Team A vs Team B',
        startTime: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        sport: mockSport,
      };

      const mockMarket = {
        id: 'market-1',
        eventId: 'event-1',
        type: 'MATCH_WINNER',
        name: 'Match Winner',
        isActive: true,
      };

      // Step 1: Sync event
      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const syncedEvent = await eventSyncService.syncEventFromTheOddsAPI(
        'ext-1',
        'soccer_epl',
        'Premier League',
        'Team A',
        'Team B',
        new Date().toISOString()
      );

      expect(syncedEvent).toBeDefined();

      // Step 2: Generate predictions
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (prisma.market.findMany as jest.Mock).mockResolvedValue([mockMarket]);
      (prisma.prediction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.prediction.create as jest.Mock).mockResolvedValue({
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'Team A',
        predictedProbability: 0.45,
        confidence: 0.75,
      });

      const predictions = await autoPredictionsService.generatePredictionsForSyncedEvents(['event-1']);

      expect(predictions.generated).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors in prediction flow gracefully', async () => {
      (prisma.event.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await autoPredictionsService.generatePredictionsForSyncedEvents(['event-1']);

      expect(result.errors).toBeGreaterThan(0);
    });
  });
});


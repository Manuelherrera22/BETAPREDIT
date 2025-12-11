/**
 * Predictions API Integration Tests
 * Tests for /api/predictions endpoints
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prisma } from '../../config/database';

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-1', email: 'test@test.com', role: 'USER' };
    next();
  },
}));

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    prediction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    market: {
      findUnique: jest.fn(),
    },
  },
}));

// Import app after mocks
import predictionsRoutes from '../../api/routes/predictions.routes';

const app = express();
app.use(express.json());
app.use('/api/predictions', predictionsRoutes);

describe('Predictions API Integration Tests', () => {
  beforeAll(() => {
    // Setup
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/predictions/event/:eventId', () => {
    it('should return predictions for an event with data quality metadata', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          marketId: 'market-1',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
          factors: {
            marketAverage: { home: 0.6 },
            advancedFeatures: {
              homeForm: { winRate5: 0.6, isRealData: true },
              awayForm: { winRate5: 0.4, isRealData: true },
            },
          },
          market: { id: 'market-1', type: 'match_winner' },
          event: {
            id: 'event-1',
            name: 'Test Event',
            sport: { id: 'sport-1', name: 'Soccer' },
          },
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);

      const response = await request(app)
        .get('/api/predictions/event/event-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('dataQuality');
      expect(response.body.data[0].dataQuality).toHaveProperty('isValid');
      expect(response.body.data[0].dataQuality).toHaveProperty('completeness');
      expect(response.body.data[0].dataQuality).toHaveProperty('canDisplay');
    });

    it('should handle missing factors gracefully', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          predictedProbability: 0.65,
          confidence: 0.75,
          factors: null,
          market: { id: 'market-1' },
          event: { id: 'event-1', sport: { id: 'sport-1' } },
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);

      const response = await request(app)
        .get('/api/predictions/event/event-1')
        .expect(200);

      expect(response.body.data[0].factors).toEqual({});
      expect(response.body.data[0].dataQuality.canDisplay).toBe(false);
    });
  });

  describe('POST /api/predictions/:predictionId/feedback', () => {
    it('should validate feedback input with Zod', async () => {
      const response = await request(app)
        .post('/api/predictions/pred-1/feedback')
        .send({
          wasCorrect: 'invalid', // Should be boolean
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('details');
    });

    it('should accept valid feedback', async () => {
      const mockPrediction = {
        id: 'pred-1',
        factors: {},
      };

      (prisma.prediction.findUnique as jest.Mock).mockResolvedValue(mockPrediction);
      (prisma.prediction.update as jest.Mock).mockResolvedValue({
        ...mockPrediction,
        factors: {
          userFeedback: {
            userId: 'test-user-1',
            wasCorrect: true,
          },
        },
      });

      const response = await request(app)
        .post('/api/predictions/pred-1/feedback')
        .send({
          wasCorrect: true,
          userConfidence: 0.8,
          notes: 'Great prediction!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate confidence range', async () => {
      const response = await request(app)
        .post('/api/predictions/pred-1/feedback')
        .send({
          wasCorrect: true,
          userConfidence: 1.5, // Invalid: > 1
        })
        .expect(400);

      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('GET /api/predictions/:predictionId/factors', () => {
    it('should return prediction with factors and data quality', async () => {
      const mockPrediction = {
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        predictedProbability: 0.65,
        confidence: 0.75,
        factors: {
          marketAverage: { home: 0.6 },
          advancedFeatures: {
            homeForm: { winRate5: 0.6, isRealData: true },
          },
        },
        event: {
          id: 'event-1',
          name: 'Test Event',
          sport: { id: 'sport-1', name: 'Soccer' },
        },
        market: { id: 'market-1', type: 'match_winner' },
      };

      (prisma.prediction.findUnique as jest.Mock).mockResolvedValue(mockPrediction);

      const response = await request(app)
        .get('/api/predictions/pred-1/factors')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('factorExplanation');
      expect(response.body.data).toHaveProperty('dataQuality');
    });
  });

  describe('GET /api/predictions/history', () => {
    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/predictions/history')
        .query({
          limit: 'invalid', // Should be number
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept valid query parameters', async () => {
      (prisma.prediction.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/predictions/history')
        .query({
          limit: '20',
          offset: '0',
          sportId: 'sport-1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});


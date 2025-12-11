/**
 * API Endpoints Integration Tests
 * Tests for critical API endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { predictionsController } from '../../api/controllers/predictions.controller';
import { eventsController } from '../../api/controllers/events.controller';
import { prisma } from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    prediction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('API Endpoints Integration', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
    } as Partial<Request>;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  describe('GET /api/predictions/event/:eventId', () => {
    it('should return predictions for an event', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          marketId: 'market-1',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
          factors: {},
        },
      ];

      (prisma.prediction.findMany as jest.Mock).mockResolvedValue(mockPredictions);
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        name: 'Team A vs Team B',
      });

      mockReq.params = { eventId: 'event-1' };

      await predictionsController.getEventPredictions(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });

    it('should return 404 if event not found', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      mockReq.params = { eventId: 'non-existent' };

      await predictionsController.getEventPredictions(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('GET /api/events/live', () => {
    it('should return live events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Team A vs Team B',
          status: 'LIVE',
          homeScore: 2,
          awayScore: 1,
        },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

      await eventsController.getLiveEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });
  });
});


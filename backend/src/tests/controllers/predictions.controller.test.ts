/**
 * Predictions Controller Tests
 * Tests for predictions API controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { predictionsController } from '../../api/controllers/predictions.controller';
import { predictionsService } from '../../services/predictions.service';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/predictions.service', () => ({
  predictionsService: {
    getEventPredictions: jest.fn(),
    getPredictionWithFactors: jest.fn(),
    getAccuracyStats: jest.fn(),
    getPredictionStats: jest.fn(),
    getPredictionHistory: jest.fn(),
    submitFeedback: jest.fn(),
    generatePredictions: jest.fn(),
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

describe('PredictionsController', () => {
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

  describe('getEventPredictions', () => {
    it('should return predictions for an event', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
        },
      ];

      (predictionsService.getEventPredictions as jest.Mock).mockResolvedValue(mockPredictions);
      mockReq.params = { eventId: 'event-1' };

      await predictionsController.getEventPredictions(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(predictionsService.getEventPredictions).toHaveBeenCalledWith('event-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPredictions,
        })
      );
    });

    it('should handle service errors', async () => {
      (predictionsService.getEventPredictions as jest.Mock).mockRejectedValue(
        new AppError('Event not found', 404)
      );
      mockReq.params = { eventId: 'non-existent' };

      await predictionsController.getEventPredictions(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getPredictionFactors', () => {
    it('should return prediction with factors', async () => {
      const mockPrediction = {
        id: 'pred-1',
        factors: {
          marketAverage: { home: 0.45 },
          advancedFeatures: {},
        },
        factorExplanation: {
          keyFactors: [],
          confidenceFactors: [],
          riskFactors: [],
        },
      };

      (predictionsService.getPredictionWithFactors as jest.Mock).mockResolvedValue(mockPrediction);
      mockReq.params = { predictionId: 'pred-1' };

      await predictionsController.getPredictionFactors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(predictionsService.getPredictionWithFactors).toHaveBeenCalledWith('pred-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPrediction,
        })
      );
    });
  });

  describe('getAccuracyStats', () => {
    it('should return accuracy statistics', async () => {
      const mockStats = {
        total: 100,
        correct: 65,
        accuracy: 0.65,
      };

      (predictionsService.getAccuracyStats as jest.Mock).mockResolvedValue(mockStats);
      mockReq.query = {};

      await predictionsController.getAccuracyStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats,
        })
      );
    });

    it('should apply filters from query parameters', async () => {
      const mockStats = { total: 50, correct: 35, accuracy: 0.70 };
      (predictionsService.getAccuracyStats as jest.Mock).mockResolvedValue(mockStats);
      mockReq.query = { modelVersion: 'v2.0', sportId: 'sport-1' };

      await predictionsController.getAccuracyStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(predictionsService.getAccuracyStats).toHaveBeenCalledWith(
        expect.objectContaining({
          modelVersion: 'v2.0',
          sportId: 'sport-1',
        })
      );
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockFeedback = {
        wasCorrect: true,
        userConfidence: 0.8,
        notes: 'Good prediction',
      };

      (predictionsService.submitFeedback as jest.Mock).mockResolvedValue({
        id: 'feedback-1',
      });
      mockReq.params = { predictionId: 'pred-1' };
      mockReq.body = mockFeedback;

      await predictionsController.submitFeedback(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(predictionsService.submitFeedback).toHaveBeenCalledWith(
        'pred-1',
        'user-1',
        mockFeedback
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});


/**
 * Predictions Service Tests
 * Tests for the predictions service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { predictionsService } from '../../services/predictionsService';
import api from '../../services/api';
import * as supabase from '../../config/supabase';

// Mock dependencies
vi.mock('../../services/api');
vi.mock('../../config/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => false),
  supabase: null,
}));
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    token: 'test-token',
  }),
}));

describe('PredictionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEventPredictions', () => {
    it('should fetch event predictions from backend API', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          eventId: 'event-1',
          selection: 'home',
          predictedProbability: 0.65,
          confidence: 0.75,
        },
      ];

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockPredictions,
        },
      });

      const result = await predictionsService.getEventPredictions('event-1');

      expect(api.get).toHaveBeenCalledWith('/predictions/event/event-1');
      expect(result).toEqual(mockPredictions);
    });

    it('should handle API errors gracefully', async () => {
      (api.get as any).mockRejectedValue(new Error('API error'));

      await expect(
        predictionsService.getEventPredictions('event-1')
      ).rejects.toThrow();
    });
  });

  describe('getPredictionFactors', () => {
    it('should fetch prediction factors', async () => {
      const mockFactors = {
        id: 'pred-1',
        factors: {
          marketAverage: { home: 0.45, away: 0.35 },
          advancedFeatures: {},
        },
        factorExplanation: {
          keyFactors: [],
          confidenceFactors: [],
          riskFactors: [],
        },
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockFactors,
        },
      });

      const result = await predictionsService.getPredictionFactors('pred-1');

      expect(api.get).toHaveBeenCalledWith('/predictions/pred-1/factors');
      expect(result).toEqual(mockFactors);
    });
  });

  describe('getAccuracyStats', () => {
    it('should fetch accuracy statistics', async () => {
      const mockStats = {
        total: 100,
        correct: 65,
        accuracy: 0.65,
        avgAccuracy: 0.68,
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockStats,
        },
      });

      const result = await predictionsService.getAccuracyStats();

      expect(api.get).toHaveBeenCalledWith('/predictions/accuracy');
      expect(result).toEqual(mockStats);
    });

    it('should fetch accuracy stats with filters', async () => {
      const filters = {
        modelVersion: 'v2.0',
        sportId: 'sport-1',
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: { total: 50, correct: 35, accuracy: 0.70 },
        },
      });

      await predictionsService.getAccuracyStats(filters);

      expect(api.get).toHaveBeenCalledWith(
        '/predictions/accuracy',
        expect.objectContaining({
          params: filters,
        })
      );
    });
  });

  describe('submitFeedback', () => {
    it('should submit prediction feedback', async () => {
      const feedback = {
        wasCorrect: true,
        userConfidence: 0.8,
        notes: 'Good prediction',
      };

      (api.post as any).mockResolvedValue({
        data: {
          success: true,
          data: { id: 'feedback-1' },
        },
      });

      const result = await predictionsService.submitFeedback('pred-1', feedback);

      expect(api.post).toHaveBeenCalledWith(
        '/predictions/pred-1/feedback',
        feedback
      );
      expect(result).toBeDefined();
    });
  });

  describe('getPredictionHistory', () => {
    it('should fetch prediction history', async () => {
      const mockHistory = [
        {
          id: 'pred-1',
          eventName: 'Team A vs Team B',
          wasCorrect: true,
          accuracy: 0.85,
        },
      ];

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockHistory,
        },
      });

      const result = await predictionsService.getPredictionHistory();

      expect(api.get).toHaveBeenCalledWith('/predictions/history');
      expect(result).toEqual(mockHistory);
    });

    it('should fetch history with filters', async () => {
      const filters = {
        limit: 10,
        sportId: 'sport-1',
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      await predictionsService.getPredictionHistory(filters);

      expect(api.get).toHaveBeenCalledWith(
        '/predictions/history',
        expect.objectContaining({
          params: filters,
        })
      );
    });
  });
});

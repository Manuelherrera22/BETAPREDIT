/**
 * Predictions Service
 * Frontend service for prediction accuracy tracking
 */

import api from './api';

export interface PredictionAccuracyStats {
  total: number;
  correct: number;
  accuracy: number;
  avgAccuracy: number;
  brierScore: number;
  calibrationScore: number;
  calibrationBins: Array<{
    bin: number;
    avgPredicted: number;
    avgActual: number;
    count: number;
    difference: number;
  }>;
  bySport: Array<{
    sport: string;
    total: number;
    correct: number;
    accuracy: number;
    avgAccuracy: number;
  }>;
  byMarket: Array<{
    market: string;
    total: number;
    correct: number;
    accuracy: number;
    avgAccuracy: number;
  }>;
  byConfidence: Array<{
    confidence: number;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  recentPredictions: Array<{
    id: string;
    eventName: string;
    selection: string;
    predictedProbability: number;
    confidence: number;
    wasCorrect: boolean | null;
    accuracy: number | null;
    createdAt: string;
    eventFinishedAt: string | null;
  }>;
}

export interface PredictionStats {
  total: number;
  correct: number;
  accuracy: number;
  avgAccuracy: number;
  bySport: Array<{
    sport: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  byMarket: Array<{
    market: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export const predictionsService = {
  /**
   * Get prediction accuracy tracking with detailed metrics
   */
  getAccuracyTracking: async (filters?: {
    modelVersion?: string;
    sportId?: string;
    marketType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PredictionAccuracyStats> => {
    const { data } = await api.get('/predictions/accuracy', { params: filters });
    return data.data as PredictionAccuracyStats;
  },

  /**
   * Get predictions for an event
   */
  getEventPredictions: async (eventId: string): Promise<any[]> => {
    const { data } = await api.get(`/predictions/event/${eventId}`);
    return data.data || [];
  },

  /**
   * Get basic prediction statistics
   */
  getPredictionStats: async (modelVersion?: string): Promise<PredictionStats> => {
    const { data } = await api.get('/predictions/stats', {
      params: modelVersion ? { modelVersion } : {},
    });
    return data.data as PredictionStats;
  },

  /**
   * Submit user feedback on a prediction
   */
  submitFeedback: async (
    predictionId: string,
    feedback: {
      wasCorrect: boolean;
      userConfidence?: number;
      notes?: string;
    }
  ): Promise<any> => {
    const { data } = await api.post(`/predictions/${predictionId}/feedback`, feedback);
    return data.data;
  },

  /**
   * Get prediction with detailed factors explanation
   */
  getPredictionFactors: async (predictionId: string): Promise<any> => {
    const { data } = await api.get(`/predictions/${predictionId}/factors`);
    return data.data;
  },
};


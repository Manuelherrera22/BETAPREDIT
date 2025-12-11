/**
 * Predictions Validators
 * Zod schemas for predictions endpoints
 */

import { z } from 'zod';

export const getEventPredictionsSchema = z.object({
  params: z.object({
    eventId: z.string().uuid('Event ID must be a valid UUID'),
  }),
});

export const getPredictionFactorsSchema = z.object({
  params: z.object({
    predictionId: z.string().uuid('Prediction ID must be a valid UUID'),
  }),
});

export const submitFeedbackSchema = z.object({
  params: z.object({
    predictionId: z.string().uuid('Prediction ID must be a valid UUID'),
  }),
  body: z.object({
    wasCorrect: z.boolean(),
    userConfidence: z.number().min(0).max(1).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const regeneratePredictionsSchema = z.object({
  query: z.object({
    eventId: z.string().uuid('Event ID must be a valid UUID').optional(),
  }),
});

export const getPredictionsQuerySchema = z.object({
  query: z.object({
    modelVersion: z.string().optional(),
    sportId: z.string().optional(),
    marketType: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});


/**
 * Prediction Validators
 * Validation schemas for prediction endpoints
 */

import { z } from 'zod';

// Schema for creating a prediction
export const createPredictionSchema = z.object({
  eventId: z.string().uuid('Event ID inválido'),
  marketId: z.string().uuid('Market ID inválido'),
  selection: z.string().min(1, 'La selección es requerida'),
  predictedProbability: z.number()
    .min(0, 'La probabilidad debe ser al menos 0')
    .max(1, 'La probabilidad no puede exceder 1'),
  confidence: z.number()
    .min(0.45, 'La confianza debe ser al menos 0.45')
    .max(0.95, 'La confianza no puede exceder 0.95'),
  modelVersion: z.string().min(1, 'La versión del modelo es requerida'),
  factors: z.record(z.any()).optional(),
});

// Schema for submitting feedback on a prediction
export const submitFeedbackSchema = z.object({
  wasCorrect: z.boolean(),
  userConfidence: z.number()
    .min(0, 'La confianza del usuario debe ser al menos 0')
    .max(1, 'La confianza del usuario no puede exceder 1')
    .optional(),
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
});

// Schema for query parameters when getting predictions
export const getPredictionsQuerySchema = z.object({
  eventId: z.string().uuid('Event ID inválido').optional(),
  marketId: z.string().uuid('Market ID inválido').optional(),
  sportId: z.string().optional(),
  sportSlug: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(100)
  ).optional().default('10'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(0)
  ).optional().default('0'),
  minConfidence: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).pipe(
    z.number().min(0).max(1)
  ).optional(),
  maxConfidence: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).pipe(
    z.number().min(0).max(1)
  ).optional(),
});

// Schema for regenerating predictions
export const regeneratePredictionsSchema = z.object({
  eventIds: z.array(z.string().uuid('Event ID inválido')).optional(),
  sportId: z.string().optional(),
  sportSlug: z.string().optional(),
  force: z.boolean().optional().default(false),
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type GetPredictionsQuery = z.infer<typeof getPredictionsQuerySchema>;
export type RegeneratePredictionsInput = z.infer<typeof regeneratePredictionsSchema>;


/**
 * Validation Middleware
 * Validates request data using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        params: req.params,
        query: req.query,
        body: req.body,
      });

      // Replace request data with validated data
      req.params = result.params || req.params;
      req.query = result.query || req.query;
      req.body = result.body || req.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new AppError('Validation error', 400, { validationErrors: errors });
      }
      next(error);
    }
  };
}


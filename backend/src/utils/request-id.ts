/**
 * Request ID Middleware
 * Adds unique request ID to each request for tracking and debugging
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  id?: string;
}

/**
 * Middleware to add request ID to each request
 */
export const requestIdMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
) => {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  
  // Attach to request object
  req.id = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
};


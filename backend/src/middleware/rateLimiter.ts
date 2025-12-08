import { Request, Response, NextFunction } from 'express';
import { redisHelpers } from '../config/redis';
import { AppError } from './errorHandler';

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}`;
    
    // 100 requests per minute per IP
    const allowed = await redisHelpers.checkRateLimit(key, 100, 60);
    
    if (!allowed) {
      throw new AppError('Too many requests', 429);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};


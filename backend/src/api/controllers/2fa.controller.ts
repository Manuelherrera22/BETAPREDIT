/**
 * 2FA Controller
 * Handles 2FA-related API requests
 */

import { Response, NextFunction } from 'express';
import { twoFactorService } from '../../services/2fa.service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

class TwoFactorController {
  /**
   * Generate 2FA secret and QR code
   * GET /api/2fa/generate
   */
  async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await twoFactorService.generateSecret(userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token and enable 2FA
   * POST /api/2fa/verify
   */
  async verify(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { token, secret } = req.body;
      if (!token || !secret) {
        throw new AppError('Token and secret are required', 400);
      }

      const result = await twoFactorService.verifyAndEnable(userId, token, secret);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA
   * POST /api/2fa/disable
   */
  async disable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await twoFactorService.disable(userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const twoFactorController = new TwoFactorController();




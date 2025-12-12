/**
 * Referrals Controller
 * Handles referral-related API requests
 */

import { Request, Response, NextFunction } from 'express';
import { referralService } from '../../services/referrals/referral.service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

class ReferralsController {
  /**
   * Get user's referral code and stats
   * GET /api/referrals/me
   */
  async getMyReferrals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const stats = await referralService.getReferralStats(userId);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral leaderboard
   * GET /api/referrals/leaderboard
   */
  async getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await referralService.getLeaderboard(limit);
      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process referral (called during registration)
   * POST /api/referrals/process
   */
  async processReferral(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { referralCode } = req.body;
      if (!referralCode) {
        throw new AppError('Referral code is required', 400);
      }

      await referralService.processReferral(userId, referralCode);
      res.json({
        success: true,
        message: 'Referral processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const referralsController = new ReferralsController();





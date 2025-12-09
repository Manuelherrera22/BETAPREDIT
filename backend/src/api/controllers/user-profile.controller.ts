/**
 * User Profile Controller
 * Handles user profile updates
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

class UserProfileController {
  /**
   * Get current user profile
   * GET /api/user/profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          avatar: true,
          timezone: true,
          preferredCurrency: true,
          preferredMode: true,
          subscriptionTier: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
      }
      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        timezone,
        preferredCurrency,
        preferredMode, // "casual" | "pro"
      } = req.body;

      // Validate preferredMode
      if (preferredMode && !['casual', 'pro'].includes(preferredMode)) {
        return res.status(400).json({
          success: false,
          error: { message: 'preferredMode must be "casual" or "pro"' },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
          ...(timezone !== undefined && { timezone }),
          ...(preferredCurrency !== undefined && { preferredCurrency }),
          ...(preferredMode !== undefined && { preferredMode }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          avatar: true,
          timezone: true,
          preferredCurrency: true,
          preferredMode: true,
          subscriptionTier: true,
        },
      });

      logger.info(`User ${userId} updated profile`);

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      next(error);
    }
  }
}

export const userProfileController = new UserProfileController();


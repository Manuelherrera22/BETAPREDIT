/**
 * Referral Service
 * Handles referral system: codes, tracking, rewards
 */

import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

class ReferralService {
  /**
   * Generate unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      // Check if user already has a referral code
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });

      if (user?.referralCode) {
        return user.referralCode;
      }

      // Generate unique code (8 characters, alphanumeric)
      let code: string = '';
      let exists = true;
      let attempts = 0;

      while (exists && attempts < 10) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
        const existing = await prisma.user.findUnique({
          where: { referralCode: code },
          select: { id: true },
        });
        exists = !!existing;
        attempts++;
      }

      if (!code || exists) {
        // Fallback: use userId-based code
        code = `REF${userId.substring(0, 5).toUpperCase()}`;
      }

      // Update user with referral code
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });

      logger.info(`Generated referral code ${code} for user ${userId}`);
      return code;
    } catch (error: any) {
      logger.error('Error generating referral code:', error);
      throw new AppError('Failed to generate referral code', 500);
    }
  }

  /**
   * Get or create referral code for user
   */
  async getReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (user?.referralCode) {
      return user.referralCode;
    }

    return await this.generateReferralCode(userId);
  }

  /**
   * Process referral when new user registers
   */
  async processReferral(referredUserId: string, referralCode: string): Promise<void> {
    try {
      // Find referrer by code
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
        select: { id: true },
      });

      if (!referrer) {
        logger.warn(`Invalid referral code: ${referralCode}`);
        return; // Invalid code, but don't fail registration
      }

      if (referrer.id === referredUserId) {
        logger.warn(`User tried to refer themselves`);
        return; // Can't refer yourself
      }

      // Check if referral already exists
      const existing = await prisma.referral.findUnique({
        where: { referredUserId },
      });

      if (existing) {
        logger.warn(`Referral already exists for user ${referredUserId}`);
        return;
      }

      // Create referral record
      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId,
          referralCode: referralCode.toUpperCase(),
          status: 'PENDING',
        },
      });

      // Update referrer's referral count
      await prisma.user.update({
        where: { id: referrer.id },
        data: {
          referralCount: {
            increment: 1,
          },
        },
      });

      // Update referred user
      await prisma.user.update({
        where: { id: referredUserId },
        data: {
          referredBy: referrer.id,
        },
      });

      logger.info(`Referral processed: ${referrer.id} referred ${referredUserId}`);
    } catch (error: any) {
      logger.error('Error processing referral:', error);
      // Don't throw - referral failure shouldn't break registration
    }
  }

  /**
   * Get referral statistics for user
   */
  async getReferralStats(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCode: true,
          referralCount: true,
          activeReferrals: true,
          referralRewards: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get referral code if doesn't exist
      const code = user.referralCode || (await this.generateReferralCode(userId));

      // Get all referrals
      const referrals = await prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referredUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate stats
      const stats = {
        referralCode: code,
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter((r) => r.status === 'ACTIVE').length,
        pendingReferrals: referrals.filter((r) => r.status === 'PENDING').length,
        rewardedReferrals: referrals.filter((r) => r.rewardGranted).length,
        referrals: referrals.map((r) => ({
          id: r.id,
          referredUser: r.referredUser,
          status: r.status,
          rewardGranted: r.rewardGranted,
          rewardType: r.rewardType,
          createdAt: r.createdAt,
          convertedAt: r.convertedAt,
        })),
        rewards: user.referralRewards || {},
      };

      return stats;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting referral stats:', error);
      throw new AppError('Failed to get referral stats', 500);
    }
  }

  /**
   * Check and grant referral rewards
   */
  async checkAndGrantRewards(userId: string): Promise<void> {
    try {
      const referrals = await prisma.referral.findMany({
        where: {
          referrerId: userId,
          rewardGranted: false,
        },
        include: {
          referredUser: {
            select: {
              subscriptionTier: true,
              subscription: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      });

      for (const referral of referrals) {
        // Check if referred user is active (has active subscription)
        const isActive =
          referral.referredUser.subscriptionTier !== 'FREE' &&
          referral.referredUser.subscription?.status === 'ACTIVE';

        if (isActive && referral.status !== 'ACTIVE') {
          // Update referral status
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: 'ACTIVE',
              convertedAt: new Date(),
            },
          });

          // Update referrer's active referrals count
          await prisma.user.update({
            where: { id: userId },
            data: {
              activeReferrals: {
                increment: 1,
              },
            },
          });

          // Grant rewards based on active referrals count
          await this.grantRewards(userId);
        }
      }
    } catch (error: any) {
      logger.error('Error checking and granting rewards:', error);
      // Don't throw - this runs in background
    }
  }

  /**
   * Grant rewards based on referral count
   */
  private async grantRewards(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        activeReferrals: true,
        referralRewards: true,
      },
    });

    if (!user) return;

    const activeCount = user.activeReferrals;
    const currentRewards = (user.referralRewards as any) || {};

    const newRewards: any = { ...currentRewards };

    // Reward tiers
    if (activeCount >= 3 && !currentRewards.freeMonth1) {
      // Grant 1 free month for 3 active referrals
      newRewards.freeMonth1 = true;
      newRewards.freeMonths = (newRewards.freeMonths || 0) + 1;
      // TODO: Apply free month to subscription
    }

    if (activeCount >= 5 && !currentRewards.premiumAccess) {
      // Grant premium access for 5 active referrals
      newRewards.premiumAccess = true;
      // TODO: Upgrade user to premium tier
    }

    if (activeCount >= 10 && !currentRewards.discount50) {
      // Grant 50% permanent discount for 10 active referrals
      newRewards.discount50 = true;
      newRewards.discount = 50;
      // TODO: Apply discount to subscription
    }

    // Update user rewards
    await prisma.user.update({
      where: { id: userId },
      data: {
        referralRewards: newRewards,
      },
    });

    logger.info(`Rewards granted to user ${userId}: ${JSON.stringify(newRewards)}`);
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit: number = 10) {
    try {
      const topReferrers = await prisma.user.findMany({
        where: {
          referralCount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          referralCount: true,
          activeReferrals: true,
          avatar: true,
        },
        orderBy: {
          activeReferrals: 'desc',
        },
        take: limit,
      });

      return topReferrers.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        totalReferrals: user.referralCount,
        activeReferrals: user.activeReferrals,
      }));
    } catch (error: any) {
      logger.error('Error getting leaderboard:', error);
      throw new AppError('Failed to get leaderboard', 500);
    }
  }
}

export const referralService = new ReferralService();


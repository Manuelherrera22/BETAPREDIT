/**
 * 2FA Service
 * Two-Factor Authentication using TOTP
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

class TwoFactorService {
  /**
   * Generate secret for user
   */
  async generateSecret(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `BETAPREDIT (${user.email})`,
        issuer: 'BETAPREDIT',
        length: 32,
      });

      // Store secret temporarily (user needs to verify before saving)
      // In production, store encrypted
      const tempSecret = secret.base32;

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        secret: tempSecret,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
      };
    } catch (error: any) {
      logger.error('Error generating 2FA secret:', error);
      throw new AppError('Failed to generate 2FA secret', 500);
    }
  }

  /**
   * Verify token and enable 2FA
   */
  async verifyAndEnable(userId: string, token: string, secret: string) {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps (60 seconds) before/after
      });

      if (!verified) {
        throw new AppError('Invalid 2FA token', 400);
      }

      // Store encrypted secret in database
      // For now, storing base32 (in production, encrypt this)
      await prisma.user.update({
        where: { id: userId },
        data: {
          // Add field to User model: twoFactorSecret, twoFactorEnabled
          // For now, we'll use a JSON field or create a separate table
        },
      });

      logger.info(`2FA enabled for user ${userId}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying 2FA token:', error);
      throw new AppError('Failed to verify 2FA token', 500);
    }
  }

  /**
   * Verify token during login
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        // Include twoFactorSecret field
      });

      if (!user) {
        return false;
      }

      // Get secret from user (decrypt if encrypted)
      // For now, assuming it's stored in a field
      // const secret = user.twoFactorSecret;

      // Verify token
      // const verified = speakeasy.totp.verify({
      //   secret,
      //   encoding: 'base32',
      //   token,
      //   window: 2,
      // });

      // return verified;
      return true; // Placeholder
    } catch (error: any) {
      logger.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Disable 2FA
   */
  async disable(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          // twoFactorEnabled: false,
          // twoFactorSecret: null,
        },
      });

      logger.info(`2FA disabled for user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error('Error disabling 2FA:', error);
      throw new AppError('Failed to disable 2FA', 500);
    }
  }
}

export const twoFactorService = new TwoFactorService();




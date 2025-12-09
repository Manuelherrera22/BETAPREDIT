import { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/auth.service';
import { supabaseAuthService } from '../../services/auth/supabase-auth.service';
import { isSupabaseConfigured, getSupabaseAdmin } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = req.body;

      // Use Supabase Auth if configured
      if (isSupabaseConfigured()) {
        logger.info('Using Supabase Auth for registration');
        const result = await supabaseAuthService.signUp(
          userData.email,
          userData.password,
          {
            firstName: userData.firstName,
            lastName: userData.lastName,
            referralCode: userData.referralCode,
          }
        );
        return res.status(201).json({ success: true, data: result });
      }

      // Fallback to manual auth
      const result = await authService.register(userData);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { message: 'Email and password are required' },
        });
        return;
      }

      // Use Supabase Auth if configured
      if (isSupabaseConfigured()) {
        logger.info('Using Supabase Auth for login');
        const result = await supabaseAuthService.signIn(email, password);
        res.json({ success: true, data: result });
        return;
      }

      // Fallback to manual auth
      const result = await authService.login(email, password);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Sync Supabase user with our database
   * POST /api/auth/supabase/sync
   */
  async syncSupabaseUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          error: { message: 'Supabase Auth not configured' },
        });
      }

      const { supabaseUserId, email, metadata } = req.body;

      if (!supabaseUserId || !email) {
        return res.status(400).json({
          success: false,
          error: { message: 'supabaseUserId and email are required' },
        });
      }

      // Get or create user in our database
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            id: supabaseUserId,
            email,
            firstName: metadata?.first_name || metadata?.full_name?.split(' ')[0] || null,
            lastName: metadata?.last_name || metadata?.full_name?.split(' ').slice(1).join(' ') || null,
            password: '',
            provider: 'google',
            googleId: supabaseUserId,
            avatar: metadata?.avatar_url || null,
            emailVerified: true,
            oauthData: metadata || null,
          },
        });
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: supabaseUserId,
            avatar: metadata?.avatar_url || user.avatar,
            emailVerified: true,
            oauthData: metadata || user.oauthData,
          },
        });
      }

      // Generate tokens
      const tokens = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          user,
          ...tokens,
        },
      });
    } catch (error: any) {
      logger.error('Error syncing Supabase user:', error);
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user?.id;

      if (isSupabaseConfigured() && userId) {
        await supabaseAuthService.signOut(userId);
      } else {
        await authService.logout(refreshToken);
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      await authService.verifyEmail(token);
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

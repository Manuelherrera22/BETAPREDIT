/**
 * OAuth Controller
 * Handles OAuth authentication flows
 */

import { Request, Response, NextFunction } from 'express';
import { googleOAuthService } from '../../services/oauth/google.service';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

class OAuthController {
  /**
   * Initiate Google OAuth flow
   * GET /api/oauth/google
   */
  async initiateGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const authUrl = googleOAuthService.getAuthUrl();
      res.json({
        success: true,
        data: {
          authUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Google OAuth callback
   * GET /api/oauth/google/callback
   */
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error } = req.query;

      if (error) {
        logger.error('Google OAuth error:', error);
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`
        );
      }

      if (!code || typeof code !== 'string') {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_code`
        );
      }

      // Authenticate user
      const result = await googleOAuthService.authenticate(code);

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('token', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('provider', 'google');

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('Error in Google OAuth callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
}

export const oauthController = new OAuthController();


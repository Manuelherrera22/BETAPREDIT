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
      logger.info('Google OAuth URL generated successfully');
      res.json({
        success: true,
        data: {
          authUrl,
        },
      });
    } catch (error: any) {
      logger.error('Error generating Google OAuth URL:', error);
      // Return a more descriptive error
      if (error.statusCode === 503) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Google OAuth no está configurado. Por favor, contacta al administrador.',
            code: 'OAUTH_NOT_CONFIGURED',
          },
        });
      }
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

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (error) {
        logger.error('Google OAuth error:', error);
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }

      if (!code || typeof code !== 'string') {
        logger.warn('Google OAuth callback called without code');
        return res.redirect(`${frontendUrl}/login?error=no_code`);
      }

      // Authenticate user
      const result = await googleOAuthService.authenticate(code);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('token', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('provider', 'google');

      logger.info('Google OAuth successful, redirecting to frontend');
      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('Error in Google OAuth callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
}

export const oauthController = new OAuthController();


/**
 * OAuth Controller
 * Handles OAuth authentication flows
 * Now uses Supabase Auth when available, falls back to manual OAuth
 */

import { Request, Response, NextFunction } from 'express';
import { googleOAuthService } from '../../services/oauth/google.service';
import { supabaseAuthService } from '../../services/auth/supabase-auth.service';
import { isSupabaseConfigured } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

class OAuthController {
  /**
   * Initiate Google OAuth flow
   * GET /api/oauth/google
   * Uses Supabase Auth if configured, otherwise falls back to manual OAuth
   */
  async initiateGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Google OAuth initiation requested');

      // Use Supabase Auth if configured
      if (isSupabaseConfigured()) {
        logger.info('Using Supabase Auth for OAuth');
        const authUrl = await supabaseAuthService.getGoogleAuthUrl();
        logger.info('Supabase OAuth URL generated successfully');
        return res.json({
          success: true,
          data: {
            authUrl,
            provider: 'supabase',
          },
        });
      }

      // Fallback to manual OAuth
      logger.info('Using manual Google OAuth (Supabase not configured)');
      const authUrl = googleOAuthService.getAuthUrl();
      logger.info('Google OAuth URL generated successfully', { 
        urlLength: authUrl.length,
        hasClient: !!googleOAuthService['client']
      });
      res.json({
        success: true,
        data: {
          authUrl,
          provider: 'manual',
        },
      });
    } catch (error: any) {
      logger.error('Error generating Google OAuth URL:', {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
      });
      
      // Return a more descriptive error
      if (error.statusCode === 503 || error.message?.includes('not configured')) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'OAuth no está configurado. Configura Supabase Auth o las variables de entorno de Google OAuth.',
            code: 'OAUTH_NOT_CONFIGURED',
          },
        });
      }
      
      // Return error response instead of using next()
      return res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Error al generar URL de OAuth',
          code: 'OAUTH_ERROR',
        },
      });
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


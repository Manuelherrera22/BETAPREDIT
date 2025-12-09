/**
 * Supabase Auth Service
 * Handles authentication using Supabase Auth
 */

import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured } from '../../config/supabase';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { authService } from '../auth.service';

class SupabaseAuthService {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    referralCode?: string;
  }) {
    if (!isSupabaseConfigured()) {
      throw new AppError('Supabase Auth not configured', 503);
    }

    const supabase = getSupabaseClient();

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName,
            last_name: userData?.lastName,
          },
        },
      });

      if (authError) {
        logger.error('Supabase signup error:', authError);
        throw new AppError(authError.message, 400);
      }

      if (!authData.user) {
        throw new AppError('Failed to create user', 500);
      }

      // Create user in our database
      let user;
      try {
        user = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            firstName: userData?.firstName || null,
            lastName: userData?.lastName || null,
            password: '', // No password stored locally when using Supabase Auth
            provider: 'supabase',
            emailVerified: authData.user.email_confirmed_at ? true : false,
            // Handle referral code if provided
            ...(userData?.referralCode && {
              referredBy: userData.referralCode,
            }),
          },
        });
      } catch (dbError: any) {
        // If user already exists in our DB, try to update
        if (dbError.code === 'P2002') {
          user = await prisma.user.findUnique({
            where: { email: authData.user.email! },
          });
        } else {
          throw dbError;
        }
      }

      // Generate tokens using our auth service
      const tokens = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        ...tokens,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in Supabase signup:', error);
      throw new AppError('Failed to sign up', 500);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new AppError('Supabase Auth not configured', 503);
    }

    const supabase = getSupabaseClient();

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        logger.error('Supabase signin error:', authError);
        throw new AppError(authError.message, 401);
      }

      if (!authData.user) {
        throw new AppError('Failed to sign in', 500);
      }

      // Get or create user in our database
      let user = await prisma.user.findUnique({
        where: { email: authData.user.email! },
      });

      if (!user) {
        // Create user if doesn't exist (shouldn't happen, but handle it)
        user = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            firstName: authData.user.user_metadata?.first_name || null,
            lastName: authData.user.user_metadata?.last_name || null,
            password: '',
            provider: 'supabase',
            emailVerified: authData.user.email_confirmed_at ? true : false,
          },
        });
      } else {
        // Update user metadata if needed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: authData.user.email_confirmed_at ? true : false,
          },
        });
      }

      // Generate tokens using our auth service
      const tokens = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        ...tokens,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in Supabase signin:', error);
      throw new AppError('Failed to sign in', 500);
    }
  }

  /**
   * Get Google OAuth URL using Supabase
   */
  async getGoogleAuthUrl(redirectTo?: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new AppError('Supabase Auth not configured', 503);
    }

    const supabase = getSupabaseClient();
    // Use FRONTEND_URL from env, or detect from environment, or default to localhost
    const frontendUrl = process.env.FRONTEND_URL || 
                        (process.env.NODE_ENV === 'production' ? 'https://betapredit.com' : 'http://localhost:5173');
    const callbackUrl = redirectTo || `${frontendUrl}/auth/callback`;

    // Generate OAuth URL using Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      logger.error('Error generating Supabase OAuth URL:', error);
      throw new AppError('Failed to generate OAuth URL', 500);
    }

    if (!data?.url) {
      throw new AppError('Failed to get Google OAuth URL', 500);
    }

    return data.url;
  }

  /**
   * Handle OAuth callback from Supabase
   */
  async handleOAuthCallback(code: string) {
    if (!isSupabaseConfigured()) {
      throw new AppError('Supabase Auth not configured', 503);
    }

    const supabase = getSupabaseClient();

    try {
      // Exchange code for session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        logger.error('Supabase OAuth callback error:', sessionError);
        throw new AppError(sessionError.message, 400);
      }

      if (!sessionData.user) {
        throw new AppError('Failed to authenticate user', 500);
      }

      // Get or create user in our database
      let user = await prisma.user.findUnique({
        where: { email: sessionData.user.email! },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            id: sessionData.user.id,
            email: sessionData.user.email!,
            firstName: sessionData.user.user_metadata?.first_name || 
                       sessionData.user.user_metadata?.full_name?.split(' ')[0] || null,
            lastName: sessionData.user.user_metadata?.last_name || 
                      sessionData.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
            password: '',
            provider: 'google',
            googleId: sessionData.user.id,
            avatar: sessionData.user.user_metadata?.avatar_url || null,
            emailVerified: sessionData.user.email_confirmed_at ? true : false,
            oauthData: sessionData.user.user_metadata || null,
          },
        });
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: sessionData.user.id,
            avatar: sessionData.user.user_metadata?.avatar_url || user.avatar,
            emailVerified: sessionData.user.email_confirmed_at ? true : user.emailVerified,
            oauthData: sessionData.user.user_metadata || user.oauthData,
          },
        });
      }

      // Generate tokens using our auth service
      const tokens = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        ...tokens,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in Supabase OAuth callback:', error);
      throw new AppError('Failed to process OAuth callback', 500);
    }
  }

  /**
   * Sign out
   */
  async signOut(userId: string) {
    if (!isSupabaseConfigured()) {
      // Fallback to our auth service
      return authService.logout(userId);
    }

    const supabase = getSupabaseAdmin();
    
    try {
      // Sign out from Supabase (admin operation)
      const { error } = await supabase.auth.admin.signOut(userId);
      
      if (error) {
        logger.warn('Supabase signout error:', error);
        // Continue with our logout anyway
      }

      // Also logout from our system
      return authService.logout(userId);
    } catch (error: any) {
      logger.error('Error in Supabase signout:', error);
      // Fallback to our logout
      return authService.logout(userId);
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();


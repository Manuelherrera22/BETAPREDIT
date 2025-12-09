/**
 * Google OAuth Service
 * Handles Google authentication and user management
 */

import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { authService } from '../auth.service';

class GoogleOAuthService {
  private client: OAuth2Client | null = null;

  constructor() {
    this.initialize();
  }

  initialize() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Use environment variable or construct from BACKEND_URL
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/oauth/google/callback` : undefined);

    if (clientId && clientSecret && redirectUri) {
      this.client = new OAuth2Client(clientId, clientSecret, redirectUri);
      logger.info('Google OAuth service initialized', {
        redirectUri,
        clientId: clientId.substring(0, 10) + '...', // Log partial ID for security
      });
    } else {
      logger.warn('Google OAuth not configured. Missing environment variables.');
      logger.warn(`Client ID: ${clientId ? '✓' : '✗'}, Secret: ${clientSecret ? '✓' : '✗'}, Redirect: ${redirectUri ? '✓' : '✗'}`);
      if (!redirectUri) {
        logger.warn('GOOGLE_REDIRECT_URI not set. Set it manually or configure BACKEND_URL.');
      }
    }
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl(): string {
    if (!this.client) {
      throw new AppError('Google OAuth not configured', 503);
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens and get user info
   */
  async getTokenAndUserInfo(code: string): Promise<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    verified: boolean;
  }> {
    if (!this.client) {
      throw new AppError('Google OAuth not configured', 503);
    }

    try {
      // Exchange code for tokens
      const { tokens } = await this.client.getToken(code);
      
      if (!tokens.id_token) {
        throw new AppError('Failed to get ID token from Google', 400);
      }

      // Verify and decode ID token
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError('Invalid ID token from Google', 400);
      }

      // Extract user information
      const googleId = payload.sub;
      const email = payload.email;
      const firstName = payload.given_name || null;
      const lastName = payload.family_name || null;
      const avatar = payload.picture || null;
      const emailVerified = payload.email_verified || false;

      if (!email) {
        throw new AppError('Email not provided by Google', 400);
      }

      return {
        id: googleId,
        email,
        firstName,
        lastName,
        avatar,
        verified: emailVerified,
      };
    } catch (error: any) {
      logger.error('Error getting token and user info from Google:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to authenticate with Google', 500);
    }
  }

  /**
   * Find or create user from Google OAuth
   */
  async findOrCreateUser(googleUserInfo: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    verified: boolean;
  }) {
    try {
      // Try to find user by Google ID
      let user = await prisma.user.findUnique({
        where: { googleId: googleUserInfo.id },
      });

      if (user) {
        // Update user info if needed
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: googleUserInfo.email,
            firstName: googleUserInfo.firstName || user.firstName,
            lastName: googleUserInfo.lastName || user.lastName,
            avatar: googleUserInfo.avatar || user.avatar,
            verified: googleUserInfo.verified || user.verified,
            provider: 'google',
            oauthData: {
              lastLogin: new Date().toISOString(),
            } as any,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            verified: true,
            avatar: true,
            createdAt: true,
          },
        });

        logger.info(`Google user logged in: ${user.email}`);
        return user;
      }

      // Try to find user by email (in case they registered with email first)
      user = await prisma.user.findUnique({
        where: { email: googleUserInfo.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUserInfo.id,
            provider: 'google',
            firstName: googleUserInfo.firstName || user.firstName,
            lastName: googleUserInfo.lastName || user.lastName,
            avatar: googleUserInfo.avatar || user.avatar,
            verified: googleUserInfo.verified || user.verified,
            oauthData: {
              lastLogin: new Date().toISOString(),
            } as any,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            verified: true,
            avatar: true,
            createdAt: true,
          },
        });

        logger.info(`Google account linked to existing user: ${user.email}`);
        return user;
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUserInfo.email,
          googleId: googleUserInfo.id,
          provider: 'google',
          firstName: googleUserInfo.firstName,
          lastName: googleUserInfo.lastName,
          avatar: googleUserInfo.avatar,
          verified: googleUserInfo.verified,
          passwordHash: null, // No password for OAuth users
          preferredMode: 'pro', // Default to pro mode
          oauthData: {
            lastLogin: new Date().toISOString(),
          } as any,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          verified: true,
          avatar: true,
          createdAt: true,
        },
      });

      // Create RG settings for new user
      try {
        await prisma.responsibleGaming.create({
          data: {
            userId: user.id,
          },
        });
      } catch (rgError) {
        logger.warn('Error creating RG settings for Google user:', rgError);
        // Not critical, continue
      }

      logger.info(`New Google user created: ${user.email}`);
      return user;
    } catch (error: any) {
      logger.error('Error finding or creating Google user:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process Google authentication', 500);
    }
  }

  /**
   * Authenticate user with Google and return JWT tokens
   */
  async authenticate(code: string) {
    // Get user info from Google
    const googleUserInfo = await this.getTokenAndUserInfo(code);

    // Find or create user
    const user = await this.findOrCreateUser(googleUserInfo);

    // Generate JWT tokens (reuse auth service method)
    const tokens = authService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role || 'USER',
    });

      // Create session
      try {
        await prisma.session.create({
          data: {
            userId: user.id,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
      } catch (sessionError) {
        logger.warn('Error creating session for Google user:', sessionError);
        // Not critical, continue
      }

    return {
      user,
      ...tokens,
    };
  }
}

export const googleOAuthService = new GoogleOAuthService();

// Export initialize function for re-initialization after env vars are loaded
export function initializeGoogleOAuthService() {
  googleOAuthService.initialize();
}


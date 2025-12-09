/**
 * User Preferences Service
 * Manages user preferences for value bet alerts and filters
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

interface ValueBetPreferences {
  minValue?: number; // Minimum value percentage (default: 5%)
  maxEvents?: number; // Maximum events to check per scan
  sports?: string[]; // Preferred sports (e.g., ['soccer_epl', 'basketball_nba'])
  leagues?: string[]; // Preferred leagues (e.g., ['Premier League', 'NBA'])
  platforms?: string[]; // Preferred bookmaker platforms (e.g., ['Bet365', 'Betfair'])
  autoCreateAlerts?: boolean; // Auto-create alerts when value bets detected
  notificationThreshold?: number; // Only notify if value >= this (default: 10%)
  minConfidence?: number; // Minimum confidence level (0-1, default: 0.5)
  maxOdds?: number; // Maximum odds to consider (default: 10.0)
  minOdds?: number; // Minimum odds to consider (default: 1.1)
  timeRange?: { // Preferred time range for events
    start?: string; // HH:mm format (e.g., '09:00')
    end?: string; // HH:mm format (e.g., '23:00')
    timezone?: string; // Timezone (default: user's timezone)
  };
  marketTypes?: string[]; // Preferred market types (e.g., ['h2h', 'totals'])
}

interface UserPreferencesData {
  valueBetPreferences?: ValueBetPreferences;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  preferredSports?: string[];
  timezone?: string;
}

class UserPreferencesService {
  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          alertPreferences: true, // Using existing alertPreferences field
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Default preferences
      const defaultPreferences: UserPreferencesData = {
        valueBetPreferences: {
          minValue: 0.05, // 5%
          maxEvents: 20,
          sports: ['soccer_epl', 'basketball_nba'],
          leagues: [],
          platforms: [],
          autoCreateAlerts: true,
          notificationThreshold: 0.10, // 10%
          minConfidence: 0.5, // 50%
          maxOdds: 10.0,
          minOdds: 1.1,
          timeRange: undefined,
          marketTypes: ['h2h'],
        },
        emailNotifications: true,
        pushNotifications: true,
        preferredSports: ['soccer_epl', 'basketball_nba'],
        timezone: 'UTC',
      };

      // Merge with user preferences if they exist
      const userPreferences = user.alertPreferences as UserPreferencesData | null;
      return {
        ...defaultPreferences,
        ...(userPreferences || {}),
        valueBetPreferences: {
          ...defaultPreferences.valueBetPreferences,
          ...(userPreferences?.valueBetPreferences || {}),
        },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting user preferences:', error);
      throw new AppError('Failed to get user preferences', 500);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferencesData>) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get current preferences
      const currentPreferences = (user.alertPreferences as UserPreferencesData) || {};

      // Merge with new preferences
      const updatedPreferences: UserPreferencesData = {
        ...currentPreferences,
        ...preferences,
        valueBetPreferences: {
          ...currentPreferences.valueBetPreferences,
          ...preferences.valueBetPreferences,
        },
      };

      // Update user preferences
      await prisma.user.update({
        where: { id: userId },
        data: {
          alertPreferences: updatedPreferences as any,
        },
      });

      logger.info(`Updated preferences for user ${userId}`);
      return updatedPreferences;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating user preferences:', error);
      throw new AppError('Failed to update user preferences', 500);
    }
  }

  /**
   * Get value bet preferences for a user
   */
  async getValueBetPreferences(userId: string): Promise<ValueBetPreferences> {
    const allPreferences = await this.getUserPreferences(userId);
    return allPreferences.valueBetPreferences || {
      minValue: 0.05,
      maxEvents: 20,
      sports: ['soccer_epl'],
      leagues: [],
      platforms: [],
      autoCreateAlerts: true,
      notificationThreshold: 0.10,
      minConfidence: 0.5,
      maxOdds: 10.0,
      minOdds: 1.1,
      timeRange: undefined,
      marketTypes: ['h2h'],
    };
  }

  /**
   * Update value bet preferences
   */
  async updateValueBetPreferences(userId: string, preferences: Partial<ValueBetPreferences>) {
    const currentPreferences = await this.getUserPreferences(userId);
    return await this.updateUserPreferences(userId, {
      valueBetPreferences: {
        ...currentPreferences.valueBetPreferences,
        ...preferences,
      },
    });
  }
}

export const userPreferencesService = new UserPreferencesService();


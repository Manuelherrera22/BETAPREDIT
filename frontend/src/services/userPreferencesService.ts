/**
 * User Preferences Service
 * Frontend service for managing user preferences
 */

import api from './api';

export interface ValueBetPreferences {
  minValue?: number; // Minimum value percentage (0-1, e.g., 0.05 = 5%)
  maxEvents?: number; // Maximum events to check per scan
  sports?: string[]; // Preferred sports
  leagues?: string[]; // Preferred leagues
  platforms?: string[]; // Preferred bookmaker platforms
  autoCreateAlerts?: boolean; // Auto-create alerts when value bets detected
  notificationThreshold?: number; // Only notify if value >= this (0-1)
  minConfidence?: number; // Minimum confidence level (0-1)
  maxOdds?: number; // Maximum odds to consider
  minOdds?: number; // Minimum odds to consider
  timeRange?: {
    start?: string; // HH:mm format
    end?: string; // HH:mm format
    timezone?: string;
  };
  marketTypes?: string[]; // Preferred market types
}

export interface UserPreferences {
  valueBetPreferences?: ValueBetPreferences;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  preferredSports?: string[];
  timezone?: string;
}

export const userPreferencesService = {
  /**
   * Get user preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    const { data } = await api.get('/user/preferences');
    return data.data as UserPreferences;
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const { data } = await api.put('/user/preferences', preferences);
    return data.data as UserPreferences;
  },

  /**
   * Get value bet preferences only
   */
  getValueBetPreferences: async (): Promise<ValueBetPreferences> => {
    const { data } = await api.get('/user/preferences/value-bets');
    return data.data as ValueBetPreferences;
  },

  /**
   * Update value bet preferences only
   */
  updateValueBetPreferences: async (preferences: Partial<ValueBetPreferences>): Promise<ValueBetPreferences> => {
    const { data } = await api.put('/user/preferences/value-bets', preferences);
    return data.data as ValueBetPreferences;
  },
};

/**
 * User Preferences Service Tests
 * Tests for user preferences service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userPreferencesService } from '../../services/userPreferencesService';
import api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('UserPreferencesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should fetch user preferences', async () => {
      const mockPreferences = {
        valueBetPreferences: {
          minValue: 0.10,
          maxEvents: 30,
        },
        emailNotifications: true,
        pushNotifications: true,
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockPreferences,
        },
      });

      const result = await userPreferencesService.getPreferences();

      expect(api.get).toHaveBeenCalledWith('/user/preferences');
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const preferences = {
        emailNotifications: false,
      };

      (api.put as any).mockResolvedValue({
        data: {
          success: true,
          data: preferences,
        },
      });

      const result = await userPreferencesService.updatePreferences(preferences);

      expect(api.put).toHaveBeenCalledWith('/user/preferences', preferences);
      expect(result).toBeDefined();
    });
  });

  describe('getValueBetPreferences', () => {
    it('should fetch value bet preferences', async () => {
      const mockValueBetPrefs = {
        minValue: 0.10,
        maxEvents: 30,
        sports: ['soccer_epl'],
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockValueBetPrefs,
        },
      });

      const result = await userPreferencesService.getValueBetPreferences();

      expect(api.get).toHaveBeenCalledWith('/user/preferences/value-bets');
      expect(result).toEqual(mockValueBetPrefs);
    });
  });

  describe('updateValueBetPreferences', () => {
    it('should update value bet preferences', async () => {
      const preferences = {
        minValue: 0.15,
        maxEvents: 50,
      };

      (api.put as any).mockResolvedValue({
        data: {
          success: true,
          data: preferences,
        },
      });

      const result = await userPreferencesService.updateValueBetPreferences(preferences);

      expect(api.put).toHaveBeenCalledWith('/user/preferences/value-bets', preferences);
      expect(result).toBeDefined();
    });
  });
});


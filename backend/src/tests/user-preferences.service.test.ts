/**
 * User Preferences Service Tests
 * Tests for user preferences management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { userPreferencesService } from '../services/user-preferences.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('UserPreferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should return default preferences when user has none', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        alertPreferences: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userPreferencesService.getUserPreferences('user-1');

      expect(result).toHaveProperty('valueBetPreferences');
      expect(result).toHaveProperty('emailNotifications');
      expect(result).toHaveProperty('pushNotifications');
      expect(result.valueBetPreferences.minValue).toBe(0.05);
      expect(result.valueBetPreferences.maxEvents).toBe(20);
    });

    it('should merge user preferences with defaults', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        alertPreferences: {
          valueBetPreferences: {
            minValue: 0.10,
            maxEvents: 50,
          },
          emailNotifications: false,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userPreferencesService.getUserPreferences('user-1');

      expect(result.valueBetPreferences.minValue).toBe(0.10);
      expect(result.valueBetPreferences.maxEvents).toBe(50);
      expect(result.emailNotifications).toBe(false);
      // Should still have defaults for other fields
      expect(result.pushNotifications).toBe(true);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        userPreferencesService.getUserPreferences('non-existent')
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const mockUser = {
        id: 'user-1',
        alertPreferences: {},
      };

      const updatedPreferences = {
        valueBetPreferences: {
          minValue: 0.15,
          maxEvents: 30,
        },
        emailNotifications: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        alertPreferences: updatedPreferences,
      });

      const result = await userPreferencesService.updateUserPreferences(
        'user-1',
        updatedPreferences
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          alertPreferences: expect.objectContaining(updatedPreferences),
        },
      });
      expect(result).toBeDefined();
    });

    it('should merge with existing preferences', async () => {
      const mockUser = {
        id: 'user-1',
        alertPreferences: {
          valueBetPreferences: {
            minValue: 0.10,
            maxEvents: 20,
          },
          emailNotifications: true,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        alertPreferences: {
          ...mockUser.alertPreferences,
          valueBetPreferences: {
            ...mockUser.alertPreferences.valueBetPreferences,
            minValue: 0.15,
          },
        },
      });

      const result = await userPreferencesService.updateUserPreferences('user-1', {
        valueBetPreferences: {
          minValue: 0.15,
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('updateValueBetPreferences', () => {
    it('should update only value bet preferences', async () => {
      const mockUser = {
        id: 'user-1',
        alertPreferences: {
          valueBetPreferences: {
            minValue: 0.05,
          },
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        alertPreferences: {
          ...mockUser.alertPreferences,
          valueBetPreferences: {
            minValue: 0.12,
            maxEvents: 25,
          },
        },
      });

      const result = await userPreferencesService.updateValueBetPreferences('user-1', {
        minValue: 0.12,
        maxEvents: 25,
      });

      expect(result.valueBetPreferences.minValue).toBe(0.12);
      expect(result.valueBetPreferences.maxEvents).toBe(25);
    });
  });
});


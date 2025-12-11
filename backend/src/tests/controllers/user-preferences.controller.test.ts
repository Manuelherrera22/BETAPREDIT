/**
 * User Preferences Controller Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { userPreferencesController } from '../../api/controllers/user-preferences.controller';
import { userPreferencesService } from '../../services/user-preferences.service';

// Mock dependencies
jest.mock('../../services/user-preferences.service', () => ({
  userPreferencesService: {
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    getValueBetPreferences: jest.fn(),
    updateValueBetPreferences: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserPreferencesController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
    } as Partial<Request>;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        valueBetPreferences: {
          minValue: 0.10,
          maxEvents: 30,
        },
        emailNotifications: true,
      };

      (userPreferencesService.getUserPreferences as jest.Mock).mockResolvedValue(mockPreferences);

      await userPreferencesController.getPreferences(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userPreferencesService.getUserPreferences).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPreferences,
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await userPreferencesController.getPreferences(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const mockUpdated = {
        valueBetPreferences: {
          minValue: 0.15,
          maxEvents: 50,
        },
        emailNotifications: false,
      };

      (userPreferencesService.updateUserPreferences as jest.Mock).mockResolvedValue(mockUpdated);
      mockReq.body = { emailNotifications: false };

      await userPreferencesController.updatePreferences(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userPreferencesService.updateUserPreferences).toHaveBeenCalledWith('user-1', mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdated,
        })
      );
    });
  });

  describe('getValueBetPreferences', () => {
    it('should return value bet preferences', async () => {
      const mockValueBetPrefs = {
        minValue: 0.10,
        maxEvents: 30,
        sports: ['soccer_epl'],
      };

      (userPreferencesService.getValueBetPreferences as jest.Mock).mockResolvedValue(mockValueBetPrefs);

      await userPreferencesController.getValueBetPreferences(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userPreferencesService.getValueBetPreferences).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockValueBetPrefs,
        })
      );
    });
  });

  describe('updateValueBetPreferences', () => {
    it('should update value bet preferences', async () => {
      const mockUpdated = {
        valueBetPreferences: {
          minValue: 0.15,
          maxEvents: 50,
        },
      };

      (userPreferencesService.updateValueBetPreferences as jest.Mock).mockResolvedValue(mockUpdated);
      mockReq.body = { minValue: 0.15 };

      await userPreferencesController.updateValueBetPreferences(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userPreferencesService.updateValueBetPreferences).toHaveBeenCalledWith('user-1', mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdated.valueBetPreferences,
        })
      );
    });
  });
});


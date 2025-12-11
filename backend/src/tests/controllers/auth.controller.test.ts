/**
 * Auth Controller Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { authController } from '../../api/controllers/auth.controller';
import { authService } from '../../services/auth.service';

// Mock dependencies
jest.mock('../../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
    } as Partial<Request>;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
        token: 'test-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResponse);
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      await authController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.register).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResponse,
        })
      );
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const mockResponse = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
        token: 'test-token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.login(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.login).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResponse,
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const mockResponse = {
        token: 'new-token',
      };

      (authService.refreshToken as jest.Mock).mockResolvedValue(mockResponse);
      mockReq.body = {
        refreshToken: 'old-refresh-token',
      };

      await authController.refreshToken(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResponse,
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);
      mockReq.user = { id: 'user-1' };

      await authController.logout(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.logout).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});


/**
 * Auth Service Tests
 * Basic unit tests for authentication service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { authService } from '../services/auth.service';
import { prisma } from '../config/database';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    responsibleGaming: {
      create: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw error if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('User already exists');
    });

    it('should create user with valid data', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date(),
      });
      (prisma.responsibleGaming.create as jest.Mock).mockResolvedValue({
        id: 'rg1',
        userId: '1',
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toHaveProperty('email', 'test@example.com');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.responsibleGaming.create).toHaveBeenCalled();
    });
  });
});


/**
 * Referral Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { referralService } from '../services/referrals/referral.service';
import { prisma } from '../config/database';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'ABCD1234EFGH5678'),
  })),
}));

describe('ReferralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReferralCode', () => {
    it('should generate a referral code', async () => {
      // Mock: user doesn't have a referral code yet
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ referralCode: null }) // First call: check if user has code
        .mockResolvedValueOnce(null); // Second call: check if code exists (it doesn't)

      // Mock: update user with referral code
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user123',
        referralCode: 'ABCD1234',
      });

      const code = await referralService.generateReferralCode('user123');
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should return existing referral code if user already has one', async () => {
      // Mock: user already has a referral code
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        referralCode: 'EXISTING123',
      });

      const code = await referralService.generateReferralCode('user123');
      
      expect(code).toBe('EXISTING123');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});


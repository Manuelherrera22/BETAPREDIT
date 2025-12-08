/**
 * Referral Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { referralService } from '../services/referrals/referral.service';

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'hexstring'),
  })),
}));

describe('ReferralService', () => {
  describe('generateReferralCode', () => {
    it('should generate a referral code', async () => {
      const code = await referralService.generateReferralCode('user123');
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });
});


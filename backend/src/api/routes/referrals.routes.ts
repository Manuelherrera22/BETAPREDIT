/**
 * Referrals Routes
 */

import { Router } from 'express';
import { referralsController } from '../controllers/referrals.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's referral stats
router.get(
  '/me',
  referralsController.getMyReferrals.bind(referralsController)
);

// Get leaderboard
router.get(
  '/leaderboard',
  referralsController.getLeaderboard.bind(referralsController)
);

// Process referral (for new users)
import { validate } from '../../middleware/validate';
import { processReferralSchema } from '../../validators/referral.validator';

router.post(
  '/process',
  validate(processReferralSchema),
  referralsController.processReferral.bind(referralsController)
);

export default router;


/**
 * 2FA Routes
 */

import { Router } from 'express';
import { twoFactorController } from '../controllers/2fa.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate 2FA secret
router.get(
  '/generate',
  twoFactorController.generate.bind(twoFactorController)
);

// Verify and enable 2FA
router.post(
  '/verify',
  validate(z.object({
    token: z.string().length(6, 'Token must be 6 digits'),
    secret: z.string().min(1, 'Secret is required'),
  })),
  twoFactorController.verify.bind(twoFactorController)
);

// Disable 2FA
router.post(
  '/disable',
  twoFactorController.disable.bind(twoFactorController)
);

export default router;





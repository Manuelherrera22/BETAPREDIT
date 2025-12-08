/**
 * Arbitrage Routes
 */

import { Router } from 'express';
import { arbitrageController } from '../controllers/arbitrage.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all active arbitrage opportunities
router.get(
  '/opportunities',
  arbitrageController.getOpportunities.bind(arbitrageController)
);

// Detect arbitrage for a specific event
router.get(
  '/event/:eventId',
  arbitrageController.detectForEvent.bind(arbitrageController)
);

// Calculate stakes for an arbitrage opportunity
import { validate } from '../../middleware/validate';
import { calculateStakesSchema } from '../../validators/arbitrage.validator';

router.post(
  '/calculate-stakes',
  validate(calculateStakesSchema),
  arbitrageController.calculateStakes.bind(arbitrageController)
);

export default router;


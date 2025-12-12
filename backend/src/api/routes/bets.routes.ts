import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { betsController } from '../controllers/bets.controller';
import { validate, validateQuery } from '../../middleware/validate';
import { placeBetSchema } from '../../validators/bet.validator';
import {
  getMyBetsQuerySchema,
  getBetDetailsSchema,
  getBetHistorySchema,
  cancelBetSchema,
} from '../../validators/bets-queries.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Place a bet
router.post('/', validate(placeBetSchema), betsController.placeBet);

// Get user's bets
router.get('/my-bets', validateQuery(getMyBetsQuerySchema), betsController.getMyBets);

// Get bet details
router.get('/:betId', validate(getBetDetailsSchema), betsController.getBetDetails);

// Cancel a bet (if allowed)
router.delete('/:betId', validate(cancelBetSchema), betsController.cancelBet);

// Get bet history with filters
router.get('/history/filter', validateQuery(getBetHistorySchema), betsController.getBetHistory);

export default router;


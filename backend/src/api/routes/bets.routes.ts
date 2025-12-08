import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { betsController } from '../controllers/bets.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Place a bet
router.post('/', betsController.placeBet);

// Get user's bets
router.get('/my-bets', betsController.getMyBets);

// Get bet details
router.get('/:betId', betsController.getBetDetails);

// Cancel a bet (if allowed)
router.delete('/:betId', betsController.cancelBet);

// Get bet history with filters
router.get('/history/filter', betsController.getBetHistory);

export default router;


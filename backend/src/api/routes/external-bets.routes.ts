import { Router } from 'express';
import { externalBetsController } from '../controllers/external-bets.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', externalBetsController.registerBet.bind(externalBetsController));
router.get('/', externalBetsController.getMyBets.bind(externalBetsController));
router.get('/stats', externalBetsController.getBetStats.bind(externalBetsController));
router.patch('/:betId/result', externalBetsController.updateBetResult.bind(externalBetsController));
router.delete('/:betId', externalBetsController.deleteBet.bind(externalBetsController));

export default router;


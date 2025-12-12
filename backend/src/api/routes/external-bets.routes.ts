import { Router } from 'express';
import { externalBetsController } from '../controllers/external-bets.controller';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import {
  registerExternalBetSchema,
  getExternalBetsQuerySchema,
  updateBetResultSchema,
  deleteExternalBetSchema,
} from '../../validators/external-bets.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(registerExternalBetSchema), externalBetsController.registerBet.bind(externalBetsController));
router.get('/', validateQuery(getExternalBetsQuerySchema), externalBetsController.getMyBets.bind(externalBetsController));
router.get('/stats', externalBetsController.getBetStats.bind(externalBetsController));
router.patch('/:betId/result', validate(updateBetResultSchema), externalBetsController.updateBetResult.bind(externalBetsController));
router.delete('/:betId', validate(deleteExternalBetSchema), externalBetsController.deleteBet.bind(externalBetsController));

export default router;


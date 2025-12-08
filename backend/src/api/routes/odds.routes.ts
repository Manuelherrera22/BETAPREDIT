import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { oddsController } from '../controllers/odds.controller';

const router = Router();

// Get odds for a specific event
router.get('/event/:eventId', authenticate, oddsController.getEventOdds);

// Get odds for multiple events
router.post('/events', authenticate, oddsController.getMultipleEventsOdds);

// Get live odds updates (WebSocket alternative via polling)
router.get('/live/:eventId', authenticate, oddsController.getLiveOdds);

// Get odds history for analysis
router.get('/history/:eventId', authenticate, oddsController.getOddsHistory);

export default router;


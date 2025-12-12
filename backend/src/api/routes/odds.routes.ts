import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { oddsController } from '../controllers/odds.controller';
import { validate, validateQuery } from '../../middleware/validate';
import { 
  getEventOddsSchema, 
  getMultipleEventsOddsSchema, 
  getLiveOddsSchema,
  getOddsHistorySchema,
  compareOddsFromAPISchema
} from '../../validators/odds.validator';

const router = Router();

// Get odds for a specific event
router.get('/event/:eventId', authenticate, validate(getEventOddsSchema), oddsController.getEventOdds);

// Get odds for multiple events
router.post('/events', authenticate, validate(getMultipleEventsOddsSchema), oddsController.getMultipleEventsOdds);

// Get live odds updates (WebSocket alternative via polling)
router.get('/live/:eventId', authenticate, validate(getLiveOddsSchema), oddsController.getLiveOdds);

// Get odds history for analysis
router.get('/history/:eventId', authenticate, validateQuery(getOddsHistorySchema), oddsController.getOddsHistory);

// Fetch and compare odds from The Odds API
router.post('/compare/:sport/:eventId', authenticate, validateQuery(compareOddsFromAPISchema), oddsController.compareOddsFromAPI);

export default router;


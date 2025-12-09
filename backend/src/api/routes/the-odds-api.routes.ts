import { Router } from 'express';
import { theOddsAPIController } from '../controllers/the-odds-api.controller';
import { eventSyncService } from '../../services/event-sync.service';

const router = Router();

// All endpoints are public (authentication handled by API key in service)
router.get('/sports', theOddsAPIController.getSports.bind(theOddsAPIController));
router.get('/sports/:sport/odds', theOddsAPIController.getOdds.bind(theOddsAPIController));
router.get('/sports/:sport/events/:eventId/compare', theOddsAPIController.compareOdds.bind(theOddsAPIController));
router.post('/sports/:sport/events/:eventId/value-bets', theOddsAPIController.detectValueBets.bind(theOddsAPIController));
router.get('/sports/:sport/search', theOddsAPIController.searchEvents.bind(theOddsAPIController));

export default router;


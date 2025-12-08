import { Router } from 'express';
import { kalshiController } from '../controllers/kalshi.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public endpoints (no auth required for market data)
router.get('/exchange/status', kalshiController.getExchangeStatus.bind(kalshiController));
router.get('/series', kalshiController.getSeries.bind(kalshiController));
router.get('/events', kalshiController.getEvents.bind(kalshiController));
router.get('/events/:eventTicker/markets', kalshiController.getEventMarkets.bind(kalshiController));
router.get('/markets/:marketTicker', kalshiController.getMarketDetails.bind(kalshiController));
router.get('/markets/trending', kalshiController.getTrendingMarkets.bind(kalshiController));

// Protected endpoints (require auth)
router.use(authenticate);
router.post('/compare/:eventTicker/:marketTicker', kalshiController.compareWithML.bind(kalshiController));

export default router;


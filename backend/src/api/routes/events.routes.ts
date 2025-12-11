import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { cacheMiddleware } from '../../middleware/cache';
import { CACHE_TTL } from '../../utils/performance';
import { eventsController } from '../controllers/events.controller';
import { validate, validateQuery, validateParams } from '../../middleware/validate';
import {
  getEventsQuerySchema,
  syncEventsSchema,
  getEventDetailsParamsSchema,
} from '../../validators/event.validator';

const router = Router();

// Get live events (cache for 2 minutes - data changes frequently)
router.get('/live', authenticate, validateQuery(getEventsQuerySchema), cacheMiddleware(CACHE_TTL.SHORT), eventsController.getLiveEvents);

// Get upcoming events (cache for 10 minutes - less frequently changing)
router.get('/upcoming', authenticate, validateQuery(getEventsQuerySchema), cacheMiddleware(CACHE_TTL.MEDIUM), eventsController.getUpcomingEvents);

// Sync events manually (admin or for testing) - MUST be before /:eventId
router.post('/sync', authenticate, validate(syncEventsSchema), eventsController.syncEvents);

// Get events by sport (cache for 5 minutes)
router.get('/sport/:sportId', authenticate, validateQuery(getEventsQuerySchema), cacheMiddleware(CACHE_TTL.MEDIUM), eventsController.getEventsBySport);

// Search events (cache for 2 minutes)
router.get('/search/:query', authenticate, validateQuery(getEventsQuerySchema), cacheMiddleware(CACHE_TTL.SHORT), eventsController.searchEvents);

// Get event details - MUST be last to avoid catching other routes
router.get('/:eventId', authenticate, validateParams(getEventDetailsParamsSchema), eventsController.getEventDetails);

export default router;


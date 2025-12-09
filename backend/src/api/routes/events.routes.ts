import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { eventsController } from '../controllers/events.controller';

const router = Router();

// Get live events
router.get('/live', authenticate, eventsController.getLiveEvents);

// Get upcoming events
router.get('/upcoming', authenticate, eventsController.getUpcomingEvents);

// Sync events manually (admin or for testing) - MUST be before /:eventId
router.post('/sync', authenticate, eventsController.syncEvents);

// Get events by sport
router.get('/sport/:sportId', authenticate, eventsController.getEventsBySport);

// Search events
router.get('/search/:query', authenticate, eventsController.searchEvents);

// Get event details - MUST be last to avoid catching other routes
router.get('/:eventId', authenticate, eventsController.getEventDetails);

export default router;


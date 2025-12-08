import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { eventsController } from '../controllers/events.controller';

const router = Router();

// Get live events
router.get('/live', authenticate, eventsController.getLiveEvents);

// Get upcoming events
router.get('/upcoming', authenticate, eventsController.getUpcomingEvents);

// Get event details
router.get('/:eventId', authenticate, eventsController.getEventDetails);

// Get events by sport
router.get('/sport/:sportId', authenticate, eventsController.getEventsBySport);

// Search events
router.get('/search/:query', authenticate, eventsController.searchEvents);

export default router;


import { Router } from 'express';
import { apiFootballController } from '../controllers/api-football.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get fixtures
router.get('/fixtures', apiFootballController.getFixtures.bind(apiFootballController));

// Get head-to-head
router.get('/head-to-head', apiFootballController.getHeadToHead.bind(apiFootballController));

// Get team statistics
router.get('/teams/statistics', apiFootballController.getTeamStatistics.bind(apiFootballController));

// Get injuries
router.get('/injuries', apiFootballController.getInjuries.bind(apiFootballController));

// Get standings
router.get('/standings', apiFootballController.getStandings.bind(apiFootballController));

// Search teams
router.get('/teams/search', apiFootballController.searchTeams.bind(apiFootballController));

export default router;





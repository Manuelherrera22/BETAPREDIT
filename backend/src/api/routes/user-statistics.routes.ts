import { Router } from 'express';
import { userStatisticsController } from '../controllers/user-statistics.controller';
import { authenticate } from '../../middleware/auth';
import { validateQuery } from '../../middleware/validate';
import {
  getUserStatisticsSchema,
  getStatisticsBySportSchema,
  getStatisticsByPlatformSchema,
} from '../../validators/user-statistics.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', validateQuery(getUserStatisticsSchema), userStatisticsController.getMyStatistics.bind(userStatisticsController));
router.post('/recalculate', userStatisticsController.recalculateStatistics.bind(userStatisticsController));
router.get('/by-sport', validateQuery(getStatisticsBySportSchema), userStatisticsController.getStatisticsBySport.bind(userStatisticsController));
router.get('/by-platform', validateQuery(getStatisticsByPlatformSchema), userStatisticsController.getStatisticsByPlatform.bind(userStatisticsController));

export default router;


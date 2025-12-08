import { Router } from 'express';
import { userStatisticsController } from '../controllers/user-statistics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', userStatisticsController.getMyStatistics.bind(userStatisticsController));
router.post('/recalculate', userStatisticsController.recalculateStatistics.bind(userStatisticsController));

export default router;


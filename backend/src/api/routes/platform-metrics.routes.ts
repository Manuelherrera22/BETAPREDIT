/**
 * Platform Metrics Routes
 */

import { Router } from 'express';
import { platformMetricsController } from '../controllers/platform-metrics.controller';

const router = Router();

// Public endpoint (no auth required for social proof)
router.get('/', platformMetricsController.getMetrics);

export default router;


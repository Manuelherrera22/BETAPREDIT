/**
 * Platform Metrics Controller
 * Handles platform-wide statistics endpoints
 */

import { Response, NextFunction } from 'express';
import { platformMetricsService } from '../../services/platform-metrics.service';
import { logger } from '../../utils/logger';

class PlatformMetricsController {
  /**
   * Get platform metrics
   * GET /api/platform/metrics
   */
  async getMetrics(req: any, res: Response, next: NextFunction) {
    try {
      const metrics = await platformMetricsService.getPlatformMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}

export const platformMetricsController = new PlatformMetricsController();


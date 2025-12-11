/**
 * Metrics Routes
 * Exposes Prometheus metrics endpoint
 */

import { Router } from 'express';
import { register } from '../../monitoring/prometheus';

const router = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: 'Error generating metrics' },
    });
  }
});

export default router;


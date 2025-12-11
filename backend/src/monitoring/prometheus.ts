/**
 * Prometheus Metrics Collection
 * Collects and exposes metrics for monitoring
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from '../utils/logger';

// Create a Registry to register metrics
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// ============================================
// HTTP Metrics
// ============================================

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// ============================================
// Database Metrics
// ============================================

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model'],
  registers: [register],
});

export const dbQueryErrors = new Counter({
  name: 'db_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['operation', 'model'],
  registers: [register],
});

// ============================================
// Business Metrics
// ============================================

export const predictionsGenerated = new Counter({
  name: 'predictions_generated_total',
  help: 'Total number of predictions generated',
  labelNames: ['sport', 'market_type'],
  registers: [register],
});

export const valueBetsDetected = new Counter({
  name: 'value_bets_detected_total',
  help: 'Total number of value bets detected',
  labelNames: ['sport', 'min_value'],
  registers: [register],
});

export const betsPlaced = new Counter({
  name: 'bets_placed_total',
  help: 'Total number of bets placed',
  labelNames: ['sport', 'market_type'],
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['period'], // 'hour', 'day', 'week'
  registers: [register],
});

export const predictionsAccuracy = new Gauge({
  name: 'predictions_accuracy',
  help: 'Current prediction accuracy percentage',
  labelNames: ['sport', 'market_type'],
  registers: [register],
});

// ============================================
// External API Metrics
// ============================================

export const externalApiRequests = new Counter({
  name: 'external_api_requests_total',
  help: 'Total number of external API requests',
  labelNames: ['provider', 'endpoint', 'status'],
  registers: [register],
});

export const externalApiDuration = new Histogram({
  name: 'external_api_duration_seconds',
  help: 'Duration of external API requests in seconds',
  labelNames: ['provider', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const externalApiErrors = new Counter({
  name: 'external_api_errors_total',
  help: 'Total number of external API errors',
  labelNames: ['provider', 'endpoint'],
  registers: [register],
});

// ============================================
// Cache Metrics
// ============================================

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache_type'],
  registers: [register],
});

// ============================================
// Queue/Job Metrics
// ============================================

export const jobsProcessed = new Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['job_type', 'status'],
  registers: [register],
});

export const jobsDuration = new Histogram({
  name: 'jobs_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['job_type'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register],
});

export const jobsQueueSize = new Gauge({
  name: 'jobs_queue_size',
  help: 'Current number of jobs in queue',
  labelNames: ['job_type'],
  registers: [register],
});

// ============================================
// System Health Metrics
// ============================================

export const systemHealth = new Gauge({
  name: 'system_health',
  help: 'System health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['component'], // 'database', 'redis', 'external_apis'
  registers: [register],
});

export const uptime = new Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds',
  registers: [register],
});

// Initialize uptime
const startTime = Date.now();
setInterval(() => {
  uptime.set((Date.now() - startTime) / 1000);
}, 10000); // Update every 10 seconds

logger.info('Prometheus metrics initialized');


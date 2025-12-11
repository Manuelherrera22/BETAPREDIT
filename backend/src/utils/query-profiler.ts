/**
 * Query Profiler
 * Profiles database queries to identify slow queries and N+1 problems
 */

import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { dbQueryDuration, dbQueryTotal, dbQueryErrors } from '../monitoring/prometheus';

interface QueryProfile {
  query: string;
  duration: number;
  model?: string;
  operation?: string;
  timestamp: Date;
}

class QueryProfiler {
  private slowQueryThreshold = 1000; // 1 second
  private queries: QueryProfile[] = [];
  private maxQueries = 1000; // Keep last 1000 queries

  /**
   * Profile a database query
   */
  profileQuery(query: Prisma.QueryEvent) {
    const duration = query.duration;
    const model = this.extractModel(query.query);
    const operation = this.extractOperation(query.query);

    // Record Prometheus metrics
    dbQueryDuration.observe({ operation, model }, duration / 1000);
    dbQueryTotal.inc({ operation, model });

    // Track query
    const profile: QueryProfile = {
      query: query.query,
      duration,
      model,
      operation,
      timestamp: new Date(),
    };

    this.queries.push(profile);

    // Keep only last N queries
    if (this.queries.length > this.maxQueries) {
      this.queries.shift();
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      logger.warn('Slow query detected:', {
        duration: `${duration}ms`,
        model,
        operation,
        query: query.query.substring(0, 200), // First 200 chars
      });
    }

    // Check for potential N+1 queries
    this.detectNPlusOne(profile);
  }

  /**
   * Extract model name from query
   */
  private extractModel(query: string): string {
    const match = query.match(/(?:FROM|INTO|UPDATE|DELETE FROM)\s+["`]?(\w+)["`]?/i);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract operation type from query
   */
  private extractOperation(query: string): string {
    if (query.match(/^SELECT/i)) return 'SELECT';
    if (query.match(/^INSERT/i)) return 'INSERT';
    if (query.match(/^UPDATE/i)) return 'UPDATE';
    if (query.match(/^DELETE/i)) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Detect potential N+1 query problems
   */
  private detectNPlusOne(profile: QueryProfile) {
    // Check if same query is executed multiple times in short period
    const recentQueries = this.queries.filter(
      (q) =>
        q.model === profile.model &&
        q.operation === profile.operation &&
        Date.now() - q.timestamp.getTime() < 1000 // Last second
    );

    if (recentQueries.length > 10) {
      logger.warn('Potential N+1 query detected:', {
        model: profile.model,
        operation: profile.operation,
        count: recentQueries.length,
        timeWindow: '1 second',
      });
    }
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold?: number): QueryProfile[] {
    const limit = threshold || this.slowQueryThreshold;
    return this.queries.filter((q) => q.duration > limit).sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get query statistics
   */
  getStatistics() {
    const total = this.queries.length;
    const slow = this.queries.filter((q) => q.duration > this.slowQueryThreshold).length;
    const avgDuration = this.queries.reduce((sum, q) => sum + q.duration, 0) / total || 0;
    const maxDuration = Math.max(...this.queries.map((q) => q.duration), 0);

    // Group by model
    const byModel = this.queries.reduce((acc, q) => {
      acc[q.model || 'unknown'] = (acc[q.model || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by operation
    const byOperation = this.queries.reduce((acc, q) => {
      acc[q.operation || 'unknown'] = (acc[q.operation || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      slow,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      byModel,
      byOperation,
    };
  }

  /**
   * Reset profiler
   */
  reset() {
    this.queries = [];
  }
}

export const queryProfiler = new QueryProfiler();


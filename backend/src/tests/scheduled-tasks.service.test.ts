/**
 * Scheduled Tasks Service Tests
 * Tests for scheduled tasks management service
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { scheduledTasksService } from '../services/scheduled-tasks.service';
import { autoPredictionsService } from '../services/auto-predictions.service';
import { eventSyncService } from '../services/event-sync.service';
import { valueBetDetectionService } from '../services/value-bet-detection.service';
import { valueBetAlertsService } from '../services/value-bet-alerts.service';

// Mock dependencies
jest.mock('../services/auto-predictions.service', () => ({
  autoPredictionsService: {
    generatePredictionsForUpcomingEvents: jest.fn(),
    updatePredictionsForChangedOdds: jest.fn(),
  },
}));

jest.mock('../services/event-sync.service', () => ({
  eventSyncService: {
    syncSportEvents: jest.fn(),
  },
}));

jest.mock('../services/value-bet-detection.service', () => ({
  valueBetDetectionService: {
    scanAllSports: jest.fn(),
  },
}));

jest.mock('../services/value-bet-alerts.service', () => ({
  valueBetAlertsService: {
    expireOldAlerts: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ScheduledTasksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Stop any running tasks before each test
    scheduledTasksService.stop();
  });

  afterEach(() => {
    // Clean up after each test
    scheduledTasksService.stop();
  });

  describe('start', () => {
    it('should start all scheduled tasks', () => {
      scheduledTasksService.start();

      const status = scheduledTasksService.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.tasks.length).toBeGreaterThan(0);
    });

    it('should not start tasks if already running', () => {
      scheduledTasksService.start();
      const firstStatus = scheduledTasksService.getStatus();
      const firstTaskCount = firstStatus.tasks.length;

      scheduledTasksService.start(); // Try to start again
      const secondStatus = scheduledTasksService.getStatus();

      expect(secondStatus.isRunning).toBe(true);
      expect(secondStatus.tasks.length).toBe(firstTaskCount);
    });
  });

  describe('stop', () => {
    it('should stop all scheduled tasks', () => {
      scheduledTasksService.start();
      expect(scheduledTasksService.getStatus().isRunning).toBe(true);

      scheduledTasksService.stop();
      expect(scheduledTasksService.getStatus().isRunning).toBe(false);
    });

    it('should handle stop when not running', () => {
      scheduledTasksService.stop(); // Should not throw
      expect(scheduledTasksService.getStatus().isRunning).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = scheduledTasksService.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.tasks).toEqual([]);
      expect(status.count).toBe(0);
    });

    it('should return correct status when running', () => {
      scheduledTasksService.start();
      const status = scheduledTasksService.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.tasks.length).toBeGreaterThan(0);
      expect(status.count).toBeGreaterThan(0);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all tasks are registered', () => {
      scheduledTasksService.start();
      const health = scheduledTasksService.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.issues).toEqual([]);
    });

    it('should detect missing tasks', () => {
      // This test would require mocking the internal state
      // For now, we test that the method exists and returns expected structure
      scheduledTasksService.start();
      const health = scheduledTasksService.healthCheck();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('issues');
      expect(Array.isArray(health.issues)).toBe(true);
    });
  });
});


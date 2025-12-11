/**
 * Value Bet Alerts Service Tests
 * Tests for value bet alerts management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { valueBetAlertsService } from '../services/value-bet-alerts.service';
import { prisma } from '../config/database';
import { webSocketService } from '../services/websocket.service';
import { notificationsService } from '../services/notifications.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    valueBetAlert: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    market: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../services/websocket.service', () => ({
  webSocketService: {
    emitValueBetAlert: jest.fn(),
  },
}));

jest.mock('../services/notifications.service', () => ({
  notificationsService: {
    createNotification: jest.fn(),
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

describe('ValueBetAlertsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create a new value bet alert', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Team A vs Team B',
      };

      const mockMarket = {
        id: 'market-1',
        type: 'MATCH_WINNER',
      };

      const mockAlert = {
        id: 'alert-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        valuePercentage: 0.15,
        status: 'ACTIVE',
        event: mockEvent,
        market: mockMarket,
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prisma.valueBetAlert.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.valueBetAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await valueBetAlertsService.createAlert({
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        bookmakerOdds: 2.5,
        bookmakerPlatform: 'Bet365',
        predictedProbability: 0.5,
        expectedValue: 0.15,
        valuePercentage: 0.15,
        confidence: 0.75,
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(prisma.valueBetAlert.create).toHaveBeenCalled();
      expect(webSocketService.emitValueBetAlert).toHaveBeenCalled();
      expect(result).toEqual(mockAlert);
    });

    it('should update existing alert instead of creating duplicate', async () => {
      const mockEvent = { id: 'event-1' };
      const mockMarket = { id: 'market-1' };
      const existingAlert = {
        id: 'alert-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        status: 'ACTIVE',
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.market.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prisma.valueBetAlert.findFirst as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.valueBetAlert.update as jest.Mock).mockResolvedValue({
        ...existingAlert,
        valuePercentage: 0.20,
      });

      const result = await valueBetAlertsService.createAlert({
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        bookmakerOdds: 2.6,
        bookmakerPlatform: 'Bet365',
        predictedProbability: 0.5,
        expectedValue: 0.20,
        valuePercentage: 0.20,
        confidence: 0.75,
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(prisma.valueBetAlert.update).toHaveBeenCalled();
      expect(prisma.valueBetAlert.create).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if event not found', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        valueBetAlertsService.createAlert({
          eventId: 'non-existent',
          marketId: 'market-1',
          selection: 'home',
          bookmakerOdds: 2.5,
          bookmakerPlatform: 'Bet365',
          predictedProbability: 0.5,
          expectedValue: 0.15,
          valuePercentage: 0.15,
          confidence: 0.75,
          expiresAt: new Date(),
        })
      ).rejects.toThrow('Event not found');
    });
  });

  describe('getUserAlerts', () => {
    it('should get user alerts with filters', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          valuePercentage: 0.15,
          status: 'ACTIVE',
        },
      ];

      (prisma.valueBetAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const result = await valueBetAlertsService.getUserAlerts('user-1', {
        status: 'ACTIVE',
        minValue: 0.10,
      });

      expect(prisma.valueBetAlert.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'ACTIVE',
          valuePercentage: { gte: 0.10 },
        }),
      });
      expect(result).toEqual(mockAlerts);
    });

    it('should return empty array when no alerts found', async () => {
      (prisma.valueBetAlert.findMany as jest.Mock).mockResolvedValue([]);

      const result = await valueBetAlertsService.getUserAlerts('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('expireOldAlerts', () => {
    it('should expire alerts past expiration date', async () => {
      const mockExpiredAlerts = [
        { id: 'alert-1', expiresAt: new Date(Date.now() - 3600000) },
        { id: 'alert-2', expiresAt: new Date(Date.now() - 7200000) },
      ];

      (prisma.valueBetAlert.findMany as jest.Mock).mockResolvedValue(mockExpiredAlerts);
      (prisma.valueBetAlert.update as jest.Mock).mockResolvedValue({ status: 'EXPIRED' });

      const result = await valueBetAlertsService.expireOldAlerts();

      expect(prisma.valueBetAlert.update).toHaveBeenCalledTimes(2);
      expect(result.expired).toBe(2);
    });

    it('should handle no expired alerts', async () => {
      (prisma.valueBetAlert.findMany as jest.Mock).mockResolvedValue([]);

      const result = await valueBetAlertsService.expireOldAlerts();

      expect(result.expired).toBe(0);
    });
  });
});


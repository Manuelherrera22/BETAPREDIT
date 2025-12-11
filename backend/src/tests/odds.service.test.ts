/**
 * Odds Service Tests
 * Tests for odds service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { oddsService } from '../services/odds.service';
import { prisma } from '../config/database';
import { redisHelpers } from '../config/redis';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    odds: {
      findMany: jest.fn(),
    },
    oddsHistory: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../config/redis', () => ({
  redisHelpers: {
    getCachedOdds: jest.fn(),
    cacheOdds: jest.fn(),
    publishOddsUpdate: jest.fn(),
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

describe('OddsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventOdds', () => {
    it('should return cached odds if available', async () => {
      const mockCachedOdds = [
        {
          id: 'odds-1',
          selection: 'home',
          decimal: 2.0,
        },
      ];

      (redisHelpers.getCachedOdds as jest.Mock).mockResolvedValue(mockCachedOdds);

      const result = await oddsService.getEventOdds('event-1');

      expect(redisHelpers.getCachedOdds).toHaveBeenCalledWith('event-1');
      expect(result).toEqual(mockCachedOdds);
      expect(prisma.odds.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      const mockOdds = [
        {
          id: 'odds-1',
          selection: 'home',
          decimal: 2.0,
          isActive: true,
        },
      ];

      (redisHelpers.getCachedOdds as jest.Mock).mockResolvedValue(null);
      (prisma.odds.findMany as jest.Mock).mockResolvedValue(mockOdds);
      (redisHelpers.cacheOdds as jest.Mock).mockResolvedValue(undefined);

      const result = await oddsService.getEventOdds('event-1');

      expect(prisma.odds.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            eventId: 'event-1',
            isActive: true,
          },
        })
      );
      expect(redisHelpers.cacheOdds).toHaveBeenCalledWith('event-1', mockOdds, 30);
      expect(result).toEqual(mockOdds);
    });
  });

  describe('getMultipleEventsOdds', () => {
    it('should return odds for multiple events', async () => {
      const eventIds = ['event-1', 'event-2'];
      const mockOdds = [
        {
          id: 'odds-1',
          eventId: 'event-1',
          decimal: 2.0,
        },
        {
          id: 'odds-2',
          eventId: 'event-2',
          decimal: 2.5,
        },
      ];

      (redisHelpers.getCachedOdds as jest.Mock).mockResolvedValue(null);
      (prisma.odds.findMany as jest.Mock).mockResolvedValue(mockOdds);

      const result = await oddsService.getMultipleEventsOdds(eventIds);

      expect(result).toHaveProperty('event-1');
      expect(result).toHaveProperty('event-2');
    });

    it('should use cached odds when available', async () => {
      const eventIds = ['event-1', 'event-2'];
      const cachedOdds = [{ id: 'odds-1', decimal: 2.0 }];

      (redisHelpers.getCachedOdds as jest.Mock)
        .mockResolvedValueOnce(cachedOdds) // event-1 cached
        .mockResolvedValueOnce(null); // event-2 not cached

      (prisma.odds.findMany as jest.Mock).mockResolvedValue([
        { id: 'odds-2', eventId: 'event-2', decimal: 2.5 },
      ]);

      const result = await oddsService.getMultipleEventsOdds(eventIds);

      expect(result['event-1']).toEqual(cachedOdds);
      expect(result['event-2']).toBeDefined();
    });
  });

  describe('getLiveOdds', () => {
    it('should get live odds and publish update', async () => {
      const mockOdds = [
        {
          id: 'odds-1',
          decimal: 2.0,
        },
      ];

      (oddsService.getEventOdds as jest.Mock) = jest.fn().mockResolvedValue(mockOdds);
      (redisHelpers.publishOddsUpdate as jest.Mock).mockResolvedValue(undefined);

      const result = await oddsService.getLiveOdds('event-1');

      expect(redisHelpers.publishOddsUpdate).toHaveBeenCalledWith('event-1', mockOdds);
      expect(result).toEqual(mockOdds);
    });
  });

  describe('getOddsHistory', () => {
    it('should return odds history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          timestamp: new Date(),
          decimal: 2.0,
        },
      ];

      (prisma.oddsHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);

      const result = await oddsService.getOddsHistory('event-1', {});

      expect(prisma.oddsHistory.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
    });

    it('should apply date filters', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      (prisma.oddsHistory.findMany as jest.Mock).mockResolvedValue([]);

      await oddsService.getOddsHistory('event-1', {
        startDate,
        endDate,
        limit: 50,
      });

      expect(prisma.oddsHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: new Date(startDate),
              lte: new Date(endDate),
            }),
          }),
        })
      );
    });
  });
});


/**
 * Event Sync Service Tests
 * Tests for event synchronization service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { eventSyncService } from '../services/event-sync.service';
import { prisma } from '../config/database';
import { getTheOddsAPIService } from '../services/integrations/the-odds-api.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    sport: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    market: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('EventSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncEventFromTheOddsAPI', () => {
    it('should create new sport if not exists', async () => {
      const mockSport = {
        id: 'sport-1',
        name: 'Premier League',
        slug: 'soccer_epl',
        isActive: true,
      };

      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sport.create as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event.create as jest.Mock).mockResolvedValue({
        id: 'event-1',
        externalId: 'ext-1',
        sportId: 'sport-1',
        name: 'Team A vs Team B',
        startTime: new Date(),
      });

      await eventSyncService.syncEventFromTheOddsAPI(
        'ext-1',
        'soccer_epl',
        'Premier League',
        'Team A',
        'Team B',
        new Date().toISOString()
      );

      expect(prisma.sport.create).toHaveBeenCalledWith({
        data: {
          name: 'Premier League',
          slug: 'soccer_epl',
          isActive: true,
        },
      });
    });

    it('should use existing sport if found', async () => {
      const mockSport = {
        id: 'sport-1',
        name: 'Premier League',
        slug: 'soccer_epl',
        isActive: true,
      };

      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event.create as jest.Mock).mockResolvedValue({
        id: 'event-1',
        externalId: 'ext-1',
        sportId: 'sport-1',
      });

      await eventSyncService.syncEventFromTheOddsAPI(
        'ext-1',
        'soccer_epl',
        'Premier League',
        'Team A',
        'Team B',
        new Date().toISOString()
      );

      expect(prisma.sport.create).not.toHaveBeenCalled();
      expect(prisma.event.create).toHaveBeenCalled();
    });

    it('should create new event if not exists', async () => {
      const mockSport = {
        id: 'sport-1',
        name: 'Premier League',
        slug: 'soccer_epl',
        isActive: true,
      };

      const mockEvent = {
        id: 'event-1',
        externalId: 'ext-1',
        sportId: 'sport-1',
        name: 'Team A vs Team B',
        startTime: new Date(),
      };

      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await eventSyncService.syncEventFromTheOddsAPI(
        'ext-1',
        'soccer_epl',
        'Premier League',
        'Team A',
        'Team B',
        new Date().toISOString()
      );

      expect(prisma.event.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update existing event if found', async () => {
      const mockSport = {
        id: 'sport-1',
        name: 'Premier League',
        slug: 'soccer_epl',
        isActive: true,
      };

      const existingEvent = {
        id: 'event-1',
        externalId: 'ext-1',
        sportId: 'sport-1',
        name: 'Team A vs Team B',
        startTime: new Date(),
      };

      (prisma.sport.findFirst as jest.Mock).mockResolvedValue(mockSport);
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(existingEvent);
      (prisma.event.update as jest.Mock).mockResolvedValue({
        ...existingEvent,
        homeScore: 1,
        awayScore: 0,
      });

      const result = await eventSyncService.syncEventFromTheOddsAPI(
        'ext-1',
        'soccer_epl',
        'Premier League',
        'Team A',
        'Team B',
        new Date().toISOString(),
        1,
        0,
        'LIVE'
      );

      expect(prisma.event.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('syncSportEvents', () => {
    it('should sync events for a sport from The Odds API', async () => {
      const mockOddsData = [
        {
          id: 'event-1',
          sport_key: 'soccer_epl',
          sport_title: 'Premier League',
          home_team: 'Team A',
          away_team: 'Team B',
          commence_time: new Date().toISOString(),
          bookmakers: [],
        },
      ];

      const mockTheOddsAPI = {
        getOdds: jest.fn().mockResolvedValue(mockOddsData),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockTheOddsAPI);
      (prisma.sport.findFirst as jest.Mock).mockResolvedValue({
        id: 'sport-1',
        slug: 'soccer_epl',
        name: 'Premier League',
      });
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event.create as jest.Mock).mockResolvedValue({
        id: 'event-1',
        externalId: 'event-1',
      });

      const result = await eventSyncService.syncSportEvents('soccer_epl');

      expect(mockTheOddsAPI.getOdds).toHaveBeenCalledWith('soccer_epl', {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array if The Odds API service is not available', async () => {
      (getTheOddsAPIService as jest.Mock).mockReturnValue(null);

      const result = await eventSyncService.syncSportEvents('soccer_epl');

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const mockTheOddsAPI = {
        getOdds: jest.fn().mockRejectedValue(new Error('API error')),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockTheOddsAPI);

      await expect(eventSyncService.syncSportEvents('soccer_epl')).rejects.toThrow();
    });
  });
});


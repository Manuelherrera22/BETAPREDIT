/**
 * Events Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { eventsService } from '../services/events.service';
import { prisma } from '../config/database';
import { getTheOddsAPIService } from '../services/integrations/the-odds-api.service';
import { eventSyncService } from '../services/event-sync.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sport: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/integrations/the-odds-api.service', () => ({
  getTheOddsAPIService: jest.fn(),
}));

jest.mock('../services/event-sync.service', () => ({
  eventSyncService: {
    syncEventsFromOddsData: jest.fn(),
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

describe('EventsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLiveEvents', () => {
    it('should return live events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Team A vs Team B',
          status: 'LIVE',
          homeScore: 1,
          awayScore: 0,
        },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await eventsService.getLiveEvents({});

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'LIVE',
          },
        })
      );
      expect(result).toEqual(mockEvents);
    });

    it('should filter by sportId', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await eventsService.getLiveEvents({ sportId: 'sport-1' });

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'LIVE',
            sportId: 'sport-1',
          },
        })
      );
    });

    it('should limit results', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await eventsService.getLiveEvents({ limit: 10 });

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events from database', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Team A vs Team B',
          status: 'SCHEDULED',
          startTime: new Date(Date.now() + 3600000),
        },
      ];

      (getTheOddsAPIService as jest.Mock).mockReturnValue(null);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await eventsService.getUpcomingEvents({ useTheOddsAPI: false });

      expect(result).toEqual(mockEvents);
    });

    it('should sync events from The Odds API when enabled', async () => {
      const mockOddsAPI = {
        getOdds: jest.fn().mockResolvedValue([
          {
            id: 'odds-event-1',
            home_team: 'Team A',
            away_team: 'Team B',
            commence_time: new Date(Date.now() + 3600000).toISOString(),
          },
        ]),
      };

      (getTheOddsAPIService as jest.Mock).mockReturnValue(mockOddsAPI);
      (eventSyncService.syncEventsFromOddsData as jest.Mock).mockResolvedValue(undefined);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await eventsService.getUpcomingEvents({ useTheOddsAPI: true });

      expect(mockOddsAPI.getOdds).toHaveBeenCalled();
      expect(eventSyncService.syncEventsFromOddsData).toHaveBeenCalled();
    });
  });

  describe('getEventDetails', () => {
    it('should return event details', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        markets: [],
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

      const result = await eventsService.getEventDetails('event-1');

      expect(prisma.event.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'event-1',
          },
        })
      );
      expect(result).toEqual(mockEvent);
    });
  });
});


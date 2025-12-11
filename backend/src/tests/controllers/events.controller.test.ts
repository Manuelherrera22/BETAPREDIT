/**
 * Events Controller Tests
 * Tests for events API controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { eventsController } from '../../api/controllers/events.controller';
import { eventsService } from '../../services/events.service';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/events.service', () => ({
  eventsService: {
    getLiveEvents: jest.fn(),
    getUpcomingEvents: jest.fn(),
    getEventDetails: jest.fn(),
    syncEvents: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('EventsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
    } as Partial<Request>;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  describe('getLiveEvents', () => {
    it('should return live events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Team A vs Team B',
          status: 'LIVE',
          homeScore: 2,
          awayScore: 1,
        },
      ];

      (eventsService.getLiveEvents as jest.Mock).mockResolvedValue(mockEvents);
      mockReq.query = {};

      await eventsController.getLiveEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(eventsService.getLiveEvents).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvents,
        })
      );
    });

    it('should filter by sportId when provided', async () => {
      (eventsService.getLiveEvents as jest.Mock).mockResolvedValue([]);
      mockReq.query = { sportId: 'sport-1' };

      await eventsController.getLiveEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(eventsService.getLiveEvents).toHaveBeenCalledWith('sport-1');
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Team A vs Team B',
          startTime: new Date(Date.now() + 3600000),
          status: 'SCHEDULED',
        },
      ];

      (eventsService.getUpcomingEvents as jest.Mock).mockResolvedValue(mockEvents);
      mockReq.query = {};

      await eventsController.getUpcomingEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(eventsService.getUpcomingEvents).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvents,
        })
      );
    });
  });

  describe('getEventDetails', () => {
    it('should return event details', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(),
        status: 'SCHEDULED',
      };

      (eventsService.getEventDetails as jest.Mock).mockResolvedValue(mockEvent);
      mockReq.params = { eventId: 'event-1' };

      await eventsController.getEventDetails(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(eventsService.getEventDetails).toHaveBeenCalledWith('event-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvent,
        })
      );
    });

    it('should handle event not found', async () => {
      (eventsService.getEventDetails as jest.Mock).mockRejectedValue(
        new AppError('Event not found', 404)
      );
      mockReq.params = { eventId: 'non-existent' };

      await eventsController.getEventDetails(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('syncEvents', () => {
    it('should sync events successfully', async () => {
      (eventsService.syncEvents as jest.Mock).mockResolvedValue({
        synced: 10,
        errors: 0,
      });
      mockReq.body = {};

      await eventsController.syncEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(eventsService.syncEvents).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});


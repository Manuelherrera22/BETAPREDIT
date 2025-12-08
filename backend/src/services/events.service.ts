import { prisma } from '../config/database';
import { logger } from '../utils/logger';

class EventsService {
  async getLiveEvents(options: {
    sportId?: string;
    limit?: number;
  }) {
    const { sportId, limit = 50 } = options;

    const where: any = {
      status: 'LIVE',
    };

    if (sportId) {
      where.sportId = sportId;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        sport: true,
        markets: {
          where: {
            isActive: true,
            isSuspended: false,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    return events;
  }

  async getUpcomingEvents(options: {
    sportId?: string;
    date?: string;
    limit?: number;
  }) {
    const { sportId, date, limit = 50 } = options;

    const where: any = {
      status: 'SCHEDULED',
    };

    if (sportId) {
      where.sportId = sportId;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    } else {
      where.startTime = {
        gte: new Date(),
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        sport: true,
        markets: {
          where: {
            isActive: true,
            isSuspended: false,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    return events;
  }

  async getEventDetails(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sport: true,
        markets: {
          where: {
            isActive: true,
          },
          include: {
            odds: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  async getEventsBySport(
    sportId: string,
    options: {
      status?: string;
      limit?: number;
    }
  ) {
    const { status, limit = 50 } = options;

    const where: any = { sportId };
    if (status) {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        sport: true,
        markets: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    return events;
  }

  async searchEvents(query: string, options: { limit?: number }) {
    const { limit = 20 } = options;

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { homeTeam: { contains: query, mode: 'insensitive' } },
          { awayTeam: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        sport: true,
        markets: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    return events;
  }
}

export const eventsService = new EventsService();


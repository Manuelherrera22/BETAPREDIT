import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { eventSyncService } from './event-sync.service';

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
    useTheOddsAPI?: boolean; // Use The Odds API to fetch real events
  }) {
    const { sportId, date, limit = 50, useTheOddsAPI = true } = options;

    // If useTheOddsAPI is enabled, fetch from The Odds API and sync
    if (useTheOddsAPI) {
      try {
        const theOddsAPI = getTheOddsAPIService();
        if (!theOddsAPI) {
          logger.warn('The Odds API service not configured, using database only');
        } else {
          // Map sportId to The Odds API sport key (now async)
          const sportKey = await this.mapSportIdToTheOddsAPIKey(sportId);
          logger.debug(`Mapped sportId ${sportId} to The Odds API key: ${sportKey}`);
          
          // Fetch events from The Odds API
          const oddsEvents = await theOddsAPI.getOdds(sportKey, {
            regions: ['us', 'uk', 'eu'],
            markets: ['h2h'],
            oddsFormat: 'decimal',
          });

          if (oddsEvents && oddsEvents.length > 0) {
            logger.info(`Fetched ${oddsEvents.length} events from The Odds API for ${sportKey}`);
            // Sync events to database
            await eventSyncService.syncEventsFromOddsData(oddsEvents);

            // Now fetch from database (with synced events)
            const dbEvents = await this.getUpcomingEventsFromDB({ sportId, date, limit });
            logger.info(`Returning ${dbEvents.length} events from database after sync`);
            return dbEvents;
          } else {
            logger.info(`No events found in The Odds API for ${sportKey}, trying database`);
          }
        }
      } catch (error: any) {
        logger.error('Error fetching events from The Odds API, falling back to database:', error.message);
        // Fall through to database query
      }
    }

    // Fallback to database query
    return await this.getUpcomingEventsFromDB({ sportId, date, limit });
  }

  /**
   * Get upcoming events from database
   */
  private async getUpcomingEventsFromDB(options: {
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

  /**
   * Map internal sport ID to The Odds API sport key
   * Now searches in database for proper mapping
   */
  private async mapSportIdToTheOddsAPIKey(sportId?: string): Promise<string> {
    if (!sportId) {
      return 'soccer_epl'; // Default
    }

    try {
      // Try to find sport in database by ID
      const sport = await prisma.sport.findUnique({
        where: { id: sportId },
      });

      if (sport) {
        // If sport has a slug, use it directly (should match The Odds API key)
        if (sport.slug) {
          return sport.slug;
        }

        // If no slug, try to map by name
        const nameMapping: Record<string, string> = {
          'soccer': 'soccer_epl',
          'football': 'soccer_epl',
          'basketball': 'basketball_nba',
          'american football': 'americanfootball_nfl',
          'baseball': 'baseball_mlb',
          'tennis': 'tennis',
          'ice hockey': 'icehockey_nhl',
          'rugby': 'rugby_league_nrl',
        };

        const sportNameLower = sport.name.toLowerCase();
        for (const [name, key] of Object.entries(nameMapping)) {
          if (sportNameLower.includes(name)) {
            return key;
          }
        }
      }
    } catch (error: any) {
      logger.warn(`Error mapping sport ${sportId}:`, error.message);
    }

    // If sportId looks like a The Odds API key already (contains underscore), use it
    if (sportId.includes('_')) {
      return sportId;
    }

    // Default to soccer
    return 'soccer_epl';
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


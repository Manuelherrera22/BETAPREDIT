/**
 * Event Sync Service
 * Sincroniza eventos de The Odds API a Supabase
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';
import { AppError } from '../middleware/errorHandler';

interface SyncEventData {
  externalId: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
}

class EventSyncService {
  /**
   * Sincronizar un evento desde The Odds API a Supabase
   */
  async syncEventFromTheOddsAPI(
    externalId: string,
    sportKey: string,
    sportTitle: string,
    homeTeam: string,
    awayTeam: string,
    commenceTime: string
  ) {
    try {
      // Buscar o crear el deporte
      let sport = await prisma.sport.findFirst({
        where: {
          OR: [
            { slug: sportKey },
            { name: { contains: sportTitle, mode: 'insensitive' } },
          ],
        },
      });

      if (!sport) {
        sport = await prisma.sport.create({
          data: {
            name: sportTitle,
            slug: sportKey,
            isActive: true,
          },
        });
        logger.info(`Created new sport: ${sportTitle} (${sportKey})`);
      }

      // Buscar evento existente
      let event = await prisma.event.findFirst({
        where: {
          externalId: externalId,
        },
      });

      if (!event) {
        // Intentar buscar por nombres de equipos y fecha
        const commenceDate = new Date(commenceTime);
        const startOfDay = new Date(commenceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(commenceDate);
        endOfDay.setHours(23, 59, 59, 999);

        event = await prisma.event.findFirst({
          where: {
            sportId: sport.id,
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
            OR: [
              {
                homeTeam: { contains: homeTeam, mode: 'insensitive' },
                awayTeam: { contains: awayTeam, mode: 'insensitive' },
              },
              {
                homeTeam: { contains: awayTeam, mode: 'insensitive' },
                awayTeam: { contains: homeTeam, mode: 'insensitive' },
              },
            ],
          },
        });
      }

      // Crear evento si no existe
      if (!event) {
        event = await prisma.event.create({
          data: {
            externalId: externalId,
            sportId: sport.id,
            name: `${homeTeam} vs ${awayTeam}`,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            startTime: new Date(commenceTime),
            status: 'SCHEDULED',
          },
        });
        logger.info(`Created new event: ${homeTeam} vs ${awayTeam} (${externalId})`);
      } else {
        // Actualizar evento existente si es necesario
        if (event.externalId !== externalId) {
          event = await prisma.event.update({
            where: { id: event.id },
            data: {
              externalId: externalId,
              name: `${homeTeam} vs ${awayTeam}`,
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              startTime: new Date(commenceTime),
            },
          });
          logger.info(`Updated event: ${homeTeam} vs ${awayTeam} (${event.id})`);
        }
      }

      return event;
    } catch (error: any) {
      logger.error('Error syncing event from The Odds API:', error);
      throw new AppError('Failed to sync event', 500);
    }
  }

  /**
   * Sincronizar múltiples eventos desde The Odds API
   */
  async syncEventsFromOddsData(oddsEvents: any[]) {
    const syncedEvents = [];

    for (const oddsEvent of oddsEvents) {
      try {
        const event = await this.syncEventFromTheOddsAPI(
          oddsEvent.id,
          oddsEvent.sport_key || oddsEvent.sport_key,
          oddsEvent.sport_title || oddsEvent.sport_title,
          oddsEvent.home_team,
          oddsEvent.away_team,
          oddsEvent.commence_time
        );
        syncedEvents.push(event);
      } catch (error: any) {
        logger.warn(`Failed to sync event ${oddsEvent.id}:`, error.message);
        // Continuar con el siguiente evento
      }
    }

    logger.info(`Synced ${syncedEvents.length} events from The Odds API`);
    return syncedEvents;
  }

  /**
   * Sincronizar eventos de un deporte específico
   */
  async syncSportEvents(sportKey: string) {
    try {
      const theOddsAPI = getTheOddsAPIService();
      if (!theOddsAPI) {
        throw new AppError('The Odds API service not configured', 503);
      }

      // Obtener eventos del deporte
      const oddsEvents = await theOddsAPI.getOdds(sportKey, {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
        oddsFormat: 'decimal',
      });

      // Sincronizar eventos
      const syncedEvents = await this.syncEventsFromOddsData(oddsEvents);

      return syncedEvents;
    } catch (error: any) {
      logger.error(`Error syncing events for sport ${sportKey}:`, error);
      throw error;
    }
  }
}

export const eventSyncService = new EventSyncService();


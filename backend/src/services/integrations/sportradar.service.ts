/**
 * Sportradar Integration Service
 * Integrates with Sportradar APIs for:
 * - Real-time odds and events data
 * - Universal Fraud Detection System (UFDS)
 * - Match integrity monitoring
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { redisHelpers } from '../../config/redis';

interface SportradarConfig {
  apiKey: string;
  apiUrl: string;
  timeout?: number;
}

interface OddsUpdate {
  eventId: string;
  marketId: string;
  odds: Array<{
    selection: string;
    decimal: number;
    timestamp: string;
  }>;
}

interface IntegrityAlert {
  eventId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  pattern: string;
  timestamp: string;
}

class SportradarService {
  private client: AxiosInstance;
  private config: SportradarConfig;

  constructor(config: SportradarConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 5000, // 5 second timeout for low latency
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Sportradar API Request: ${config.method} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Sportradar API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Sportradar API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get real-time odds for an event
   * Low latency endpoint optimized for in-play betting
   */
  async getRealTimeOdds(eventId: string): Promise<OddsUpdate> {
    try {
      // Try cache first (very short TTL for real-time data)
      const cacheKey = `sportradar:odds:${eventId}`;
      const cached = await redisHelpers.getCachedOdds(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/events/${eventId}/odds`, {
        params: {
          format: 'json',
          realtime: true,
        },
      });

      const oddsUpdate: OddsUpdate = {
        eventId,
        marketId: response.data.market_id,
        odds: response.data.odds.map((odd: any) => ({
          selection: odd.selection,
          decimal: odd.decimal,
          timestamp: new Date().toISOString(),
        })),
      };

      // Cache for 5 seconds only (real-time data)
      await redisHelpers.cacheOdds(cacheKey, oddsUpdate, 5);

      return oddsUpdate;
    } catch (error) {
      logger.error(`Error fetching real-time odds for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get event details with metadata
   */
  async getEventDetails(eventId: string) {
    try {
      const response = await this.client.get(`/events/${eventId}`, {
        params: {
          format: 'json',
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        startTime: response.data.scheduled,
        status: response.data.status,
        homeTeam: response.data.competitors?.find((c: any) => c.home)?.name,
        awayTeam: response.data.competitors?.find((c: any) => !c.home)?.name,
        metadata: response.data,
      };
    } catch (error) {
      logger.error(`Error fetching event details for ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get live events (in-play)
   */
  async getLiveEvents(sportId?: string) {
    try {
      const response = await this.client.get('/events/live', {
        params: {
          format: 'json',
          sport_id: sportId,
        },
      });

      return response.data.events || [];
    } catch (error) {
      logger.error('Error fetching live events:', error);
      throw error;
    }
  }

  /**
   * Check integrity using UFDS (Universal Fraud Detection System)
   * This would integrate with Sportradar's UFDS API
   */
  async checkIntegrity(eventId: string, betPatterns: any[]): Promise<IntegrityAlert[]> {
    try {
      const response = await this.client.post('/integrity/ufds/check', {
        event_id: eventId,
        bet_patterns: betPatterns,
      });

      return response.data.alerts || [];
    } catch (error) {
      logger.error(`Error checking integrity for event ${eventId}:`, error);
      // Return empty array if service unavailable (fail gracefully)
      return [];
    }
  }

  /**
   * Subscribe to real-time odds updates via WebSocket/SSE
   * This would establish a persistent connection for low-latency updates
   */
  async subscribeToOddsUpdates(eventIds: string[], callback: (update: OddsUpdate) => void) {
    // In production, this would use WebSocket or Server-Sent Events
    // For now, we'll use polling with short intervals
    const interval = setInterval(async () => {
      for (const eventId of eventIds) {
        try {
          const update = await this.getRealTimeOdds(eventId);
          callback(update);
        } catch (error) {
          logger.error(`Error in odds subscription for ${eventId}:`, error);
        }
      }
    }, 1000); // Poll every second for low latency

    return () => clearInterval(interval);
  }
}

// Factory function to create Sportradar service instance
export function createSportradarService(): SportradarService | null {
  const apiKey = process.env.SPORTRADAR_API_KEY;
  const apiUrl = process.env.SPORTRADAR_API_URL || 'https://api.sportradar.com';

  if (!apiKey) {
    logger.warn('Sportradar API key not configured. Service will not be available.');
    return null;
  }

  return new SportradarService({
    apiKey,
    apiUrl,
    timeout: 5000, // 5 seconds for low latency
  });
}

export const sportradarService = createSportradarService();


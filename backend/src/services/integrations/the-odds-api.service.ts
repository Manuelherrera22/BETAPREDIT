/**
 * The Odds API Integration Service
 * Integrates with The Odds API for:
 * - Comparing odds from multiple bookmakers (Bet365, Betfair, Pinnacle, etc.)
 * - Real-time odds updates
 * - Value bet detection
 * - Best odds finding
 * 
 * Documentation: https://the-odds-api.com
 * API URL: https://api.the-odds-api.com/v4
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { redisHelpers } from '../../config/redis';

interface TheOddsAPIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface Bookmaker {
  key: string; // e.g., "bet365", "betfair", "pinnacle"
  title: string;
  last_update: string;
}

interface Market {
  key: string; // e.g., "h2h", "spreads", "totals"
  last_update: string;
  outcomes: Array<{
    name: string;
    price: number; // Decimal odds
    point?: number; // For spreads/totals
  }>;
}

interface OddsData {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Market[];
  }>;
}

interface BestOdds {
  selection: string;
  bestOdds: number;
  bestBookmaker: string;
  allOdds: Array<{
    bookmaker: string;
    odds: number;
  }>;
  averageOdds: number;
  maxDifference: number;
}

class TheOddsAPIService {
  private client: AxiosInstance;
  private config: TheOddsAPIConfig;

  constructor(config: TheOddsAPIConfig) {
    this.config = config;
    const baseUrl = config.baseUrl || 'https://api.the-odds-api.com/v4';
    
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: config.timeout || 10000,
      params: {
        apiKey: config.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`The Odds API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('The Odds API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Log remaining requests
        const remaining = response.headers['x-requests-remaining'];
        const used = response.headers['x-requests-used'];
        if (remaining) {
          logger.debug(`The Odds API: ${remaining} requests remaining (used: ${used})`);
        }
        return response;
      },
      (error) => {
        logger.error('The Odds API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get available sports
   */
  async getSports(): Promise<Array<{ key: string; title: string; active: boolean }>> {
    try {
      // Try cache first (but don't fail if Redis is unavailable)
      let cached: string | null = null;
      try {
        const cacheKey = 'theodds:sports';
        cached = await redisHelpers.get(cacheKey);
        if (cached) {
          logger.debug('Sports loaded from cache');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Cache not available, fetching from API');
      }

      // Fetch from API
      const response = await this.client.get('/sports');
      const sports = response.data;

      // Try to cache (but don't fail if Redis is unavailable)
      try {
        const cacheKey = 'theodds:sports';
        await redisHelpers.set(cacheKey, JSON.stringify(sports), 86400);
      } catch (cacheError) {
        logger.debug('Could not cache sports (Redis unavailable)');
      }

      return sports;
    } catch (error: any) {
      logger.error('Error fetching sports from The Odds API:', error);
      if (error.response) {
        logger.error('API Error:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      return [];
    }
  }

  /**
   * Get odds for a specific sport
   */
  async getOdds(
    sport: string,
    options: {
      regions?: string[]; // e.g., ['us', 'uk', 'eu']
      markets?: string[]; // e.g., ['h2h', 'spreads', 'totals']
      oddsFormat?: 'decimal' | 'american';
      dateFormat?: 'iso' | 'unix';
    } = {}
  ): Promise<OddsData[]> {
    try {
      const {
        regions = ['us', 'uk', 'eu'],
        markets = ['h2h', 'spreads', 'totals'],
        oddsFormat = 'decimal',
        dateFormat = 'iso',
      } = options;

      const cacheKey = `theodds:odds:${sport}:${regions.join(',')}:${markets.join(',')}`;
      const cached = await redisHelpers.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.client.get(`/sports/${sport}/odds`, {
        params: {
          regions: regions.join(','),
          markets: markets.join(','),
          oddsFormat,
          dateFormat,
        },
      });

      const odds = response.data;

      // Cache for 1 minute (odds change frequently)
      await redisHelpers.set(cacheKey, JSON.stringify(odds), 60);

      return odds;
    } catch (error: any) {
      logger.error('Error fetching odds from The Odds API:', error);
      return [];
    }
  }

  /**
   * Get odds for a specific event
   */
  async getEventOdds(
    sport: string,
    eventId: string,
    options: {
      regions?: string[];
      markets?: string[];
      oddsFormat?: 'decimal' | 'american';
    } = {}
  ): Promise<OddsData | null> {
    try {
      const allOdds = await this.getOdds(sport, options);
      const event = allOdds.find((o) => o.id === eventId);
      return event || null;
    } catch (error: any) {
      logger.error('Error fetching event odds:', error);
      return null;
    }
  }

  /**
   * Compare odds across all bookmakers and find best odds
   */
  async compareOdds(
    sport: string,
    eventId: string,
    market: string = 'h2h'
  ): Promise<{
    event: OddsData;
    comparisons: Record<string, BestOdds>;
    bestBookmakers: Record<string, string>;
  } | null> {
    try {
      const event = await this.getEventOdds(sport, eventId, {
        markets: [market],
      });

      if (!event) {
        return null;
      }

      const comparisons: Record<string, BestOdds> = {};
      const bestBookmakers: Record<string, string> = {};

      // Find the market in the first bookmaker (all should have same markets)
      const firstBookmaker = event.bookmakers[0];
      const targetMarket = firstBookmaker?.markets.find((m) => m.key === market);

      if (!targetMarket) {
        return { event, comparisons, bestBookmakers };
      }

      // For each outcome/selection, compare odds across all bookmakers
      targetMarket.outcomes.forEach((outcome) => {
        const selection = outcome.name;
        const allOddsForSelection: Array<{ bookmaker: string; odds: number }> = [];

        // Collect odds from all bookmakers
        event.bookmakers.forEach((bookmaker) => {
          const bookmakerMarket = bookmaker.markets.find((m) => m.key === market);
          const bookmakerOutcome = bookmakerMarket?.outcomes.find(
            (o) => o.name === selection
          );

          if (bookmakerOutcome) {
            allOddsForSelection.push({
              bookmaker: bookmaker.title,
              odds: bookmakerOutcome.price,
            });
          }
        });

        if (allOddsForSelection.length === 0) {
          return;
        }

        // Find best odds
        const best = allOddsForSelection.reduce((best, current) =>
          current.odds > best.odds ? current : best
        );

        // Calculate average and max difference
        const averageOdds =
          allOddsForSelection.reduce((sum, o) => sum + o.odds, 0) /
          allOddsForSelection.length;
        const maxDifference =
          Math.max(...allOddsForSelection.map((o) => o.odds)) -
          Math.min(...allOddsForSelection.map((o) => o.odds));

        comparisons[selection] = {
          selection,
          bestOdds: best.odds,
          bestBookmaker: best.bookmaker,
          allOdds: allOddsForSelection,
          averageOdds,
          maxDifference,
        };

        bestBookmakers[selection] = best.bookmaker;
      });

      return { event, comparisons, bestBookmakers };
    } catch (error: any) {
      logger.error('Error comparing odds:', error);
      return null;
    }
  }

  /**
   * Detect value bets by comparing odds with predicted probability
   */
  async detectValueBets(
    sport: string,
    eventId: string,
    predictedProbabilities: Record<string, number>, // e.g., { "Team A": 0.45, "Team B": 0.35, "Draw": 0.20 }
    minValue: number = 0.05 // Minimum 5% value
  ): Promise<
    Array<{
      selection: string;
      bookmaker: string;
      odds: number;
      predictedProbability: number;
      impliedProbability: number;
      value: number; // Percentage value
      expectedValue: number;
    }>
  > {
    try {
      const comparison = await this.compareOdds(sport, eventId, 'h2h');

      if (!comparison) {
        return [];
      }

      const valueBets: Array<{
        selection: string;
        bookmaker: string;
        odds: number;
        predictedProbability: number;
        impliedProbability: number;
        value: number;
        expectedValue: number;
      }> = [];

      Object.entries(comparison.comparisons).forEach(([selection, bestOdds]) => {
        const predictedProb = predictedProbabilities[selection];
        if (!predictedProb) {
          return;
        }

        // Calculate value: (predicted_prob * odds) - 1
        const value = predictedProb * bestOdds.bestOdds - 1;

        if (value >= minValue) {
          const impliedProb = 1 / bestOdds.bestOdds;
          const expectedValue = value * 100; // As percentage

          valueBets.push({
            selection,
            bookmaker: bestOdds.bestBookmaker,
            odds: bestOdds.bestOdds,
            predictedProbability: predictedProb,
            impliedProbability: impliedProb,
            value,
            expectedValue,
          });
        }
      });

      // Sort by value (highest first)
      return valueBets.sort((a, b) => b.value - a.value);
    } catch (error: any) {
      logger.error('Error detecting value bets:', error);
      return [];
    }
  }

  /**
   * Get upcoming events for a sport
   */
  async getUpcomingEvents(
    sport: string,
    options: {
      regions?: string[];
      markets?: string[];
    } = {}
  ): Promise<OddsData[]> {
    return await this.getOdds(sport, options);
  }

  /**
   * Search events by team name
   */
  async searchEvents(
    sport: string,
    teamName: string,
    options: {
      regions?: string[];
      markets?: string[];
    } = {}
  ): Promise<OddsData[]> {
    const allEvents = await this.getOdds(sport, options);
    const searchTerm = teamName.toLowerCase();

    return allEvents.filter(
      (event) =>
        event.home_team.toLowerCase().includes(searchTerm) ||
        event.away_team.toLowerCase().includes(searchTerm)
    );
  }
}

// Export singleton instance
let theOddsAPIServiceInstance: TheOddsAPIService | null = null;

export function createTheOddsAPIService(config: TheOddsAPIConfig): TheOddsAPIService {
  if (!theOddsAPIServiceInstance) {
    theOddsAPIServiceInstance = new TheOddsAPIService(config);
  }
  return theOddsAPIServiceInstance;
}

export function getTheOddsAPIService(): TheOddsAPIService | null {
  return theOddsAPIServiceInstance;
}

// Initialize function that can be called after dotenv.config()
export function initializeTheOddsAPIService() {
  if (theOddsAPIServiceInstance) {
    return; // Already initialized
  }

  if (process.env.THE_ODDS_API_KEY) {
    createTheOddsAPIService({
      apiKey: process.env.THE_ODDS_API_KEY,
      baseUrl: process.env.THE_ODDS_API_BASE_URL,
      timeout: parseInt(process.env.THE_ODDS_API_TIMEOUT || '10000'),
    });
    logger.info('The Odds API service initialized');
  } else {
    logger.warn('The Odds API key not found in environment variables');
  }
}

// Try to initialize if env vars are already loaded (for cases where dotenv was called before import)
if (process.env.THE_ODDS_API_KEY) {
  initializeTheOddsAPIService();
}


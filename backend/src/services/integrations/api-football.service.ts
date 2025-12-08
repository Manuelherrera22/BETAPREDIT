/**
 * API-Football Integration Service
 * Integrates with API-Football for:
 * - Historical match data
 * - Team and player statistics
 * - Head-to-head records
 * - Injuries and suspensions
 * - League standings
 * 
 * Documentation: https://www.api-football.com/documentation-v3
 * API URL: https://v3.football.api-sports.io
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { redisHelpers } from '../../config/redis';

interface APIFootballConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface Match {
  fixture: {
    id: number;
    date: string;
    venue: {
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number;
    };
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface HeadToHead {
  fixture: {
    id: number;
    date: string;
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    fulltime: {
      home: number;
      away: number;
    };
  };
}

interface TeamStatistics {
  team: Team;
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  age: number;
}

interface Injury {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  fixture: {
    id: number;
    date: string;
  };
  type: string; // 'injured' | 'suspended'
  reason: string;
}

class APIFootballService {
  private client: AxiosInstance;
  private config: APIFootballConfig;
  private baseUrl: string;

  constructor(config: APIFootballConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://v3.football.api-sports.io';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'x-apisports-key': this.config.apiKey,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (reqConfig) => {
        logger.debug(`API-Football Request: ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`);
        return reqConfig;
      },
      (error) => {
        logger.error('API-Football Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log remaining requests
        const remaining = response.headers['x-ratelimit-requests-remaining'];
        if (remaining) {
          logger.debug(`API-Football: ${remaining} requests remaining`);
        }
        return response;
      },
      (error) => {
        logger.error('API-Football Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get fixtures (matches) for a league/season
   */
  async getFixtures(options: {
    league?: number;
    season?: number;
    team?: number;
    date?: string;
    next?: number; // Next N fixtures
    last?: number; // Last N fixtures
  }): Promise<Match[]> {
    try {
      const cacheKey = `apifootball:fixtures:${JSON.stringify(options)}`;
      let cached: string | null = null;
      
      try {
        cached = await redisHelpers.get(cacheKey);
        if (cached) {
          logger.debug('Fixtures loaded from cache');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Cache not available, fetching from API');
      }

      const params: any = {};
      if (options.league) params.league = options.league;
      if (options.season) params.season = options.season;
      if (options.team) params.team = options.team;
      if (options.date) params.date = options.date;
      if (options.next) params.next = options.next;
      if (options.last) params.last = options.last;

      const response = await this.client.get('/fixtures', { params });
      const fixtures = response.data.response || [];

      // Cache for 1 hour (fixtures don't change often)
      try {
        await redisHelpers.set(cacheKey, JSON.stringify(fixtures), 3600);
      } catch (cacheError) {
        logger.debug('Could not cache fixtures');
      }

      return fixtures;
    } catch (error: any) {
      logger.error('Error fetching fixtures from API-Football:', error);
      return [];
    }
  }

  /**
   * Get head-to-head records between two teams
   */
  async getHeadToHead(team1Id: number, team2Id: number, last: number = 10): Promise<HeadToHead[]> {
    try {
      const cacheKey = `apifootball:h2h:${team1Id}:${team2Id}:${last}`;
      let cached: string | null = null;
      
      try {
        cached = await redisHelpers.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // Ignore cache errors
      }

      const response = await this.client.get('/fixtures/headtohead', {
        params: {
          h2h: `${team1Id}-${team2Id}`,
          last,
        },
      });

      const h2h = response.data.response || [];

      // Cache for 24 hours (H2H doesn't change often)
      try {
        await redisHelpers.set(cacheKey, JSON.stringify(h2h), 86400);
      } catch (cacheError) {
        // Ignore
      }

      return h2h;
    } catch (error: any) {
      logger.error('Error fetching head-to-head from API-Football:', error);
      return [];
    }
  }

  /**
   * Get team statistics for a league/season
   */
  async getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<TeamStatistics | null> {
    try {
      const cacheKey = `apifootball:teamstats:${teamId}:${leagueId}:${season}`;
      let cached: string | null = null;
      
      try {
        cached = await redisHelpers.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // Ignore
      }

      const response = await this.client.get('/teams/statistics', {
        params: {
          team: teamId,
          league: leagueId,
          season,
        },
      });

      const stats = response.data.response || null;

      // Cache for 6 hours
      if (stats) {
        try {
          await redisHelpers.set(cacheKey, JSON.stringify(stats), 21600);
        } catch (cacheError) {
          // Ignore
        }
      }

      return stats;
    } catch (error: any) {
      logger.error('Error fetching team statistics from API-Football:', error);
      return null;
    }
  }

  /**
   * Get injuries and suspensions
   */
  async getInjuries(options: {
    league?: number;
    season?: number;
    team?: number;
    date?: string;
  }): Promise<Injury[]> {
    try {
      const cacheKey = `apifootball:injuries:${JSON.stringify(options)}`;
      let cached: string | null = null;
      
      try {
        cached = await redisHelpers.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // Ignore
      }

      const params: any = {};
      if (options.league) params.league = options.league;
      if (options.season) params.season = options.season;
      if (options.team) params.team = options.team;
      if (options.date) params.date = options.date;

      const response = await this.client.get('/injuries', { params });
      const injuries = response.data.response || [];

      // Cache for 1 hour (injuries change frequently)
      try {
        await redisHelpers.set(cacheKey, JSON.stringify(injuries), 3600);
      } catch (cacheError) {
        // Ignore
      }

      return injuries;
    } catch (error: any) {
      logger.error('Error fetching injuries from API-Football:', error);
      return [];
    }
  }

  /**
   * Get league standings
   */
  async getStandings(leagueId: number, season: number): Promise<any> {
    try {
      const cacheKey = `apifootball:standings:${leagueId}:${season}`;
      let cached: string | null = null;
      
      try {
        cached = await redisHelpers.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // Ignore
      }

      const response = await this.client.get('/standings', {
        params: {
          league: leagueId,
          season,
        },
      });

      const standings = response.data.response || [];

      // Cache for 6 hours
      try {
        await redisHelpers.set(cacheKey, JSON.stringify(standings), 21600);
      } catch (cacheError) {
        // Ignore
      }

      return standings;
    } catch (error: any) {
      logger.error('Error fetching standings from API-Football:', error);
      return [];
    }
  }

  /**
   * Search teams by name
   */
  async searchTeams(query: string): Promise<Team[]> {
    try {
      const response = await this.client.get('/teams', {
        params: {
          search: query,
        },
      });

      return response.data.response || [];
    } catch (error: any) {
      logger.error('Error searching teams from API-Football:', error);
      return [];
    }
  }
}

// Export singleton instance
let apiFootballServiceInstance: APIFootballService | null = null;

export function createAPIFootballService(config: APIFootballConfig): APIFootballService {
  if (!apiFootballServiceInstance) {
    apiFootballServiceInstance = new APIFootballService(config);
  }
  return apiFootballServiceInstance;
}

export function getAPIFootballService(): APIFootballService | null {
  return apiFootballServiceInstance;
}

// Initialize with environment variables if available
export function initializeAPIFootballService() {
  if (apiFootballServiceInstance) {
    return; // Already initialized
  }

  if (process.env.API_FOOTBALL_KEY) {
    createAPIFootballService({
      apiKey: process.env.API_FOOTBALL_KEY,
      baseUrl: process.env.API_FOOTBALL_BASE_URL,
      timeout: parseInt(process.env.API_FOOTBALL_TIMEOUT || '10000'),
    });
    logger.info('API-Football service initialized');
  } else {
    logger.warn('API-Football key not found in environment variables');
  }
}

// Try to initialize if env vars are already loaded
if (process.env.API_FOOTBALL_KEY) {
  initializeAPIFootballService();
}


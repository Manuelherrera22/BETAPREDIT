/**
 * Kalshi Integration Service
 * Integrates with Kalshi Prediction Market API for:
 * - Real-time market data and probabilities
 * - Event predictions and market sentiment
 * - Trading data and contract prices
 * 
 * Documentation: https://docs.kalshi.com
 */
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { redisHelpers } from '../../config/redis';

interface KalshiConfig {
  apiKey: string;
  apiSecret: string; // RSA private key
  baseUrl?: string; // 'https://api.demo.kalshi.com', 'https://api.kalshi.com', or 'https://api.elections.kalshi.com'
  timeout?: number;
}

interface ExchangeStatus {
  exchange_active: boolean;
  trading_active: boolean;
  exchange_estimated_resume_time?: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  subtitle?: string;
  category: string;
  series_ticker: string;
  start_time: string;
  end_time: string;
  status: string;
  strike_date?: string;
}

interface KalshiMarket {
  market_ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  yes_bid: number; // Price to buy YES (0-100)
  yes_ask: number; // Price to sell YES (0-100)
  no_bid: number; // Price to buy NO (0-100)
  no_ask: number; // Price to sell NO (0-100)
  last_price: number; // Last traded price (0-100)
  previous_price?: number;
  volume: number;
  open_interest: number;
  liquidity: number;
}

interface KalshiSeries {
  series_ticker: string;
  title: string;
  category: string;
  markets_count: number;
}

class KalshiService {
  private client: AxiosInstance;
  private config: KalshiConfig;
  private baseUrl: string;

  constructor(config: KalshiConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.demo.kalshi.com/trade-api/v2';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        // Skip authentication for public endpoints
        const publicEndpoints = ['/exchange/status'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        );

        if (!isPublicEndpoint && this.config.apiKey !== 'public' && !this.config.apiSecret.includes('DUMMY')) {
          // Generate authentication headers
          const timestamp = Date.now().toString();
          const path = config.url || '';
          const method = (config.method || 'GET').toUpperCase();
          const body = config.data ? JSON.stringify(config.data) : '';

          // Create signature
          const signature = this.generateSignature(
            method,
            path,
            timestamp,
            body
          );

          // Add authentication headers
          config.headers['KALSHI-ACCESS-KEY'] = this.config.apiKey;
          config.headers['KALSHI-ACCESS-TIMESTAMP'] = timestamp;
          config.headers['KALSHI-ACCESS-SIGNATURE'] = signature;
        }

        logger.debug(`Kalshi API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Kalshi API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Kalshi API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate RSA-PSS signature for Kalshi API authentication
   */
  private generateSignature(
    method: string,
    path: string,
    timestamp: string,
    body: string
  ): string {
    try {
      // Skip signature for public endpoints or if using dummy key
      if (this.config.apiKey === 'public' || this.config.apiSecret.includes('DUMMY')) {
        return '';
      }

      // Create the string to sign
      const stringToSign = `${method}\n${path}\n${timestamp}\n${body}`;

      // Load private key
      const privateKey = this.config.apiSecret.replace(/\\n/g, '\n');

      // Sign with RSA-PSS
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(stringToSign);
      sign.end();

      const signature = sign.sign(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
        },
        'base64'
      );

      return signature;
    } catch (error) {
      logger.error('Error generating Kalshi signature:', error);
      throw new Error('Failed to generate signature');
    }
  }

  /**
   * Create API key programmatically
   * Note: This requires authentication with existing credentials
   */
  async createApiKey(name: string, publicKey: string): Promise<{ api_key_id: string }> {
    try {
      const response = await this.client.post('/api-keys', {
        name,
        public_key: publicKey,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating Kalshi API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  /**
   * Get exchange status
   * Public endpoint - no authentication required
   */
  async getExchangeStatus(): Promise<ExchangeStatus> {
    try {
      // This endpoint doesn't require authentication
      const response = await axios.get(`${this.baseUrl}/exchange/status`, {
        timeout: this.config.timeout || 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Kalshi exchange status:', error);
      throw new Error('Failed to fetch exchange status');
    }
  }

  /**
   * Get all available series (categories of events)
   */
  async getSeries(): Promise<KalshiSeries[]> {
    try {
      const cacheKey = 'kalshi:series';
      const cached = await redisHelpers.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.client.get('/series');
      const series = response.data.series || [];

      // Cache for 1 hour
      await redisHelpers.set(cacheKey, JSON.stringify(series), 3600);

      return series;
    } catch (error: any) {
      logger.error('Error fetching Kalshi series:', error);
      // Return empty array on error to not break the app
      return [];
    }
  }

  /**
   * Get events in a series
   */
  async getEvents(seriesTicker?: string, limit: number = 50): Promise<KalshiEvent[]> {
    try {
      const cacheKey = `kalshi:events:${seriesTicker || 'all'}:${limit}`;
      const cached = await redisHelpers.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const params: any = { limit };
      if (seriesTicker) {
        params.series_ticker = seriesTicker;
      }

      const response = await this.client.get('/events', { params });
      const events = response.data.events || [];

      // Cache for 5 minutes (events change frequently)
      await redisHelpers.set(cacheKey, JSON.stringify(events), 300);

      return events;
    } catch (error: any) {
      logger.error('Error fetching Kalshi events:', error);
      return [];
    }
  }

  /**
   * Get markets for an event
   */
  async getEventMarkets(eventTicker: string): Promise<KalshiMarket[]> {
    try {
      const cacheKey = `kalshi:markets:${eventTicker}`;
      const cached = await redisHelpers.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.client.get(`/events/${eventTicker}/markets`);
      const markets = response.data.markets || [];

      // Cache for 1 minute (market data changes frequently)
      await redisHelpers.set(cacheKey, JSON.stringify(markets), 60);

      return markets;
    } catch (error: any) {
      logger.error('Error fetching Kalshi markets:', error);
      return [];
    }
  }

  /**
   * Get market details with order book
   */
  async getMarketDetails(marketTicker: string): Promise<KalshiMarket | null> {
    try {
      const cacheKey = `kalshi:market:${marketTicker}`;
      const cached = await redisHelpers.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.client.get(`/markets/${marketTicker}`);
      const market = response.data.market;

      if (!market) {
        return null;
      }

      // Cache for 30 seconds (very dynamic data)
      await redisHelpers.set(cacheKey, JSON.stringify(market), 30);

      return market;
    } catch (error: any) {
      logger.error('Error fetching Kalshi market details:', error);
      return null;
    }
  }

  /**
   * Convert Kalshi market price (0-100) to probability (0-1)
   */
  priceToProbability(price: number): number {
    return price / 100;
  }

  /**
   * Convert probability (0-1) to Kalshi market price (0-100)
   */
  probabilityToPrice(probability: number): number {
    return probability * 100;
  }

  /**
   * Get market probability from last price
   */
  getMarketProbability(market: KalshiMarket): {
    yes: number; // Probability of YES (0-1)
    no: number; // Probability of NO (0-1)
    confidence: number; // Based on liquidity
  } {
    const yesProb = this.priceToProbability(market.last_price || market.yes_bid || 50);
    const noProb = 1 - yesProb;
    
    // Confidence based on liquidity (higher liquidity = higher confidence)
    const confidence = Math.min(1, market.liquidity / 10000); // Normalize to 0-1

    return {
      yes: yesProb,
      no: noProb,
      confidence,
    };
  }

  /**
   * Search events by keyword
   */
  async searchEvents(query: string, limit: number = 20): Promise<KalshiEvent[]> {
    try {
      const response = await this.client.get('/events', {
        params: {
          limit,
          search: query,
        },
      });

      return response.data.events || [];
    } catch (error: any) {
      logger.error('Error searching Kalshi events:', error);
      return [];
    }
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(category: string, limit: number = 50): Promise<KalshiEvent[]> {
    try {
      const response = await this.client.get('/events', {
        params: {
          limit,
          category,
        },
      });

      return response.data.events || [];
    } catch (error: any) {
      logger.error('Error fetching Kalshi events by category:', error);
      return [];
    }
  }

  /**
   * Get trending markets (high volume)
   */
  async getTrendingMarkets(limit: number = 20): Promise<KalshiMarket[]> {
    try {
      // Get all events and their markets, then sort by volume
      const events = await this.getEvents(undefined, 100);
      const allMarkets: KalshiMarket[] = [];

      for (const event of events.slice(0, 10)) { // Limit to first 10 events for performance
        const markets = await this.getEventMarkets(event.event_ticker);
        allMarkets.push(...markets);
      }

      // Sort by volume and return top N
      return allMarkets
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit);
    } catch (error: any) {
      logger.error('Error fetching trending Kalshi markets:', error);
      return [];
    }
  }

  /**
   * Compare Kalshi probabilities with our ML predictions
   */
  async compareWithMLPrediction(
    eventTicker: string,
    marketTicker: string,
    mlProbability: number
  ): Promise<{
    kalshiProbability: number;
    mlProbability: number;
    difference: number;
    valueOpportunity: number; // Positive if ML thinks higher probability
  }> {
    try {
      const market = await this.getMarketDetails(marketTicker);
      
      if (!market) {
        throw new Error('Market not found');
      }

      const kalshiProb = this.getMarketProbability(market).yes;
      const difference = mlProbability - kalshiProb;
      const valueOpportunity = difference * 100; // Percentage difference

      return {
        kalshiProbability: kalshiProb,
        mlProbability,
        difference,
        valueOpportunity,
      };
    } catch (error: any) {
      logger.error('Error comparing with ML prediction:', error);
      throw error;
    }
  }
}

// Export singleton instance
let kalshiServiceInstance: KalshiService | null = null;

export function createKalshiService(config: KalshiConfig): KalshiService {
  if (!kalshiServiceInstance) {
    kalshiServiceInstance = new KalshiService(config);
  }
  return kalshiServiceInstance;
}

export function getKalshiService(): KalshiService | null {
  return kalshiServiceInstance;
}

// Initialize with environment variables if available
// Note: Exchange status endpoint works without auth, but other endpoints need credentials
const kalshiBaseUrl = process.env.KALSHI_BASE_URL || 'https://api.demo.kalshi.com';
const baseUrl = kalshiBaseUrl.endsWith('/trade-api/v2')
  ? kalshiBaseUrl
  : `${kalshiBaseUrl}/trade-api/v2`;

if (process.env.KALSHI_API_KEY && process.env.KALSHI_API_SECRET) {
  createKalshiService({
    apiKey: process.env.KALSHI_API_KEY,
    apiSecret: process.env.KALSHI_API_SECRET,
    baseUrl,
    timeout: parseInt(process.env.KALSHI_TIMEOUT || '10000'),
  });
  logger.info(`Kalshi service initialized with authentication (${kalshiBaseUrl})`);
} else {
  // Initialize with dummy credentials for public endpoints only
  createKalshiService({
    apiKey: 'public',
    apiSecret: '-----BEGIN RSA PRIVATE KEY-----\nDUMMY\n-----END RSA PRIVATE KEY-----',
    baseUrl,
    timeout: parseInt(process.env.KALSHI_TIMEOUT || '10000'),
  });
  logger.warn(`Kalshi service initialized for public endpoints only (${kalshiBaseUrl}) - no auth credentials`);
}


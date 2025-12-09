/**
 * The Odds API Service
 * Frontend service for interacting with The Odds API endpoints
 * Uses Supabase Edge Functions in production, backend API in development
 */

import api from './api';
import { isSupabaseConfigured } from '../config/supabase';
import apiCache from '../utils/apiCache';
import apiUsageMonitor from '../utils/apiUsageMonitor';

// Get Supabase Functions URL
const getSupabaseFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
};

export interface Sport {
  key: string;
  title: string;
  active: boolean;
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface OddsComparison {
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

export interface ValueBet {
  selection: string;
  bookmaker: string;
  odds: number;
  predictedProbability: number;
  impliedProbability: number;
  value: number;
  expectedValue: number;
}

class TheOddsAPIService {
  /**
   * Get all available sports
   */
  async getSports(): Promise<Sport[]> {
    try {
      // Use Supabase Edge Function if available, otherwise use backend API
      const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
      const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && import.meta.env.PROD;
      
      if (useSupabase) {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!anonKey) {
          console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
          return [];
        }
        
        // Use direct fetch with proper headers
        const response = await fetch(`${supabaseFunctionsUrl}/the-odds-api/sports`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error ${response.status} en Edge Function:`, errorText);
          return [];
        }
        
        const result = await response.json();
        return result.success ? result.data : [];
      } else {
        const { data } = await api.get('/the-odds-api/sports');
        const sportsData = data.success ? data.data : [];
        
        // Record API call
        apiUsageMonitor.recordCall('getSports');
        
        // Cache for 1 hour
        if (sportsData.length > 0) {
          apiCache.set('theodds_sports', sportsData, 3600);
        }
        
        return sportsData;
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
      return [];
    }
  }

  /**
   * Get odds for a specific sport
   */
  async getOdds(
    sport: string,
    options: {
      regions?: string[];
      markets?: string[];
      oddsFormat?: 'decimal' | 'american';
      sync?: boolean; // Sincronizar eventos a Supabase
    } = {}
  ): Promise<OddsEvent[]> {
    try {
      const { regions = ['us', 'uk', 'eu'], markets = ['h2h'], oddsFormat = 'decimal', sync = true } = options;

      // Check cache first (odds change frequently, but cache for 2 minutes)
      const cacheKey = apiCache.generateKey('theodds_odds', { sport, regions, markets, oddsFormat });
      const cached = apiCache.get<OddsEvent[]>(cacheKey);
      if (cached) {
        return cached; // Cache hit - no API call needed
      }

      // Check if we can make API call
      if (!apiUsageMonitor.canMakeCall()) {
        console.warn('⚠️ API usage limit reached. Using cached data if available.');
        return cached || [];
      }

      // Use Supabase Edge Function if available, otherwise use backend API
      const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
      const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && import.meta.env.PROD;
      
      if (useSupabase) {
        const params = new URLSearchParams({
          regions: regions.join(','),
          markets: markets.join(','),
          oddsFormat,
        });
        if (sync) params.set('sync', 'true');
        
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!anonKey) {
          console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
          return [];
        }
        
        const response = await fetch(`${supabaseFunctionsUrl}/the-odds-api/sports/${sport}/odds?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error ${response.status} en Edge Function:`, errorText);
          return [];
        }
        
        const result = await response.json();
        return result.success ? result.data : [];
      } else {
        const { data } = await api.get(`/the-odds-api/sports/${sport}/odds`, {
          params: {
            regions: regions.join(','),
            markets: markets.join(','),
            oddsFormat,
            sync: sync ? 'true' : undefined, // Sincronizar por defecto
          },
        });
        const oddsData = data.success ? data.data : [];
        
        // Record API call
        apiUsageMonitor.recordCall('getOdds');
        
        // Cache for 2 minutes
        if (oddsData.length > 0) {
          apiCache.set(cacheKey, oddsData, 120);
        }
        
        return oddsData;
      }
    } catch (error) {
      console.error('Error fetching odds:', error);
      return [];
    }
  }

  /**
   * Compare odds across all bookmakers
   */
  async compareOdds(
    sport: string,
    eventId: string,
    market: string = 'h2h',
    options: {
      save?: boolean; // Guardar comparación en Supabase
    } = {}
  ): Promise<{
    event: OddsEvent;
    comparisons: Record<string, OddsComparison>;
    bestBookmakers: Record<string, string>;
  } | null> {
    try {
      const { save = true } = options;

      // Check cache first (comparisons change frequently, cache for 1 minute)
      const cacheKey = apiCache.generateKey('theodds_compare', { sport, eventId, market });
      const cached = apiCache.get<{
        event: OddsEvent;
        comparisons: Record<string, OddsComparison>;
        bestBookmakers: Record<string, string>;
      }>(cacheKey);
      if (cached) {
        return cached; // Cache hit - no API call needed
      }

      // Check if we can make API call
      if (!apiUsageMonitor.canMakeCall()) {
        console.warn('⚠️ API usage limit reached. Using cached data if available.');
        return cached || null;
      }

      // Use Supabase Edge Function if available, otherwise use backend API
      const supabaseFunctionsUrl = getSupabaseFunctionsUrl();
      const useSupabase = isSupabaseConfigured() && supabaseFunctionsUrl && import.meta.env.PROD;
      
      if (useSupabase) {
        const params = new URLSearchParams({ market });
        if (save) params.set('save', 'true');
        
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!anonKey) {
          console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
          return null;
        }
        
        const response = await fetch(`${supabaseFunctionsUrl}/the-odds-api/sports/${sport}/events/${eventId}/compare?${params}`, {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`❌ Error ${response.status} en Edge Function:`, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          return null;
        }
        
        const result = await response.json();
        const data = result.success ? result.data : null;
        
        // Record API call
        apiUsageMonitor.recordCall('compareOdds');
        
        // Cache for 1 minute (comparisons change frequently)
        if (data) {
          apiCache.set(cacheKey, data, 60);
        }
        
        return data;
      } else {
        const { data } = await api.get(`/the-odds-api/sports/${sport}/events/${eventId}/compare`, {
          params: { 
            market,
            save: save ? 'true' : undefined, // Guardar por defecto
          },
        });
        const comparisonData = data.success ? data.data : null;
        
        // Record API call
        apiUsageMonitor.recordCall('compareOdds');
        
        // Cache for 1 minute
        if (comparisonData) {
          apiCache.set(cacheKey, comparisonData, 60);
        }
        
        return comparisonData;
      }
    } catch (error) {
      console.error('Error comparing odds:', error);
      return null;
    }
  }

  /**
   * Detect value bets
   */
  async detectValueBets(
    sport: string,
    eventId: string,
    predictedProbabilities: Record<string, number>,
    minValue: number = 0.05
  ): Promise<ValueBet[]> {
    try {
      const { data } = await api.post(`/the-odds-api/sports/${sport}/events/${eventId}/value-bets`, {
        predictedProbabilities,
        minValue,
      });
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error detecting value bets:', error);
      return [];
    }
  }

  /**
   * Search events by team name
   */
  async searchEvents(sport: string, team: string): Promise<OddsEvent[]> {
    try {
      const { data } = await api.get(`/the-odds-api/sports/${sport}/search`, {
        params: { team },
      });
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }
}

export const theOddsApiService = new TheOddsAPIService();


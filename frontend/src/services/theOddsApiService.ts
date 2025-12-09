/**
 * The Odds API Service
 * Frontend service for interacting with The Odds API endpoints
 * Uses Supabase Edge Functions in production, backend API in development
 */

import api from './api';
import { isSupabaseConfigured } from '../config/supabase';

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
        
        const response = await fetch(`${supabaseFunctionsUrl}/the-odds-api/sports`, {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`❌ Error ${response.status} en Edge Function:`, response.statusText);
          return [];
        }
        
        const result = await response.json();
        return result.success ? result.data : [];
      } else {
        const { data } = await api.get('/the-odds-api/sports');
        return data.success ? data.data : [];
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
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`❌ Error ${response.status} en Edge Function:`, response.statusText);
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
        return data.success ? data.data : [];
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
        return result.success ? result.data : null;
      } else {
        const { data } = await api.get(`/the-odds-api/sports/${sport}/events/${eventId}/compare`, {
          params: { 
            market,
            save: save ? 'true' : undefined, // Guardar por defecto
          },
        });
        return data.success ? data.data : null;
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


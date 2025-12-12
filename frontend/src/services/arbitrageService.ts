/**
 * Arbitrage Service
 * Handles API calls for arbitrage opportunities
 * Can work with backend API or calculate directly from The Odds API data
 */

import api from './api';
import { theOddsApiService } from './theOddsApiService';

export interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  event: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    sport: {
      name: string;
      slug: string;
    };
  };
  market: {
    id: string;
    type: string;
    name: string;
  };
  selections: Array<{
    selection: string;
    bookmaker: string;
    odds: number;
    impliedProbability: number;
    stake?: number;
  }>;
  totalImpliedProbability: number;
  profitMargin: number;
  guaranteedProfit: number;
  roi: number;
  minBankroll: number;
  detectedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface StakeCalculation {
  selection: string;
  bookmaker: string;
  odds: number;
  stake: number;
  potentialReturn: number;
}

export interface CalculateStakesRequest {
  opportunity: ArbitrageOpportunity;
  totalBankroll: number;
}

export interface CalculateStakesResponse {
  stakes: StakeCalculation[];
  totalStake: number;
  guaranteedProfit: number;
  roi: number;
  profitMargin: number;
}

class ArbitrageService {
  /**
   * Calculate arbitrage opportunities from odds comparison data
   */
  private calculateArbitrageFromComparison(
    event: any,
    comparisons: Record<string, any>,
    minProfitMargin: number = 0.01
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const selections = Object.keys(comparisons);

    if (selections.length < 2) {
      return []; // Need at least 2 outcomes for arbitrage
    }

    // Generate all possible combinations of bookmakers
    const generateCombinations = (
      currentSelections: string[],
      currentBookmakers: string[],
      currentOdds: number[],
      index: number
    ) => {
      if (index === selections.length) {
        // Calculate total implied probability
        const totalImpliedProb = currentOdds.reduce((sum, odd) => sum + 1 / odd, 0);
        const profitMargin = 1 - totalImpliedProb;

        if (profitMargin >= minProfitMargin) {
          const opportunity: ArbitrageOpportunity = {
            id: `${event.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            eventId: event.id,
            event: {
              id: event.id,
              homeTeam: event.home_team || 'Unknown',
              awayTeam: event.away_team || 'Unknown',
              startTime: event.commence_time || new Date().toISOString(),
              sport: {
                name: event.sport_title || 'Unknown',
                slug: event.sport_key || 'unknown',
              },
            },
            market: {
              id: `${event.id}-h2h`,
              type: 'MATCH_WINNER',
              name: 'Match Winner',
            },
            selections: currentSelections.map((sel, i) => ({
              selection: sel,
              bookmaker: currentBookmakers[i],
              odds: currentOdds[i],
              impliedProbability: 1 / currentOdds[i],
            })),
            totalImpliedProbability: totalImpliedProb,
            profitMargin,
            guaranteedProfit: 0,
            roi: (profitMargin / totalImpliedProb) * 100,
            minBankroll: 10,
            detectedAt: new Date().toISOString(),
            expiresAt: event.commence_time || new Date().toISOString(),
            isActive: true,
          };
          opportunities.push(opportunity);
        }
        return;
      }

      const currentSelection = selections[index];
      const oddsForSelection = comparisons[currentSelection]?.allOdds || [];

      for (const oddData of oddsForSelection) {
        generateCombinations(
          [...currentSelections, currentSelection],
          [...currentBookmakers, oddData.bookmaker],
          [...currentOdds, oddData.odds],
          index + 1
        );
      }
    };

    generateCombinations([], [], [], 0);

    // Sort by profit margin (highest first)
    opportunities.sort((a, b) => b.profitMargin - a.profitMargin);

    return opportunities;
  }

  /**
   * Get all active arbitrage opportunities
   * Uses Supabase Edge Functions in production, backend API in development
   */
  async getOpportunities(options?: {
    minProfitMargin?: number;
    sport?: string;
    limit?: number;
  }): Promise<ArbitrageOpportunity[]> {
    const { minProfitMargin = 0.01, sport = 'soccer_epl', limit = 50 } = options || {};

    // Use Supabase Edge Function in production
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    if (isProduction) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase not configured');
        }

        const { supabase } = await import('../config/supabase');
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const token = session.access_token;
        const params = new URLSearchParams();
        if (minProfitMargin) params.set('minProfitMargin', minProfitMargin.toString());
        if (sport) params.set('sport', sport);
        if (limit) params.set('limit', limit.toString());

        const response = await fetch(`${supabaseUrl}/functions/v1/arbitrage/opportunities?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch arbitrage opportunities');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      } catch (error: any) {
        console.error('Error fetching arbitrage opportunities from Edge Function:', error);
        // Fallback to direct calculation
      }
    }

    // Try backend first, fallback to direct calculation
    try {
      const params = new URLSearchParams();
      if (minProfitMargin) {
        params.append('minProfitMargin', minProfitMargin.toString());
      }
      if (sport) {
        params.append('sport', sport);
      }
      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await api.get(`/arbitrage/opportunities?${params.toString()}`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (error: any) {
      // Backend not available, calculate directly from The Odds API
      console.log('Backend not available, calculating arbitrage directly from The Odds API');
    }

    // Fallback: Calculate directly from The Odds API
    // OPTIMIZED: Use only getOdds() data instead of compareOdds() for each event
    // This reduces API calls from ~150 to just 1 per request
    try {
      const allOpportunities: ArbitrageOpportunity[] = [];

      // Get events from The Odds API (single call, cached)
      const events = await theOddsApiService.getOdds(sport, {
        regions: ['us', 'uk', 'eu'],
        markets: ['h2h'],
        oddsFormat: 'decimal',
      });

      if (!events || events.length === 0) {
        return [];
      }

      // Process events directly from getOdds() response (no additional API calls)
      // getOdds() already includes all bookmakers and odds for each event
      const eventsToProcess = events.slice(0, limit * 1.5); // Reduced from limit * 3

      for (const event of eventsToProcess) {
        try {
          // Extract comparisons directly from event data (already includes all bookmakers)
          if (!event.bookmakers || !Array.isArray(event.bookmakers)) {
            continue;
          }

          // Build comparisons object from event.bookmakers
          const comparisons: Record<string, any> = {};
          
          event.bookmakers.forEach((bookmaker: any) => {
            if (!bookmaker.markets || !Array.isArray(bookmaker.markets)) {
              return;
            }
            
            bookmaker.markets.forEach((marketData: any) => {
              if (marketData.key === 'h2h' && marketData.outcomes && Array.isArray(marketData.outcomes)) {
                marketData.outcomes.forEach((outcome: any) => {
                  const selectionName = outcome.name || outcome.description || 'unknown';
                  if (!comparisons[selectionName]) {
                    comparisons[selectionName] = {
                      name: selectionName,
                      allOdds: [],
                      bestOdds: 0,
                      bestBookmaker: '',
                    };
                  }
                  
                  const odds = parseFloat(outcome.price) || 0;
                  if (odds > 0) {
                    comparisons[selectionName].allOdds.push({
                      odds,
                      bookmaker: bookmaker.title || bookmaker.key,
                    });
                    
                    if (odds > comparisons[selectionName].bestOdds) {
                      comparisons[selectionName].bestOdds = odds;
                      comparisons[selectionName].bestBookmaker = bookmaker.title || bookmaker.key;
                    }
                  }
                });
              }
            });
          });

          // Calculate arbitrage from the comparisons we built
          if (Object.keys(comparisons).length >= 2) {
            const opportunities = this.calculateArbitrageFromComparison(
              event,
              comparisons,
              minProfitMargin
            );
            allOpportunities.push(...opportunities);
          }

          // If we have enough opportunities, we can stop early
          if (allOpportunities.length >= limit) {
            break;
          }
        } catch (error: any) {
          // Silently skip events that fail
          continue;
        }
      }

      // Sort by profit margin (highest first) and group by event
      allOpportunities.sort((a, b) => b.profitMargin - a.profitMargin);

      // Group by event and take best opportunity per event, then take top N
      const opportunitiesByEvent = new Map<string, ArbitrageOpportunity>();
      for (const opp of allOpportunities) {
        const existing = opportunitiesByEvent.get(opp.eventId);
        if (!existing || opp.profitMargin > existing.profitMargin) {
          opportunitiesByEvent.set(opp.eventId, opp);
        }
      }

      // Convert back to array, sort by profit margin, and return top N
      const uniqueOpportunities = Array.from(opportunitiesByEvent.values())
        .sort((a, b) => b.profitMargin - a.profitMargin)
        .slice(0, limit);

      return uniqueOpportunities;
    } catch (error: any) {
      console.error('Error calculating arbitrage opportunities:', error);
      return [];
    }
  }

  /**
   * Detect arbitrage for a specific event
   * Uses Supabase Edge Functions in production, backend API in development
   */
  async detectForEvent(
    eventId: string,
    options?: {
      marketType?: string;
      minProfitMargin?: number;
    }
  ): Promise<ArbitrageOpportunity[]> {
    // Use Supabase Edge Function in production
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    if (isProduction) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase not configured');
        }

        const { supabase } = await import('../config/supabase');
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const token = session.access_token;
        const params = new URLSearchParams();
        if (options?.marketType) params.set('marketType', options.marketType);
        if (options?.minProfitMargin) params.set('minProfitMargin', options.minProfitMargin.toString());

        const response = await fetch(`${supabaseUrl}/functions/v1/arbitrage/event/${eventId}?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to detect arbitrage for event');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      } catch (error: any) {
        console.error('Error detecting arbitrage from Edge Function:', error);
        // Fallback to backend
      }
    }

    // Fallback to backend API
    const params = new URLSearchParams();
    if (options?.marketType) {
      params.append('marketType', options.marketType);
    }
    if (options?.minProfitMargin) {
      params.append('minProfitMargin', options.minProfitMargin.toString());
    }

    const response = await api.get(`/arbitrage/event/${eventId}?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Calculate stakes for an arbitrage opportunity
   * Uses Supabase Edge Functions in production, backend API in development
   */
  async calculateStakes(
    opportunity: ArbitrageOpportunity,
    totalBankroll: number
  ): Promise<CalculateStakesResponse> {
    // Use Supabase Edge Function in production
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    if (isProduction) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase not configured');
        }

        const { supabase } = await import('../config/supabase');
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const token = session.access_token;

        const response = await fetch(`${supabaseUrl}/functions/v1/arbitrage/calculate-stakes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ opportunity, totalBankroll }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to calculate stakes');
        }

        const result = await response.json();
        return result.data;
      } catch (error: any) {
        console.error('Error calculating stakes from Edge Function:', error);
        // Fallback to direct calculation
      }
    }

    // Try backend first
    try {
      const response = await api.post('/arbitrage/calculate-stakes', {
        opportunity,
        totalBankroll,
      });
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (error: any) {
      // Backend not available, calculate directly
      console.log('Backend not available, calculating stakes directly');
    }

    // Fallback: Calculate directly
    const { selections, totalImpliedProbability } = opportunity;
    const stakes: StakeCalculation[] = selections.map((sel) => {
      const stake = (totalBankroll * sel.impliedProbability) / totalImpliedProbability;
      const potentialReturn = stake * sel.odds;

      return {
        selection: sel.selection,
        bookmaker: sel.bookmaker,
        odds: sel.odds,
        stake: Math.round(stake * 100) / 100,
        potentialReturn: Math.round(potentialReturn * 100) / 100,
      };
    });

    const totalStake = stakes.reduce((sum, s) => sum + s.stake, 0);
    const guaranteedProfit = totalStake * opportunity.profitMargin;

    return {
      stakes,
      totalStake: Math.round(totalStake * 100) / 100,
      guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
      roi: opportunity.roi,
      profitMargin: opportunity.profitMargin * 100,
    };
  }
}

export const arbitrageService = new ArbitrageService();


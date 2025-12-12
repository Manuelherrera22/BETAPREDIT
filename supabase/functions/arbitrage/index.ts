/**
 * Arbitrage Edge Function
 * Detects arbitrage opportunities using odds from database
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to find arbitrage combinations
function findArbitrageCombinations(
  comparisons: Record<string, Array<{ bookmaker: string; odds: number }>>,
  minProfitMargin: number
): Array<{
  selections: Array<{
    selection: string;
    bookmaker: string;
    odds: number;
    impliedProbability: number;
  }>;
  totalImpliedProbability: number;
}> {
  const combinations: Array<{
    selections: Array<{
      selection: string;
      bookmaker: string;
      odds: number;
      impliedProbability: number;
    }>;
    totalImpliedProbability: number;
  }> = [];

  const selections = Object.keys(comparisons);

  // Generate all possible combinations
  const generateCombinations = (
    currentSelections: string[],
    currentBookmakers: string[],
    currentOdds: number[],
    index: number
  ) => {
    if (index === selections.length) {
      const totalImpliedProb = currentOdds.reduce((sum, odd) => sum + 1 / odd, 0);
      const profitMargin = 1 - totalImpliedProb;

      if (profitMargin >= minProfitMargin) {
        combinations.push({
          selections: currentSelections.map((sel, i) => ({
            selection: sel,
            bookmaker: currentBookmakers[i],
            odds: currentOdds[i],
            impliedProbability: 1 / currentOdds[i],
          })),
          totalImpliedProbability: totalImpliedProb,
        });
      }
      return;
    }

    const currentSelection = selections[index];
    const oddsForSelection = comparisons[currentSelection] || [];

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
  combinations.sort((a, b) => {
    const profitA = 1 - a.totalImpliedProbability;
    const profitB = 1 - b.totalImpliedProbability;
    return profitB - profitA;
  });

  return combinations;
}

// Helper function to calculate stakes
function calculateStakes(
  opportunity: any,
  totalBankroll: number
): Array<{
  selection: string;
  bookmaker: string;
  odds: number;
  stake: number;
  potentialReturn: number;
}> {
  const { selections, totalImpliedProbability } = opportunity;

  return selections.map((sel: any) => {
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Supabase configuration missing' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'No authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionIndex = pathParts.indexOf('arbitrage');
    const action = pathParts[functionIndex + 1]; // 'opportunities', 'event', 'calculate-stakes', etc.
    const eventIdParam = pathParts[functionIndex + 2]; // eventId

    // GET /arbitrage/opportunities - Get all active opportunities
    if (req.method === 'GET' && action === 'opportunities') {
      const minProfitMargin = parseFloat(url.searchParams.get('minProfitMargin') || '0.01');
      const sportParam = url.searchParams.get('sport') || '';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      // Get events with odds from database
      const now = new Date();
      const maxTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Build query for events
      let eventsQuery = supabase
        .from('Event')
        .select(`
          id,
          name,
          homeTeam,
          awayTeam,
          startTime,
          sportId,
          sport:Sport (
            id,
            name,
            slug
          )
        `)
        .eq('status', 'SCHEDULED')
        .eq('isActive', true)
        .gte('startTime', now.toISOString())
        .lte('startTime', maxTime.toISOString())
        .limit(limit * 2) // Get more events to have better chances of finding opportunities
        .order('startTime', { ascending: true });

      // Filter by sport if specified
      if (sportParam && sportParam.trim() !== '') {
        // Find sport
        const { data: sportData } = await supabase
          .from('Sport')
          .select('id')
          .eq('slug', sportParam)
          .eq('isActive', true)
          .single();

        if (!sportData) {
          return new Response(
            JSON.stringify({ success: true, data: [], count: 0 }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        eventsQuery = eventsQuery.eq('sportId', sportData.id);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: { message: `Failed to fetch events: ${eventsError.message}` } 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!events || events.length === 0) {
        return new Response(
          JSON.stringify({ success: true, data: [], count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const opportunities: any[] = [];

      for (const event of events) {
        // Get markets for this event
        const { data: markets, error: marketsError } = await supabase
          .from('Market')
          .select(`
            id,
            type,
            name,
            odds:Odds (
              id,
              selection,
              decimal,
              source,
              isActive
            )
          `)
          .eq('eventId', event.id)
          .eq('type', 'MATCH_WINNER')
          .eq('isActive', true)
          .limit(1);

        if (marketsError) {
          console.error(`Error fetching markets for event ${event.id}:`, marketsError);
          continue;
        }
        
        if (!markets || markets.length === 0) continue;
        
        const market = markets[0];
        if (!market || !market.odds || (market.odds as any[]).length === 0) continue;

        // Group odds by selection
        const comparisons: Record<string, Array<{ bookmaker: string; odds: number }>> = {};
        
        (market.odds as any[]).forEach((odd: any) => {
          if (!odd.isActive || !odd.decimal || odd.decimal <= 0) return;
          if (!comparisons[odd.selection]) {
            comparisons[odd.selection] = [];
          }
          comparisons[odd.selection].push({
            bookmaker: odd.source || 'SYSTEM',
            odds: odd.decimal,
          });
        });

        // Need at least 2 different selections with odds from different bookmakers for arbitrage
        const selectionKeys = Object.keys(comparisons);
        if (selectionKeys.length < 2) {
          continue; // Need at least 2 outcomes for arbitrage
        }

        // Check if we have odds from different bookmakers
        const hasMultipleBookmakers = selectionKeys.some(sel => 
          comparisons[sel].length > 1 || 
          selectionKeys.some(otherSel => 
            otherSel !== sel && 
            comparisons[sel].some(o1 => 
              comparisons[otherSel].some(o2 => o1.bookmaker !== o2.bookmaker)
            )
          )
        );

        if (!hasMultipleBookmakers) {
          continue; // Need odds from different bookmakers
        }

        // Find arbitrage combinations
        const combinations = findArbitrageCombinations(comparisons, minProfitMargin);

        for (const combination of combinations) {
          const profitMargin = 1 - combination.totalImpliedProbability;
          
          opportunities.push({
            id: `${event.id}-${market.id}-${Date.now()}`,
            eventId: event.id,
            event: {
              id: event.id,
              homeTeam: event.homeTeam,
              awayTeam: event.awayTeam,
              startTime: event.startTime,
              sport: event.sport,
            },
            market: {
              id: market.id,
              type: market.type,
              name: market.name,
            },
            selections: combination.selections,
            totalImpliedProbability: combination.totalImpliedProbability,
            profitMargin,
            guaranteedProfit: 0,
            roi: (profitMargin / combination.totalImpliedProbability) * 100,
            minBankroll: 10,
            detectedAt: new Date().toISOString(),
            expiresAt: event.startTime,
            isActive: true,
          });
        }
      }

      // Sort by profit margin
      opportunities.sort((a, b) => b.profitMargin - a.profitMargin);

      // Limit results
      const limitedOpportunities = opportunities.slice(0, limit);

      console.log(`Found ${limitedOpportunities.length} arbitrage opportunities from ${events?.length || 0} events`);

      return new Response(
        JSON.stringify({ success: true, data: limitedOpportunities, count: limitedOpportunities.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /arbitrage/event/:eventId - Detect for specific event
    if (req.method === 'GET' && action === 'event' && eventIdParam) {
      const marketType = url.searchParams.get('marketType') || 'h2h';
      const minProfitMargin = parseFloat(url.searchParams.get('minProfitMargin') || '0.01');

      // Get event
      const { data: event, error: eventError } = await supabase
        .from('Event')
        .select(`
          id,
          name,
          homeTeam,
          awayTeam,
          startTime,
          sport:Sport (
            name,
            slug
          )
        `)
        .eq('id', eventIdParam)
        .single();

      if (eventError || !event) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Event not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get markets for this event
      const { data: markets, error: marketsError } = await supabase
        .from('Market')
        .select(`
          id,
          type,
          name,
          odds:Odds (
            id,
            selection,
            decimal,
            source,
            isActive
          )
        `)
        .eq('eventId', event.id)
        .eq('type', 'MATCH_WINNER')
        .eq('isActive', true)
        .limit(1);

      if (marketsError || !markets || markets.length === 0) {
        return new Response(
          JSON.stringify({ success: true, data: [], count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const market = markets[0];
      if (!market || !market.odds || (market.odds as any[]).length === 0) {
        return new Response(
          JSON.stringify({ success: true, data: [], count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Group odds by selection
      const comparisons: Record<string, Array<{ bookmaker: string; odds: number }>> = {};
      
      (market.odds as any[]).forEach((odd: any) => {
        if (!odd.isActive) return;
        if (!comparisons[odd.selection]) {
          comparisons[odd.selection] = [];
        }
        comparisons[odd.selection].push({
          bookmaker: odd.source || 'SYSTEM',
          odds: odd.decimal,
        });
      });

      // Find arbitrage combinations
      const combinations = findArbitrageCombinations(comparisons, minProfitMargin);
      const opportunities: any[] = [];

      for (const combination of combinations) {
        const profitMargin = 1 - combination.totalImpliedProbability;
        
        opportunities.push({
          id: `${event.id}-${market.id}-${Date.now()}`,
          eventId: event.id,
          event: {
            id: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            startTime: event.startTime,
            sport: event.sport,
          },
          market: {
            id: market.id,
            type: market.type,
            name: market.name,
          },
          selections: combination.selections,
          totalImpliedProbability: combination.totalImpliedProbability,
          profitMargin,
          guaranteedProfit: 0,
          roi: (profitMargin / combination.totalImpliedProbability) * 100,
          minBankroll: 10,
          detectedAt: new Date().toISOString(),
          expiresAt: event.startTime,
          isActive: true,
        });
      }

      // Sort by profit margin
      opportunities.sort((a, b) => b.profitMargin - a.profitMargin);

      return new Response(
        JSON.stringify({ success: true, data: opportunities, count: opportunities.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /arbitrage/calculate-stakes - Calculate stakes
    if (req.method === 'POST' && action === 'calculate-stakes') {
      const body = await req.json();
      const { opportunity, totalBankroll } = body;

      if (!opportunity || !totalBankroll) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Opportunity and totalBankroll are required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (totalBankroll <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Total bankroll must be greater than 0' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stakes = calculateStakes(opportunity, totalBankroll);
      const totalStake = stakes.reduce((sum, s) => sum + s.stake, 0);
      const guaranteedProfit = totalStake * (1 - opportunity.totalImpliedProbability);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stakes,
            totalStake: Math.round(totalStake * 100) / 100,
            guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
            roi: opportunity.roi,
            profitMargin: opportunity.profitMargin * 100,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in arbitrage function:', error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

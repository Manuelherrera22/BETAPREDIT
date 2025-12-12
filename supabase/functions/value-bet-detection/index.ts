/**
 * Value Bet Detection Edge Function
 * Detects value bets using events and predictions from database
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const functionIndex = pathParts.indexOf('value-bet-detection');
    const action = pathParts[functionIndex + 1]; // 'sport', 'scan-all', etc.
    const sportParam = pathParts[functionIndex + 2]; // sport slug

    const minValue = parseFloat(url.searchParams.get('minValue') || '0.05');
    const maxEvents = parseInt(url.searchParams.get('maxEvents') || '20');
    const autoCreateAlerts = url.searchParams.get('autoCreateAlerts') === 'true';

    // Get user preferences
    let userMinValue = minValue;
    let userMaxEvents = maxEvents;
    let userAutoCreateAlerts = autoCreateAlerts;
    let preferredSports: string[] = [];

    try {
      const { data: preferences } = await supabase
        .from('UserPreferences')
        .select('valueBetPreferences')
        .eq('userId', userId)
        .single();

      if (preferences?.valueBetPreferences) {
        const prefs = preferences.valueBetPreferences as any;
        if (prefs.minValue !== undefined) userMinValue = prefs.minValue;
        if (prefs.maxEvents !== undefined) userMaxEvents = prefs.maxEvents;
        if (prefs.autoCreateAlerts !== undefined) userAutoCreateAlerts = prefs.autoCreateAlerts;
        if (prefs.sports) preferredSports = prefs.sports;
      }
    } catch (error) {
      console.warn('Error loading user preferences, using defaults:', error);
    }

    // Helper function to detect value bets for events
    async function detectValueBetsForEvents(sportSlug: string) {
      // Find sport
      const { data: sport, error: sportError } = await supabase
        .from('Sport')
        .select('id')
        .eq('slug', sportSlug)
        .eq('isActive', true)
        .single();

      if (sportError || !sport) {
        return [];
      }

      // Get events with predictions
      const now = new Date();
      const maxTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data: events, error: eventsError } = await supabase
        .from('Event')
        .select(`
          id,
          name,
          homeTeam,
          awayTeam,
          startTime,
          markets:Market!Event_id_fkey (
            id,
            type,
            odds:Odds!Market_id_fkey (
              id,
              selection,
              decimal,
              source,
              isActive
            )
          ),
          Prediction!Event_id_fkey (
            id,
            selection,
            predictedProbability,
            confidence,
            factors,
            wasCorrect
          )
        `)
        .eq('sportId', sport.id)
        .eq('status', 'SCHEDULED')
        .eq('isActive', true)
        .gte('startTime', now.toISOString())
        .lte('startTime', maxTime.toISOString())
        .limit(userMaxEvents)
        .order('startTime', { ascending: true });

      if (eventsError || !events) {
        return [];
      }

      const detectedValueBets: any[] = [];

      for (const event of events) {
        const market = (event.markets as any[])?.find((m: any) => m.type === 'MATCH_WINNER');
        if (!market) continue;

        const predictions = (event.Prediction as any[])?.filter((p: any) => p.wasCorrect === null) || [];

        for (const prediction of predictions) {
          const oddsForSelection = (market.odds as any[])?.filter(
            (o: any) => o.selection === prediction.selection && o.isActive
          ) || [];

          if (oddsForSelection.length === 0) continue;

          // Find best odds
          const bestOdd = oddsForSelection.reduce((best: any, current: any) => {
            return current.decimal > best.decimal ? current : best;
          }, oddsForSelection[0]);

          const bestOdds = bestOdd.decimal;
          const bookmaker = bestOdd.source || 'SYSTEM';
          const predictedProbability = prediction.predictedProbability;
          const confidence = prediction.confidence || 0.7;
          const factors = prediction.factors || {};

          // Calculate value
          const impliedProbability = 1 / bestOdds;
          const rawValue = predictedProbability * bestOdds - 1;
          const estimatedMargin = factors.estimatedMargin ? factors.estimatedMargin / 100 : 0.05;
          const confidenceAdjustedValue = rawValue * confidence;
          const marginAdjustedValue = confidenceAdjustedValue - (estimatedMargin * (1 - confidence));
          const valuePercentage = marginAdjustedValue * 100;
          const adjustedExpectedValue = marginAdjustedValue * 100;

          // Check if it's a value bet
          if (marginAdjustedValue >= userMinValue) {
            detectedValueBets.push({
              eventId: event.id,
              eventName: `${event.homeTeam} vs ${event.awayTeam}`,
              selection: prediction.selection,
              bookmaker: bookmaker,
              odds: bestOdds,
              impliedProbability,
              predictedProbability,
              valuePercentage,
              expectedValue: adjustedExpectedValue,
            });

            // Auto-create alert if enabled
            if (userAutoCreateAlerts) {
              try {
                await supabase.from('ValueBetAlert').insert({
                  userId: userId,
                  eventId: event.id,
                  marketId: market.id,
                  selection: prediction.selection,
                  bookmakerOdds: bestOdds,
                  bookmakerPlatform: bookmaker,
                  predictedProbability,
                  expectedValue: adjustedExpectedValue,
                  valuePercentage,
                  confidence,
                  factors: {
                    ...factors,
                    rawValue: rawValue * 100,
                    marginAdjustedValue: marginAdjustedValue * 100,
                    adjustedExpectedValue,
                  },
                  expiresAt: event.startTime,
                  status: 'ACTIVE',
                });
              } catch (alertError) {
                console.error(`Error creating alert for event ${event.id}:`, alertError);
              }
            }
          }
        }
      }

      return detectedValueBets.sort((a, b) => b.valuePercentage - a.valuePercentage);
    }

    // GET /value-bet-detection/sport/:sport - Detect for specific sport
    if (req.method === 'GET' && action === 'sport' && sportParam) {
      const valueBets = await detectValueBetsForEvents(sportParam);
      
      return new Response(
        JSON.stringify({ success: true, data: valueBets, count: valueBets.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /value-bet-detection/scan-all - Scan all sports
    if (req.method === 'GET' && action === 'scan-all') {
      const sportsToScan = preferredSports.length > 0 ? preferredSports : ['soccer_epl', 'soccer_mls', 'basketball_nba'];
      const allValueBets: any[] = [];

      for (const sportSlug of sportsToScan) {
        const valueBets = await detectValueBetsForEvents(sportSlug);
        allValueBets.push(...valueBets);
      }

      // Sort all by value percentage
      allValueBets.sort((a, b) => b.valuePercentage - a.valuePercentage);

      return new Response(
        JSON.stringify({ success: true, data: allValueBets, count: allValueBets.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in value-bet-detection function:', error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

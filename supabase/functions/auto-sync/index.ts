/**
 * Auto Sync Edge Function
 * Sincroniza eventos y genera predicciones automáticamente
 * Se ejecuta automáticamente cada hora via Supabase Cron
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

/**
 * Sync markets and odds for an event
 */
async function syncMarketsAndOdds(
  supabase: any,
  eventId: string,
  sportId: string,
  oddsEvent: OddsEvent
) {
  try {
    if (!oddsEvent.bookmakers || oddsEvent.bookmakers.length === 0) {
      return;
    }

    // Find or create MATCH_WINNER market
    let { data: market, error: marketError } = await supabase
      .from('Market')
      .select('id')
      .eq('eventId', eventId)
      .eq('type', 'MATCH_WINNER')
      .maybeSingle();

    if (marketError && marketError.code !== 'PGRST116') {
      console.error(`Error finding market for event ${eventId}:`, marketError);
      return;
    }

    if (!market) {
      const currentTime = new Date().toISOString();
      const { data: newMarket, error: createMarketError } = await supabase
        .from('Market')
        .insert({
          id: crypto.randomUUID(),
          eventId: eventId,
          sportId: sportId,
          type: 'MATCH_WINNER',
          name: 'Match Winner',
          isActive: true,
          isSuspended: false,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .select('id')
        .single();

      if (createMarketError) {
        console.error(`Error creating market for event ${eventId}:`, createMarketError);
        return;
      }
      market = newMarket;
    }

    // Extract odds from all bookmakers
    const oddsToInsert: any[] = [];
    const currentTime = new Date().toISOString();

    for (const bookmaker of oddsEvent.bookmakers) {
      if (!bookmaker.markets || bookmaker.markets.length === 0) continue;

      const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
      if (!h2hMarket || !h2hMarket.outcomes) continue;

      for (const outcome of h2hMarket.outcomes) {
        if (!outcome.price || outcome.price <= 0) continue;

        let selection = outcome.name;
        const homeLower = oddsEvent.home_team.toLowerCase();
        const awayLower = oddsEvent.away_team.toLowerCase();
        const nameLower = outcome.name.toLowerCase();

        if (nameLower.includes(homeLower) || nameLower === 'home' || nameLower === '1') {
          selection = oddsEvent.home_team;
        } else if (nameLower.includes(awayLower) || nameLower === 'away' || nameLower === '2') {
          selection = oddsEvent.away_team;
        } else if (nameLower.includes('draw') || nameLower === 'x' || nameLower === '3') {
          selection = 'Draw';
        }

        const probability = 1 / outcome.price;

        oddsToInsert.push({
          id: crypto.randomUUID(),
          eventId: eventId,
          marketId: market.id,
          selection: selection,
          decimal: outcome.price,
          probability: probability,
          source: 'THE_ODDS_API',
          isActive: true,
          createdAt: currentTime,
          updatedAt: currentTime,
        });
      }
    }

    if (oddsToInsert.length === 0) {
      return;
    }

    // Deactivate old odds for this market
    await supabase
      .from('Odds')
      .update({ isActive: false, updatedAt: currentTime })
      .eq('eventId', eventId)
      .eq('marketId', market.id);

    // Insert new odds in batches
    const batchSize = 50;
    for (let i = 0; i < oddsToInsert.length; i += batchSize) {
      const batch = oddsToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('Odds')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting odds batch for event ${eventId}:`, insertError);
      }
    }
  } catch (error: any) {
    console.error(`Error syncing markets/odds for event ${eventId}:`, error.message);
  }
}

/**
 * Generate predictions for events with odds
 */
async function generatePredictionsForEvents(supabase: any, eventIds: string[]) {
  const MODEL_VERSION = 'v2.0-auto';
  const HOURS_AHEAD = 48;
  const now = new Date();
  const maxTime = new Date(now.getTime() + HOURS_AHEAD * 60 * 60 * 1000);

  let totalGenerated = 0;
  let totalUpdated = 0;

  for (const eventId of eventIds) {
    try {
      // Get event with markets and odds
      const { data: event, error: eventError } = await supabase
        .from('Event')
        .select(`
          id,
          startTime,
          Market:Market(
            id,
            type,
            Odds:Odds(
              id,
              selection,
              decimal,
              isActive
            )
          )
        `)
        .eq('id', eventId)
        .eq('status', 'SCHEDULED')
        .eq('isActive', true)
        .gte('startTime', now.toISOString())
        .lte('startTime', maxTime.toISOString())
        .single();

      if (eventError || !event) continue;

      const market = event.Market?.find((m: any) => m.type === 'MATCH_WINNER');
      if (!market || !market.Odds || market.Odds.length === 0) continue;

      // Group odds by selection
      const selections: Record<string, number[]> = {};
      for (const odd of market.Odds) {
        if (odd.isActive !== false && odd.decimal && odd.decimal > 0) {
          if (!selections[odd.selection]) {
            selections[odd.selection] = [];
          }
          selections[odd.selection].push(odd.decimal);
        }
      }

      if (Object.keys(selections).length === 0) continue;

      // Generate predictions for each selection
      for (const [selection, oddsArray] of Object.entries(selections)) {
        if (oddsArray.length === 0) continue;

        // Calculate predicted probability
        const impliedProbabilities = oddsArray.map(odd => 1 / odd);
        const marketAverage = impliedProbabilities.reduce((sum, prob) => sum + prob, 0) / impliedProbabilities.length;
        const variance = impliedProbabilities.reduce((sum, prob) => {
          return sum + Math.pow(prob - marketAverage, 2);
        }, 0) / impliedProbabilities.length;
        const standardDeviation = Math.sqrt(variance);
        const marketConsensus = 1 - Math.min(standardDeviation * 2, 0.5);
        const valueAdjustment = marketConsensus < 0.7 ? 1.05 : 1.02;

        let predictedProbability = marketAverage * valueAdjustment;
        predictedProbability = Math.max(0.01, Math.min(0.99, predictedProbability));

        let confidence = marketConsensus;
        confidence = confidence * (1 + Math.min(oddsArray.length / 10, 0.2));
        confidence = Math.max(0.5, Math.min(0.95, confidence));

        const factors = {
          marketAverage,
          marketConsensus,
          valueAdjustment,
        };

        // Check if prediction exists
        const { data: existing, error: checkError } = await supabase
          .from('Prediction')
          .select('id, factors')
          .eq('eventId', event.id)
          .eq('marketId', market.id)
          .eq('selection', selection)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') continue;

        const currentTime = new Date().toISOString();

        if (existing) {
          // Update if odds changed significantly (>5%)
          const existingFactors = existing.factors || {};
          const existingAvgOdds = existingFactors.marketAverage
            ? 1 / existingFactors.marketAverage
            : null;
          const avgOdds = oddsArray.reduce((sum, odd) => sum + odd, 0) / oddsArray.length;

          if (existingAvgOdds && Math.abs(avgOdds - existingAvgOdds) / existingAvgOdds > 0.05) {
            await supabase
              .from('Prediction')
              .update({
                predictedProbability,
                confidence,
                modelVersion: MODEL_VERSION,
                factors,
                updatedAt: currentTime,
              })
              .eq('id', existing.id);
            totalUpdated++;
          }
        } else {
          // Create new prediction
          await supabase
            .from('Prediction')
            .insert({
              id: crypto.randomUUID(),
              eventId: event.id,
              marketId: market.id,
              selection: selection,
              predictedProbability,
              confidence,
              modelVersion: MODEL_VERSION,
              factors,
              createdAt: currentTime,
              updatedAt: currentTime,
            });
          totalGenerated++;
        }
      }
    } catch (error: any) {
      console.error(`Error generating prediction for event ${eventId}:`, error.message);
    }
  }

  return { generated: totalGenerated, updated: totalUpdated };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting automatic sync...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    console.log('Supabase URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
    console.log('Supabase Key:', supabaseKey ? '✅ Configured' : '❌ Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Supabase configuration missing' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get The Odds API key
    const theOddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (!theOddsApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'The Odds API key not configured' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Starting automatic sync...');

    // ⚠️ SMART UPDATE: Only sync if needed
    const now = Date.now();
    const twoHoursFromNow = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    const { count: recentEventsCount } = await supabase
      .from('Event')
      .select('id', { count: 'exact', head: true })
      .eq('isActive', true)
      .gte('startTime', new Date().toISOString())
      .lte('startTime', twoHoursFromNow);

    // If we have enough events, skip sync
    if (recentEventsCount && recentEventsCount >= 20) {
      console.log(`✅ Already have ${recentEventsCount} upcoming events. Skipping sync.`);
      
      // Still generate predictions for existing events
      const { data: events } = await supabase
        .from('Event')
        .select('id')
        .eq('isActive', true)
        .eq('status', 'SCHEDULED')
        .gte('startTime', new Date().toISOString())
        .lte('startTime', twoHoursFromNow)
        .limit(50);

      if (events && events.length > 0) {
        const eventIds = events.map(e => e.id);
        const predictions = await generatePredictionsForEvents(supabase, eventIds);
        console.log(`✅ Generated ${predictions.generated} predictions, updated ${predictions.updated}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Skipped sync (${recentEventsCount} events available). Generated predictions.`,
          data: { skipped: true, predictions: predictions || { generated: 0, updated: 0 } },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ⚠️ PRIORITIZED SPORTS: Sync most popular sports first
    const prioritizedSports = [
      'soccer_epl',           // Premier League (most popular)
      'basketball_nba',       // NBA
      'soccer_spain_la_liga', // La Liga
      'americanfootball_nfl', // NFL
      'soccer_italy_serie_a', // Serie A
      'icehockey_nhl',       // NHL
    ];

    let totalSynced = 0;
    const syncedEventIds: string[] = [];

    // Sync each sport (prioritized)
    for (const sport of prioritizedSports) {
      try {
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=us,uk,eu&markets=h2h&oddsFormat=decimal&apiKey=${theOddsApiKey}`;
        const oddsResponse = await fetch(oddsUrl);
        
        if (!oddsResponse.ok) {
          console.error(`Error fetching ${sport}:`, await oddsResponse.text());
          continue;
        }

        let oddsEvents: OddsEvent[];
        try {
          oddsEvents = await oddsResponse.json();
        } catch (jsonError) {
          const errorText = await oddsResponse.text();
          console.error(`Error parsing JSON response for ${sport}:`, errorText);
          results.push({ sport, count: 0, error: `Invalid JSON response: ${errorText.substring(0, 100)}` });
          continue;
        }
        
        if (!Array.isArray(oddsEvents)) {
          console.error(`Invalid response format for ${sport}:`, typeof oddsEvents);
          results.push({ sport, count: 0, error: 'Invalid response format' });
          continue;
        }
        if (!oddsEvents || oddsEvents.length === 0) continue;

        // Find or create sport
        let { data: sportData } = await supabase
          .from('Sport')
          .select('id')
          .eq('slug', sport)
          .maybeSingle();

        if (!sportData) {
          const sportId = crypto.randomUUID();
          const now = new Date().toISOString();
          const { data: newSport } = await supabase
            .from('Sport')
            .insert({
              id: sportId,
              name: oddsEvents[0]?.sport_title || sport,
              slug: sport,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            })
            .select('id')
            .single();
          sportData = newSport;
        }

        if (!sportData) continue;

        // Process events
        for (const oddsEvent of oddsEvents) {
          try {
            const commenceTime = new Date(oddsEvent.commence_time);
            const currentTime = Date.now();
            if (commenceTime < new Date(currentTime - 60 * 60 * 1000)) continue; // Skip past events

            // Check if event exists
            const { data: existingEvent } = await supabase
              .from('Event')
              .select('id, startTime')
              .eq('sportId', sportData.id)
              .gte('startTime', new Date(commenceTime.getTime() - 24 * 60 * 60 * 1000).toISOString())
              .lte('startTime', new Date(commenceTime.getTime() + 24 * 60 * 60 * 1000).toISOString())
              .or(`homeTeam.ilike.%${oddsEvent.home_team}%,awayTeam.ilike.%${oddsEvent.home_team}%`)
              .maybeSingle();

            let eventId: string;

            if (existingEvent) {
              // ⚠️ SMART UPDATE: Only update if startTime changed significantly (>1 hour)
              const timeDiff = Math.abs(new Date(existingEvent.startTime).getTime() - commenceTime.getTime());
              if (timeDiff > 60 * 60 * 1000) {
                await supabase
                  .from('Event')
                  .update({
                    startTime: oddsEvent.commence_time,
                    isActive: true,
                  })
                  .eq('id', existingEvent.id);
              }
              eventId = existingEvent.id;
            } else {
              // Create new event
              eventId = crypto.randomUUID();
              const now = new Date().toISOString();
              const { data: createdEvent } = await supabase
                .from('Event')
                .insert({
                  id: eventId,
                  externalId: oddsEvent.id,
                  sportId: sportData.id,
                  name: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
                  homeTeam: oddsEvent.home_team,
                  awayTeam: oddsEvent.away_team,
                  startTime: oddsEvent.commence_time,
                  status: 'SCHEDULED',
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                })
                .select('id')
                .single();

              if (!createdEvent) continue;
            }

            // Sync markets and odds
            await syncMarketsAndOdds(supabase, eventId, sportData.id, oddsEvent);
            syncedEventIds.push(eventId);
            totalSynced++;
          } catch (error: any) {
            console.error(`Error processing event ${oddsEvent.id}:`, error.message);
          }
        }
      } catch (error: any) {
        console.error(`Error syncing sport ${sport}:`, error.message);
      }
    }

    // Generate predictions for synced events
    let predictions = { generated: 0, updated: 0 };
    if (syncedEventIds.length > 0) {
      predictions = await generatePredictionsForEvents(supabase, syncedEventIds);
      console.log(`✅ Generated ${predictions.generated} predictions, updated ${predictions.updated}`);
    }

    console.log(`✅ Auto-sync completed: ${totalSynced} events synced, ${predictions.generated} predictions generated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalSynced} events and generated ${predictions.generated} predictions`,
        data: {
          eventsSynced: totalSynced,
          predictionsGenerated: predictions.generated,
          predictionsUpdated: predictions.updated,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in auto-sync:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    const errorMessage = error?.message || error?.toString() || 'Internal server error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: errorMessage },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


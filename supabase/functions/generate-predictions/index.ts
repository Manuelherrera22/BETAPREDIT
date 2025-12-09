/**
 * Generate Predictions Edge Function
 * Generates predictions for upcoming events using Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOURS_AHEAD = 48; // Generate predictions for events in next 48 hours
const MODEL_VERSION = 'v2.0-edge';

/**
 * Calculate predicted probability from market odds
 */
function calculatePredictedProbability(allBookmakerOdds: number[]): {
  predictedProbability: number;
  confidence: number;
  factors: any;
} {
  if (!allBookmakerOdds || allBookmakerOdds.length === 0) {
    throw new Error('No odds provided');
  }

  // Calculate market average implied probability
  const impliedProbabilities = allBookmakerOdds.map(odd => 1 / odd);
  const marketAverage = impliedProbabilities.reduce((sum, prob) => sum + prob, 0) / impliedProbabilities.length;

  // Calculate market consensus (standard deviation of implied probabilities)
  const variance = impliedProbabilities.reduce((sum, prob) => {
    return sum + Math.pow(prob - marketAverage, 2);
  }, 0) / impliedProbabilities.length;
  const standardDeviation = Math.sqrt(variance);
  const marketConsensus = 1 - Math.min(standardDeviation * 2, 0.5); // Normalize to 0-1

  // Calculate value adjustment
  const valueAdjustment = marketConsensus < 0.7 ? 1.05 : 1.02; // 5% or 2% adjustment

  // Calculate predicted probability
  let predictedProbability = marketAverage * valueAdjustment;
  predictedProbability = Math.max(0.01, Math.min(0.99, predictedProbability));

  // Calculate confidence
  let confidence = marketConsensus;
  confidence = confidence * (1 + Math.min(allBookmakerOdds.length / 10, 0.2)); // Boost for more bookmakers
  confidence = Math.max(0.5, Math.min(0.95, confidence));

  return {
    predictedProbability,
    confidence,
    factors: {
      marketAverage,
      marketConsensus,
      valueAdjustment,
    },
  };
}

/**
 * Normalize selection name
 */
function normalizeSelection(name: string, teams: { home_team: string; away_team: string }): string {
  const lowerName = name.toLowerCase();
  const homeLower = teams.home_team.toLowerCase();
  const awayLower = teams.away_team.toLowerCase();

  if (lowerName.includes(homeLower) || lowerName === 'home' || lowerName === '1') {
    return teams.home_team;
  }
  if (lowerName.includes(awayLower) || lowerName === 'away' || lowerName === '2') {
    return teams.away_team;
  }
  if (lowerName.includes('draw') || lowerName === 'x' || lowerName === '3') {
    return 'Draw';
  }
  return name;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Unauthorized' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting prediction generation...');

    // Get all active sports
    const { data: sports, error: sportsError } = await supabase
      .from('Sport')
      .select('id, slug, name')
      .eq('isActive', true)
      .limit(10);

    if (sportsError) {
      console.error('Error fetching sports:', sportsError);
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Failed to fetch sports' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sports || sports.length === 0) {
      console.log('No active sports found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active sports found. Cannot generate predictions.',
          data: { generated: 0, updated: 0, errors: 0 },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const maxTime = new Date(now.getTime() + HOURS_AHEAD * 60 * 60 * 1000);

    let totalGenerated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // Process each sport
    for (const sport of sports) {
      try {
        console.log(`Processing sport: ${sport.slug || sport.name || sport.id}`);

        // Get upcoming events for this sport
        const { data: events, error: eventsError } = await supabase
          .from('Event')
          .select(`
            id,
            name,
            homeTeam,
            awayTeam,
            startTime,
            externalId,
            Sport:Sport(id, slug, name),
            Market:Market(
              id,
              type,
              Odds:Odds(
                id,
                selection,
                decimal,
                bookmaker
              )
            )
          `)
          .eq('sportId', sport.id)
          .eq('status', 'SCHEDULED')
          .eq('isActive', true)
          .gte('startTime', now.toISOString())
          .lte('startTime', maxTime.toISOString())
          .limit(30)
          .order('startTime', { ascending: true });

        if (eventsError) {
          console.error(`Error fetching events for sport ${sport.id}:`, eventsError);
          totalErrors++;
          continue;
        }

        if (!events || events.length === 0) {
          console.log(`No upcoming events for sport ${sport.slug || sport.id}`);
          continue;
        }

        console.log(`Found ${events.length} events for sport ${sport.slug || sport.id}`);

        // Process each event
        for (const event of events) {
          try {
            // Find or get MATCH_WINNER market
            let market = event.Market?.find((m: any) => m.type === 'MATCH_WINNER');
            
            if (!market) {
              // Create market if it doesn't exist
              const { data: newMarket, error: marketError } = await supabase
                .from('Market')
                .insert({
                  eventId: event.id,
                  sportId: sport.id,
                  type: 'MATCH_WINNER',
                  name: 'Match Winner',
                  isActive: true,
                })
                .select()
                .single();

              if (marketError) {
                console.error(`Error creating market for event ${event.id}:`, marketError);
                continue;
              }
              market = newMarket;
            }

            // Extract odds from database
            const selections: Record<string, number[]> = {};
            
            if (market.Odds && market.Odds.length > 0) {
              // Use odds from database
              for (const odd of market.Odds) {
                if (!selections[odd.selection]) {
                  selections[odd.selection] = [];
                }
                selections[odd.selection].push(odd.decimal);
              }
            } else {
              // No odds in database, skip this event
              console.log(`No odds available for event ${event.id}`);
              continue;
            }

            if (Object.keys(selections).length === 0) {
              console.log(`No selections found for event ${event.id}`);
              continue;
            }

            // Generate predictions for each selection
            for (const [selection, oddsArray] of Object.entries(selections)) {
              if (oddsArray.length === 0) continue;

              try {
                // Calculate prediction
                const prediction = calculatePredictedProbability(oddsArray);

                // Check if prediction already exists
                const { data: existing, error: checkError } = await supabase
                  .from('Prediction')
                  .select('id, factors')
                  .eq('eventId', event.id)
                  .eq('marketId', market.id)
                  .eq('selection', selection)
                  .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') {
                  console.error(`Error checking existing prediction:`, checkError);
                  continue;
                }

                if (existing) {
                  // Update existing prediction if odds changed significantly (>5%)
                  const existingFactors = existing.factors || {};
                  const existingAvgOdds = existingFactors.marketAverage
                    ? 1 / existingFactors.marketAverage
                    : null;
                  const avgOdds = oddsArray.reduce((sum, odd) => sum + odd, 0) / oddsArray.length;

                  if (existingAvgOdds && Math.abs(avgOdds - existingAvgOdds) / existingAvgOdds > 0.05) {
                    // Odds changed more than 5%, update prediction
                    const { error: updateError } = await supabase
                      .from('Prediction')
                      .update({
                        predictedProbability: prediction.predictedProbability,
                        confidence: prediction.confidence,
                        modelVersion: MODEL_VERSION,
                        factors: prediction.factors,
                        updatedAt: new Date().toISOString(),
                      })
                      .eq('id', existing.id);

                    if (updateError) {
                      console.error(`Error updating prediction:`, updateError);
                    } else {
                      totalUpdated++;
                    }
                  }
                } else {
                  // Create new prediction
                  const { error: insertError } = await supabase
                    .from('Prediction')
                    .insert({
                      eventId: event.id,
                      marketId: market.id,
                      selection: selection,
                      predictedProbability: prediction.predictedProbability,
                      confidence: prediction.confidence,
                      modelVersion: MODEL_VERSION,
                      factors: prediction.factors,
                    });

                  if (insertError) {
                    console.error(`Error creating prediction:`, insertError);
                  } else {
                    totalGenerated++;
                  }
                }
              } catch (error: any) {
                console.error(`Error generating prediction for ${selection}:`, error.message);
              }
            }
          } catch (error: any) {
            console.error(`Error processing event ${event.id}:`, error.message);
            totalErrors++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing sport ${sport.id}:`, error.message);
        totalErrors++;
      }
    }

    console.log(`Prediction generation completed: ${totalGenerated} generated, ${totalUpdated} updated, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${totalGenerated} predictions, updated ${totalUpdated}`,
        data: {
          generated: totalGenerated,
          updated: totalUpdated,
          errors: totalErrors,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-predictions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


/**
 * Update Finished Events Edge Function
 * Actualiza eventos a FINISHED cuando terminan y actualiza sus predicciones
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Update predictions for a finished event
 */
async function updatePredictionsForEvent(
  supabase: any,
  eventId: string,
  homeScore: number | null,
  awayScore: number | null,
  homeTeam: string,
  awayTeam: string
) {
  try {
    // Get all predictions for this event that haven't been resolved
    const { data: predictions, error: predError } = await supabase
      .from('Prediction')
      .select('id, selection, predictedProbability, modelVersion')
      .eq('eventId', eventId)
      .is('wasCorrect', null);

    if (predError) {
      console.error(`Error fetching predictions for event ${eventId}:`, predError);
      return 0;
    }

    if (!predictions || predictions.length === 0) {
      return 0;
    }

    // Determine actual results from scores
    const actualResults: Record<string, 'WON' | 'LOST' | 'VOID'> = {};

    if (homeScore !== null && awayScore !== null) {
      if (homeScore > awayScore) {
        actualResults[homeTeam] = 'WON';
        actualResults[awayTeam] = 'LOST';
        actualResults['Draw'] = 'LOST';
      } else if (awayScore > homeScore) {
        actualResults[homeTeam] = 'LOST';
        actualResults[awayTeam] = 'WON';
        actualResults['Draw'] = 'LOST';
      } else {
        actualResults[homeTeam] = 'LOST';
        actualResults[awayTeam] = 'LOST';
        actualResults['Draw'] = 'WON';
      }
    } else {
      // If no scores, mark all as VOID
      actualResults[homeTeam] = 'VOID';
      actualResults[awayTeam] = 'VOID';
      actualResults['Draw'] = 'VOID';
    }

    // Update each prediction
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const prediction of predictions) {
      const actualResult = actualResults[prediction.selection] || 'VOID';
      
      // Determine if prediction was correct
      // For WON: predictedProbability > 0.5 means correct
      // For LOST: predictedProbability < 0.5 means correct
      let wasCorrect: boolean | null = null;
      if (actualResult === 'WON') {
        wasCorrect = prediction.predictedProbability > 0.5;
      } else if (actualResult === 'LOST') {
        wasCorrect = prediction.predictedProbability < 0.5;
      } else {
        // VOID: can't determine correctness
        wasCorrect = null;
      }

      // Calculate accuracy (1 - absolute difference)
      const actualProbability = actualResult === 'WON' ? 1 : actualResult === 'LOST' ? 0 : 0.5;
      const accuracy = 1 - Math.abs(prediction.predictedProbability - actualProbability);

      const { error: updateError } = await supabase
        .from('Prediction')
        .update({
          actualResult,
          wasCorrect,
          accuracy,
          eventFinishedAt: now,
        })
        .eq('id', prediction.id);

      if (updateError) {
        console.error(`Error updating prediction ${prediction.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error: any) {
    console.error(`Error updating predictions for event ${eventId}:`, error);
    return 0;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Supabase configuration missing' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get The Odds API key for fetching scores
    const theOddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
    
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find events that should be FINISHED:
    // 1. startTime < now (event already started)
    // 2. startTime > oneDayAgo (not too old)
    // 3. status != FINISHED (not already finished)
    const { data: eventsToUpdate, error: eventsError } = await supabase
      .from('Event')
      .select('id, name, startTime, status, homeTeam, awayTeam, homeScore, awayScore, externalId, sportId')
      .lt('startTime', now.toISOString())
      .gt('startTime', oneDayAgo.toISOString())
      .neq('status', 'FINISHED')
      .neq('status', 'CANCELLED')
      .limit(100);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ success: false, error: { message: eventsError.message } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!eventsToUpdate || eventsToUpdate.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No events to update',
          data: { updated: 0, predictionsUpdated: 0 },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eventsToUpdate.length} events to update`);

    let updatedEvents = 0;
    let totalPredictionsUpdated = 0;

    // For each event, try to get scores from The Odds API if externalId exists
    for (const event of eventsToUpdate) {
      try {
        let homeScore: number | null = event.homeScore;
        let awayScore: number | null = event.awayScore;
        let shouldMarkFinished = true;

        // If no scores and we have externalId, try to fetch from API
        if ((homeScore === null || awayScore === null) && event.externalId && theOddsApiKey) {
          try {
            // Try to get scores from The Odds API
            // Note: The Odds API doesn't provide scores directly, but we can estimate
            // For now, we'll mark as finished without scores if event is old enough
            const eventStartTime = new Date(event.startTime);
            const hoursSinceStart = (now.getTime() - eventStartTime.getTime()) / (1000 * 60 * 60);
            
            // If event started more than 3 hours ago, assume it's finished
            // (most sports events last 1-2 hours)
            if (hoursSinceStart > 3) {
              // Mark as finished without scores
              homeScore = homeScore || 0;
              awayScore = awayScore || 0;
            } else {
              // Too recent, might still be playing
              shouldMarkFinished = false;
            }
          } catch (apiError) {
            console.error(`Error fetching scores for event ${event.id}:`, apiError);
            // Continue anyway, mark as finished without scores
          }
        }

        if (shouldMarkFinished) {
          // Update event status to FINISHED
          const { error: updateError } = await supabase
            .from('Event')
            .update({
              status: 'FINISHED',
              homeScore: homeScore || 0,
              awayScore: awayScore || 0,
            })
            .eq('id', event.id);

          if (updateError) {
            console.error(`Error updating event ${event.id}:`, updateError);
            continue;
          }

          updatedEvents++;

          // Update predictions for this event
          const predictionsUpdated = await updatePredictionsForEvent(
            supabase,
            event.id,
            homeScore,
            awayScore,
            event.homeTeam,
            event.awayTeam
          );

          totalPredictionsUpdated += predictionsUpdated;

          console.log(`Updated event ${event.id} (${event.name}): ${predictionsUpdated} predictions`);
        }
      } catch (error: any) {
        console.error(`Error processing event ${event.id}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedEvents} events and ${totalPredictionsUpdated} predictions`,
        data: {
          eventsChecked: eventsToUpdate.length,
          eventsUpdated: updatedEvents,
          predictionsUpdated: totalPredictionsUpdated,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-finished-events:', {
      message: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Internal server error',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


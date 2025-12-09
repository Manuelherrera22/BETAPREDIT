/**
 * Get Predictions Edge Function
 * Obtiene predicciones para eventos desde Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Unauthorized' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Supabase configuration missing' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId');

    if (!eventId) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'eventId is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Fetching predictions for eventId: ${eventId}`);

    // First, verify the event exists
    const { data: event, error: eventCheckError } = await supabase
      .from('Event')
      .select('id, isActive, status, startTime, name, homeTeam, awayTeam')
      .eq('id', eventId)
      .maybeSingle();

    if (eventCheckError) {
      console.error('❌ Error checking event:', JSON.stringify(eventCheckError, null, 2));
    }

    if (!event) {
      console.log(`⚠️ Event ${eventId} does not exist in database`);
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Event found: ${event.name || `${event.homeTeam} vs ${event.awayTeam}`}`);
    console.log(`   isActive: ${event.isActive}, status: ${event.status}, startTime: ${event.startTime}`);

    // Get ALL predictions for the event first (without filters)
    const { data: allPredictions, error: allPredictionsError } = await supabase
      .from('Prediction')
      .select(`
        id,
        eventId,
        marketId,
        selection,
        predictedProbability,
        confidence,
        modelVersion,
        factors,
        createdAt,
        updatedAt,
        Market:Market (
          id,
          type,
          name,
          isActive
        )
      `)
      .eq('eventId', eventId)
      .order('predictedProbability', { ascending: false });

    if (allPredictionsError) {
      console.error('❌ Error fetching predictions:', JSON.stringify(allPredictionsError, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: allPredictionsError.message || 'Failed to fetch predictions' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${allPredictions?.length || 0} total predictions for eventId: ${eventId}`);

    // Filter predictions: only show for active events that are scheduled and upcoming
    let predictions = allPredictions || [];
    
    // Only filter by event status if event is not active or not scheduled
    if (event.isActive && event.status === 'SCHEDULED' && new Date(event.startTime) >= new Date()) {
      // Event is valid, show all predictions (filter by market later)
      console.log(`✅ Event is active and upcoming, showing all predictions`);
    } else {
      // Event is not valid, return empty
      console.log(`⚠️ Event is not active/upcoming. Filtering out predictions.`);
      console.log(`   isActive: ${event.isActive}, status: ${event.status}, startTime: ${new Date(event.startTime).toISOString()}, now: ${new Date().toISOString()}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (predictionsError) {
      console.error('❌ Error fetching predictions:', JSON.stringify(predictionsError, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: predictionsError.message || 'Failed to fetch predictions' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out predictions with inactive markets (but be lenient - if market doesn't have isActive, include it)
    const activePredictions = (predictions || []).filter((pred: any) => {
      // Include if market doesn't exist (shouldn't happen but be safe)
      if (!pred.Market) {
        console.warn(`⚠️ Prediction ${pred.id} has no Market`);
        return false;
      }
      // Include if isActive is true or undefined/null (be lenient)
      const isActive = pred.Market.isActive !== false;
      if (!isActive) {
        console.log(`⚠️ Prediction ${pred.id} has inactive market: ${pred.Market.name || pred.Market.type}`);
      }
      return isActive;
    });

    console.log(`📊 Filtered: ${predictions.length} total → ${activePredictions.length} with active markets`);

    // Transform predictions to match frontend expectations (only active ones)
    const transformedPredictions = activePredictions.map((pred: any) => ({
      id: pred.id,
      eventId: pred.eventId,
      marketId: pred.marketId,
      selection: pred.selection,
      predictedProbability: pred.predictedProbability,
      confidence: pred.confidence,
      modelVersion: pred.modelVersion,
      factors: pred.factors,
      market: pred.Market ? {
        id: pred.Market.id,
        type: pred.Market.type,
        name: pred.Market.name,
      } : null,
      createdAt: pred.createdAt,
      updatedAt: pred.updatedAt,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedPredictions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-predictions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


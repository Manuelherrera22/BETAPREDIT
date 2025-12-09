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

    // First, verify the event is active and upcoming
    const { data: event, error: eventCheckError } = await supabase
      .from('Event')
      .select('id, isActive, status, startTime')
      .eq('id', eventId)
      .maybeSingle();

    if (eventCheckError) {
      console.error('Error checking event:', eventCheckError);
    }

    // Only return predictions if event is active and upcoming
    if (!event || !event.isActive || event.status !== 'SCHEDULED' || new Date(event.startTime) < new Date()) {
      console.log(`⚠️ Event ${eventId} is not active/upcoming. isActive: ${event?.isActive}, status: ${event?.status}, startTime: ${event?.startTime}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get predictions for the event (only for active, upcoming events)
    const { data: predictions, error: predictionsError } = await supabase
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
      .eq('Market.isActive', true)
      .order('predictedProbability', { ascending: false });

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

    console.log(`✅ Found ${predictions?.length || 0} predictions for eventId: ${eventId}`);
    
    // Filter out predictions with inactive markets
    const activePredictions = (predictions || []).filter((pred: any) => 
      pred.Market && pred.Market.isActive !== false
    );

    console.log(`📊 Found ${predictions?.length || 0} total predictions, ${activePredictions.length} with active markets`);

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


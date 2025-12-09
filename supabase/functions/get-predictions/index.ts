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

    // Get predictions for the event
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
          name
        )
      `)
      .eq('eventId', eventId)
      .order('predictedProbability', { ascending: false });

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: predictionsError.message || 'Failed to fetch predictions' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform predictions to match frontend expectations
    const transformedPredictions = (predictions || []).map((pred: any) => ({
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


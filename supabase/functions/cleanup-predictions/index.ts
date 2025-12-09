/**
 * Cleanup Predictions Edge Function
 * Limpia predicciones de eventos que ya no están activos o que ya pasaron
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Supabase configuration missing' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 Starting prediction cleanup...');

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Find predictions for events that:
    // 1. Are not active (isActive = false)
    // 2. Have status FINISHED or CANCELLED
    // 3. Started more than 2 days ago
    const { data: eventsToClean, error: eventsError } = await supabase
      .from('Event')
      .select('id')
      .or(`isActive.eq.false,status.eq.FINISHED,status.eq.CANCELLED,startTime.lt.${twoDaysAgo.toISOString()}`);

    if (eventsError) {
      console.error('Error fetching events to clean:', eventsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: eventsError.message || 'Failed to fetch events' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventIdsToClean = (eventsToClean || []).map((e: any) => e.id);
    
    if (eventIdsToClean.length === 0) {
      console.log('✅ No events to clean');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No predictions to clean',
          data: { deleted: 0 },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${eventIdsToClean.length} events to clean predictions for`);

    // Delete predictions for these events
    const { data: deletedPredictions, error: deleteError } = await supabase
      .from('Prediction')
      .delete()
      .in('eventId', eventIdsToClean)
      .select('id');

    if (deleteError) {
      console.error('Error deleting predictions:', deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: deleteError.message || 'Failed to delete predictions' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deletedCount = deletedPredictions?.length || 0;
    console.log(`✅ Deleted ${deletedCount} predictions for ${eventIdsToClean.length} events`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${deletedCount} predictions`,
        data: {
          deleted: deletedCount,
          eventsProcessed: eventIdsToClean.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in cleanup-predictions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


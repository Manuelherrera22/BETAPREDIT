/**
 * Value Bet Alerts Edge Function
 * Handles value bet alerts management using Supabase
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
    // Path structure: /functions/v1/value-bet-alerts/...
    // pathParts will be: ['functions', 'v1', 'value-bet-alerts', ...]
    const functionIndex = pathParts.indexOf('value-bet-alerts');
    const action = pathParts[functionIndex + 1]; // 'stats', 'my-alerts', alertId, etc.
    const subAction = pathParts[functionIndex + 2]; // 'click', 'taken', etc.

    // GET /value-bet-alerts/my-alerts - Get user alerts
    // GET /value-bet-alerts (root) - Get user alerts
    if (req.method === 'GET' && (action === 'my-alerts' || !action)) {
      const minValue = url.searchParams.get('minValue');
      const sportId = url.searchParams.get('sportId');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Get user preferences for default filtering
      let userMinValue = minValue ? parseFloat(minValue) : undefined;
      
      try {
        const { data: preferences } = await supabase
          .from('UserPreferences')
          .select('valueBetPreferences')
          .eq('userId', userId)
          .single();

        if (preferences?.valueBetPreferences) {
          const prefs = preferences.valueBetPreferences as any;
          if (userMinValue === undefined) {
            userMinValue = (prefs.minValue || 0.05) * 100; // Convert to percentage
          }
        }
      } catch (error) {
        console.warn('Error getting user preferences, using defaults:', error);
        if (userMinValue === undefined) {
          userMinValue = 5; // 5% default
        }
      }

      // Build query
      let query = supabase
        .from('ValueBetAlert')
        .select(`
          id,
          userId,
          eventId,
          marketId,
          selection,
          bookmakerOdds,
          bookmakerPlatform,
          predictedProbability,
          expectedValue,
          valuePercentage,
          confidence,
          status,
          notifiedAt,
          clickedAt,
          betPlaced,
          externalBetId,
          factors,
          createdAt,
          expiresAt,
          event:Event!ValueBetAlert_eventId_fkey (
            id,
            name,
            homeTeam,
            awayTeam,
            startTime,
            status,
            sport:Sport!Event_sportId_fkey (
              id,
              name,
              slug
            )
          ),
          market:Market!ValueBetAlert_marketId_fkey (
            id,
            type,
            name,
            isActive
          )
        `)
        .or(`userId.eq.${userId},userId.is.null`)
        .eq('status', 'ACTIVE')
        .gte('valuePercentage', userMinValue || 5)
        .gt('expiresAt', new Date().toISOString())
        .order('valuePercentage', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by sport if specified
      if (sportId) {
        query = query.eq('event.sportId', sportId);
      }

      const { data: alerts, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching alerts:', queryError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch alerts' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: alerts || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /value-bet-alerts/stats - Get alert statistics
    if (req.method === 'GET' && action === 'stats') {
      const { data: alerts, error: queryError } = await supabase
        .from('ValueBetAlert')
        .select('status, valuePercentage, betPlaced, externalBetId')
        .or(`userId.eq.${userId},userId.is.null`);

      if (queryError) {
        console.error('Error fetching alert stats:', queryError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch stats' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stats = {
        totalAlerts: alerts?.length || 0,
        activeAlerts: alerts?.filter((a: any) => a.status === 'ACTIVE').length || 0,
        takenAlerts: alerts?.filter((a: any) => a.status === 'TAKEN').length || 0,
        expiredAlerts: alerts?.filter((a: any) => a.status === 'EXPIRED').length || 0,
        averageValue: alerts && alerts.length > 0
          ? alerts.reduce((sum: number, a: any) => sum + (a.valuePercentage || 0), 0) / alerts.length
          : 0,
        betsPlaced: alerts?.filter((a: any) => a.betPlaced).length || 0,
      };

      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /value-bet-alerts/:alertId/click - Mark alert as clicked
    if (req.method === 'POST' && subAction === 'click') {
      const alertId = action;

      if (!alertId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Alert ID required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify alert exists and user has access
      const { data: alert, error: alertError } = await supabase
        .from('ValueBetAlert')
        .select('id, userId')
        .eq('id', alertId)
        .single();

      if (alertError || !alert) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Alert not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user has access (if userId provided)
      if (alert.userId && alert.userId !== userId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Unauthorized' } }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update alert
      const { data: updatedAlert, error: updateError } = await supabase
        .from('ValueBetAlert')
        .update({ clickedAt: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating alert:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to update alert' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedAlert }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /value-bet-alerts/:alertId/taken - Mark alert as taken
    if (req.method === 'POST' && subAction === 'taken') {
      const alertId = action;
      const body = await req.json();
      const { externalBetId } = body;

      if (!alertId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Alert ID required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify alert exists
      const { data: alert, error: alertError } = await supabase
        .from('ValueBetAlert')
        .select('id')
        .eq('id', alertId)
        .single();

      if (alertError || !alert) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Alert not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update alert
      const { data: updatedAlert, error: updateError } = await supabase
        .from('ValueBetAlert')
        .update({
          status: 'TAKEN',
          betPlaced: true,
          externalBetId: externalBetId || null,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating alert:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to update alert' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedAlert }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /value-bet-alerts/:id - Get specific alert
    if (req.method === 'GET' && action && action !== 'my-alerts' && action !== 'stats' && !subAction) {
      const alertId = action;

      const { data: alert, error: queryError } = await supabase
        .from('ValueBetAlert')
        .select(`
          *,
          event:Event!ValueBetAlert_eventId_fkey (
            *,
            sport:Sport!Event_sportId_fkey (*)
          ),
          market:Market!ValueBetAlert_marketId_fkey (*)
        `)
        .eq('id', alertId)
        .single();

      if (queryError || !alert) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Alert not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user has access
      if (alert.userId && alert.userId !== userId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Unauthorized' } }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: alert }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in value-bet-alerts function:', error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

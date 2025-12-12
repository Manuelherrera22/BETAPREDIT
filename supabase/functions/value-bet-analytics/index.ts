/**
 * Value Bet Analytics Edge Function
 * Handles value bet analytics calculations using Supabase
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
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Missing authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid or expired token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const url = new URL(req.url);
    const path = url.pathname.replace('/value-bet-analytics', '');

    // Route handling
    if (req.method === 'GET' && path === '' || path === '/') {
      // GET /value-bet-analytics - Get analytics
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const sport = url.searchParams.get('sport');

      // Build query
      let query = supabase
        .from('ValueBetAlert')
        .select(`
          *,
          event:Event(
            *,
            sport:Sport(*)
          ),
          externalBet:ExternalBet(
            *,
            result:BetResult(*)
          )
        `)
        .eq('userId', userId);

      if (startDate) {
        query = query.gte('createdAt', startDate);
      }
      if (endDate) {
        query = query.lte('createdAt', endDate);
      }

      const { data: alerts, error } = await query;

      if (error) {
        throw error;
      }

      // Filter by sport if provided
      let filteredAlerts = alerts || [];
      if (sport) {
        filteredAlerts = filteredAlerts.filter((a: any) => 
          a.event?.sport?.slug === sport
        );
      }

      // Calculate analytics
      const totalDetected = filteredAlerts.length;
      const totalTaken = filteredAlerts.filter((a: any) => a.status === 'TAKEN').length;
      const totalExpired = filteredAlerts.filter((a: any) => a.status === 'EXPIRED').length;
      const totalInvalid = filteredAlerts.filter((a: any) => a.status === 'INVALID').length;

      const valuePercentages = filteredAlerts.map((a: any) => a.valuePercentage || 0);
      const averageValue = valuePercentages.length > 0
        ? valuePercentages.reduce((sum: number, val: number) => sum + val, 0) / valuePercentages.length
        : 0;
      const highestValue = valuePercentages.length > 0
        ? Math.max(...valuePercentages)
        : 0;

      // Calculate success rate based on external bets with results
      const takenAlerts = filteredAlerts.filter((a: any) => 
        a.status === 'TAKEN' && a.externalBet
      );
      const wonBets = takenAlerts.filter((a: any) => 
        a.externalBet?.result?.status === 'WON'
      ).length;
      const successRate = takenAlerts.length > 0
        ? (wonBets / takenAlerts.length) * 100
        : 0;

      const totalExpectedValue = filteredAlerts.reduce((sum: number, a: any) => 
        sum + (a.expectedValue || 0), 0
      );

      // Group by sport
      const bySport: Record<string, any> = {};
      filteredAlerts.forEach((alert: any) => {
        const sportName = alert.event?.sport?.name || 'Unknown';
        if (!bySport[sportName]) {
          bySport[sportName] = {
            detected: 0,
            taken: 0,
            totalValue: 0,
          };
        }
        bySport[sportName].detected++;
        if (alert.status === 'TAKEN') {
          bySport[sportName].taken++;
        }
        bySport[sportName].totalValue += alert.valuePercentage || 0;
      });

      // Calculate averages for each sport
      Object.keys(bySport).forEach((sport) => {
        bySport[sport].averageValue = bySport[sport].totalValue / bySport[sport].detected;
        delete bySport[sport].totalValue;
      });

      // Group by time period
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      const byTimePeriod = {
        today: filteredAlerts.filter((a: any) => new Date(a.createdAt) >= today).length,
        thisWeek: filteredAlerts.filter((a: any) => new Date(a.createdAt) >= thisWeek).length,
        thisMonth: filteredAlerts.filter((a: any) => new Date(a.createdAt) >= thisMonth).length,
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            totalDetected,
            totalTaken,
            totalExpired,
            totalInvalid,
            averageValue,
            highestValue,
            successRate,
            totalExpectedValue,
            bySport,
            byTimePeriod,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path === '/top') {
      // GET /value-bet-analytics/top - Get top value bets
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const { data: alerts, error } = await supabase
        .from('ValueBetAlert')
        .select(`
          *,
          event:Event(
            *,
            sport:Sport(*)
          ),
          market:Market(*)
        `)
        .eq('userId', userId)
        .in('status', ['ACTIVE', 'TAKEN'])
        .order('valuePercentage', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data: alerts || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path === '/trends') {
      // GET /value-bet-analytics/trends - Get trends
      const days = parseInt(url.searchParams.get('days') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: alerts, error } = await supabase
        .from('ValueBetAlert')
        .select('createdAt, valuePercentage, status')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: true });

      if (error) {
        throw error;
      }

      // Group by day
      const trends: Record<string, any> = {};

      (alerts || []).forEach((alert: any) => {
        const date = new Date(alert.createdAt).toISOString().split('T')[0];
        if (!trends[date]) {
          trends[date] = {
            date,
            detected: 0,
            averageValue: 0,
            taken: 0,
            totalValue: 0,
          };
        }
        trends[date].detected++;
        trends[date].totalValue += alert.valuePercentage || 0;
        if (alert.status === 'TAKEN') {
          trends[date].taken++;
        }
      });

      // Calculate averages
      const trendsArray = Object.values(trends).map((trend: any) => {
        trend.averageValue = trend.totalValue / trend.detected;
        delete trend.totalValue;
        return trend;
      });

      return new Response(
        JSON.stringify({ success: true, data: trendsArray }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'POST' && path.startsWith('/track/')) {
      // POST /value-bet-analytics/track/:alertId - Track outcome
      const alertId = path.replace('/track/', '');
      const body = await req.json();
      const { outcome } = body;

      if (!['WON', 'LOST', 'VOID'].includes(outcome)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Invalid outcome. Must be WON, LOST, or VOID' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get alert
      const { data: alert, error: alertError } = await supabase
        .from('ValueBetAlert')
        .select('*, externalBet:ExternalBet(*)')
        .eq('id', alertId)
        .single();

      if (alertError || !alert) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Alert not found' },
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update alert with outcome
      const factors = alert.factors || {};
      const updatedFactors = {
        ...factors,
        outcome,
        trackedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('ValueBetAlert')
        .update({ factors: updatedFactors })
        .eq('id', alertId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Outcome tracked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Route not found' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in value-bet-analytics function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

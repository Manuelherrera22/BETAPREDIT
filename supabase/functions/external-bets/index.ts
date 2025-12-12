/**
 * External Bets Edge Function
 * Handles external bet registration and management using Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterExternalBetData {
  eventId?: string;
  externalEventId?: string;
  platform: string;
  platformBetId?: string;
  platformUrl?: string;
  marketType: string;
  selection: string;
  odds: number;
  stake: number;
  currency?: string;
  betPlacedAt: string | Date;
  notes?: string;
  tags?: string[];
  metadata?: any;
  valueBetAlertId?: string;
}

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
    
    // Find the index of 'external-bets' in the path
    const functionIndex = pathParts.indexOf('external-bets');
    const action = functionIndex >= 0 && pathParts.length > functionIndex + 1 
      ? pathParts[functionIndex + 1] 
      : null;
    
    // betId is the last part if it's not 'stats' or 'external-bets'
    const betId = action && action !== 'stats' && action !== 'external-bets' 
      ? action 
      : null;

    // POST /external-bets - Register new bet
    if (req.method === 'POST' && !betId) {
      const body: RegisterExternalBetData = await req.json();

      // Validate required fields
      if (!body.platform || !body.selection || !body.odds || !body.stake) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Missing required fields: platform, selection, odds, stake' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify event if provided
      if (body.eventId) {
        const { data: event, error: eventError } = await supabase
          .from('Event')
          .select('id')
          .eq('id', body.eventId)
          .single();

        if (eventError || !event) {
          return new Response(
            JSON.stringify({ success: false, error: { message: 'Event not found' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Verify value bet alert if provided
      if (body.valueBetAlertId) {
        const { data: alert, error: alertError } = await supabase
          .from('ValueBetAlert')
          .select('id')
          .eq('id', body.valueBetAlertId)
          .eq('userId', userId)
          .single();

        if (alertError || !alert) {
          return new Response(
            JSON.stringify({ success: false, error: { message: 'Value bet alert not found or does not belong to user' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create the external bet
      const betData = {
        userId,
        eventId: body.eventId || null,
        externalEventId: body.externalEventId || null,
        platform: body.platform,
        platformBetId: body.platformBetId || null,
        platformUrl: body.platformUrl || null,
        marketType: body.marketType,
        selection: body.selection,
        odds: body.odds,
        stake: body.stake,
        currency: body.currency || 'USD',
        betPlacedAt: new Date(body.betPlacedAt).toISOString(),
        notes: body.notes || null,
        tags: body.tags || [],
        metadata: body.metadata || null,
        status: 'PENDING',
        valueBetAlertId: body.valueBetAlertId || null,
      };

      const { data: bet, error: createError } = await supabase
        .from('ExternalBet')
        .insert(betData)
        .select(`
          *,
          event:Event(
            id,
            homeTeam,
            awayTeam,
            startTime,
            status,
            sport:Sport(id, name)
          ),
          valueBetAlert:ValueBetAlert(
            id,
            valuePercentage
          )
        `)
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ success: false, error: { message: createError.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: bet }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /external-bets - Get user's bets
    if (req.method === 'GET' && !betId && action !== 'stats') {
      const status = url.searchParams.get('status');
      const platform = url.searchParams.get('platform');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      let query = supabase
        .from('ExternalBet')
        .select(`
          *,
          event:Event(
            id,
            homeTeam,
            awayTeam,
            startTime,
            status,
            sport:Sport(id, name)
          ),
          valueBetAlert:ValueBetAlert(
            id,
            valuePercentage
          )
        `)
        .eq('userId', userId)
        .order('betPlacedAt', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      if (startDate) {
        query = query.gte('betPlacedAt', new Date(startDate).toISOString());
      }

      if (endDate) {
        query = query.lte('betPlacedAt', new Date(endDate).toISOString());
      }

      const { data: bets, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: { message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: bets || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /external-bets/stats - Get bet statistics
    if (req.method === 'GET' && action === 'stats') {
      const period = url.searchParams.get('period') || 'all';
      const now = new Date();
      let startDate: Date | undefined;

      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === 'year') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      let query = supabase
        .from('ExternalBet')
        .select('status, result, stake, actualWin, odds, platform')
        .eq('userId', userId);

      if (startDate) {
        query = query.gte('betPlacedAt', startDate.toISOString());
      }

      const { data: bets, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: { message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const betsArray = bets || [];
      const stats = {
        totalBets: betsArray.length,
        totalWins: betsArray.filter((b: any) => b.status === 'WON').length,
        totalLosses: betsArray.filter((b: any) => b.status === 'LOST').length,
        totalVoids: betsArray.filter((b: any) => b.status === 'VOID').length,
        totalStaked: betsArray.reduce((sum: number, b: any) => sum + (b.stake || 0), 0),
        totalWon: betsArray
          .filter((b: any) => b.status === 'WON' && b.actualWin)
          .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0),
        totalLost: betsArray
          .filter((b: any) => b.status === 'LOST')
          .reduce((sum: number, b: any) => sum + (b.stake || 0), 0),
        winRate:
          betsArray.length > 0
            ? (betsArray.filter((b: any) => b.status === 'WON').length / betsArray.length) * 100
            : 0,
        roi:
          betsArray.length > 0
            ? ((betsArray
                .filter((b: any) => b.status === 'WON' && b.actualWin)
                .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0) -
                betsArray.reduce((sum: number, b: any) => sum + (b.stake || 0), 0)) /
                betsArray.reduce((sum: number, b: any) => sum + (b.stake || 0), 0)) *
              100
            : 0,
        byPlatform: {} as Record<string, any>,
      };

      // Calculate stats by platform
      const platforms = [...new Set(betsArray.map((b: any) => b.platform))];
      platforms.forEach((platform) => {
        const platformBets = betsArray.filter((b: any) => b.platform === platform);
        (stats.byPlatform as any)[platform as string] = {
          totalBets: platformBets.length,
          wins: platformBets.filter((b: any) => b.status === 'WON').length,
          losses: platformBets.filter((b: any) => b.status === 'LOST').length,
          totalStaked: platformBets.reduce((sum: number, b: any) => sum + (b.stake || 0), 0),
          totalWon: platformBets
            .filter((b: any) => b.status === 'WON' && b.actualWin)
            .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0),
        };
      });

      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /external-bets/:betId - Update bet result
    if (req.method === 'PUT' && betId) {
      const body = await req.json();
      const { result, actualWin } = body;

      if (!result || !['WON', 'LOST', 'VOID', 'CANCELLED'].includes(result)) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Invalid result. Must be WON, LOST, VOID, or CANCELLED' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the bet first to verify ownership and status
      const { data: bet, error: betError } = await supabase
        .from('ExternalBet')
        .select('id, status, stake, odds')
        .eq('id', betId)
        .eq('userId', userId)
        .single();

      if (betError || !bet) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Bet not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (bet.status !== 'PENDING') {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Bet result already set' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate actual win if not provided
      const calculatedWin = result === 'WON' 
        ? (actualWin !== undefined ? actualWin : bet.stake * bet.odds)
        : null;

      const updateData: any = {
        status: result,
        result: result === 'WON' ? 'WON' : result === 'LOST' ? 'LOST' : 'VOID',
        settledAt: new Date().toISOString(),
      };

      if (calculatedWin !== null) {
        updateData.actualWin = calculatedWin;
      }

      const { data: updatedBet, error: updateError } = await supabase
        .from('ExternalBet')
        .update(updateData)
        .eq('id', betId)
        .select(`
          *,
          valueBetAlert:ValueBetAlert(
            id,
            valuePercentage
          )
        `)
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: { message: updateError.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedBet }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /external-bets/:betId - Delete bet
    if (req.method === 'DELETE' && betId) {
      // Verify ownership
      const { data: bet, error: betError } = await supabase
        .from('ExternalBet')
        .select('id')
        .eq('id', betId)
        .eq('userId', userId)
        .single();

      if (betError || !bet) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Bet not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('ExternalBet')
        .delete()
        .eq('id', betId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ success: false, error: { message: deleteError.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Bet deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


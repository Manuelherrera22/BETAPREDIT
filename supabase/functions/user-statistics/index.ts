/**
 * User Statistics Edge Function
 * Handles user statistics calculation using Supabase
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
    const period = url.searchParams.get('period') || 'all_time';

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date | null = null;

    if (period === 'daily') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
    } else if (period === 'weekly') {
      const dayOfWeek = now.getDay();
      periodStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      // all_time
      periodStart = new Date(0);
      periodEnd = null;
    }

    // Get bets for the period
    let betsQuery = supabase
      .from('ExternalBet')
      .select(`
        *,
        event:Event(
          id,
          homeTeam,
          awayTeam,
          sport:Sport(id, name)
        )
      `)
      .eq('userId', userId)
      .gte('betPlacedAt', periodStart.toISOString());

    if (periodEnd) {
      betsQuery = betsQuery.lte('betPlacedAt', periodEnd.toISOString());
    }

    const { data: bets, error: betsError } = await betsQuery;

    if (betsError) {
      return new Response(
        JSON.stringify({ success: false, error: { message: betsError.message } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const betsArray = bets || [];

    // Calculate basic statistics
    const totalBets = betsArray.length;
    const totalWins = betsArray.filter((b: any) => b.status === 'WON').length;
    const totalLosses = betsArray.filter((b: any) => b.status === 'LOST').length;
    const totalVoids = betsArray.filter((b: any) => b.status === 'VOID').length;
    const totalStaked = betsArray.reduce((sum: number, b: any) => sum + (b.stake || 0), 0);
    const totalWon = betsArray
      .filter((b: any) => b.status === 'WON' && b.actualWin)
      .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0);
    const totalLost = betsArray
      .filter((b: any) => b.status === 'LOST')
      .reduce((sum: number, b: any) => sum + (b.stake || 0), 0);
    const netProfit = totalWon - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

    // By sport
    const statsBySport: Record<string, any> = {};
    betsArray.forEach((bet: any) => {
      const sport = bet.event?.sport?.name || 'Unknown';
      if (!statsBySport[sport]) {
        statsBySport[sport] = {
          bets: 0,
          wins: 0,
          losses: 0,
          staked: 0,
          won: 0,
          lost: 0,
        };
      }
      statsBySport[sport].bets++;
      if (bet.status === 'WON') {
        statsBySport[sport].wins++;
        statsBySport[sport].won += bet.actualWin || 0;
      } else if (bet.status === 'LOST') {
        statsBySport[sport].losses++;
        statsBySport[sport].lost += bet.stake || 0;
      }
      statsBySport[sport].staked += bet.stake || 0;
    });

    // Calculate ROI for each sport
    Object.keys(statsBySport).forEach((sport) => {
      const stats = statsBySport[sport];
      stats.roi = stats.staked > 0 ? ((stats.won - stats.staked) / stats.staked) * 100 : 0;
      stats.winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
    });

    // By platform
    const statsByPlatform: Record<string, any> = {};
    betsArray.forEach((bet: any) => {
      const platform = bet.platform;
      if (!statsByPlatform[platform]) {
        statsByPlatform[platform] = {
          bets: 0,
          wins: 0,
          losses: 0,
          staked: 0,
          won: 0,
          lost: 0,
        };
      }
      statsByPlatform[platform].bets++;
      if (bet.status === 'WON') {
        statsByPlatform[platform].wins++;
        statsByPlatform[platform].won += bet.actualWin || 0;
      } else if (bet.status === 'LOST') {
        statsByPlatform[platform].losses++;
        statsByPlatform[platform].lost += bet.stake || 0;
      }
      statsByPlatform[platform].staked += bet.stake || 0;
    });

    // Calculate ROI for each platform
    Object.keys(statsByPlatform).forEach((platform) => {
      const stats = statsByPlatform[platform];
      stats.roi = stats.staked > 0 ? ((stats.won - stats.staked) / stats.staked) * 100 : 0;
      stats.winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
    });

    // By market type
    const statsByMarket: Record<string, any> = {};
    betsArray.forEach((bet: any) => {
      const market = bet.marketType;
      if (!statsByMarket[market]) {
        statsByMarket[market] = {
          bets: 0,
          wins: 0,
          losses: 0,
          staked: 0,
          won: 0,
          lost: 0,
        };
      }
      statsByMarket[market].bets++;
      if (bet.status === 'WON') {
        statsByMarket[market].wins++;
        statsByMarket[market].won += bet.actualWin || 0;
      } else if (bet.status === 'LOST') {
        statsByMarket[market].losses++;
        statsByMarket[market].lost += bet.stake || 0;
      }
      statsByMarket[market].staked += bet.stake || 0;
    });

    // Calculate ROI for each market
    Object.keys(statsByMarket).forEach((market) => {
      const stats = statsByMarket[market];
      stats.roi = stats.staked > 0 ? ((stats.won - stats.staked) / stats.staked) * 100 : 0;
      stats.winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
    });

    // Value bets stats (from alerts)
    let valueBetsQuery = supabase
      .from('ValueBetAlert')
      .select(`
        id,
        betPlaced,
        externalBet:ExternalBet(
          status,
          stake,
          actualWin
        )
      `)
      .eq('userId', userId)
      .eq('betPlaced', true);

    const { data: valueBetAlerts, error: alertsError } = await valueBetsQuery;

    const alertsArray = valueBetAlerts || [];
    const valueBetsFound = alertsArray.length;
    const valueBetsTaken = alertsArray.filter((a: any) => a.betPlaced).length;
    const valueBetsWon = alertsArray.filter(
      (a: any) => a.externalBet?.status === 'WON'
    ).length;

    const valueBetsStaked = alertsArray
      .filter((a: any) => a.externalBet)
      .reduce((sum: number, a: any) => sum + (a.externalBet?.stake || 0), 0);
    const valueBetsWonAmount = alertsArray
      .filter((a: any) => a.externalBet?.status === 'WON')
      .reduce((sum: number, a: any) => sum + (a.externalBet?.actualWin || 0), 0);
    const valueBetsROI =
      valueBetsStaked > 0
        ? ((valueBetsWonAmount - valueBetsStaked) / valueBetsStaked) * 100
        : 0;

    const statistics = {
      userId,
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd ? periodEnd.toISOString() : null,
      totalBets,
      totalWins,
      totalLosses,
      totalVoids,
      totalStaked,
      totalWon,
      totalLost,
      netProfit,
      roi,
      winRate,
      statsBySport,
      statsByPlatform,
      statsByMarket,
      valueBetsFound,
      valueBetsTaken,
      valueBetsWon,
      valueBetsROI,
      lastUpdated: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({ success: true, data: statistics }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


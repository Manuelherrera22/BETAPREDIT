/**
 * ROI Tracking Edge Function
 * Handles ROI tracking calculations using Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate stats from bets
function calculateStats(bets: any[]) {
  const totalBets = bets.length;
  const totalWins = bets.filter((b) => b.status === 'WON').length;
  const totalLosses = bets.filter((b) => b.status === 'LOST').length;
  const totalStaked = bets.reduce((sum: number, b: any) => sum + (b.stake || 0), 0);
  const totalWon = bets
    .filter((b: any) => b.status === 'WON' && b.actualWin)
    .reduce((sum: number, b: any) => sum + (b.actualWin || 0), 0);
  const netProfit = totalWon - totalStaked;
  const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
  const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

  return {
    totalBets,
    totalWins,
    totalLosses,
    totalStaked,
    totalWon,
    netProfit,
    roi,
    winRate,
  };
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
    const functionIndex = pathParts.indexOf('roi-tracking');
    const action = pathParts[functionIndex + 1]; // 'history', 'top-value-bets', etc.

    // GET /roi-tracking - Get ROI tracking
    if (req.method === 'GET' && !action) {
      const period = url.searchParams.get('period') || 'all_time';
      const now = new Date();
      let startDate: Date | undefined;

      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === 'year') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      // Build query for resolved bets
      let query = supabase
        .from('ExternalBet')
        .select(`
          *,
          valueBetAlert:ValueBetAlert!ExternalBet_valueBetAlertId_fkey (
            id
          )
        `)
        .eq('userId', userId)
        .in('status', ['WON', 'LOST', 'VOID']);

      if (startDate) {
        query = query.gte('betPlacedAt', startDate.toISOString());
      }

      const { data: allBets, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching bets:', queryError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch bets' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Separate value bets from normal bets
      const valueBets = (allBets || []).filter((bet: any) => bet.valueBetAlert !== null);
      const normalBets = (allBets || []).filter((bet: any) => bet.valueBetAlert === null);

      // Calculate stats
      const totalStats = calculateStats(allBets || []);
      const valueBetsStats = calculateStats(valueBets);
      const normalBetsStats = calculateStats(normalBets);

      // Get user's first bet date
      const { data: firstBet } = await supabase
        .from('ExternalBet')
        .select('registeredAt')
        .eq('userId', userId)
        .order('registeredAt', { ascending: true })
        .limit(1)
        .single();

      let comparison = undefined;
      if (firstBet && period === 'all_time') {
        comparison = {
          before: null,
          after: totalStats.roi,
          improvement: totalStats.roi,
          betsBefore: 0,
          betsAfter: (allBets || []).length,
        };
      }

      const result = {
        totalROI: totalStats.roi,
        valueBetsROI: valueBetsStats.roi,
        normalBetsROI: normalBetsStats.roi,
        totalBets: totalStats.totalBets,
        totalWins: totalStats.totalWins,
        totalLosses: totalStats.totalLosses,
        totalStaked: totalStats.totalStaked,
        totalWon: totalStats.totalWon,
        netProfit: totalStats.netProfit,
        comparison,
        valueBetsMetrics: {
          taken: valueBets.length,
          won: valueBetsStats.totalWins,
          lost: valueBetsStats.totalLosses,
          winRate: valueBetsStats.winRate,
          roi: valueBetsStats.roi,
          totalStaked: valueBetsStats.totalStaked,
          totalWon: valueBetsStats.totalWon,
          netProfit: valueBetsStats.netProfit,
        },
      };

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /roi-tracking/history - Get ROI history
    if (req.method === 'GET' && action === 'history') {
      const period = url.searchParams.get('period') || 'month';
      const now = new Date();
      let intervalDays: number;
      let startDate: Date;

      if (period === 'week') {
        intervalDays = 1;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        intervalDays = 7;
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        intervalDays = 30;
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      // Get all bets in the period
      const { data: bets, error: betsError } = await supabase
        .from('ExternalBet')
        .select('*')
        .eq('userId', userId)
        .in('status', ['WON', 'LOST', 'VOID'])
        .gte('betPlacedAt', startDate.toISOString())
        .order('betPlacedAt', { ascending: true });

      if (betsError) {
        console.error('Error fetching bets for history:', betsError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch history' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Group bets by interval
      const history: Array<{
        date: string;
        roi: number;
        netProfit: number;
        bets: number;
      }> = [];

      if (bets && bets.length > 0) {
        const groupedBets: { [key: string]: any[] } = {};
        
        (bets as any[]).forEach((bet) => {
          const betDate = new Date(bet.betPlacedAt);
          const intervalStart = new Date(betDate);
          intervalStart.setDate(intervalStart.getDate() - (intervalStart.getDate() % intervalDays));
          intervalStart.setHours(0, 0, 0, 0);
          
          const key = intervalStart.toISOString().split('T')[0];
          if (!groupedBets[key]) {
            groupedBets[key] = [];
          }
          groupedBets[key].push(bet);
        });

        // Calculate stats for each interval
        Object.keys(groupedBets).sort().forEach((dateKey) => {
          const intervalBets = groupedBets[dateKey];
          const stats = calculateStats(intervalBets);
          history.push({
            date: dateKey,
            roi: stats.roi,
            netProfit: stats.netProfit,
            bets: stats.totalBets,
          });
        });
      }

      return new Response(
        JSON.stringify({ success: true, data: history }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /roi-tracking/top-value-bets - Get top value bets by ROI
    if (req.method === 'GET' && action === 'top-value-bets') {
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const { data: bets, error: betsError } = await supabase
        .from('ExternalBet')
        .select(`
          id,
          event:Event!ExternalBet_eventId_fkey (
            id,
            name,
            homeTeam,
            awayTeam,
            sport:Sport!Event_sportId_fkey (
              name
            )
          ),
          selection,
          odds,
          stake,
          status,
          actualWin,
          valueBetAlert:ValueBetAlert!ExternalBet_valueBetAlertId_fkey (
            id,
            valuePercentage
          )
        `)
        .eq('userId', userId)
        .in('status', ['WON', 'LOST', 'VOID'])
        .not('valueBetAlertId', 'is', null)
        .order('registeredAt', { ascending: false })
        .limit(limit * 2); // Get more to calculate ROI and sort

      if (betsError) {
        console.error('Error fetching top value bets:', betsError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch top value bets' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate ROI for each bet and sort
      const betsWithROI = (bets || []).map((bet: any) => {
        const profit = bet.status === 'WON' && bet.actualWin
          ? bet.actualWin - bet.stake
          : bet.status === 'LOST'
          ? -bet.stake
          : 0;
        const roi = bet.stake > 0 ? (profit / bet.stake) * 100 : 0;
        return {
          ...bet,
          roi,
          profit,
        };
      });

      // Sort by ROI descending and take top N
      const topBets = betsWithROI
        .sort((a: any, b: any) => b.roi - a.roi)
        .slice(0, limit)
        .map((bet: any) => ({
          id: bet.id,
          event: bet.event?.name || 'Unknown Event',
          sport: bet.event?.sport?.name || 'Unknown',
          selection: bet.selection,
          odds: bet.odds,
          stake: bet.stake,
          roi: bet.roi,
          profit: bet.profit,
          status: bet.status,
          valuePercentage: bet.valueBetAlert?.valuePercentage || 0,
        }));

      return new Response(
        JSON.stringify({ success: true, data: topBets }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in roi-tracking function:', error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

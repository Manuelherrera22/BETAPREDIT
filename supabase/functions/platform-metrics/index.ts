/**
 * Platform Metrics Edge Function
 * Handles platform-wide statistics using Supabase
 * Public endpoint (no authentication required)
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

    // Route handling
    if (req.method === 'GET') {
      // GET /platform-metrics - Get platform metrics
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(todayStart.getTime() - 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Value bets found today
      const { count: valueBetsToday } = await supabase
        .from('ValueBetAlert')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', todayStart.toISOString())
        .eq('status', 'ACTIVE');

      // Value bets found yesterday
      const { count: valueBetsYesterday } = await supabase
        .from('ValueBetAlert')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', yesterdayStart.toISOString())
        .lte('createdAt', yesterdayEnd.toISOString())
        .eq('status', 'ACTIVE');

      // Total value bets found
      const { count: totalValueBets } = await supabase
        .from('ValueBetAlert')
        .select('*', { count: 'exact', head: true })
        .in('status', ['ACTIVE', 'TAKEN', 'EXPIRED']);

      // Active users (users who logged in in last 7 days or have bets in last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get users with recent login
      const { data: usersWithLogin, error: loginError } = await supabase
        .from('User')
        .select('id')
        .gte('lastLoginAt', sevenDaysAgo.toISOString());

      // Get users with recent bets
      const { data: usersWithBets, error: betsUserError } = await supabase
        .from('ExternalBet')
        .select('userId')
        .gte('registeredAt', sevenDaysAgo.toISOString());

      // Combine and get unique users
      const activeUserIds = new Set<string>();
      if (usersWithLogin) {
        usersWithLogin.forEach((u: any) => activeUserIds.add(u.id));
      }
      if (usersWithBets) {
        usersWithBets.forEach((b: any) => {
          if (b.userId) activeUserIds.add(b.userId);
        });
      }
      
      const activeUsers = activeUserIds.size;

      // Total users
      const { count: totalUsers } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true });

      // Calculate average ROI from resolved bets this month
      const { data: resolvedBets, error: betsError } = await supabase
        .from('ExternalBet')
        .select('stake, actualWin, status')
        .in('status', ['WON', 'LOST'])
        .gte('betPlacedAt', thisMonthStart.toISOString());

      if (betsError) {
        throw betsError;
      }

      let totalStaked = 0;
      let totalWon = 0;
      (resolvedBets || []).forEach((bet: any) => {
        totalStaked += bet.stake || 0;
        if (bet.status === 'WON' && bet.actualWin) {
          totalWon += bet.actualWin;
        }
      });

      const averageROI = totalStaked > 0 ? ((totalWon - totalStaked) / totalStaked) * 100 : 0;

      // Calculate average accuracy (win rate)
      const totalResolved = (resolvedBets || []).length;
      const totalWins = (resolvedBets || []).filter((b: any) => b.status === 'WON').length;
      const averageAccuracy = totalResolved > 0 ? (totalWins / totalResolved) * 100 : 0;

      // Calculate trends (compare this month vs last month)
      const { data: lastMonthBets, error: lastMonthBetsError } = await supabase
        .from('ExternalBet')
        .select('stake, actualWin, status')
        .in('status', ['WON', 'LOST'])
        .gte('betPlacedAt', lastMonthStart.toISOString())
        .lt('betPlacedAt', thisMonthStart.toISOString());

      if (lastMonthBetsError) {
        throw lastMonthBetsError;
      }

      let lastMonthStaked = 0;
      let lastMonthWon = 0;
      (lastMonthBets || []).forEach((bet: any) => {
        lastMonthStaked += bet.stake || 0;
        if (bet.status === 'WON' && bet.actualWin) {
          lastMonthWon += bet.actualWin;
        }
      });

      const lastMonthROI = lastMonthStaked > 0 ? ((lastMonthWon - lastMonthStaked) / lastMonthStaked) * 100 : 0;
      const roiChange = averageROI - lastMonthROI;

      // Active users last month
      const lastMonthSevenDaysAgo = new Date(lastMonthStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get users with login last month
      const { data: lastMonthUsersLogin, error: lastMonthLoginError } = await supabase
        .from('User')
        .select('id')
        .gte('lastLoginAt', lastMonthSevenDaysAgo.toISOString())
        .lt('lastLoginAt', thisMonthStart.toISOString());

      // Get users with bets last month
      const { data: lastMonthUsersBets, error: lastMonthBetsUserError } = await supabase
        .from('ExternalBet')
        .select('userId')
        .gte('registeredAt', lastMonthStart.toISOString())
        .lt('registeredAt', thisMonthStart.toISOString());

      // Combine and get unique users
      const lastMonthActiveUserIds = new Set<string>();
      if (lastMonthUsersLogin) {
        lastMonthUsersLogin.forEach((u: any) => lastMonthActiveUserIds.add(u.id));
      }
      if (lastMonthUsersBets) {
        lastMonthUsersBets.forEach((b: any) => {
          if (b.userId) lastMonthActiveUserIds.add(b.userId);
        });
      }
      
      const lastMonthActiveUsers = lastMonthActiveUserIds.size;
      const usersChange = activeUsers - lastMonthActiveUsers;

      // Value bets last month
      const { count: valueBetsLastMonth } = await supabase
        .from('ValueBetAlert')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', lastMonthStart.toISOString())
        .lt('createdAt', thisMonthStart.toISOString())
        .eq('status', 'ACTIVE');

      const valueBetsChange = (valueBetsToday || 0) - (valueBetsLastMonth || 0);

      // Accuracy last month
      const lastMonthTotal = (lastMonthBets || []).length;
      const lastMonthWins = (lastMonthBets || []).filter((b: any) => b.status === 'WON').length;
      const lastMonthAccuracy = lastMonthTotal > 0 ? (lastMonthWins / lastMonthTotal) * 100 : 0;
      const accuracyChange = averageAccuracy - lastMonthAccuracy;

      const metrics = {
        valueBetsFoundToday: valueBetsToday || 0,
        activeUsers,
        averageROI: Math.round(averageROI * 10) / 10,
        averageAccuracy: Math.round(averageAccuracy * 10) / 10,
        totalValueBetsFound: totalValueBets || 0,
        totalUsers: totalUsers || 0,
        trends: {
          valueBetsChange: valueBetsChange > 0 ? `+${valueBetsChange} vs mes anterior` : `${valueBetsChange} vs mes anterior`,
          usersChange: usersChange > 0 ? `+${usersChange} este mes` : `${usersChange} este mes`,
          roiChange: roiChange > 0 ? `+${Math.round(roiChange * 10) / 10}% vs mes anterior` : `${Math.round(roiChange * 10) / 10}% vs mes anterior`,
          accuracyChange: accuracyChange > 0 ? `+${Math.round(accuracyChange * 10) / 10}%` : `${Math.round(accuracyChange * 10) / 10}%`,
        },
      };

      return new Response(
        JSON.stringify({ success: true, data: metrics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in platform-metrics function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

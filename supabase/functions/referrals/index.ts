/**
 * Referrals Edge Function
 * Handles referral system using Supabase
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
    const path = url.pathname.replace('/referrals', '');

    // Route handling
    if (req.method === 'GET' && path === '/me') {
      // GET /referrals/me - Get user's referral stats
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('referralCode, referralCount, activeReferrals, referralRewards')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Get referred users
      const { data: referredUsers, error: referredError } = await supabase
        .from('User')
        .select(`
          id,
          email,
          firstName,
          lastName,
          subscriptionTier,
          createdAt,
          referredBy
        `)
        .eq('referredBy', userId)
        .order('createdAt', { ascending: false });

      if (referredError) {
        throw referredError;
      }

      // Process referrals data
      const referrals = (referredUsers || []).map((refUser: any) => {
        const isActive = refUser.subscriptionTier !== 'FREE';
        const rewardGranted = isActive;
        
        return {
          id: refUser.id,
          referredUser: {
            id: refUser.id,
            email: refUser.email,
            firstName: refUser.firstName,
            lastName: refUser.lastName,
            subscriptionTier: refUser.subscriptionTier,
            createdAt: refUser.createdAt,
          },
          status: isActive ? 'ACTIVE' : 'PENDING',
          rewardGranted,
          rewardType: isActive ? 'SUBSCRIPTION' : null,
          createdAt: refUser.createdAt,
          convertedAt: isActive ? refUser.createdAt : null,
        };
      });

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter((r: any) => r.status === 'ACTIVE').length;
      const pendingReferrals = referrals.filter((r: any) => r.status === 'PENDING').length;
      const rewardedReferrals = referrals.filter((r: any) => r.rewardGranted).length;

      // Get or generate referral code
      let referralCode = userData.referralCode;
      if (!referralCode) {
        // Generate a unique referral code
        referralCode = `REF${userId.slice(0, 8).toUpperCase()}`;
        
        // Update user with referral code
        await supabase
          .from('User')
          .update({ referralCode })
          .eq('id', userId);
      }

      const stats = {
        referralCode,
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        rewardedReferrals,
        referrals,
        rewards: userData.referralRewards || {
          freeMonths: 0,
          premiumAccess: false,
          discount: 0,
        },
      };

      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path === '/leaderboard') {
      // GET /referrals/leaderboard - Get referral leaderboard
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const { data: users, error } = await supabase
        .from('User')
        .select(`
          id,
          email,
          firstName,
          lastName,
          avatar,
          referralCount,
          activeReferrals
        `)
        .not('referralCount', 'is', null)
        .gt('referralCount', 0)
        .order('referralCount', { ascending: false })
        .order('activeReferrals', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const leaderboard = (users || []).map((user: any, index: number) => ({
        rank: index + 1,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        totalReferrals: user.referralCount || 0,
        activeReferrals: user.activeReferrals || 0,
      }));

      return new Response(
        JSON.stringify({ success: true, data: leaderboard }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'POST' && path === '/process') {
      // POST /referrals/process - Process referral code
      const body = await req.json();
      const { referralCode } = body;

      if (!referralCode) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Referral code is required' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find user with this referral code
      const { data: referrer, error: referrerError } = await supabase
        .from('User')
        .select('id, referralCount, activeReferrals')
        .eq('referralCode', referralCode)
        .single();

      if (referrerError || !referrer) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Invalid referral code' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already has a referrer
      const { data: currentUser, error: currentUserError } = await supabase
        .from('User')
        .select('referredBy')
        .eq('id', userId)
        .single();

      if (currentUserError) {
        throw currentUserError;
      }

      if (currentUser.referredBy) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'User already has a referrer' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-referral
      if (referrer.id === userId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Cannot refer yourself' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update current user with referrer
      const { error: updateError } = await supabase
        .from('User')
        .update({
          referredBy: referrer.id,
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update referrer's stats
      const { error: statsError } = await supabase
        .from('User')
        .update({
          referralCount: (referrer.referralCount || 0) + 1,
        })
        .eq('id', referrer.id);

      if (statsError) {
        throw statsError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Referral processed successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Route not found' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in referrals function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

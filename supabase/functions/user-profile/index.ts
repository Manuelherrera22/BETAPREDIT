/**
 * User Profile Edge Function
 * Handles user profile operations using Supabase
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
    // Supabase automatically injects these via environment variables
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

    // Validate email exists
    if (!user.email) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'User email is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET request - Get profile
    if (req.method === 'GET') {
      let { data: profile, error } = await supabase
        .from('User')
        .select('id, email, firstName, lastName, phone, dateOfBirth, avatar, timezone, preferredCurrency, preferredMode, subscriptionTier, createdAt')
        .eq('id', userId)
        .maybeSingle();

      // If user doesn't exist in User table, create it from auth user
      if ((error && error.code === 'PGRST116') || !profile) {
        // User not found in User table, create it
        const now = new Date().toISOString();
        const userData: any = {
          id: userId,
          email: user.email,
          firstName: user.user_metadata?.first_name || user.user_metadata?.firstName || null,
          lastName: user.user_metadata?.last_name || user.user_metadata?.lastName || null,
          passwordHash: null, // No password needed for OAuth users
          provider: user.app_metadata?.provider || 'supabase',
          verified: user.email_confirmed_at ? true : false,
          role: 'USER', // Default role
          kycStatus: 'PENDING', // Default KYC status
          preferredMode: 'pro', // Default to pro mode
          preferredCurrency: 'USD', // Default currency
          subscriptionTier: 'FREE', // Default tier
          timezone: 'UTC', // Default timezone
          createdAt: now, // Explicit creation time
          updatedAt: now, // Explicit update time (required by @updatedAt)
          // Statistics defaults
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          totalStaked: 0,
          totalWon: 0,
          roi: 0,
          winRate: 0,
          referralCount: 0,
          activeReferrals: 0,
        };

        // Add avatar if available
        if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
          userData.avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        }

        // Add Google ID if available
        if (user.app_metadata?.provider === 'google' && user.user_metadata?.sub) {
          userData.googleId = user.user_metadata.sub;
        }

        console.log('Creating user with data:', { ...userData, passwordHash: '[REDACTED]' });

        const { data: newUser, error: createError } = await supabase
          .from('User')
          .insert(userData)
          .select('id, email, firstName, lastName, phone, dateOfBirth, avatar, timezone, preferredCurrency, preferredMode, subscriptionTier, createdAt')
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          console.error('User data attempted:', { ...userData, passwordHash: '[REDACTED]' });
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { 
                message: `Failed to create user profile: ${createError.message}`,
                code: createError.code,
                details: createError.details
              }
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        profile = newUser;
      } else if (error) {
        // Other error
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: { message: error.message }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: profile }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle PUT request - Update profile
    if (req.method === 'PUT') {
      const body = await req.json();
      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        timezone,
        preferredCurrency,
        preferredMode,
      } = body;

      // Validate preferredMode
      if (preferredMode && !['casual', 'pro'].includes(preferredMode)) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'preferredMode must be "casual" or "pro"' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build update object
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;
      if (preferredMode !== undefined) updateData.preferredMode = preferredMode;

      // First check if user exists, if not create it
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingUser) {
        // User doesn't exist, create it first
        const now = new Date().toISOString();
        const userData: any = {
          id: userId,
          email: user.email,
          firstName: user.user_metadata?.first_name || user.user_metadata?.firstName || null,
          lastName: user.user_metadata?.last_name || user.user_metadata?.lastName || null,
          passwordHash: null,
          provider: user.app_metadata?.provider || 'supabase',
          verified: user.email_confirmed_at ? true : false,
          role: 'USER',
          kycStatus: 'PENDING',
          preferredMode: 'pro',
          preferredCurrency: 'USD',
          subscriptionTier: 'FREE',
          timezone: 'UTC',
          createdAt: now,
          updatedAt: now,
          // Statistics defaults
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          totalStaked: 0,
          totalWon: 0,
          roi: 0,
          winRate: 0,
          referralCount: 0,
          activeReferrals: 0,
          ...updateData, // Merge with update data (will override defaults if provided)
        };

        if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
          userData.avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        }

        // Add Google ID if available
        if (user.app_metadata?.provider === 'google' && user.user_metadata?.sub) {
          userData.googleId = user.user_metadata.sub;
        }

        const { data: newUser, error: createError } = await supabase
          .from('User')
          .insert(userData)
          .select('id, email, firstName, lastName, phone, dateOfBirth, avatar, timezone, preferredCurrency, preferredMode, subscriptionTier, createdAt')
          .single();

        if (createError) {
          console.error('Error creating user in PUT:', createError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { 
                message: `Failed to create user profile: ${createError.message}`,
                code: createError.code,
                details: createError.details
              }
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: newUser }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // User exists, update it
      const { data: updatedProfile, error } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, firstName, lastName, phone, dateOfBirth, avatar, timezone, preferredCurrency, preferredMode, subscriptionTier, createdAt')
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: { message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedProfile }),
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
      JSON.stringify({ success: false, error: { message: error.message } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


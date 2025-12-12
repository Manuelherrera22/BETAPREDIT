/**
 * User Preferences Edge Function
 * Handles user preferences management using Supabase
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
    const path = url.pathname.replace('/user-preferences', '');

    // Route handling
    if (req.method === 'GET' && (path === '' || path === '/')) {
      // GET /user-preferences - Get user preferences
      const { data: user, error } = await supabase
        .from('User')
        .select('alertPreferences, timezone')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      // Default preferences
      const defaultPreferences = {
        valueBetPreferences: {
          minValue: 0.05, // 5%
          maxEvents: 20,
          sports: ['soccer_epl', 'basketball_nba'],
          leagues: [],
          platforms: [],
          autoCreateAlerts: true,
          notificationThreshold: 0.10, // 10%
          minConfidence: 0.5, // 50%
          maxOdds: 10.0,
          minOdds: 1.1,
          timeRange: undefined,
          marketTypes: ['h2h'],
        },
        emailNotifications: true,
        pushNotifications: true,
        preferredSports: ['soccer_epl', 'basketball_nba'],
        timezone: user.timezone || 'UTC',
      };

      // Merge with user preferences if they exist
      const userPreferences = user.alertPreferences as any || {};
      const mergedPreferences = {
        ...defaultPreferences,
        ...userPreferences,
        valueBetPreferences: {
          ...defaultPreferences.valueBetPreferences,
          ...(userPreferences.valueBetPreferences || {}),
        },
        timezone: user.timezone || defaultPreferences.timezone,
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: mergedPreferences,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'PUT' && (path === '' || path === '/')) {
      // PUT /user-preferences - Update user preferences
      const body = await req.json();
      
      // Get current user preferences
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('alertPreferences')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Merge with existing preferences
      const currentPreferences = (user.alertPreferences as any) || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...body,
        valueBetPreferences: {
          ...(currentPreferences.valueBetPreferences || {}),
          ...(body.valueBetPreferences || {}),
        },
      };

      // Update user's alertPreferences field
      const { data: updatedUser, error: updateError } = await supabase
        .from('User')
        .update({
          alertPreferences: updatedPreferences,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('alertPreferences, timezone')
        .single();

      if (updateError) throw updateError;

      // Return merged preferences with defaults
      const defaultPreferences = {
        valueBetPreferences: {
          minValue: 0.05,
          maxEvents: 20,
          sports: ['soccer_epl', 'basketball_nba'],
          leagues: [],
          platforms: [],
          autoCreateAlerts: true,
          notificationThreshold: 0.10,
          minConfidence: 0.5,
          maxOdds: 10.0,
          minOdds: 1.1,
          timeRange: undefined,
          marketTypes: ['h2h'],
        },
        emailNotifications: true,
        pushNotifications: true,
        preferredSports: ['soccer_epl', 'basketball_nba'],
        timezone: updatedUser.timezone || 'UTC',
      };

      const result = {
        ...defaultPreferences,
        ...updatedPreferences,
        valueBetPreferences: {
          ...defaultPreferences.valueBetPreferences,
          ...updatedPreferences.valueBetPreferences,
        },
      };

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path === '/value-bets') {
      // GET /user-preferences/value-bets - Get value bet preferences only
      const { data: user, error } = await supabase
        .from('User')
        .select('alertPreferences')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      const userPreferences = (user.alertPreferences as any) || {};
      const defaultValueBetPreferences = {
        minValue: 0.05,
        maxEvents: 20,
        sports: ['soccer_epl', 'basketball_nba'],
        leagues: [],
        platforms: [],
        autoCreateAlerts: true,
        notificationThreshold: 0.10,
        minConfidence: 0.5,
        maxOdds: 10.0,
        minOdds: 1.1,
        timeRange: undefined,
        marketTypes: ['h2h'],
      };

      const result = {
        ...defaultValueBetPreferences,
        ...(userPreferences.valueBetPreferences || {}),
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'PUT' && path === '/value-bets') {
      // PUT /user-preferences/value-bets - Update value bet preferences only
      const body = await req.json();
      
      // Get current user preferences
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('alertPreferences')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Merge value bet preferences
      const currentPreferences = (user.alertPreferences as any) || {};
      const updatedValueBetPreferences = {
        ...(currentPreferences.valueBetPreferences || {}),
        ...body,
      };

      const updatedPreferences = {
        ...currentPreferences,
        valueBetPreferences: updatedValueBetPreferences,
      };

      // Update user's alertPreferences field
      const { error: updateError } = await supabase
        .from('User')
        .update({
          alertPreferences: updatedPreferences,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Return merged value bet preferences with defaults
      const defaultValueBetPreferences = {
        minValue: 0.05,
        maxEvents: 20,
        sports: ['soccer_epl', 'basketball_nba'],
        leagues: [],
        platforms: [],
        autoCreateAlerts: true,
        notificationThreshold: 0.10,
        minConfidence: 0.5,
        maxOdds: 10.0,
        minOdds: 1.1,
        timeRange: undefined,
        marketTypes: ['h2h'],
      };

      const result = {
        ...defaultValueBetPreferences,
        ...updatedValueBetPreferences,
      };

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Route not found' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in user-preferences function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

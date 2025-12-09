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

    // Handle GET request - Get profile
    if (req.method === 'GET') {
      const { data: profile, error } = await supabase
        .from('User')
        .select('id, email, firstName, lastName, phone, dateOfBirth, avatar, timezone, preferredCurrency, preferredMode, subscriptionTier, createdAt')
        .eq('id', userId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: { message: error.message } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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


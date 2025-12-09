/**
 * Get Events Edge Function
 * Obtiene eventos desde Supabase
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
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Unauthorized' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'SCHEDULED'; // 'LIVE' or 'SCHEDULED'
    const sportId = url.searchParams.get('sportId') || null;
    const sportSlug = url.searchParams.get('sportSlug') || null;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // If sportSlug is provided, find the sportId first
    let finalSportId = sportId;
    if (sportSlug && !sportId) {
      const { data: sport, error: sportError } = await supabase
        .from('Sport')
        .select('id')
        .eq('slug', sportSlug)
        .limit(1)
        .maybeSingle();

      if (sportError) {
        console.error('Error finding sport by slug:', sportError);
      } else if (sport) {
        finalSportId = sport.id;
      }
    }

    // Build query
    let query = supabase
      .from('Event')
      .select(`
        id,
        name,
        sportId,
        startTime,
        status,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        externalId,
        isActive,
        Sport:Sport (
          id,
          name,
          slug
        ),
        Market:Market (
          id,
          type,
          name,
          isActive,
          isSuspended
        )
      `)
      .eq('status', status)
      .order('startTime', { ascending: true })
      .limit(limit);

    // ⚠️ FILTRO: Solo eventos activos (si el campo existe)
    // Si isActive no existe en la BD, este filtro será ignorado silenciosamente
    try {
      query = query.eq('isActive', true);
    } catch (e) {
      // Si isActive no existe, continuar sin ese filtro
      console.warn('isActive field may not exist, continuing without filter');
    }

    // Filter by sport if provided
    if (finalSportId) {
      query = query.eq('sportId', finalSportId);
    }

    // For upcoming events, filter by startTime >= now
    if (status === 'SCHEDULED') {
      query = query.gte('startTime', new Date().toISOString());
    }

    const { data: events, error: queryError } = await query;

    if (queryError) {
      console.error('Error querying events:', queryError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: queryError.message || 'Failed to fetch events' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data to match frontend interface
    const transformedEvents = (events || []).map((event: any) => ({
      id: event.id,
      name: event.name,
      sportId: event.sportId,
      startTime: event.startTime,
      status: event.status,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      homeScore: event.homeScore,
      awayScore: event.awayScore,
      sport: event.Sport ? {
        id: event.Sport.id,
        name: event.Sport.name,
        slug: event.Sport.slug,
      } : null,
      markets: (event.Market || []).filter((m: any) => m.isActive && !m.isSuspended).map((m: any) => ({
        id: m.id,
        type: m.type,
        name: m.name,
        isActive: m.isActive,
        isSuspended: m.isSuspended,
      })),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedEvents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-events:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


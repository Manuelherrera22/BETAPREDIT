/**
 * Sync Events Edge Function
 * Sincroniza eventos desde The Odds API a Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

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

    // Parse request body
    const { sportKey } = await req.json().catch(() => ({}));

    // Get The Odds API key from environment
    const theOddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (!theOddsApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'The Odds API key not configured' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define sports to sync (if no sportKey provided, sync main sports)
    const sportsToSync = sportKey 
      ? [sportKey]
      : [
          'soccer_epl',
          'soccer_spain_la_liga',
          'soccer_italy_serie_a',
          'basketball_nba',
          'americanfootball_nfl',
          'icehockey_nhl',
        ];

    let totalSynced = 0;
    const results: Array<{ sport: string; count: number; error?: string }> = [];

    // Sync each sport
    for (const sport of sportsToSync) {
      try {
        // Fetch events from The Odds API
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=us,uk,eu&markets=h2h&oddsFormat=decimal&apiKey=${theOddsApiKey}`;
        const oddsResponse = await fetch(oddsUrl);
        
        if (!oddsResponse.ok) {
          const errorText = await oddsResponse.text();
          results.push({ sport, count: 0, error: `The Odds API error: ${errorText}` });
          continue;
        }

        const oddsEvents: OddsEvent[] = await oddsResponse.json();

        if (!oddsEvents || oddsEvents.length === 0) {
          results.push({ sport, count: 0 });
          continue;
        }

        let syncedCount = 0;

        // Process each event
        for (const oddsEvent of oddsEvents) {
          try {
            // Find or create sport
            let { data: sportData, error: sportError } = await supabase
              .from('Sport')
              .select('id')
              .or(`slug.eq.${oddsEvent.sport_key},name.ilike.%${oddsEvent.sport_title}%`)
              .limit(1)
              .single();

            if (sportError || !sportData) {
              // Create sport if it doesn't exist
              const { data: newSport, error: createSportError } = await supabase
                .from('Sport')
                .insert({
                  name: oddsEvent.sport_title,
                  slug: oddsEvent.sport_key,
                  isActive: true,
                })
                .select('id')
                .single();

              if (createSportError || !newSport) {
                console.error(`Error creating sport ${oddsEvent.sport_key}:`, createSportError);
                continue;
              }
              sportData = newSport;
            }

            // Check if event already exists
            const commenceDate = new Date(oddsEvent.commence_time);
            const startOfDay = new Date(commenceDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(commenceDate);
            endOfDay.setHours(23, 59, 59, 999);

            let { data: existingEvent } = await supabase
              .from('Event')
              .select('id')
              .eq('sportId', sportData.id)
              .gte('startTime', startOfDay.toISOString())
              .lte('startTime', endOfDay.toISOString())
              .or(`homeTeam.ilike.%${oddsEvent.home_team}%,awayTeam.ilike.%${oddsEvent.home_team}%`)
              .limit(1)
              .maybeSingle();

            if (!existingEvent) {
              // Create new event
              const { error: createEventError } = await supabase
                .from('Event')
                .insert({
                  externalId: oddsEvent.id,
                  sportId: sportData.id,
                  name: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
                  homeTeam: oddsEvent.home_team,
                  awayTeam: oddsEvent.away_team,
                  startTime: oddsEvent.commence_time,
                  status: 'SCHEDULED',
                });

              if (createEventError) {
                console.error(`Error creating event ${oddsEvent.id}:`, createEventError);
                continue;
              }
              syncedCount++;
            } else {
              // Update existing event if needed
              const { error: updateError } = await supabase
                .from('Event')
                .update({
                  externalId: oddsEvent.id,
                  name: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
                  homeTeam: oddsEvent.home_team,
                  awayTeam: oddsEvent.away_team,
                  startTime: oddsEvent.commence_time,
                })
                .eq('id', existingEvent.id);

              if (updateError) {
                console.error(`Error updating event ${oddsEvent.id}:`, updateError);
              } else {
                syncedCount++;
              }
            }
          } catch (eventError) {
            console.error(`Error processing event ${oddsEvent.id}:`, eventError);
            continue;
          }
        }

        totalSynced += syncedCount;
        results.push({ sport, count: syncedCount });
      } catch (sportError: any) {
        results.push({ sport, count: 0, error: sportError.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalSynced} total events`,
        data: { totalSynced, results },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in sync-events:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


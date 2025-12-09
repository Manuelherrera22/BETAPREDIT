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
    const requestBody = await req.json().catch(() => ({}));
    const { sportKey } = requestBody || {};

    // Get The Odds API key from environment
    const theOddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (!theOddsApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'The Odds API key not configured' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ⚠️ VALIDACIÓN CRÍTICA: Verificar si ya hay eventos recientes suficientes
    // Esto evita sincronizaciones innecesarias y protege nuestros créditos de API
    const now = Date.now();
    const twoHoursFromNow = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    const { count: recentEventsCount } = await supabase
      .from('Event')
      .select('id', { count: 'exact', head: true })
      .eq('isActive', true)
      .gte('startTime', new Date().toISOString())
      .lte('startTime', twoHoursFromNow);

    // Si ya hay suficientes eventos recientes, no sincronizar
    if (recentEventsCount && recentEventsCount >= 10) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Ya hay ${recentEventsCount} eventos disponibles en las próximas 2 horas. No es necesario sincronizar ahora. Esto protege nuestros créditos de API.`,
          data: { totalSynced: 0, results: [], skipped: true, reason: 'sufficient_events' },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ⚠️ RATE LIMITING SIMPLE: Verificar última sincronización global
    // Buscar el evento más reciente para estimar última sincronización
    // Nota: En Supabase, los campos pueden ser snake_case (created_at) o camelCase (createdAt)
    const { data: lastEvent } = await supabase
      .from('Event')
      .select('createdAt, created_at')
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Usar createdAt o created_at dependiendo de cuál esté disponible
    const lastEventTime = lastEvent?.createdAt || lastEvent?.created_at;
    if (lastEventTime) {
      const lastSyncTime = new Date(lastEventTime).getTime();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      // Si se creó un evento en los últimos 5 minutos, probablemente ya se sincronizó
      if (lastSyncTime > fiveMinutesAgo) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'La sincronización se ejecutó recientemente. Por favor espera unos minutos antes de sincronizar nuevamente. Esto protege nuestros créditos de API.',
            },
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
              // ⚠️ IMPORTANTE: Generar ID manualmente para Supabase
              // Supabase no genera automáticamente cuid(), necesitamos generarlo
              const sportId = crypto.randomUUID(); // Usar UUID en lugar de cuid para Supabase
              
              const { data: newSport, error: createSportError } = await supabase
                .from('Sport')
                .insert({
                  id: sportId, // ⚠️ CRÍTICO: Especificar ID manualmente
                  name: oddsEvent.sport_title,
                  slug: oddsEvent.sport_key,
                  isActive: true,
                })
                .select('id')
                .single();

              if (createSportError || !newSport) {
                console.error(`Error creating sport ${oddsEvent.sport_key}:`, createSportError);
                // Si el error es por ID duplicado, intentar buscar nuevamente
                if (createSportError?.code === '23505') {
                  const { data: existingSport } = await supabase
                    .from('Sport')
                    .select('id')
                    .eq('slug', oddsEvent.sport_key)
                    .limit(1)
                    .maybeSingle();
                  if (existingSport) {
                    sportData = existingSport;
                  } else {
                    continue;
                  }
                } else {
                  continue;
                }
              } else {
                sportData = newSport;
              }
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
              // ⚠️ VERIFICAR: Asegurar que startTime sea futuro
              const commenceTime = new Date(oddsEvent.commence_time);
              const now = new Date();
              
              // Solo crear eventos con startTime en el futuro (o muy recientes, dentro de 1 hora)
              if (commenceTime < new Date(now.getTime() - 60 * 60 * 1000)) {
                console.log(`Skipping event ${oddsEvent.id}: startTime is in the past (${commenceTime.toISOString()})`);
                continue;
              }
              
              // ⚠️ IMPORTANTE: Generar ID manualmente para Supabase
              const eventId = crypto.randomUUID();
              
              const { data: createdEvent, error: createEventError } = await supabase
                .from('Event')
                .insert({
                  id: eventId, // ⚠️ CRÍTICO: Especificar ID manualmente
                  externalId: oddsEvent.id,
                  sportId: sportData.id,
                  name: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
                  homeTeam: oddsEvent.home_team,
                  awayTeam: oddsEvent.away_team,
                  startTime: oddsEvent.commence_time,
                  status: 'SCHEDULED',
                  isActive: true, // ⚠️ CRÍTICO: Establecer isActive para que aparezcan en get-events
                })
                .select('id, status, startTime, isActive')
                .single();

              if (createEventError) {
                console.error(`Error creating event ${oddsEvent.id}:`, createEventError);
                continue;
              }
              
              // ⚠️ VERIFICAR: Log del evento creado para debug
              console.log(`Created event:`, {
                id: createdEvent?.id,
                name: `${oddsEvent.home_team} vs ${oddsEvent.away_team}`,
                status: createdEvent?.status,
                startTime: createdEvent?.startTime,
                isActive: createdEvent?.isActive,
              });
              
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
                  isActive: true, // ⚠️ CRÍTICO: Asegurar que esté activo
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
        console.log(`Synced ${syncedCount} events for sport ${sport}`);
      } catch (sportError: any) {
        results.push({ sport, count: 0, error: sportError.message });
      }
    }

    // ⚠️ VERIFICAR: Después de sincronizar, verificar cuántos eventos hay en la BD
    const { count: totalEventsAfterSync } = await supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SCHEDULED');
    
    const { count: upcomingEventsAfterSync } = await supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SCHEDULED')
      .gte('startTime', new Date().toISOString());
    
    console.log(`After sync: Total SCHEDULED events in DB: ${totalEventsAfterSync || 0}`);
    console.log(`After sync: Upcoming SCHEDULED events: ${upcomingEventsAfterSync || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalSynced} total events`,
        data: { 
          totalSynced, 
          results,
          verification: {
            totalScheduledInDB: totalEventsAfterSync || 0,
            upcomingScheduledInDB: upcomingEventsAfterSync || 0,
          },
        },
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


import api from './api'

export interface Event {
  id: string
  name: string
  sportId: string
  startTime: string
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'SUSPENDED'
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  sport?: {
    id: string
    name: string
    slug: string
  }
  markets?: Market[]
}

export interface Market {
  id: string
  type: string
  name: string
  isActive: boolean
  isSuspended: boolean
  odds?: Odds[]
}

export interface Odds {
  id: string
  selection: string
  decimal: number
  american?: number
  probability: number
  isActive: boolean
}

export const eventsService = {
  getLiveEvents: async (sportId?: string) => {
    // Use Supabase Edge Function in production, backend API in development
    const isSupabaseConfigured = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      return !!(supabaseUrl && supabaseKey);
    };

    if (isSupabaseConfigured() && import.meta.env.PROD) {
      // Use Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const { supabase } = await import('../config/supabase');
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }
      
      const token = session?.access_token;
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const params = new URLSearchParams({ status: 'LIVE' });
      // If sportId looks like a slug (contains underscore), use sportSlug instead
      if (sportId) {
        if (sportId.includes('_')) {
          params.set('sportSlug', sportId);
        } else {
          params.set('sportId', sportId);
        }
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/get-events?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch live events');
      }

      const result = await response.json();
      return result.data || [];
    } else {
      // Use backend API
      const { data } = await api.get('/events/live', {
        params: { sportId },
      });
      return data.data as Event[];
    }
  },

  getUpcomingEvents: async (sportId?: string, date?: string, useTheOddsAPI: boolean = true) => {
    // Use Supabase Edge Function in production, backend API in development
    const isSupabaseConfigured = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      return !!(supabaseUrl && supabaseKey);
    };

    if (isSupabaseConfigured() && import.meta.env.PROD) {
      // Use Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const { supabase } = await import('../config/supabase');
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }
      
      const token = session?.access_token;
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const params = new URLSearchParams({ status: 'SCHEDULED' });
      // If sportId looks like a slug (contains underscore), use sportSlug instead
      if (sportId) {
        if (sportId.includes('_')) {
          params.set('sportSlug', sportId);
        } else {
          params.set('sportId', sportId);
        }
      }
      if (date) params.set('date', date);

      const response = await fetch(`${supabaseUrl}/functions/v1/get-events?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch upcoming events');
      }

      const result = await response.json();
      console.log('get-events response:', { success: result.success, dataLength: result.data?.length || 0 });
      return result.data || [];
    } else {
      // Use backend API
      const { data } = await api.get('/events/upcoming', {
        params: { sportId, date, useTheOddsAPI },
      });
      return data.data as Event[];
    }
  },

  getEventDetails: async (eventId: string) => {
    const { data } = await api.get(`/events/${eventId}`)
    return data.data as Event
  },

  getEventsBySport: async (sportId: string) => {
    const { data } = await api.get(`/events/sport/${sportId}`)
    return data.data as Event[]
  },

  searchEvents: async (query: string) => {
    const { data } = await api.get(`/events/search/${query}`)
    return data.data as Event[]
  },

  syncEvents: async (sportKey?: string) => {
    // Use Supabase Edge Function in production, backend API in development
    const isSupabaseConfigured = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      return !!(supabaseUrl && supabaseKey);
    };

    if (isSupabaseConfigured() && import.meta.env.PROD) {
      // Use Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get auth token from Supabase (use configured client)
      const { supabase } = await import('../config/supabase');
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }
      
      const token = session?.access_token;
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ sportKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to sync events');
      }

      return await response.json();
    } else {
      // Use backend API
      const { data } = await api.post('/events/sync', { sportKey });
      return data;
    }
  },
}


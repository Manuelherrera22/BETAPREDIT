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
    const { data } = await api.get('/events/live', {
      params: { sportId },
    })
    return data.data as Event[]
  },

  getUpcomingEvents: async (sportId?: string, date?: string, useTheOddsAPI: boolean = true) => {
    const { data } = await api.get('/events/upcoming', {
      params: { sportId, date, useTheOddsAPI },
    })
    return data.data as Event[]
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
      
      // Get auth token from Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
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


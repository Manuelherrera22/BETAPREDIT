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

  getUpcomingEvents: async (sportId?: string, date?: string) => {
    const { data } = await api.get('/events/upcoming', {
      params: { sportId, date },
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
}


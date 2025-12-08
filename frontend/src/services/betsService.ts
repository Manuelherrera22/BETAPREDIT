import api from './api'

export interface Bet {
  id: string
  eventId: string
  marketId: string
  selection: string
  stake: number
  potentialWin: number
  odds: number
  status: 'PENDING' | 'ACCEPTED' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED'
  createdAt: string
  event?: {
    id: string
    name: string
    homeTeam: string
    awayTeam: string
  }
}

export const betsService = {
  placeBet: async (betData: {
    eventId: string
    marketId: string
    oddsId: string
    type: string
    selection: string
    stake: number
  }) => {
    const { data } = await api.post('/bets', betData)
    return data.data as Bet
  },

  getMyBets: async (status?: string) => {
    const { data } = await api.get('/bets/my-bets', {
      params: { status },
    })
    return data.data as Bet[]
  },

  getBetDetails: async (betId: string) => {
    const { data } = await api.get(`/bets/${betId}`)
    return data.data as Bet
  },

  cancelBet: async (betId: string) => {
    const { data } = await api.delete(`/bets/${betId}`)
    return data.data
  },
}


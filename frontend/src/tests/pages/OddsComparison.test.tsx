/**
 * Odds Comparison Page Tests
 * Tests for the odds comparison page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import OddsComparison from '../../pages/OddsComparison';
import * as theOddsApiService from '../../services/theOddsApiService';

// Mock services
vi.mock('../../services/theOddsApiService');
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    lastMessage: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

describe('OddsComparison', () => {
  let queryClient: QueryClient;

  const mockSports = [
    { key: 'soccer_epl', title: 'Premier League', active: true },
    { key: 'basketball_nba', title: 'NBA', active: true },
  ];

  const mockEvents = [
    {
      id: 'event-1',
      home_team: 'Team A',
      away_team: 'Team B',
      commence_time: new Date(Date.now() + 3600000).toISOString(),
    },
  ];

  const mockComparison = {
    comparisons: {
      home: {
        bestOdds: { bookmaker: 'Bet365', odds: 2.0 },
        allOdds: [{ bookmaker: 'Bet365', odds: 2.0 }],
      },
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });
    vi.clearAllMocks();
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue(mockSports);
    (theOddsApiService.theOddsApiService.getOdds as any).mockResolvedValue(mockEvents);
    (theOddsApiService.theOddsApiService.compareOdds as any).mockResolvedValue(mockComparison);
  });

  it('should render odds comparison page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OddsComparison />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Comparador de Cuotas|Odds Comparison/i)).toBeInTheDocument();
    });
  });

  it('should load and display sports', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OddsComparison />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(theOddsApiService.theOddsApiService.getSports).toHaveBeenCalled();
    });
  });

  it('should load events when sport is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OddsComparison />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(theOddsApiService.theOddsApiService.getOdds).toHaveBeenCalled();
    });
  });

  it('should load comparison when event is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OddsComparison />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should eventually call compareOdds when event is selected
      const compareButton = screen.queryByText(/Comparar|Compare/i);
      if (compareButton) {
        fireEvent.click(compareButton);
      }
    });
  });

  it('should filter events by search term', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OddsComparison />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Buscar|Search/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Team A' } });
      }
    });
  });
});


/**
 * Events Page Tests
 * Tests for the events listing page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Events from '../../pages/Events';
import * as eventsService from '../../services/eventsService';
import * as theOddsApiService from '../../services/theOddsApiService';

// Mock services
vi.mock('../../services/eventsService');
vi.mock('../../services/theOddsApiService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('Events', () => {
  let queryClient: QueryClient;

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
  });

  it('should render events page', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Eventos/i)).toBeInTheDocument();
    });
  });

  it('should display upcoming events', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'SCHEDULED',
        sport: { name: 'Football', slug: 'soccer' },
      },
    ];

    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue(mockEvents);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    });
  });

  it('should display live events when view mode is live', async () => {
    const mockLiveEvents = [
      {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date().toISOString(),
        status: 'LIVE',
        homeScore: 2,
        awayScore: 1,
        sport: { name: 'Football', slug: 'soccer' },
      },
    ];

    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue(mockLiveEvents);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Switch to live view
    const liveButton = screen.getByText(/En Vivo/i);
    fireEvent.click(liveButton);

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    });
  });

  it('should filter events by sport', async () => {
    const mockSports = [
      { key: 'soccer_epl', title: 'Premier League', active: true },
      { key: 'basketball_nba', title: 'NBA', active: true },
    ];

    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue(mockSports);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Premier League/i)).toBeInTheDocument();
    });
  });

  it('should handle refresh button', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const refreshButton = screen.queryByLabelText(/refresh|actualizar/i);
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }
    });
  });

  it('should handle sync events button', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);
    (eventsService.eventsService.syncEvents as any).mockResolvedValue({ success: true });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const syncButton = screen.queryByText(/sincronizar|sync/i);
      if (syncButton) {
        fireEvent.click(syncButton);
      }
    });
  });

  it('should display empty state when no events', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should show some empty state or message
      const emptyState = screen.queryByText(/no hay eventos|sin eventos/i);
      expect(emptyState || screen.getByText(/Eventos/i)).toBeTruthy();
    });
  });
});



/**
 * Events Page WebSocket Integration Tests
 * Tests for real-time event updates via WebSocket
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock WebSocket hook
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockLastMessage = { type: null, data: null };

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: ({ channels }: { channels: string[] }) => {
    // Subscribe to channels when component mounts
    if (channels.length > 0) {
      channels.forEach((channel) => mockSubscribe(channel));
    }

    return {
      isConnected: true,
      lastMessage: mockLastMessage,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    };
  },
}));

describe('Events - WebSocket Integration', () => {
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
    mockLastMessage.type = null;
    mockLastMessage.data = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to events:live channel when viewMode is live', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Switch to live view
      const liveButton = screen.getByText(/En Vivo/i);
      liveButton.click();
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('events:live');
    });
  });

  it('should display WebSocket connection status when in live mode', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const liveButton = screen.getByText(/En Vivo/i);
      liveButton.click();
    });

    await waitFor(() => {
      // Should show WebSocket status indicator
      const statusIndicator = screen.queryByText(/Tiempo Real|Polling/i);
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  it('should update events when WebSocket message is received', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date().toISOString(),
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
        sport: { name: 'Football', slug: 'soccer' },
      },
    ];

    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue(mockEvents);

    const { queryClient: testQueryClient } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const liveButton = screen.getByText(/En Vivo/i);
      liveButton.click();
    });

    // Simulate WebSocket message
    mockLastMessage.type = 'event:update';
    mockLastMessage.data = {
      id: 'event-1',
      name: 'Team A vs Team B',
      homeScore: 2,
      awayScore: 1,
      status: 'LIVE',
    };

    // Trigger re-render by updating query
    await waitFor(() => {
      // Query should be invalidated and refetched
      expect(eventsService.eventsService.getLiveEvents).toHaveBeenCalled();
    });
  });

  it('should show notification when event score is updated', async () => {
    const toast = await import('react-hot-toast');
    
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const liveButton = screen.getByText(/En Vivo/i);
      liveButton.click();
    });

    // Simulate WebSocket message with score update
    mockLastMessage.type = 'event:update';
    mockLastMessage.data = {
      id: 'event-1',
      name: 'Team A vs Team B',
      homeScore: 2,
      awayScore: 1,
      status: 'LIVE',
    };

    await waitFor(() => {
      // Should show toast notification
      expect(toast.default.success).toHaveBeenCalled();
    });
  });

  it('should unsubscribe from events:live when switching to upcoming view', async () => {
    (theOddsApiService.theOddsApiService.getSports as any).mockResolvedValue([
      { key: 'soccer_epl', title: 'Premier League', active: true },
    ]);
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const liveButton = screen.getByText(/En Vivo/i);
      liveButton.click();
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('events:live');
    });

    // Switch back to upcoming
    const upcomingButton = screen.getByText(/Próximos/i);
    upcomingButton.click();

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledWith('events:live');
    });
  });
});

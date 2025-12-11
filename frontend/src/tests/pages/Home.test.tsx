/**
 * Home Page Tests
 * Tests for the main dashboard page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import * as eventsService from '../../services/eventsService';
import * as userStatisticsService from '../../services/userStatisticsService';
import * as valueBetAlertsService from '../../services/valueBetAlertsService';

// Mock services
vi.mock('../../services/eventsService');
vi.mock('../../services/userStatisticsService');
vi.mock('../../services/valueBetAlertsService');
vi.mock('../../services/notificationsService');
vi.mock('../../services/userProfileService');
vi.mock('../../hooks/useOnboarding', () => ({
  useOnboarding: () => ({ shouldShow: false }),
}));
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

describe('Home', () => {
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

  it('should render dashboard header', async () => {
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockResolvedValue({
      winRate: 65,
      roi: 15,
      valueBetsFound: 10,
      totalStaked: 1000,
    });
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  it('should display user statistics', async () => {
    const mockStats = {
      winRate: 65.5,
      roi: 15.2,
      valueBetsFound: 10,
      totalStaked: 1000,
      totalBets: 20,
      totalWins: 13,
      netProfit: 152,
    };

    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockResolvedValue(mockStats);
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/65.5%/i)).toBeInTheDocument();
      expect(screen.getByText(/15.2%/i)).toBeInTheDocument();
    });
  });

  it('should display live events when available', async () => {
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

    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue(mockLiveEvents);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockResolvedValue(null);
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Eventos en Vivo/i)).toBeInTheDocument();
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no live events', async () => {
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockResolvedValue(null);
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No hay eventos en vivo/i)).toBeInTheDocument();
    });
  });

  it('should display quick access tools', async () => {
    (eventsService.eventsService.getLiveEvents as any).mockResolvedValue([]);
    (eventsService.eventsService.getUpcomingEvents as any).mockResolvedValue([]);
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockResolvedValue(null);
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Herramientas Rápidas/i)).toBeInTheDocument();
      expect(screen.getByText(/Predicciones/i)).toBeInTheDocument();
      expect(screen.getByText(/Eventos/i)).toBeInTheDocument();
    });
  });
});


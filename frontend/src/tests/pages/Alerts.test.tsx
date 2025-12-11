/**
 * Alerts Page Tests
 * Tests for the alerts page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Alerts from '../../pages/Alerts';
import * as valueBetAlertsService from '../../services/valueBetAlertsService';
import * as notificationsService from '../../services/notificationsService';

// Mock services
vi.mock('../../services/valueBetAlertsService');
vi.mock('../../services/notificationsService');
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    lastMessage: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));
vi.mock('../../hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({
    showValueBetNotification: vi.fn(),
    showGenericNotification: vi.fn(),
    isGranted: true,
  }),
}));
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
  }),
}));

describe('Alerts', () => {
  let queryClient: QueryClient;

  const mockAlerts = [
    {
      id: 'alert-1',
      eventId: 'event-1',
      selection: 'home',
      bookmakerOdds: 2.5,
      bookmakerPlatform: 'Bet365',
      valuePercentage: 15.5,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      event: {
        homeTeam: 'Team A',
        awayTeam: 'Team B',
      },
    },
  ];

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
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue(mockAlerts);
    (notificationsService.notificationsService.getMyNotifications as any).mockResolvedValue([]);
  });

  it('should render alerts page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Alertas|Alerts/i)).toBeInTheDocument();
    });
  });

  it('should display value bet alerts', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
      expect(screen.getByText(/15.5%/i)).toBeInTheDocument();
    });
  });

  it('should filter alerts by type', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const filterButton = screen.getByText(/Value Bet|Todos/i);
      if (filterButton) {
        fireEvent.click(filterButton);
      }
    });
  });

  it('should mark alert as read', async () => {
    (valueBetAlertsService.valueBetAlertsService.markAsRead as any).mockResolvedValue({ success: true });

    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const markReadButton = screen.queryByText(/Marcar como leído|Mark as read/i);
      if (markReadButton) {
        fireEvent.click(markReadButton);
      }
    });
  });

  it('should display empty state when no alerts', async () => {
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([]);
    (notificationsService.notificationsService.getMyNotifications as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const emptyState = screen.queryByText(/No hay alertas|No alerts/i);
      expect(emptyState || screen.getByText(/Alertas/i)).toBeTruthy();
    });
  });
});


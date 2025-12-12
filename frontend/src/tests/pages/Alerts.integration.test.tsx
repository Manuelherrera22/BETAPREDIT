/**
 * Alerts Page Integration Tests
 * Tests for the new "Registrar Apuesta" button in value bet alerts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock RegisterBetForm
vi.mock('../../components/RegisterBetForm', () => ({
  default: ({ isOpen, onClose, valueBetAlertId, initialData }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="register-bet-form">
        <div>Register Bet Form</div>
        <div data-testid="value-bet-alert-id">{valueBetAlertId || 'N/A'}</div>
        <div data-testid="initial-platform">{initialData?.platform || 'N/A'}</div>
        <div data-testid="initial-selection">{initialData?.selection || 'N/A'}</div>
        <div data-testid="initial-odds">{initialData?.odds || 'N/A'}</div>
        <div data-testid="initial-event-id">{initialData?.eventId || 'N/A'}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

describe('Alerts - Integration with Register Bet', () => {
  let queryClient: QueryClient;

  const mockValueBetAlert = {
    id: 'alert-123',
    eventId: 'event-456',
    selection: 'Home Win',
    bookmakerOdds: 2.5,
    bookmakerPlatform: 'Bet365',
    valuePercentage: 15.5,
    confidence: 0.75,
    expectedValue: 0.15,
    predictedProbability: 0.65,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    event: {
      id: 'event-456',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
    },
    market: {
      type: 'Match Winner',
      name: 'Match Winner',
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
    (valueBetAlertsService.valueBetAlertsService.getMyAlerts as any).mockResolvedValue([mockValueBetAlert]);
    (notificationsService.notificationsService.getMyNotifications as any).mockResolvedValue([]);
  });

  it('should render "Registrar Apuesta" button for value bet alerts', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Registrar Apuesta/i)).toBeInTheDocument();
    });
  });

  it('should open RegisterBetForm when "Registrar Apuesta" is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Registrar Apuesta/i)).toBeInTheDocument();
    });

    const registerButton = screen.getByText(/Registrar Apuesta/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
    });
  });

  it('should pre-fill RegisterBetForm with value bet alert data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Registrar Apuesta/i)).toBeInTheDocument();
    });

    const registerButton = screen.getByText(/Registrar Apuesta/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
      expect(screen.getByTestId('value-bet-alert-id')).toHaveTextContent('alert-123');
      expect(screen.getByTestId('initial-platform')).toHaveTextContent('Bet365');
      expect(screen.getByTestId('initial-selection')).toHaveTextContent('Home Win');
      expect(screen.getByTestId('initial-odds')).toHaveTextContent('2.5');
      expect(screen.getByTestId('initial-event-id')).toHaveTextContent('event-456');
    });
  });

  it('should include value bet metadata in initial data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Registrar Apuesta/i)).toBeInTheDocument();
    });

    const registerButton = screen.getByText(/Registrar Apuesta/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      const form = screen.getByTestId('register-bet-form');
      expect(form).toBeInTheDocument();
      // The form should have notes with value bet data
      expect(form.textContent).toContain('15.5%');
    });
  });

  it('should close RegisterBetForm when close button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Registrar Apuesta/i)).toBeInTheDocument();
    });

    const registerButton = screen.getByText(/Registrar Apuesta/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
    });

    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('register-bet-form')).not.toBeInTheDocument();
    });
  });

  it('should only show "Registrar Apuesta" button for value bet alerts', async () => {
    const mockNotification = {
      id: 'notif-1',
      type: 'ODDS_CHANGED',
      title: 'Odds Changed',
      message: 'Odds have changed',
      createdAt: new Date().toISOString(),
      read: false,
    };

    (notificationsService.notificationsService.getMyNotifications as any).mockResolvedValue([mockNotification]);

    render(
      <QueryClientProvider client={queryClient}>
        <Alerts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should have register button for value bet alert
      const registerButtons = screen.queryAllByText(/Registrar Apuesta/i);
      expect(registerButtons.length).toBeGreaterThan(0);
    });
  });
});

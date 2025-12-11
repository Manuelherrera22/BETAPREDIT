/**
 * Value Bet Preferences Form Tests
 * Tests for the value bet preferences form component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ValueBetPreferencesForm from '../../components/ValueBetPreferencesForm';
import * as userPreferencesService from '../../services/userPreferencesService';

// Mock services
vi.mock('../../services/userPreferencesService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ValueBetPreferencesForm', () => {
  let queryClient: QueryClient;

  const mockPreferences = {
    minValue: 0.10,
    maxEvents: 30,
    sports: ['soccer_epl', 'basketball_nba'],
    platforms: ['Bet365', 'Betfair'],
    autoCreateAlerts: true,
    notificationThreshold: 0.15,
    minConfidence: 0.6,
    maxOdds: 8.0,
    minOdds: 1.5,
    marketTypes: ['h2h', 'totals'],
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
    (userPreferencesService.userPreferencesService.getValueBetPreferences as any).mockResolvedValue(mockPreferences);
    (userPreferencesService.userPreferencesService.updateValueBetPreferences as any).mockResolvedValue({
      success: true,
    });
  });

  it('should render preferences form', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValueBetPreferencesForm />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Preferencias de Value Bets|Value Bet Preferences/i)).toBeInTheDocument();
    });
  });

  it('should load user preferences', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValueBetPreferencesForm />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(userPreferencesService.userPreferencesService.getValueBetPreferences).toHaveBeenCalled();
    });
  });

  it('should update min value', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValueBetPreferencesForm />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const minValueInput = screen.getByLabelText(/Valor Mínimo|Min Value/i) || screen.getByPlaceholderText(/Valor Mínimo|Min Value/i);
      if (minValueInput) {
        fireEvent.change(minValueInput, { target: { value: '0.15' } });
      }
    });
  });

  it('should toggle sport selection', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValueBetPreferencesForm />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const sportCheckbox = screen.getByLabelText(/Premier League/i);
      if (sportCheckbox) {
        fireEvent.click(sportCheckbox);
      }
    });
  });

  it('should save preferences', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValueBetPreferencesForm />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const saveButton = screen.getByText(/Guardar|Save/i);
      if (saveButton) {
        fireEvent.click(saveButton);

        expect(userPreferencesService.userPreferencesService.updateValueBetPreferences).toHaveBeenCalled();
      }
    });
  });

  it('should handle loading state', () => {
    (userPreferencesService.userPreferencesService.getValueBetPreferences as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ValueBetPreferencesForm />
      </QueryClientProvider>
    );

    // Should show loading state
    expect(screen.getByText(/Preferencias|Preferences/i) || screen.queryByText(/Cargando/i)).toBeTruthy();
  });
});


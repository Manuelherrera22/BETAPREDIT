/**
 * Register Bet Form Tests
 * Tests for the register bet form component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterBetForm from '../../components/RegisterBetForm';
import * as externalBetsService from '../../services/externalBetsService';
import * as eventsService from '../../services/eventsService';

// Mock services
vi.mock('../../services/externalBetsService');
vi.mock('../../services/eventsService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('RegisterBetForm', () => {
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

  it('should not render when isOpen is false', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterBetForm isOpen={false} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/Registrar Apuesta|Register Bet/i)).not.toBeInTheDocument();
  });

  it('should render form when isOpen is true', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterBetForm isOpen={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Registrar Apuesta|Register Bet/i)).toBeInTheDocument();
  });

  it('should populate form with initial data', () => {
    const initialData = {
      platform: 'Bet365',
      marketType: 'Match Winner',
      selection: 'home',
      odds: 2.5,
      stake: 100,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <RegisterBetForm isOpen={true} onClose={vi.fn()} initialData={initialData} />
      </QueryClientProvider>
    );

    expect(screen.getByDisplayValue(/Bet365/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/2.5/i)).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    (externalBetsService.externalBetsService.registerBet as any).mockResolvedValue({
      id: 'bet-1',
      success: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RegisterBetForm isOpen={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    // Fill form
    const platformInput = screen.getByLabelText(/Plataforma|Platform/i) || screen.getByPlaceholderText(/Plataforma|Platform/i);
    const oddsInput = screen.getByLabelText(/Cuota|Odds/i) || screen.getByPlaceholderText(/Cuota|Odds/i);
    const stakeInput = screen.getByLabelText(/Stake|Apostado/i) || screen.getByPlaceholderText(/Stake|Apostado/i);

    if (platformInput) fireEvent.change(platformInput, { target: { value: 'Bet365' } });
    if (oddsInput) fireEvent.change(oddsInput, { target: { value: '2.5' } });
    if (stakeInput) fireEvent.change(stakeInput, { target: { value: '100' } });

    // Submit
    const submitButton = screen.getByText(/Registrar|Submit/i);
    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(externalBetsService.externalBetsService.registerBet).toHaveBeenCalled();
      });
    }
  });

  it('should search events when typing in event search', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        name: 'Team A vs Team B',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
      },
    ];

    (eventsService.eventsService.searchEvents as any).mockResolvedValue(mockEvents);

    render(
      <QueryClientProvider client={queryClient}>
        <RegisterBetForm isOpen={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    const eventSearch = screen.getByPlaceholderText(/Buscar evento|Search event/i);
    if (eventSearch) {
      fireEvent.change(eventSearch, { target: { value: 'Team A' } });

      await waitFor(() => {
        expect(eventsService.eventsService.searchEvents).toHaveBeenCalled();
      });
    }
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterBetForm isOpen={true} onClose={onClose} />
      </QueryClientProvider>
    );

    const cancelButton = screen.getByText(/Cancelar|Cancel/i);
    if (cancelButton) {
      fireEvent.click(cancelButton);
      expect(onClose).toHaveBeenCalled();
    }
  });
});


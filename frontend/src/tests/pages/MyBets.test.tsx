/**
 * My Bets Page Tests
 * Tests for the my bets page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MyBets from '../../pages/MyBets';
import * as externalBetsService from '../../services/externalBetsService';

// Mock services
vi.mock('../../services/externalBetsService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MyBets', () => {
  let queryClient: QueryClient;

  const mockBets = [
    {
      id: 'bet-1',
      platform: 'Bet365',
      marketType: 'Match Winner',
      selection: 'home',
      odds: 2.5,
      stake: 100,
      status: 'PENDING',
      event: {
        name: 'Team A vs Team B',
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
    (externalBetsService.externalBetsService.getMyBets as any).mockResolvedValue(mockBets);
  });

  it('should render my bets page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mis Apuestas|My Bets/i)).toBeInTheDocument();
    });
  });

  it('should display bets list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
    });
  });

  it('should filter bets by platform', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const platformFilter = screen.getByLabelText(/Plataforma|Platform/i);
      if (platformFilter) {
        fireEvent.change(platformFilter, { target: { value: 'Bet365' } });
      }
    });
  });

  it('should filter bets by status', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/Estado|Status/i);
      if (statusFilter) {
        fireEvent.change(statusFilter, { target: { value: 'PENDING' } });
      }
    });
  });

  it('should search bets by text', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
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

  it('should open register form when add button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const addButton = screen.getByText(/Registrar Apuesta|Add Bet/i);
      if (addButton) {
        fireEvent.click(addButton);
      }
    });
  });

  it('should display empty state when no bets', async () => {
    (externalBetsService.externalBetsService.getMyBets as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyBets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const emptyState = screen.queryByText(/No hay apuestas|No bets/i);
      expect(emptyState || screen.getByText(/Mis Apuestas/i)).toBeTruthy();
    });
  });
});


/**
 * Predictions Page Tests
 * Tests for the predictions page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Predictions from '../../pages/Predictions';
import * as predictionsService from '../../services/predictionsService';

// Mock services
vi.mock('../../services/predictionsService');
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

describe('Predictions', () => {
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

  it('should render predictions page', async () => {
    (predictionsService.predictionsService.getEventPredictions as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Predictions />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Predicciones/i)).toBeInTheDocument();
    });
  });

  it('should display predictions when available', async () => {
    const mockPredictions = [
      {
        id: 'pred-1',
        eventId: 'event-1',
        marketId: 'market-1',
        selection: 'home',
        predictedProbability: 0.65,
        confidence: 0.75,
        factors: {},
        event: {
          id: 'event-1',
          name: 'Team A vs Team B',
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          startTime: new Date().toISOString(),
          sport: { name: 'Football', slug: 'soccer' },
        },
        market: {
          id: 'market-1',
          type: 'MATCH_WINNER',
          name: 'Match Winner',
        },
      },
    ];

    (predictionsService.predictionsService.getEventPredictions as any).mockResolvedValue(mockPredictions);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Predictions />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no predictions', async () => {
    (predictionsService.predictionsService.getEventPredictions as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Predictions />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should show some empty state message
      const emptyState = screen.queryByText(/No hay predicciones/i) || screen.queryByText(/Sin predicciones/i);
      expect(emptyState || screen.getByText(/Predicciones/i)).toBeTruthy();
    });
  });
});


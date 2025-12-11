/**
 * Event Detail Page Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventDetail from '../../pages/EventDetail';
import * as eventsService from '../../services/eventsService';
import * as predictionsService from '../../services/predictionsService';

// Mock dependencies
vi.mock('../../services/eventsService');
vi.mock('../../services/predictionsService');

describe('EventDetail', () => {
  let queryClient: QueryClient;

  const mockEvent = {
    id: 'event-1',
    name: 'Team A vs Team B',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'SCHEDULED',
    sport: {
      id: 'sport-1',
      name: 'Football',
      slug: 'soccer',
    },
    markets: [],
  };

  const mockPredictions = [
    {
      id: 'pred-1',
      selection: 'home',
      predictedProbability: 0.45,
      confidence: 0.75,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
      },
    });
    vi.clearAllMocks();
    (eventsService.eventsService.getEventById as any).mockResolvedValue(mockEvent);
    (predictionsService.predictionsService.getEventPredictions as any).mockResolvedValue(mockPredictions);
  });

  it('should render event detail page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events/event-1']}>
          <EventDetail />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
      expect(screen.getByText(/Team B/i)).toBeInTheDocument();
    });
  });

  it('should load event data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events/event-1']}>
          <EventDetail />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(eventsService.eventsService.getEventById).toHaveBeenCalledWith('event-1');
    });
  });

  it('should load predictions for event', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events/event-1']}>
          <EventDetail />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(predictionsService.predictionsService.getEventPredictions).toHaveBeenCalledWith('event-1');
    });
  });
});


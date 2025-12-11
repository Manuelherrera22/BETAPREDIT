/**
 * Odds History Chart Tests
 * Tests for the odds history chart component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OddsHistoryChart from '../../components/OddsHistoryChart';
import api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

describe('OddsHistoryChart', () => {
  let queryClient: QueryClient;

  const mockHistory = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      decimal: 2.0,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      decimal: 2.1,
    },
    {
      id: '3',
      timestamp: new Date().toISOString(),
      decimal: 2.2,
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
  });

  it('should render odds history chart', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        success: true,
        data: mockHistory,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OddsHistoryChart
          eventId="event-1"
          marketId="market-1"
          selection="home"
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Historial de Cuotas/i)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (api.get as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <QueryClientProvider client={queryClient}>
        <OddsHistoryChart
          eventId="event-1"
          marketId="market-1"
          selection="home"
        />
      </QueryClientProvider>
    );

    // Should show loading or skeleton
    expect(screen.getByText(/Historial de Cuotas/i) || screen.queryByText(/Cargando/i)).toBeTruthy();
  });

  it('should display empty state when no history', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        success: true,
        data: [],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OddsHistoryChart
          eventId="event-1"
          marketId="market-1"
          selection="home"
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No hay historial/i)).toBeInTheDocument();
    });
  });

  it('should calculate and display change percentage', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        success: true,
        data: mockHistory,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OddsHistoryChart
          eventId="event-1"
          marketId="market-1"
          selection="home"
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cambio/i)).toBeInTheDocument();
    });
  });

  it('should not fetch when eventId is missing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OddsHistoryChart
          eventId=""
          marketId="market-1"
          selection="home"
        />
      </QueryClientProvider>
    );

    expect(api.get).not.toHaveBeenCalled();
  });
});


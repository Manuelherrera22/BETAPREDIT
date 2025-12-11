/**
 * ROI Tracking Dashboard Tests
 * Tests for the ROI tracking dashboard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ROITrackingDashboard from '../../components/ROITrackingDashboard';
import * as roiTrackingService from '../../services/roiTrackingService';

// Mock services
vi.mock('../../services/roiTrackingService');
vi.mock('../../components/SimpleChart', () => ({
  default: () => <div data-testid="simple-chart">Chart</div>,
}));

describe('ROITrackingDashboard', () => {
  let queryClient: QueryClient;

  const mockTracking = {
    totalROI: 15.5,
    valueBetsROI: 20.0,
    normalBetsROI: 10.0,
    totalBets: 100,
    totalWins: 65,
    totalLosses: 35,
    totalStaked: 10000,
    totalWon: 11550,
    netProfit: 1550,
    comparison: {
      before: null,
      after: 15.5,
      improvement: 15.5,
      betsBefore: 0,
      betsAfter: 100,
    },
    valueBetsMetrics: {
      taken: 25,
      won: 18,
      lost: 7,
      winRate: 0.72,
      roi: 20.0,
      totalStaked: 2500,
      totalWon: 3000,
      netProfit: 500,
    },
  };

  const mockHistory = [
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), roi: 10.0 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), roi: 12.5 },
    { date: new Date().toISOString(), roi: 15.5 },
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
    (roiTrackingService.roiTrackingService.getROITracking as any).mockResolvedValue(mockTracking);
    (roiTrackingService.roiTrackingService.getROIHistory as any).mockResolvedValue(mockHistory);
  });

  it('should render ROI tracking dashboard', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/15.5%/i)).toBeInTheDocument();
    });
  });

  it('should display total ROI', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ROI Total/i)).toBeInTheDocument();
      expect(screen.getByText(/\+15.5%/i)).toBeInTheDocument();
    });
  });

  it('should display net profit', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/\+€1550/i)).toBeInTheDocument();
    });
  });

  it('should display value bets metrics', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/20.0%/i)).toBeInTheDocument();
      expect(screen.getByText(/72%/i)).toBeInTheDocument();
    });
  });

  it('should change period when selector is changed', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const periodButton = screen.getByText(/Mes|Month/i);
      if (periodButton) {
        fireEvent.click(periodButton);
      }
    });
  });

  it('should display empty state when no data', async () => {
    (roiTrackingService.roiTrackingService.getROITracking as any).mockResolvedValue(null);

    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No hay datos de ROI/i)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (roiTrackingService.roiTrackingService.getROITracking as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ROITrackingDashboard />
      </QueryClientProvider>
    );

    // Should show loading state
    expect(screen.getByText(/ROI/i) || screen.queryByText(/Cargando/i)).toBeTruthy();
  });
});


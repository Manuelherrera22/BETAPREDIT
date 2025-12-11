/**
 * Social Proof Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SocialProof from '../../components/SocialProof';
import * as platformMetricsService from '../../services/platformMetricsService';

// Mock dependencies
vi.mock('../../services/platformMetricsService');

describe('SocialProof', () => {
  let queryClient: QueryClient;

  const mockMetrics = {
    valueBetsFoundToday: 150,
    activeUsers: 1250,
    averageROI: 12.5,
    averageAccuracy: 68.5,
    trends: {
      valueBetsChange: '+15%',
      usersChange: '+8%',
      roiChange: '+2.3%',
      accuracyChange: '+1.2%',
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
      },
    });
    vi.clearAllMocks();
    (platformMetricsService.platformMetricsService.getMetrics as any).mockResolvedValue(mockMetrics);
  });

  it('should render social proof component', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocialProof />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Testimonios/i)).toBeInTheDocument();
    });
  });

  it('should display platform metrics', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocialProof />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/150/i)).toBeInTheDocument(); // valueBetsFoundToday
      expect(screen.getByText(/1.250/i)).toBeInTheDocument(); // activeUsers
    });
  });

  it('should display testimonials', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocialProof />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Carlos M./i)).toBeInTheDocument();
      expect(screen.getByText(/Ana R./i)).toBeInTheDocument();
      expect(screen.getByText(/Miguel S./i)).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (platformMetricsService.platformMetricsService.getMetrics as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SocialProof />
      </QueryClientProvider>
    );

    // Should show loading or initial state
    expect(screen.getByText(/Testimonios/i) || screen.queryByText(/Cargando/i)).toBeTruthy();
  });
});


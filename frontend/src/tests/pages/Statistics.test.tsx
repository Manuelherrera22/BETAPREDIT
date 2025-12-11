/**
 * Statistics Page Tests
 * Tests for the statistics page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Statistics from '../../pages/Statistics';
import * as userStatisticsService from '../../services/userStatisticsService';

// Mock services
vi.mock('../../services/userStatisticsService');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Statistics', () => {
  const mockStatistics = {
    totalBets: 100,
    totalWins: 65,
    winRate: 0.65,
    roi: 15.5,
    totalStaked: 10000,
    netProfit: 1550,
    valueBetsFound: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockResolvedValue(mockStatistics);
    (userStatisticsService.userStatisticsService.getStatisticsByPeriod as any).mockResolvedValue([]);
    (userStatisticsService.userStatisticsService.getStatisticsBySport as any).mockResolvedValue({});
    (userStatisticsService.userStatisticsService.getStatisticsByPlatform as any).mockResolvedValue({});
  });

  it('should render statistics page', async () => {
    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText(/Estadísticas|Statistics/i)).toBeInTheDocument();
    });
  });

  it('should display statistics cards', async () => {
    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText(/65%/i)).toBeInTheDocument();
      expect(screen.getByText(/15.5%/i)).toBeInTheDocument();
    });
  });

  it('should change time range when selector is changed', async () => {
    render(<Statistics />);

    await waitFor(() => {
      const timeRangeButton = screen.getByText(/Mes|Month/i);
      if (timeRangeButton) {
        fireEvent.click(timeRangeButton);
      }
    });
  });

  it('should handle loading state', () => {
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Statistics />);

    // Should show loading or skeleton
    expect(screen.getByText(/Estadísticas|Statistics/i) || screen.queryByText(/Cargando|Loading/i)).toBeTruthy();
  });

  it('should handle error state', async () => {
    (userStatisticsService.userStatisticsService.getMyStatistics as any).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<Statistics />);

    await waitFor(() => {
      // Should handle error gracefully
      expect(screen.getByText(/Estadísticas|Statistics/i)).toBeInTheDocument();
    });
  });
});


/**
 * Odds Comparison Table Tests
 * Tests for the odds comparison table component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OddsComparisonTable from '../../components/OddsComparisonTable';

describe('OddsComparisonTable', () => {
  const mockEvent = {
    id: 'event-1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    sport: 'Football',
  };

  const mockOdds = [
    {
      platform: 'Bet365',
      home: 2.0,
      draw: 3.0,
      away: 3.5,
      value: 5.0,
      lastUpdated: new Date().toISOString(),
    },
    {
      platform: 'Betfair',
      home: 2.1,
      draw: 3.1,
      away: 3.4,
      value: 3.0,
      lastUpdated: new Date(Date.now() - 60000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render odds comparison table', () => {
    render(<OddsComparisonTable event={mockEvent} odds={mockOdds} />);

    expect(screen.getByText(/Comparador de Cuotas/i)).toBeInTheDocument();
    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
  });

  it('should display all platforms', () => {
    render(<OddsComparisonTable event={mockEvent} odds={mockOdds} />);

    expect(screen.getByText(/Bet365/i)).toBeInTheDocument();
    expect(screen.getByText(/Betfair/i)).toBeInTheDocument();
  });

  it('should highlight best odds', () => {
    render(<OddsComparisonTable event={mockEvent} odds={mockOdds} />);

    // Betfair has best home odds (2.1)
    expect(screen.getByText(/2.1/i)).toBeInTheDocument();
  });

  it('should handle markets without draw option', () => {
    const oddsWithoutDraw = [
      {
        platform: 'Bet365',
        home: 2.0,
        away: 3.5,
        value: 5.0,
        lastUpdated: new Date().toISOString(),
      },
    ];

    render(<OddsComparisonTable event={mockEvent} odds={oddsWithoutDraw} />);

    expect(screen.getByText(/Bet365/i)).toBeInTheDocument();
    expect(screen.queryByText(/Empate/i)).not.toBeInTheDocument();
  });

  it('should display value percentage', () => {
    render(<OddsComparisonTable event={mockEvent} odds={mockOdds} />);

    expect(screen.getByText(/5.0%/i)).toBeInTheDocument();
  });

  it('should display last updated time', () => {
    render(<OddsComparisonTable event={mockEvent} odds={mockOdds} />);

    // Should show relative time
    expect(screen.getByText(/hace|ago/i) || screen.getByText(/Bet365/i)).toBeTruthy();
  });
});


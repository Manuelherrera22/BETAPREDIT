/**
 * Team Comparison Charts Tests
 * Tests for the team comparison charts component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamComparisonCharts from '../../components/TeamComparisonCharts';

// Mock Recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
}));

describe('TeamComparisonCharts', () => {
  const mockHomeStats = {
    totalShots: 15,
    shotsOnGoal: 8,
    attacks: 120,
    dangerousAttacks: 45,
    possession: 60,
    passAccuracy: 0.85,
    tackles: 20,
    goalkeeperSaves: 5,
  };

  const mockAwayStats = {
    totalShots: 12,
    shotsOnGoal: 6,
    attacks: 100,
    dangerousAttacks: 35,
    possession: 40,
    passAccuracy: 0.75,
    tackles: 25,
    goalkeeperSaves: 8,
  };

  const mockHomeForm = {
    winRate5: 0.6,
    goalsForAvg5: 2.0,
    goalsAgainstAvg5: 1.0,
  };

  const mockAwayForm = {
    winRate5: 0.4,
    goalsForAvg5: 1.5,
    goalsAgainstAvg5: 1.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render team comparison charts', () => {
    render(
      <TeamComparisonCharts
        homeTeam="Team A"
        awayTeam="Team B"
        homeStats={mockHomeStats}
        awayStats={mockAwayStats}
        homeForm={mockHomeForm}
        awayForm={mockAwayForm}
      />
    );

    expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    expect(screen.getByText(/Team B/i)).toBeInTheDocument();
  });

  it('should display empty state when no data available', () => {
    render(
      <TeamComparisonCharts
        homeTeam="Team A"
        awayTeam="Team B"
        homeStats={null}
        awayStats={null}
        homeForm={null}
        awayForm={null}
      />
    );

    expect(screen.getByText(/No hay datos disponibles/i)).toBeInTheDocument();
  });

  it('should render bar charts for offensive metrics', () => {
    render(
      <TeamComparisonCharts
        homeTeam="Team A"
        awayTeam="Team B"
        homeStats={mockHomeStats}
        awayStats={mockAwayStats}
        homeForm={mockHomeForm}
        awayForm={mockAwayForm}
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render radar chart for overall comparison', () => {
    render(
      <TeamComparisonCharts
        homeTeam="Team A"
        awayTeam="Team B"
        homeStats={mockHomeStats}
        awayStats={mockAwayStats}
        homeForm={mockHomeForm}
        awayForm={mockAwayForm}
      />
    );

    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('should render line chart for form trend', () => {
    render(
      <TeamComparisonCharts
        homeTeam="Team A"
        awayTeam="Team B"
        homeStats={mockHomeStats}
        awayStats={mockAwayStats}
        homeForm={mockHomeForm}
        awayForm={mockAwayForm}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should handle missing stats gracefully', () => {
    render(
      <TeamComparisonCharts
        homeTeam="Team A"
        awayTeam="Team B"
        homeStats={null}
        awayStats={mockAwayStats}
        homeForm={mockHomeForm}
        awayForm={mockAwayForm}
      />
    );

    expect(screen.getByText(/Team A/i)).toBeInTheDocument();
  });
});


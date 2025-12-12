/**
 * Prediction Analysis Explained Tests
 * Tests for the detailed prediction analysis component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PredictionAnalysisExplained from '../../components/PredictionAnalysisExplained';

// Mock chart components
vi.mock('../../components/TeamComparisonCharts', () => ({
  default: () => <div data-testid="team-comparison-charts">Team Comparison Charts</div>,
}));

vi.mock('../../components/OddsHistoryChart', () => ({
  default: () => <div data-testid="odds-history-chart">Odds History Chart</div>,
}));

describe('PredictionAnalysisExplained', () => {
  const mockPrediction = {
    id: 'pred-1',
    eventId: 'event-1',
    marketId: 'market-1',
    eventName: 'Team A vs Team B',
    selection: 'home',
    predictedProbability: 0.65,
    confidence: 0.75,
    sport: 'Football',
  };

  const mockFactors = {
    marketAverage: {
      home: 0.45,
      away: 0.35,
      draw: 0.20,
      total: 1.0,
    },
    advancedFeatures: {
      marketOdds: {
        bookmakerCount: 5,
        minOdds: 1.9,
        maxOdds: 2.1,
        median: 2.0,
        volatility: 0.05,
      },
      homeForm: {
        winRate5: 0.6,
        goalsForAvg5: 2.0,
        isRealData: true,
      },
      awayForm: {
        winRate5: 0.4,
        goalsForAvg5: 1.5,
        isRealData: true,
      },
      h2h: {
        team1WinRate: 0.5,
        totalMatches: 10,
        isRealData: true,
      },
    },
    advancedAnalysis: {
      home: {
        keyFactors: [
          { name: 'Form Advantage', impact: 0.2, description: 'Team A has better form' },
        ],
        riskFactors: [
          { name: 'Low H2H Data', level: 'medium' as const, description: 'Limited historical data' },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render prediction analysis', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
  });

  it('should display market data section', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    expect(screen.getByText(/Valor del Mercado|Market Value/i)).toBeInTheDocument();
  });

  it('should toggle section expansion', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    const sectionButton = screen.getByText(/Valor del Mercado|Market Value/i).closest('button');
    if (sectionButton) {
      fireEvent.click(sectionButton);
    }
  });

  it('should display key factors', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    expect(screen.getByText(/Form Advantage/i)).toBeInTheDocument();
  });

  it('should display risk factors', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    expect(screen.getByText(/Low H2H Data/i)).toBeInTheDocument();
  });

  it('should handle missing factors gracefully', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={{}}
      />
    );

    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
  });

  it('should display team comparison charts when data available', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    expect(screen.getByTestId('team-comparison-charts')).toBeInTheDocument();
  });

  it('should display odds history chart when eventId and marketId provided', () => {
    render(
      <PredictionAnalysisExplained
        prediction={mockPrediction}
        factors={mockFactors}
      />
    );

    expect(screen.getByTestId('odds-history-chart')).toBeInTheDocument();
  });
});



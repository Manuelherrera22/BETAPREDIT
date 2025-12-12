/**
 * Prediction Card Tests
 * Tests for the prediction card component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PredictionCard from '../../components/PredictionCard';

describe('PredictionCard', () => {
  const mockPrediction = {
    selection: 'home',
    predictedProbability: 0.65,
    marketOdds: 2.0,
    value: 0.15,
    confidence: 0.75,
    recommendation: 'STRONG_BUY' as const,
  };

  const defaultProps = {
    prediction: mockPrediction,
    eventName: 'Team A vs Team B',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    sport: 'Football',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render prediction card', () => {
    render(<PredictionCard {...defaultProps} />);

    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
  });

  it('should display recommendation badge', () => {
    render(<PredictionCard {...defaultProps} />);

    expect(screen.getByText(/COMPRA FUERTE|STRONG_BUY/i)).toBeInTheDocument();
  });

  it('should display different recommendations correctly', () => {
    const { rerender } = render(
      <PredictionCard
        {...defaultProps}
        prediction={{ ...mockPrediction, recommendation: 'BUY' }}
      />
    );
    expect(screen.getByText(/COMPRA|BUY/i)).toBeInTheDocument();

    rerender(
      <PredictionCard
        {...defaultProps}
        prediction={{ ...mockPrediction, recommendation: 'HOLD' }}
      />
    );
    expect(screen.getByText(/MANTENER|HOLD/i)).toBeInTheDocument();

    rerender(
      <PredictionCard
        {...defaultProps}
        prediction={{ ...mockPrediction, recommendation: 'AVOID' }}
      />
    );
    expect(screen.getByText(/EVITAR|AVOID/i)).toBeInTheDocument();
  });

  it('should call onViewDetails when button is clicked', () => {
    const onViewDetails = vi.fn();
    render(<PredictionCard {...defaultProps} onViewDetails={onViewDetails} />);

    const viewButton = screen.getByText(/Ver Detalles|View Details/i);
    fireEvent.click(viewButton);

    expect(onViewDetails).toHaveBeenCalled();
  });

  it('should display value percentage correctly', () => {
    render(<PredictionCard {...defaultProps} />);

    expect(screen.getByText(/15%/i)).toBeInTheDocument();
  });

  it('should display confidence level', () => {
    render(<PredictionCard {...defaultProps} />);

    expect(screen.getByText(/75%/i)).toBeInTheDocument();
  });

  it('should display market odds', () => {
    render(<PredictionCard {...defaultProps} />);

    expect(screen.getByText(/2.0/i)).toBeInTheDocument();
  });

  it('should handle hover state', () => {
    render(<PredictionCard {...defaultProps} />);

    const card = screen.getByText(/Team A vs Team B/i).closest('div');
    if (card) {
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);
    }
  });
});



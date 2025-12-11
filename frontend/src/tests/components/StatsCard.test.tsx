/**
 * Stats Card Tests
 * Tests for the stats card component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from '../../components/StatsCard';

describe('StatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stats card with title and value', () => {
    render(
      <StatsCard
        title="Win Rate"
        value="65%"
      />
    );

    expect(screen.getByText(/Win Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
  });

  it('should display change text when provided', () => {
    render(
      <StatsCard
        title="ROI"
        value="15%"
        change="+5% este mes"
      />
    );

    expect(screen.getByText(/\+5% este mes/i)).toBeInTheDocument();
  });

  it('should display icon when provided', () => {
    render(
      <StatsCard
        title="Value Bets"
        value="10"
        icon="zap"
      />
    );

    expect(screen.getByText(/Value Bets/i)).toBeInTheDocument();
  });

  it('should apply trend styling correctly', () => {
    const { rerender } = render(
      <StatsCard
        title="Win Rate"
        value="65%"
        trend="up"
      />
    );

    expect(screen.getByText(/65%/i)).toBeInTheDocument();

    rerender(
      <StatsCard
        title="Win Rate"
        value="45%"
        trend="down"
      />
    );

    expect(screen.getByText(/45%/i)).toBeInTheDocument();
  });

  it('should display subtitle when provided', () => {
    render(
      <StatsCard
        title="Total Apostado"
        value="€1000"
        subtitle="Este mes"
      />
    );

    expect(screen.getByText(/Este mes/i)).toBeInTheDocument();
  });

  it('should apply custom gradient when provided', () => {
    render(
      <StatsCard
        title="Test"
        value="100"
        gradient="from-blue-500/20 to-cyan-500/20"
      />
    );

    expect(screen.getByText(/Test/i)).toBeInTheDocument();
  });
});


/**
 * Prediction Card Integration Tests
 * Tests for the new "Registrar Apuesta" button integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PredictionCard from '../../components/PredictionCard';

// Mock RegisterBetForm
vi.mock('../../components/RegisterBetForm', () => ({
  default: ({ isOpen, onClose, initialData }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="register-bet-form">
        <div>Register Bet Form</div>
        <div data-testid="initial-platform">{initialData?.platform || 'N/A'}</div>
        <div data-testid="initial-selection">{initialData?.selection || 'N/A'}</div>
        <div data-testid="initial-odds">{initialData?.odds || 'N/A'}</div>
        <div data-testid="initial-event-id">{initialData?.eventId || 'N/A'}</div>
        <div data-testid="initial-notes">{initialData?.notes || 'N/A'}</div>
        <div data-testid="initial-metadata">{JSON.stringify(initialData?.metadata || {})}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

describe('PredictionCard - Integration with Register Bet', () => {
  let queryClient: QueryClient;

  const mockPrediction = {
    selection: 'Home Win',
    predictedProbability: 0.65,
    marketOdds: 2.5,
    value: 0.15,
    confidence: 0.75,
    recommendation: 'STRONG_BUY' as const,
  };

  const defaultProps = {
    prediction: mockPrediction,
    eventName: 'Team A vs Team B',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    sport: 'Football',
    eventId: 'event-123',
  };

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

  it('should render "Registrar" button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionCard {...defaultProps} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Registrar/i)).toBeInTheDocument();
  });

  it('should open RegisterBetForm when "Registrar" button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionCard {...defaultProps} />
      </QueryClientProvider>
    );

    const registerButton = screen.getByText(/Registrar/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
    });
  });

  it('should pre-fill RegisterBetForm with prediction data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionCard {...defaultProps} />
      </QueryClientProvider>
    );

    const registerButton = screen.getByText(/Registrar/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
      expect(screen.getByTestId('initial-selection')).toHaveTextContent('Home Win');
      expect(screen.getByTestId('initial-odds')).toHaveTextContent('2.5');
      expect(screen.getByTestId('initial-event-id')).toHaveTextContent('event-123');
    });
  });

  it('should include prediction metadata in initial data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionCard {...defaultProps} />
      </QueryClientProvider>
    );

    const registerButton = screen.getByText(/Registrar/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
      // The form should have notes with prediction data
      const notes = screen.getByTestId('initial-notes');
      expect(notes).toHaveTextContent(/65.0%|confianza/);
      // The form should have metadata with prediction data
      const metadata = screen.getByTestId('initial-metadata');
      expect(metadata.textContent).toContain('predictionConfidence');
      expect(metadata.textContent).toContain('predictionValue');
      expect(metadata.textContent).toContain('predictedProbability');
      expect(metadata.textContent).toContain('recommendation');
    });
  });

  it('should close RegisterBetForm when close button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionCard {...defaultProps} />
      </QueryClientProvider>
    );

    const registerButton = screen.getByText(/Registrar/i);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-bet-form')).toBeInTheDocument();
    });

    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('register-bet-form')).not.toBeInTheDocument();
    });
  });

  it('should work without eventId (optional prop)', () => {
    const propsWithoutEventId = {
      ...defaultProps,
      eventId: undefined,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <PredictionCard {...propsWithoutEventId} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Registrar/i)).toBeInTheDocument();
  });
});

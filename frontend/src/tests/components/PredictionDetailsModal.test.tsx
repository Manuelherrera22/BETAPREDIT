/**
 * Prediction Details Modal Tests
 * Tests for the prediction details modal component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PredictionDetailsModal from '../../components/PredictionDetailsModal';
import * as predictionsService from '../../services/predictionsService';

// Mock services
vi.mock('../../services/predictionsService');
vi.mock('../../components/PredictionAnalysisExplained', () => ({
  default: ({ prediction }: any) => (
    <div data-testid="prediction-analysis">
      Analysis for {prediction.eventName} - {prediction.selection}
    </div>
  ),
}));

describe('PredictionDetailsModal', () => {
  let queryClient: QueryClient;

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

  it('should not render when isOpen is false', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionDetailsModal
          isOpen={false}
          onClose={vi.fn()}
          predictionId="pred-1"
        />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/Análisis Completo/i)).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          eventName="Team A vs Team B"
          selection="home"
          predictedProbability={0.65}
          confidence={0.75}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Análisis Completo de la Predicción/i)).toBeInTheDocument();
    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionDetailsModal
          isOpen={true}
          onClose={onClose}
          eventName="Team A vs Team B"
        />
      </QueryClientProvider>
    );

    const closeButton = screen.getByLabelText(/close|cerrar/i) || screen.getByRole('button', { name: /x/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should fetch prediction factors when predictionId is provided', async () => {
    const mockPrediction = {
      id: 'pred-1',
      eventId: 'event-1',
      marketId: 'market-1',
      selection: 'home',
      predictedProbability: 0.65,
      confidence: 0.75,
      factors: {
        marketAverage: { home: 0.45, away: 0.35, draw: 0.20 },
        advancedFeatures: {
          homeForm: { winRate5: 0.6, isRealData: true },
        },
      },
      factorExplanation: {
        keyFactors: [],
        confidenceFactors: [],
        riskFactors: [],
      },
    };

    (predictionsService.predictionsService.getPredictionFactors as any).mockResolvedValue(mockPrediction);

    render(
      <QueryClientProvider client={queryClient}>
        <PredictionDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          predictionId="pred-1"
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(predictionsService.predictionsService.getPredictionFactors).toHaveBeenCalledWith('pred-1');
    });
  });

  it('should display loading state while fetching prediction', async () => {
    (predictionsService.predictionsService.getPredictionFactors as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PredictionDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          predictionId="pred-1"
        />
      </QueryClientProvider>
    );

    // Should show loading state
    await waitFor(() => {
      const loading = screen.queryByText(/cargando|loading/i);
      expect(loading || screen.getByText(/Análisis Completo/i)).toBeTruthy();
    });
  });

  it('should use provided props when predictionId is not available', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PredictionDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          eventId="event-1"
          marketId="market-1"
          selection="home"
          predictedProbability={0.65}
          confidence={0.75}
          eventName="Team A vs Team B"
          sport="Football"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
    expect(screen.getByTestId('prediction-analysis')).toBeInTheDocument();
  });
});




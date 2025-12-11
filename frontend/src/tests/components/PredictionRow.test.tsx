/**
 * Prediction Row Tests
 * Tests for the prediction row component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PredictionRow from '../../components/PredictionRow';
import * as predictionsService from '../../services/predictionsService';

// Mock services
vi.mock('../../services/predictionsService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PredictionRow', () => {
  let queryClient: QueryClient;

  const mockPrediction = {
    id: 'pred-1',
    eventName: 'Team A vs Team B',
    selection: 'home',
    predictedProbability: 0.65,
    confidence: 0.75,
    wasCorrect: null,
    accuracy: null,
    createdAt: new Date().toISOString(),
    eventFinishedAt: null,
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

  it('should render prediction row', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>
            <PredictionRow prediction={mockPrediction} />
          </tbody>
        </table>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Team A vs Team B/i)).toBeInTheDocument();
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
    expect(screen.getByText(/75%/i)).toBeInTheDocument();
  });

  it('should display pending status when wasCorrect is null', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>
            <PredictionRow prediction={mockPrediction} />
          </tbody>
        </table>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Pendiente/i)).toBeInTheDocument();
  });

  it('should display correct status when wasCorrect is true', () => {
    const correctPrediction = { ...mockPrediction, wasCorrect: true };
    render(
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>
            <PredictionRow prediction={correctPrediction} />
          </tbody>
        </table>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Correcta/i)).toBeInTheDocument();
  });

  it('should display incorrect status when wasCorrect is false', () => {
    const incorrectPrediction = { ...mockPrediction, wasCorrect: false };
    render(
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>
            <PredictionRow prediction={incorrectPrediction} />
          </tbody>
        </table>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Incorrecta/i)).toBeInTheDocument();
  });

  it('should toggle factors display', async () => {
    const mockFactors = {
      factors: {
        marketAverage: { home: 0.45 },
      },
    };

    (predictionsService.predictionsService.getPredictionFactors as any).mockResolvedValue(mockFactors);

    render(
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>
            <PredictionRow prediction={mockPrediction} />
          </tbody>
        </table>
      </QueryClientProvider>
    );

    const factorsButton = screen.getByText(/Ver Factores|Factores/i);
    fireEvent.click(factorsButton);

    await waitFor(() => {
      expect(predictionsService.predictionsService.getPredictionFactors).toHaveBeenCalledWith('pred-1');
    });
  });

  it('should submit feedback when correct button is clicked', async () => {
    (predictionsService.predictionsService.submitFeedback as any).mockResolvedValue({ success: true });

    render(
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>
            <PredictionRow prediction={mockPrediction} />
          </tbody>
        </table>
      </QueryClientProvider>
    );

    const feedbackButton = screen.getByText(/Feedback|Enviar/i);
    if (feedbackButton) {
      fireEvent.click(feedbackButton);
      
      const correctButton = screen.getByText(/Correcta|Correct/i);
      if (correctButton) {
        fireEvent.click(correctButton);
        
        await waitFor(() => {
          expect(predictionsService.predictionsService.submitFeedback).toHaveBeenCalled();
        });
      }
    }
  });
});


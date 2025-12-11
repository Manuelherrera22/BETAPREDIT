/**
 * Error Display Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorDisplay from '../../components/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('should render error message', () => {
    render(<ErrorDisplay message="Error occurred" />);

    expect(screen.getByText(/Error occurred/i)).toBeInTheDocument();
  });

  it('should render error title', () => {
    render(<ErrorDisplay title="Error" message="Error occurred" />);

    expect(screen.getByText(/Error/i)).toBeInTheDocument();
  });

  it('should render retry button when onRetry provided', () => {
    const mockRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={mockRetry} />);

    const retryButton = screen.getByText(/Reintentar|Retry/i);
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={mockRetry} />);

    const retryButton = screen.getByText(/Reintentar|Retry/i);
    retryButton.click();

    expect(mockRetry).toHaveBeenCalled();
  });
});


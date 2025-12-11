/**
 * Empty State Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';

describe('EmptyState', () => {
  it('should render empty state with title', () => {
    render(<EmptyState title="No hay datos" />);

    expect(screen.getByText(/No hay datos/i)).toBeInTheDocument();
  });

  it('should render empty state with description', () => {
    render(<EmptyState title="No hay datos" description="No se encontraron resultados" />);

    expect(screen.getByText(/No se encontraron resultados/i)).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const mockAction = vi.fn();
    render(
      <EmptyState
        title="No hay datos"
        actionLabel="Agregar"
        onAction={mockAction}
      />
    );

    const button = screen.getByText(/Agregar/i);
    expect(button).toBeInTheDocument();
  });

  it('should call action when button is clicked', () => {
    const mockAction = vi.fn();
    render(
      <EmptyState
        title="No hay datos"
        actionLabel="Agregar"
        onAction={mockAction}
      />
    );

    const button = screen.getByText(/Agregar/i);
    button.click();

    expect(mockAction).toHaveBeenCalled();
  });
});


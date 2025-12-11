/**
 * Quick Add Bet Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import QuickAddBet from '../../components/QuickAddBet';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

describe('QuickAddBet', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('should render floating button', () => {
    render(
      <BrowserRouter>
        <QuickAddBet />
      </BrowserRouter>
    );

    const button = screen.getByLabelText(/Agregar apuesta rápida/i);
    expect(button).toBeInTheDocument();
  });

  it('should open menu when button is clicked', () => {
    render(
      <BrowserRouter>
        <QuickAddBet />
      </BrowserRouter>
    );

    const button = screen.getByLabelText(/Agregar apuesta rápida/i);
    fireEvent.click(button);

    expect(screen.getByText(/Agregar Apuesta/i)).toBeInTheDocument();
  });

  it('should close menu when backdrop is clicked', () => {
    render(
      <BrowserRouter>
        <QuickAddBet />
      </BrowserRouter>
    );

    const button = screen.getByLabelText(/Agregar apuesta rápida/i);
    fireEvent.click(button);

    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(screen.queryByText(/Agregar Apuesta/i)).not.toBeInTheDocument();
  });

  it('should navigate to my-bets when "Agregar Apuesta" is clicked', () => {
    render(
      <BrowserRouter>
        <QuickAddBet />
      </BrowserRouter>
    );

    const button = screen.getByLabelText(/Agregar apuesta rápida/i);
    fireEvent.click(button);

    const addBetButton = screen.getByText(/Agregar Apuesta/i);
    fireEvent.click(addBetButton);

    expect(mockNavigate).toHaveBeenCalledWith('/my-bets?action=add');
    expect(toast.success).toHaveBeenCalled();
  });

  it('should navigate to template when "Usar Template" is clicked', () => {
    render(
      <BrowserRouter>
        <QuickAddBet />
      </BrowserRouter>
    );

    const button = screen.getByLabelText(/Agregar apuesta rápida/i);
    fireEvent.click(button);

    const templateButton = screen.getByText(/Usar Template/i);
    fireEvent.click(templateButton);

    expect(mockNavigate).toHaveBeenCalledWith('/my-bets?action=template');
  });

  it('should navigate to import when "Importar CSV" is clicked', () => {
    render(
      <BrowserRouter>
        <QuickAddBet />
      </BrowserRouter>
    );

    const button = screen.getByLabelText(/Agregar apuesta rápida/i);
    fireEvent.click(button);

    const importButton = screen.getByText(/Importar CSV/i);
    fireEvent.click(importButton);

    expect(mockNavigate).toHaveBeenCalledWith('/my-bets?action=import');
  });
});


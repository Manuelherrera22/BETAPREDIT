/**
 * Register Page Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../pages/Register';
import * as authService from '../../services/authService';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render registration form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña|Password/i)).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockResponse = {
      user: { id: 'user-1', email: 'test@example.com' },
      token: 'test-token',
    };

    (authService.authService.register as any).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contraseña|Password/i);
    const submitButton = screen.getByRole('button', { name: /Registrarse|Register/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.authService.register).toHaveBeenCalled();
    });
  });

  it('should validate password match', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText(/Contraseña|Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirmar|Confirm/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/no coinciden|don't match/i)).toBeInTheDocument();
    });
  });
});


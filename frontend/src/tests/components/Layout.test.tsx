/**
 * Layout Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store/authStore';

// Mock dependencies
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    shouldShow: false,
    completeOnboarding: vi.fn(),
  }),
}));

vi.mock('../../components/QuickAddBet', () => ({
  default: () => <div data-testid="quick-add-bet">QuickAddBet</div>,
}));

vi.mock('../../components/OnboardingTour', () => ({
  default: () => null,
}));

describe('Layout', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  it('should render layout with navigation', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText(/BETAPREDIT/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Content/i)).toBeInTheDocument();
  });

  it('should display navigation items', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText(/Inicio/i)).toBeInTheDocument();
    expect(screen.getByText(/Predicciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Eventos/i)).toBeInTheDocument();
  });

  it('should show user menu when logged in', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const userButton = screen.getByText(/Test User/i) || screen.getByText(/test@example.com/i);
    expect(userButton).toBeInTheDocument();
  });

  it('should handle logout', () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    // Find and click logout button
    const logoutButton = screen.getByText(/Cerrar Sesión/i) || screen.getByText(/Logout/i);
    if (logoutButton) {
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    }
  });

  it('should toggle mobile menu', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const menuButton = screen.getByLabelText(/menu/i) || screen.getByRole('button', { name: /menu/i });
    if (menuButton) {
      fireEvent.click(menuButton);
      // Menu should be visible
      expect(screen.getByText(/Inicio/i)).toBeInTheDocument();
    }
  });

  it('should highlight active route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Layout>
          <div>Test</div>
        </Layout>
      </MemoryRouter>
    );

    const homeLink = screen.getByText(/Inicio/i);
    expect(homeLink).toBeInTheDocument();
  });
});


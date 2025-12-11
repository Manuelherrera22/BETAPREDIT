/**
 * Profile Page Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';
import { useAuthStore } from '../../store/authStore';
import * as userProfileService from '../../services/userProfileService';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../services/userProfileService', () => ({
  userProfileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../../components/SubscriptionTab', () => ({
  default: () => <div data-testid="subscription-tab">SubscriptionTab</div>,
}));

vi.mock('../../components/ValueBetPreferencesForm', () => ({
  default: () => <div data-testid="value-bet-preferences">ValueBetPreferencesForm</div>,
}));

vi.mock('../../components/PushNotificationSettings', () => ({
  default: () => <div data-testid="push-notifications">PushNotificationSettings</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Profile', () => {
  let queryClient: QueryClient;
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockProfile = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    timezone: 'UTC',
    preferredCurrency: 'EUR',
    preferredMode: 'pro',
  };

  const mockSetUser = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
      },
    });
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
    });
    (userProfileService.userProfileService.getProfile as any).mockResolvedValue(mockProfile);
    (userProfileService.userProfileService.updateProfile as any).mockResolvedValue(mockProfile);
  });

  it('should render profile page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mi Perfil/i)).toBeInTheDocument();
    });
  });

  it('should display profile tabs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Perfil/i)).toBeInTheDocument();
      expect(screen.getByText(/Configuración/i)).toBeInTheDocument();
      expect(screen.getByText(/Notificaciones/i)).toBeInTheDocument();
      expect(screen.getByText(/Suscripción/i)).toBeInTheDocument();
    });
  });

  it('should load user profile data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(userProfileService.userProfileService.getProfile).toHaveBeenCalled();
    });
  });

  it('should update profile when form is submitted', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(userProfileService.userProfileService.updateProfile).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should switch tabs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const settingsTab = screen.getByText(/Configuración/i);
      fireEvent.click(settingsTab);
    });

    await waitFor(() => {
      expect(screen.getByTestId('value-bet-preferences')).toBeInTheDocument();
    });
  });
});


/**
 * OAuth Service
 * Handles OAuth authentication flows
 */

import api from './api';

class OAuthService {
  /**
   * Get Google OAuth URL
   */
  async getGoogleAuthUrl(): Promise<string> {
    try {
      const response = await api.get('/oauth/google');
      if (response.data?.success && response.data?.data?.authUrl) {
        return response.data.data.authUrl;
      }
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Error getting Google OAuth URL:', error);
      if (error.response?.status === 503) {
        throw new Error('Google OAuth no está configurado en el servidor. Por favor, contacta al administrador.');
      }
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Error al obtener la URL de autenticación de Google');
    }
  }

  /**
   * Initiate Google OAuth flow
   */
  async initiateGoogle(): Promise<void> {
    try {
      const authUrl = await this.getGoogleAuthUrl();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      throw error; // Re-throw to be handled by the component
    }
  }
}

export const oauthService = new OAuthService();


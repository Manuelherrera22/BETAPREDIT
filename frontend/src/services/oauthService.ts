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
      console.log('OAuth response:', response.data);
      
      if (response.data?.success && response.data?.data?.authUrl) {
        return response.data.data.authUrl;
      }
      
      // Check for error in response
      if (response.data?.error) {
        throw new Error(response.data.error.message || 'Error del servidor');
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error: any) {
      console.error('Error getting Google OAuth URL:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Handle specific error cases
      if (error.response?.status === 503) {
        throw new Error('Google OAuth no está configurado en el servidor. Por favor, contacta al administrador.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('El endpoint de OAuth no se encontró. Verifica la configuración del servidor.');
      }
      
      if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Por favor, intenta más tarde.');
      }
      
      // Try to get error message from response
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Network errors
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      }
      
      // Default error
      throw new Error(error.message || 'Error al obtener la URL de autenticación de Google');
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


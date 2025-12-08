/**
 * OAuth Service
 * Handles OAuth authentication flows
 * Uses Supabase Auth if available, falls back to backend API
 */

import api from './api';
import { supabase, isSupabaseConfigured } from '../config/supabase';

class OAuthService {
  /**
   * Get Google OAuth URL
   * Uses Supabase Auth if configured, otherwise uses backend API
   */
  async getGoogleAuthUrl(): Promise<string> {
    // Try Supabase Auth first
    if (isSupabaseConfigured() && supabase) {
      try {
        // Use current origin (works for both localhost and production)
        const frontendUrl = window.location.origin;
        const callbackUrl = `${frontendUrl}/auth/callback`;

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('Supabase OAuth error:', error);
          throw error;
        }

        if (data.url) {
          console.log('Using Supabase Auth for OAuth');
          console.log('OAuth URL:', data.url);
          console.log('Callback URL:', callbackUrl);
          return data.url;
        } else {
          throw new Error('No OAuth URL returned from Supabase');
        }
      } catch (error: any) {
        console.error('Supabase OAuth error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.status,
        });
        
        // If Supabase is configured, don't fallback to backend
        // The error should be shown to the user
        if (isSupabaseConfigured()) {
          throw new Error(`Error con Supabase Auth: ${error.message || 'Error desconocido'}`);
        }
        
        console.warn('Supabase not configured, falling back to backend');
        // Fall through to backend implementation only if Supabase is not configured
      }
    }

    // Fallback to backend API (only if Supabase is not configured)
    try {
      console.log('Requesting OAuth URL from:', api.defaults.baseURL + '/oauth/google');
      const response = await api.get('/oauth/google');
      console.log('OAuth response:', response.data);
      
      if (!response || !response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (response.data?.success && response.data?.data?.authUrl) {
        return response.data.data.authUrl;
      }
      
      // Check for error in response
      if (response.data?.error) {
        throw new Error(response.data.error.message || 'Error del servidor');
      }
      
      // Check if response structure is unexpected
      if (!response.data?.data) {
        console.error('Unexpected response structure:', response.data);
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error: any) {
      console.error('Error getting Google OAuth URL:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        code: error.code,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        },
      });
      
      // No response at all (network error, backend down, CORS)
      if (!error.response) {
        const apiUrl = api.defaults.baseURL || 'el servidor';
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          throw new Error(`No se pudo conectar con el servidor (${apiUrl}). Verifica que el backend esté corriendo.`);
        }
        if (error.code === 'ERR_CANCELED') {
          throw new Error('La petición fue cancelada');
        }
        throw new Error(`No se pudo conectar con el servidor. Verifica que el backend esté corriendo en ${apiUrl}`);
      }
      
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


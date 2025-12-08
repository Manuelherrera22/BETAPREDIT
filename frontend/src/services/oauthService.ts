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
    // Check if Supabase is configured
    const supabaseConfigured = isSupabaseConfigured();
    const hasSupabaseClient = !!supabase;
    
    console.log('🔍 OAuth Service - Configuration Check:', {
      supabaseConfigured,
      hasSupabaseClient,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    });
    
    // CRITICAL: If Supabase is configured, we MUST use it, no fallback
    if (supabaseConfigured && supabase) {
      console.log('✅ Using Supabase Auth (no backend needed)');
      try {
        // Use current origin (works for both localhost and production)
        const frontendUrl = window.location.origin;
        const callbackUrl = `${frontendUrl}/auth/callback`;
        
        console.log('Attempting Supabase OAuth with:', {
          frontendUrl,
          callbackUrl,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        });

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

        console.log('Supabase OAuth response:', { data, error });

        if (error) {
          console.error('Supabase OAuth error:', error);
          throw new Error(`Supabase Auth error: ${error.message || 'Error desconocido'}`);
        }

        if (data && data.url) {
          console.log('✅ Using Supabase Auth for OAuth');
          console.log('OAuth URL:', data.url);
          console.log('Callback URL:', callbackUrl);
          return data.url;
        } else {
          console.error('No URL in Supabase response:', data);
          throw new Error('No se recibió URL de autenticación de Supabase');
        }
      } catch (error: any) {
        console.error('Supabase OAuth failed:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.status,
          stack: error.stack,
        });
        
        // If Supabase is configured, NEVER fallback to backend
        // Show the error to the user
        console.error('❌ Supabase OAuth failed, but Supabase IS configured');
        console.error('This should NOT happen. Check Supabase dashboard configuration.');
        throw new Error(`Error con Supabase Auth: ${error.message || 'No se pudo generar la URL de autenticación. Verifica la configuración en Supabase Dashboard.'}`);
      }
    }
    
    // If we reach here, Supabase is NOT configured
    console.error('❌ Supabase NOT configured!');
    console.error('Missing environment variables:', {
      VITE_SUPABASE_URL: !import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
    console.error('⚠️ Falling back to backend API (this should not happen in production)');

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


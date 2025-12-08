/**
 * OAuth Callback Page
 * Handles OAuth redirects from providers
 * Supports both Supabase Auth and backend OAuth
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      // Get all URL parameters
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');
      
      // Log all parameters for debugging
      console.log('🔍 AuthCallback - URL parameters:', {
        token: token ? token.substring(0, 20) + '...' : null,
        code: code ? code.substring(0, 20) + '...' : null,
        provider,
        error,
        allParams: Object.fromEntries(searchParams.entries()),
      });

      if (error) {
        let errorMessage = 'Error al autenticar con ' + (provider || 'OAuth');
        if (error === 'oauth_failed') {
          errorMessage = 'Error al autenticar con Google. Por favor, intenta de nuevo.';
        } else if (error === 'no_code') {
          errorMessage = 'No se recibió el código de autorización de Google.';
        } else if (error === 'oauth_error') {
          errorMessage = 'Error en el proceso de autenticación con Google.';
        }
        toast.error(errorMessage);
        navigate('/login');
        return;
      }

      // Handle Supabase Auth callback (has code but no token)
      if (isSupabaseConfigured() && supabase && code && !token) {
        try {
          // Exchange code for session
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('Supabase OAuth callback error:', sessionError);
            toast.error('Error al procesar la autenticación con Google');
            navigate('/login');
            return;
          }

          if (!sessionData.user) {
            toast.error('No se pudo autenticar el usuario');
            navigate('/login');
            return;
          }

          // Get user info from backend (create or update user in our DB)
          try {
            const response = await api.post('/auth/supabase/sync', {
              supabaseUserId: sessionData.user.id,
              email: sessionData.user.email,
              metadata: sessionData.user.user_metadata,
            });

            if (response.data?.success) {
              const { user, accessToken } = response.data.data;
              login(user, accessToken);
              toast.success('¡Bienvenido! Inicio de sesión con Google exitoso');
              navigate('/dashboard');
            } else {
              throw new Error('Failed to sync user');
            }
          } catch (syncError: any) {
            console.error('Error syncing user:', syncError);
            // Try to create user manually
            const user = {
              id: sessionData.user.id,
              email: sessionData.user.email!,
              firstName: sessionData.user.user_metadata?.first_name || null,
              lastName: sessionData.user.user_metadata?.last_name || null,
              role: 'USER',
            };
            
            // Generate a temporary token (in production, this should come from backend)
            const tempToken = sessionData.session?.access_token || '';
            login(user, tempToken);
            toast.success('¡Bienvenido! Inicio de sesión con Google exitoso');
            navigate('/dashboard');
          }
        } catch (error: any) {
          console.error('Error processing Supabase callback:', error);
          toast.error('Error al procesar la autenticación');
          navigate('/login');
        }
        return;
      }

      // Handle backend OAuth callback (has token)
      if (token) {
        try {
          // Get user info from token (decode JWT)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            id: payload.id,
            email: payload.email,
            firstName: payload.firstName || null,
            lastName: payload.lastName || null,
            role: payload.role || 'USER',
          };

          login(user, token);
          toast.success(`¡Bienvenido! Inicio de sesión con ${provider || 'OAuth'} exitoso`);
          navigate('/dashboard');
        } catch (error) {
          console.error('Error decoding token:', error);
          toast.error('Error al procesar la autenticación');
          navigate('/login');
        }
        return;
      }

      // No token or code - Check for existing Supabase session
      console.log('ℹ️ No token or code in URL, checking for existing Supabase session...');
      console.log('Search params:', {
        token: searchParams.get('token'),
        code: searchParams.get('code'),
        error: searchParams.get('error'),
        allParams: Object.fromEntries(searchParams.entries()),
      });
      
      // Check if this is a Supabase callback that might have been handled automatically
      if (isSupabaseConfigured() && supabase) {
        // Try to get current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting Supabase session:', sessionError);
        }
        
        if (session && session.user) {
          console.log('✅ Found existing Supabase session:', {
            userId: session.user.id,
            email: session.user.email,
          });
          
          // User is already authenticated via Supabase
          // Try to sync with backend first
          try {
            console.log('🔄 Attempting to sync with backend...');
            const response = await api.post('/auth/supabase/sync', {
              supabaseUserId: session.user.id,
              email: session.user.email,
              metadata: session.user.user_metadata,
            });
            
            if (response.data?.success && response.data?.data) {
              const { user, accessToken } = response.data.data;
              console.log('✅ User synced with backend successfully');
              login(user, accessToken);
              toast.success('¡Bienvenido! Sesión restaurada');
              navigate('/dashboard');
              return;
            }
          } catch (err: any) {
            console.warn('⚠️ Backend sync failed, using Supabase session directly:', {
              message: err.message,
              status: err.response?.status,
              url: err.config?.url,
            });
            
            // Backend not available - use Supabase session directly
            const user = {
              id: session.user.id,
              email: session.user.email!,
              firstName: session.user.user_metadata?.first_name || 
                         session.user.user_metadata?.full_name?.split(' ')[0] || null,
              lastName: session.user.user_metadata?.last_name || 
                        session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
              role: 'USER' as const,
            };
            
            // Use Supabase access token
            const supabaseToken = session.access_token;
            if (supabaseToken) {
              console.log('✅ Using Supabase session directly (backend unavailable)');
              login(user, supabaseToken);
              toast.success('¡Bienvenido! Inicio de sesión exitoso');
              navigate('/dashboard');
              return;
            } else {
              console.error('❌ No access token in Supabase session');
            }
          }
        } else {
          console.log('ℹ️ No existing Supabase session found');
        }
      }
      
      // If we reach here, there's no session and no token/code
      console.error('❌ No authentication data available');
      toast.error('No se recibió el token de autenticación. Por favor, intenta de nuevo.');
      navigate('/login');
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-400">Procesando autenticación...</p>
      </div>
    </div>
  );
}


/**
 * OAuth Callback Page
 * Handles OAuth redirects from providers
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    // const refreshToken = searchParams.get('refreshToken');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Error al autenticar con ' + (provider || 'OAuth'));
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('No se recibió el token de autenticación');
      navigate('/login');
      return;
    }

    // Get user info from token (decode JWT)
    try {
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


/**
 * Error Display Component
 * Shows user-friendly error messages with retry options
 */

import { useState } from 'react';
import Icon from './icons/IconSystem';

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export default function ErrorDisplay({ 
  error, 
  onRetry, 
  title = 'Algo salió mal',
  className = '' 
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Mapear errores técnicos a mensajes user-friendly
  const getUserFriendlyMessage = (msg: string): { message: string; suggestion?: string } => {
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
      return {
        message: 'Problema de conexión',
        suggestion: 'Verifica tu conexión a internet e intenta nuevamente'
      };
    }
    
    if (lowerMsg.includes('401') || lowerMsg.includes('unauthorized')) {
      return {
        message: 'Sesión expirada',
        suggestion: 'Por favor, inicia sesión nuevamente'
      };
    }
    
    if (lowerMsg.includes('403') || lowerMsg.includes('forbidden')) {
      return {
        message: 'Sin permisos',
        suggestion: 'No tienes permisos para realizar esta acción'
      };
    }
    
    if (lowerMsg.includes('404') || lowerMsg.includes('not found')) {
      return {
        message: 'Recurso no encontrado',
        suggestion: 'El contenido que buscas no está disponible'
      };
    }
    
    if (lowerMsg.includes('429') || lowerMsg.includes('rate limit')) {
      return {
        message: 'Demasiadas solicitudes',
        suggestion: 'Espera unos momentos antes de intentar nuevamente'
      };
    }
    
    if (lowerMsg.includes('500') || lowerMsg.includes('server')) {
      return {
        message: 'Error del servidor',
        suggestion: 'Estamos experimentando problemas técnicos. Intenta más tarde'
      };
    }
    
    return {
      message: errorMessage,
      suggestion: 'Intenta recargar la página o contacta soporte si el problema persiste'
    };
  };
  
  const { message, suggestion } = getUserFriendlyMessage(errorMessage);
  
  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };
  
  return (
    <div className={`bg-dark-800 rounded-xl p-6 border border-red-500/20 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Icon name="alert" size={24} className="text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-gray-300 mb-2">{message}</p>
          {suggestion && (
            <p className="text-sm text-gray-400 mb-4">{suggestion}</p>
          )}
          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-300 border-t-transparent rounded-full animate-spin"></div>
                  Reintentando...
                </>
              ) : (
                <>
                  <Icon name="activity" size={16} />
                  Reintentar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

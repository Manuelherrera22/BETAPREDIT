/**
 * User-Friendly Error Messages
 * Maps error codes and types to user-friendly messages in Spanish
 */

export interface ErrorContext {
  action?: string;
  resource?: string;
  details?: any;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: 'Problema de conexión. Por favor, verifica tu internet e intenta de nuevo.',
  ECONNREFUSED: 'No se pudo conectar al servidor. Por favor, intenta más tarde.',
  ETIMEDOUT: 'La solicitud tardó demasiado. Por favor, intenta de nuevo.',
  
  // Authentication errors
  UNAUTHORIZED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  AUTH_REQUIRED: 'Por favor, inicia sesión para continuar.',
  
  // Validation errors
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados e intenta de nuevo.',
  INVALID_INPUT: 'Los datos ingresados no son válidos. Por favor, revísalos.',
  
  // Resource errors
  NOT_FOUND: 'No se encontró el recurso solicitado.',
  RESOURCE_NOT_FOUND: 'El recurso que buscas no existe o ha sido eliminado.',
  
  // Server errors
  SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
  INTERNAL_ERROR: 'Ocurrió un error interno. Nuestro equipo ha sido notificado.',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible temporalmente. Por favor, intenta más tarde.',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.',
  RATE_LIMIT_EXCEEDED: 'Has excedido el límite de solicitudes. Por favor, espera unos minutos.',
  
  // API specific errors
  API_ERROR: 'Error al comunicarse con el servidor. Por favor, intenta de nuevo.',
  API_TIMEOUT: 'La solicitud tardó demasiado. Por favor, intenta de nuevo.',
  
  // Prediction errors
  PREDICTION_NOT_FOUND: 'No se encontró la predicción solicitada.',
  PREDICTION_INVALID: 'Los datos de la predicción no son válidos.',
  PREDICTION_INCOMPLETE: 'Los datos de la predicción están incompletos. Se están actualizando.',
  
  // Event errors
  EVENT_NOT_FOUND: 'No se encontró el evento solicitado.',
  EVENT_EXPIRED: 'Este evento ya ha finalizado.',
  
  // Bet errors
  BET_INVALID: 'Los datos de la apuesta no son válidos.',
  BET_NOT_FOUND: 'No se encontró la apuesta solicitada.',
  
  // Value bet errors
  VALUE_BET_NOT_FOUND: 'No se encontró el value bet solicitado.',
  VALUE_BET_EXPIRED: 'Este value bet ya no está disponible.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(
  error: any,
  context?: ErrorContext
): string {
  // If error has a user-friendly message already, use it
  if (error?.userMessage) {
    return error.userMessage;
  }

  // Check for error code
  const code = error?.code || error?.error?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Check for status code
  const status = error?.status || error?.response?.status;
  if (status) {
    switch (status) {
      case 400:
        return context?.action
          ? `Error al ${context.action}. ${ERROR_MESSAGES.VALIDATION_ERROR}`
          : ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return context?.resource
          ? `No se encontró ${context.resource}.`
          : ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.TOO_MANY_REQUESTS;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        break;
    }
  }

  // Check for network error
  if (error?.isNetworkError || !error?.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Check for message in error object
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Map common error messages
    if (message.includes('network') || message.includes('connection')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.API_TIMEOUT;
    }
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    if (message.includes('not found')) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_MESSAGES.VALIDATION_ERROR;
    }
    
    // Return original message if it's already user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Default message
  return context?.action
    ? `Error al ${context.action}. Por favor, intenta de nuevo.`
    : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
}

/**
 * Get error suggestion (what user can do)
 */
export function getErrorSuggestion(error: any): string | null {
  const code = error?.code || error?.error?.code;
  const status = error?.status || error?.response?.status;

  if (code === 'NETWORK_ERROR' || !error?.response) {
    return 'Verifica tu conexión a internet y vuelve a intentar.';
  }

  if (status === 401) {
    return 'Inicia sesión nuevamente para continuar.';
  }

  if (status === 403) {
    return 'Contacta al soporte si crees que esto es un error.';
  }

  if (status === 404) {
    return 'El recurso que buscas puede haber sido eliminado o movido.';
  }

  if (status === 429) {
    return 'Espera unos minutos antes de intentar nuevamente.';
  }

  if (status >= 500) {
    return 'Nuestro equipo ha sido notificado. Por favor, intenta más tarde.';
  }

  return null;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error?.isNetworkError || !error?.response) {
    return true;
  }

  const status = error?.status || error?.response?.status;

  // 5xx errors are retryable (except 501, 505)
  if (status >= 500 && status !== 501 && status !== 505) {
    return true;
  }

  // 429 (rate limit) is retryable
  if (status === 429) {
    return true;
  }

  // 408 (timeout) is retryable
  if (status === 408) {
    return true;
  }

  // 4xx errors (except 429, 408) are not retryable
  if (status >= 400 && status < 500) {
    return false;
  }

  return false;
}


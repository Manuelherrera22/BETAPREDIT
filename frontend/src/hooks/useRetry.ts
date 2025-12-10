/**
 * useRetry Hook
 * Provides automatic retry logic for failed operations
 */

import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

export function useRetry(options: UseRetryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setIsRetrying(attempt > 0);
          setRetryCount(attempt);
          
          if (attempt > 0) {
            onRetry?.(attempt);
            // Exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
            );
          }
          
          const result = await fn();
          setRetryCount(0);
          setIsRetrying(false);
          return result;
        } catch (error) {
          lastError = error as Error;
          
          // Si es el último intento, notificar
          if (attempt === maxRetries) {
            setIsRetrying(false);
            onMaxRetriesReached?.();
            throw lastError;
          }
        }
      }
      
      throw lastError || new Error('Retry failed');
    },
    [maxRetries, retryDelay, onRetry, onMaxRetriesReached]
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    reset,
  };
}


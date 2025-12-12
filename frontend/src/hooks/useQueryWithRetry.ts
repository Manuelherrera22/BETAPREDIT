/**
 * useQueryWithRetry Hook
 * React Query hook with automatic retry logic for retryable errors
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { isRetryableError } from '../utils/errorMessages';

interface UseQueryWithRetryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'retry'> {
  showErrorToast?: boolean;
  errorToastMessage?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * React Query hook with intelligent retry logic
 * Only retries on retryable errors (network, 5xx, timeouts)
 */
export function useQueryWithRetry<TData = unknown, TError = Error>(
  options: UseQueryWithRetryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    showErrorToast = true,
    errorToastMessage,
    maxRetries = 3,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  return useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error: any) => {
      // Don't retry if max retries reached
      if (failureCount >= maxRetries) {
        return false;
      }

      // Only retry retryable errors
      if (isRetryableError(error)) {
        return true;
      }

      // Don't retry non-retryable errors
      return false;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      return Math.min(retryDelay * Math.pow(2, attemptIndex), 30000); // Max 30s
    },
    // Note: onError is deprecated in React Query v5, errors should be handled in components
    // Using throwOnError: false to handle errors manually
    throwOnError: false,
  });
}


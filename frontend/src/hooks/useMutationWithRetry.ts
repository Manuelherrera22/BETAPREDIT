/**
 * useMutationWithRetry Hook
 * React Query mutation with automatic retry logic for retryable errors
 */

import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { isRetryableError, getUserFriendlyMessage, getErrorSuggestion } from '../utils/errorMessages';
import toast from 'react-hot-toast';

interface UseMutationWithRetryOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'retry'> {
  showErrorToast?: boolean;
  errorToastMessage?: string;
  maxRetries?: number;
  retryDelay?: number;
  showSuccessToast?: boolean;
  successToastMessage?: string;
}

/**
 * React Query mutation with intelligent retry logic
 * Only retries on retryable errors (network, 5xx, timeouts)
 */
export function useMutationWithRetry<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationWithRetryOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    showErrorToast = true,
    errorToastMessage,
    showSuccessToast = false,
    successToastMessage,
    maxRetries = 2, // Mutations typically retry less than queries
    retryDelay = 1000,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
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
      // Exponential backoff: 1s, 2s, 4s...
      return Math.min(retryDelay * Math.pow(2, attemptIndex), 10000); // Max 10s for mutations
    },
    onError: (error: TError, variables: TVariables, context: TContext | undefined) => {
      // Call original onError if provided
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }

      // Show error toast if enabled
      if (showErrorToast) {
        const message = errorToastMessage || getUserFriendlyMessage(error as any);
        const suggestion = getErrorSuggestion(error as any);
        
        toast.error(
          <div>
            <div className="font-semibold">{message}</div>
            {suggestion && <div className="text-sm opacity-90 mt-1">{suggestion}</div>}
          </div>,
          { duration: 5000 }
        );
      }
    },
    onSuccess: (data: TData, variables: TVariables, context: TContext | undefined) => {
      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }

      // Show success toast if enabled
      if (showSuccessToast && successToastMessage) {
        toast.success(successToastMessage);
      }
    },
  });
}


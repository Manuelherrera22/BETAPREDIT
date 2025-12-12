/**
 * Error Display Component
 * Displays user-friendly error messages with suggestions and retry options
 */

import { getUserFriendlyMessage, getErrorSuggestion, isRetryableError } from '../utils/errorMessages';
import Icon from './icons/IconSystem';

interface ErrorDisplayProps {
  error: any;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ErrorDisplay({
  error,
  title,
  onRetry,
  retryLabel = 'Intentar de nuevo',
  className = '',
  showIcon = true,
  size = 'md',
}: ErrorDisplayProps) {
  const message = getUserFriendlyMessage(error);
  const suggestion = getErrorSuggestion(error);
  const canRetry = isRetryableError(error) && onRetry;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div
      className={`bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-5 md:p-6 ${className}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {showIcon && (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <Icon name="alert" size={iconSizes[size]} className="text-red-400" strokeWidth={2} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-bold text-red-300 mb-2 ${sizeClasses[size]}`}>
              {title}
            </h3>
          )}
          <p className={`text-red-200 mb-2 ${sizeClasses[size]}`}>
            {message}
          </p>
          {suggestion && (
            <p className={`text-red-300/80 mb-3 ${sizeClasses[size === 'lg' ? 'md' : 'sm']}`}>
              💡 {suggestion}
            </p>
          )}
          {canRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-200 text-sm font-semibold transition-colors"
            >
              <Icon name="refresh-cw" size={16} />
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Error Display (smaller, for forms)
 */
export function InlineError({ error, className = '' }: { error: any; className?: string }) {
  const message = getUserFriendlyMessage(error);
  
  return (
    <div className={`flex items-center gap-2 text-red-400 text-sm mt-1 ${className}`}>
      <Icon name="alert" size={14} />
      <span>{message}</span>
    </div>
  );
}

/**
 * Empty State with Error
 */
export function ErrorEmptyState({
  error,
  title = 'Error al cargar',
  onRetry,
  icon = 'alert',
}: {
  error: any;
  title?: string;
  onRetry?: () => void;
  icon?: string;
}) {
  const message = getUserFriendlyMessage(error);
  const suggestion = getErrorSuggestion(error);
  const canRetry = isRetryableError(error) && onRetry;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
        <Icon name={icon as any} size={32} className="text-red-400" strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-3 max-w-md">{message}</p>
      {suggestion && (
        <p className="text-sm text-gray-500 mb-4 max-w-md">💡 {suggestion}</p>
      )}
      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/40 rounded-lg text-primary-200 font-semibold transition-colors"
        >
          <Icon name="refresh-cw" size={18} />
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

/**
 * EmptyState Component
 * Reusable component for displaying empty states with helpful messages
 */

import { Link } from 'react-router-dom';
import Icon, { type IconName } from './icons/IconSystem';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
  actionOnClick?: () => void;
  className?: string;
}

export default function EmptyState({
  icon = 'info',
  title,
  message,
  actionLabel,
  actionTo,
  actionOnClick,
  className = '',
}: EmptyStateProps) {
  const actionContent = actionLabel && (
    actionTo ? (
      <Link
        to={actionTo}
        className="mt-4 inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
      >
        {actionLabel}
      </Link>
    ) : actionOnClick ? (
      <button
        onClick={actionOnClick}
        className="mt-4 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
      >
        {actionLabel}
      </button>
    ) : null
  );

  return (
    <div className={`bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 sm:p-12 border border-primary-500/20 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-500/20 rounded-full flex items-center justify-center">
          <Icon name={icon} size={32} className="text-primary-400" strokeWidth={2} />
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">{message}</p>
      {actionContent}
    </div>
  );
}


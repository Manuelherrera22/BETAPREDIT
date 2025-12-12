/**
 * Skeleton Loader Component
 * Shows loading placeholders instead of spinners
 */

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'list' | 'text' | 'circle';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ 
  type = 'card', 
  count = 1,
  className = '' 
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-dark-800 rounded-xl p-6 border border-primary-500/20 animate-pulse">
            <div className="h-6 bg-dark-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-dark-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-dark-700 rounded w-5/6"></div>
          </div>
        );
      
      case 'table':
        return (
          <div className="bg-dark-800 rounded-xl border border-primary-500/20 animate-pulse">
            <div className="p-4 border-b border-dark-700">
              <div className="h-4 bg-dark-700 rounded w-1/4"></div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-dark-700">
                <div className="h-4 bg-dark-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-dark-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="bg-dark-800 rounded-lg p-4 border border-primary-500/20 animate-pulse">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-dark-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-dark-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-dark-700 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-dark-700 rounded w-4/6"></div>
          </div>
        );
      
      case 'circle':
        return (
          <div className="w-16 h-16 bg-dark-700 rounded-full animate-pulse"></div>
        );
      
      default:
        return null;
    }
  };

  if (count > 1 && type !== 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  return <div className={className}>{renderSkeleton()}</div>;
}






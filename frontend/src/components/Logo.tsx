interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showIcon = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', iconContainer: 'w-8 h-8' },
    md: { icon: 'w-7 h-7', text: 'text-2xl', iconContainer: 'w-10 h-10' },
    lg: { icon: 'w-10 h-10', text: 'text-4xl', iconContainer: 'w-14 h-14' },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showIcon && (
        <div className={`${currentSize.iconContainer} rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30`}>
          <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
      )}
      <span className={`${currentSize.text} font-black text-white tracking-tight relative`}>
        <span className="absolute inset-0 bg-gradient-to-r from-primary-400 via-accent-500 to-gold-400 bg-clip-text text-transparent blur-sm opacity-40"></span>
        <span className="relative bg-gradient-to-r from-primary-200 via-accent-300 to-gold-200 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          BETAPREDIT
        </span>
      </span>
    </div>
  );
}


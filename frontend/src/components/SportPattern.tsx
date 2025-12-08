export default function SportPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      ></div>

      {/* Field lines pattern - more sophisticated */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
        <defs>
          <pattern id="field-lines" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            {/* Center line */}
            <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="1.5" />
            {/* Center circle */}
            <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Penalty areas */}
            <rect x="0" y="60" width="30" height="80" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="170" y="60" width="30" height="80" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#field-lines)" className="text-primary-500" />
      </svg>

      {/* Gradient orbs for depth */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-600/20 via-transparent to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-accent-600/20 via-transparent to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-gold-600/10 via-transparent to-transparent rounded-full blur-3xl"></div>

      {/* Animated data points with glow */}
      <div className="absolute top-20 left-10">
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse shadow-lg shadow-primary-500/50"></div>
        <div className="absolute top-0 left-0 w-3 h-3 bg-primary-500 rounded-full animate-ping opacity-75"></div>
      </div>
      <div className="absolute top-40 right-20">
        <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse shadow-lg shadow-accent-500/50" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-0 left-0 w-3 h-3 bg-accent-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
      </div>
      <div className="absolute bottom-32 left-1/4">
        <div className="w-3 h-3 bg-gold-500 rounded-full animate-pulse shadow-lg shadow-gold-500/50" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-0 left-0 w-3 h-3 bg-gold-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="absolute bottom-20 right-1/3">
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse shadow-lg shadow-primary-500/50" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-0 left-0 w-3 h-3 bg-primary-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
      </div>
      <div className="absolute top-1/3 right-1/4">
        <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse shadow-lg shadow-accent-400/50" style={{ animationDelay: '0.3s' }}></div>
      </div>
      <div className="absolute bottom-1/3 left-1/3">
        <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse shadow-lg shadow-gold-400/50" style={{ animationDelay: '0.7s' }}></div>
      </div>

      {/* Subtle scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent animate-pulse-slow"></div>
    </div>
  );
}


interface SportIconProps {
  sport: 'football' | 'basketball' | 'tennis' | 'all';
  className?: string;
}

export default function SportIcon({ sport, className = '' }: SportIconProps) {
  const icons = {
    football: (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
    basketball: (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2 L12 22 M2 12 L22 12" stroke="currentColor" strokeWidth="2"/>
        <path d="M6.34 6.34 L17.66 17.66 M17.66 6.34 L6.34 17.66" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    tennis: (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <ellipse cx="12" cy="12" rx="8" ry="10" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M4 12 L20 12" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    all: (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="8" cy="16" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
  };

  return icons[sport] || icons.all;
}


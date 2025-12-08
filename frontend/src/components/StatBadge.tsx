interface StatBadgeProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export default function StatBadge({ value, label, icon }: StatBadgeProps) {
  return (
    <div className="text-center group">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-500/25 via-accent-500/15 to-gold-500/25 border-2 border-primary-400/30 mb-3 sm:mb-4 group-hover:scale-110 group-hover:border-primary-300/50 transition-all duration-300 shadow-lg shadow-primary-500/20">
        {icon && <div className="text-primary-300 text-xl sm:text-2xl md:text-3xl drop-shadow-lg">{icon}</div>}
      </div>
      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-primary-300 via-accent-400 to-gold-300 bg-clip-text text-transparent mb-1 sm:mb-2 drop-shadow-lg">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-300 font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}


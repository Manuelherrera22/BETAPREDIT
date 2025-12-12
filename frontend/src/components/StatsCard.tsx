import Icon, { type IconName } from './icons/IconSystem';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: IconName;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  gradient?: string;
}

export default function StatsCard({ title, value, change, icon, trend, subtitle, gradient }: StatsCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
      ? 'text-red-400'
      : 'text-gray-400';

  const iconBgColor = gradient || 'from-primary-500/20 to-accent-500/20';
  const borderColor = trend === 'up' 
    ? 'border-emerald-500/30 hover:border-emerald-500/50' 
    : trend === 'down'
    ? 'border-red-500/30 hover:border-red-500/50'
    : 'border-primary-500/20 hover:border-primary-400/40';

  return (
    <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border ${borderColor} transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/20 hover:scale-[1.02] backdrop-blur-sm group`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm text-gray-400 font-semibold mb-1 sm:mb-2 uppercase tracking-wide line-clamp-1">{title}</div>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent break-words">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1 font-medium line-clamp-1">{subtitle}</div>
          )}
        </div>
        {icon && (
          <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${iconBgColor} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 ml-2 sm:ml-3 flex-shrink-0 opacity-80 group-hover:opacity-100`}>
            <Icon name={icon} size={14} className="sm:w-4 sm:h-4 text-white/90" strokeWidth={2} />
          </div>
        )}
      </div>
      {change && (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold ${trendColor} pt-2 border-t border-slate-700/50`}>
          {trend === 'up' && <Icon name="trending-up" size={14} className="sm:w-4 sm:h-4" />}
          {trend === 'down' && <Icon name="trending-down" size={14} className="sm:w-4 sm:h-4" />}
          <span className="line-clamp-1">{change}</span>
        </div>
      )}
    </div>
  );
}


interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export default function StatsCard({ title, value, change, icon, trend, subtitle }: StatsCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-accent-400'
      : trend === 'down'
      ? 'text-red-400'
      : 'text-gray-400';

  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-400/40 transition-all hover:shadow-xl hover:shadow-primary-500/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-gray-400 font-semibold mb-1">{title}</div>
          <div className="text-3xl font-black text-white">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className={`text-sm font-semibold ${trendColor}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {change}
        </div>
      )}
    </div>
  );
}


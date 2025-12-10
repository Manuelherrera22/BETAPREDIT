/**
 * Prediction Stats Dashboard
 * Beautiful, fully responsive statistics dashboard for predictions
 * Perfect on mobile, tablet, and desktop
 */

interface PredictionStatsDashboardProps {
  totalEvents: number;
  totalPredictions: number;
  avgConfidence: number;
  highValueCount: number;
  strongBuyCount: number;
}

export default function PredictionStatsDashboard({
  totalEvents,
  totalPredictions,
  avgConfidence,
  highValueCount,
  strongBuyCount,
}: PredictionStatsDashboardProps) {
  const stats = [
    {
      label: 'Eventos',
      value: totalEvents,
      icon: '📅',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      gradient: 'from-blue-500/20 to-blue-600/20',
    },
    {
      label: 'Predicciones',
      value: totalPredictions,
      icon: '🎯',
      color: 'text-primary-400',
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/30',
      gradient: 'from-primary-500/20 to-primary-600/20',
    },
    {
      label: 'Confianza Promedio',
      value: `${(avgConfidence * 100).toFixed(1)}%`,
      icon: '📊',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-500/20 to-emerald-600/20',
    },
    {
      label: 'Alto Valor',
      value: highValueCount,
      icon: '💎',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      gradient: 'from-amber-500/20 to-amber-600/20',
    },
    {
      label: 'Compra Fuerte',
      value: strongBuyCount,
      icon: '🔥',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      gradient: 'from-red-500/20 to-red-600/20',
    },
  ];

  return (
    <div className="w-full">
      {/* Mobile: Stack vertically with larger cards */}
      <div className="grid grid-cols-1 sm:hidden gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.gradient} ${stat.border} border-2 rounded-xl p-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-1">{stat.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet: 2 columns */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.gradient} ${stat.border} border-2 rounded-xl p-4 hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg`}
          >
            <div className="flex flex-col items-center justify-center text-center mb-2">
              <span className="text-3xl mb-2">{stat.icon}</span>
              <div className={`text-3xl font-black ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-tight">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: 5 columns horizontal */}
      <div className="hidden md:grid grid-cols-5 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.gradient} ${stat.border} border-2 rounded-xl p-4 lg:p-5 hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl lg:text-4xl mb-3">{stat.icon}</span>
              <div className={`text-2xl lg:text-3xl font-black ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-xs lg:text-sm text-gray-400 font-medium uppercase tracking-wide leading-tight">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

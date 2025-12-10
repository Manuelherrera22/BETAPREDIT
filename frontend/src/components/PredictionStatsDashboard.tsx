/**
 * Prediction Stats Dashboard
 * Beautiful statistics dashboard for predictions
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
    },
    {
      label: 'Predicciones',
      value: totalPredictions,
      icon: '🎯',
      color: 'text-primary-400',
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/30',
    },
    {
      label: 'Confianza Promedio',
      value: `${(avgConfidence * 100).toFixed(1)}%`,
      icon: '📊',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    },
    {
      label: 'Alto Valor',
      value: highValueCount,
      icon: '💎',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    {
      label: 'Compra Fuerte',
      value: strongBuyCount,
      icon: '🔥',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bg} ${stat.border} border-2 rounded-xl p-4 hover:scale-105 transition-all duration-200 cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}


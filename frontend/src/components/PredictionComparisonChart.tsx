/**
 * Prediction Comparison Chart
 * Visual comparison between our prediction and market odds
 */

interface PredictionComparisonChartProps {
  ourPrediction: number; // 0-1
  marketProbability: number; // 0-1
  selection: string;
}

export default function PredictionComparisonChart({ ourPrediction, marketProbability, selection }: PredictionComparisonChartProps) {
  const ourPercent = ourPrediction * 100;
  const marketPercent = marketProbability * 100;
  const difference = ourPercent - marketPercent;

  return (
    <div className="space-y-4">
      {/* Comparison Bars */}
      <div className="space-y-3">
        {/* Our Prediction */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary-400">Nuestra Predicción</span>
            <span className="text-lg font-black text-primary-400">{ourPercent.toFixed(1)}%</span>
          </div>
          <div className="relative w-full bg-slate-800/50 rounded-full h-4 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 rounded-full transition-all duration-700 shadow-lg shadow-primary-500/50"
              style={{ width: `${ourPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">{ourPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Market Probability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-400">Mercado (Implícita)</span>
            <span className="text-lg font-semibold text-gray-300">{marketPercent.toFixed(1)}%</span>
          </div>
          <div className="relative w-full bg-slate-800/50 rounded-full h-4 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full transition-all duration-700"
              style={{ width: `${marketPercent}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">{marketPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Difference Indicator */}
      {Math.abs(difference) > 0.5 && (
        <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${difference > 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <span className={`text-sm font-bold ${difference > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {difference > 0 ? '↑' : '↓'} {Math.abs(difference).toFixed(1)}% {difference > 0 ? 'más alta' : 'más baja'} que el mercado
          </span>
        </div>
      )}

      {/* Value Indicator */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-gray-500 mb-1">Diferencia</div>
          <div className={`text-lg font-black ${difference > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {difference >= 0 ? '+' : ''}{difference.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
          <div className="text-xs text-gray-500 mb-1">Ventaja</div>
          <div className={`text-lg font-black ${difference > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {difference > 0 ? 'Sí' : 'No'}
          </div>
        </div>
      </div>
    </div>
  );
}


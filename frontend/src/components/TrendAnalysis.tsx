/**
 * Trend Analysis Component
 * Shows trends and predictions
 */

interface TrendData {
  period: string;
  roi: number;
  winRate: number;
  betCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendAnalysisProps {
  data: TrendData[];
  currentRoi: number;
  currentWinRate: number;
}

export default function TrendAnalysis({ data, currentRoi, currentWinRate }: TrendAnalysisProps) {
  // Calculate trend
  const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3);
    const older = values.slice(0, -3);
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const roiValues = data.map(d => d.roi);
  const winRateValues = data.map(d => d.winRate);
  const roiTrend = calculateTrend(roiValues);
  const winRateTrend = calculateTrend(winRateValues);

  // Predictions
  const predictNextRoi = () => {
    if (roiValues.length < 2) return currentRoi;
    const recent = roiValues.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const trend = roiTrend === 'up' ? 1.5 : roiTrend === 'down' ? -1.5 : 0;
    return Math.max(0, avg + trend);
  };

  const predictNextWinRate = () => {
    if (winRateValues.length < 2) return currentWinRate;
    const recent = winRateValues.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const trend = winRateTrend === 'up' ? 2 : winRateTrend === 'down' ? -2 : 0;
    return Math.max(0, Math.min(100, avg + trend));
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-primary-500/20">
      <h3 className="text-xl font-black text-white mb-6">Análisis de Tendencias</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* ROI Trend */}
        <div className="bg-dark-900 rounded-lg p-4 border border-primary-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">ROI</span>
            {getTrendIcon(roiTrend)}
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {currentRoi.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            Tendencia: {roiTrend === 'up' ? '↗ Subiendo' : roiTrend === 'down' ? '↘ Bajando' : '→ Estable'}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Predicción próximo período:</div>
            <div className="text-lg font-bold text-accent-400">
              {predictNextRoi().toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Win Rate Trend */}
        <div className="bg-dark-900 rounded-lg p-4 border border-primary-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Win Rate</span>
            {getTrendIcon(winRateTrend)}
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {currentWinRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            Tendencia: {winRateTrend === 'up' ? '↗ Subiendo' : winRateTrend === 'down' ? '↘ Bajando' : '→ Estable'}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Predicción próximo período:</div>
            <div className="text-lg font-bold text-accent-400">
              {predictNextWinRate().toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Evolución Histórica</h4>
        <div className="space-y-2">
          {data.slice(-6).map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-20 text-xs text-gray-500">{item.period}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-dark-900 rounded h-6 relative overflow-hidden">
                  <div
                    className={`h-full ${
                      item.roi >= 10 ? 'bg-green-500' :
                      item.roi >= 5 ? 'bg-yellow-500' :
                      item.roi >= 0 ? 'bg-yellow-600' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(item.roi) * 5)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                    {item.roi.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}






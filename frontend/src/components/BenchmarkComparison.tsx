/**
 * Benchmark Comparison Component
 * Compares user performance with platform average
 */

interface BenchmarkData {
  metric: string;
  userValue: number;
  averageValue: number | null;
  top10Value: number | null;
  unit?: string;
}

interface BenchmarkComparisonProps {
  data: BenchmarkData[];
}

export default function BenchmarkComparison({ data }: BenchmarkComparisonProps) {
  const getPercentage = (user: number, avg: number) => {
    if (avg === 0) return 0;
    return ((user - avg) / avg) * 100;
  };

  const getStatus = (percentage: number) => {
    if (percentage >= 20) return { color: 'text-green-400', icon: '↑↑', label: 'Excelente' };
    if (percentage >= 10) return { color: 'text-green-300', icon: '↑', label: 'Bueno' };
    if (percentage >= -10) return { color: 'text-yellow-400', icon: '→', label: 'Promedio' };
    if (percentage >= -20) return { color: 'text-orange-400', icon: '↓', label: 'Bajo' };
    return { color: 'text-red-400', icon: '↓↓', label: 'Muy Bajo' };
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-primary-500/20">
      <h3 className="text-xl font-black text-white mb-6">Comparación con Otros Usuarios</h3>
      
      <div className="space-y-4">
        {data.map((item, index) => {
          // Si no hay datos de comparación, mostrar solo el valor del usuario
          const hasComparison = item.averageValue !== null && item.averageValue !== undefined;
          const percentage = hasComparison ? getPercentage(item.userValue, item.averageValue!) : 0;
          const status = hasComparison ? getStatus(percentage) : { color: 'text-gray-400', icon: '—', label: 'Sin comparación' };
          const unit = item.unit || '';

          return (
            <div key={index} className="bg-dark-900 rounded-lg p-4 border border-primary-500/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-300">{item.metric}</span>
                {hasComparison && (
                  <span className={`text-sm font-bold ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                )}
                {!hasComparison && (
                  <span className="text-xs text-gray-500">Datos de comparación próximamente</span>
                )}
              </div>
              
              <div className="space-y-2">
                {/* User Value */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tu valor</span>
                  <span className="text-sm font-bold text-white">
                    {item.userValue.toFixed(1)}{unit}
                  </span>
                </div>
                
                {/* Average */}
                {hasComparison && item.averageValue !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Promedio plataforma</span>
                    <span className="text-sm text-gray-400">
                      {item.averageValue.toFixed(1)}{unit}
                    </span>
                  </div>
                )}
                
                {/* Top 10% */}
                {hasComparison && item.top10Value !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Top 10%</span>
                    <span className="text-sm text-accent-400">
                      {item.top10Value.toFixed(1)}{unit}
                    </span>
                  </div>
                )}
                
                {/* Progress Bar - Solo mostrar si hay comparación */}
                {hasComparison && item.top10Value !== null && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-dark-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, (item.userValue / item.top10Value!) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${status.color}`}>
                        {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


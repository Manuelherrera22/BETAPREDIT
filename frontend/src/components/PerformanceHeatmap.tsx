/**
 * Performance Heatmap Component
 * Shows performance by sport, time, and market type
 */

interface HeatmapData {
  sport: string;
  timeOfDay: string;
  dayOfWeek: string;
  roi: number;
  winRate: number;
  betCount: number;
}

interface PerformanceHeatmapProps {
  data: HeatmapData[];
}

export default function PerformanceHeatmap({ data }: PerformanceHeatmapProps) {
  // Validate data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const times = ['00-06', '06-12', '12-18', '18-24'];
  const sports = Array.from(new Set(safeData.map(d => d.sport)));

  const getColor = (value: number) => {
    if (value >= 15) return 'bg-green-500';
    if (value >= 10) return 'bg-green-400';
    if (value >= 5) return 'bg-yellow-400';
    if (value >= 0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getValue = (sport: string, day: string, time: string) => {
    const item = safeData.find(
      d => d.sport === sport && d.dayOfWeek === day && d.timeOfDay === time
    );
    return item?.roi || 0;
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-primary-500/20">
      <h3 className="text-xl font-black text-white mb-4">Heatmap de Rendimiento</h3>
      <div className="overflow-x-auto">
        <div className="space-y-4">
          {sports.length > 0 ? sports.map(sport => (
            <div key={sport} className="min-w-[600px]">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">{sport}</h4>
              <div className="grid grid-cols-8 gap-1">
                {/* Header */}
                <div className="text-xs text-gray-500 font-semibold"></div>
                {days.map(day => (
                  <div key={day} className="text-xs text-gray-500 font-semibold text-center">
                    {day}
                  </div>
                ))}
                
                {/* Rows */}
                {times.map(time => (
                  <>
                    <div key={`${time}-label`} className="text-xs text-gray-400 text-right pr-2">
                      {time}
                    </div>
                    {days.map(day => {
                      const value = getValue(sport, day, time);
                      return (
                        <div
                          key={`${sport}-${day}-${time}`}
                          className={`${getColor(value)} rounded text-xs text-white font-semibold p-2 text-center min-h-[40px] flex items-center justify-center`}
                          title={`ROI: ${value.toFixed(1)}%`}
                        >
                          {value !== 0 && `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-400">
              <p>No hay datos disponibles para el heatmap</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>ROI {'≥'} 15%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>ROI 5-15%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>ROI {'<'} 0%</span>
        </div>
      </div>
    </div>
  );
}


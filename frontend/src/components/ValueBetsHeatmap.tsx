import { useState } from 'react';

interface HeatmapData {
  sport: string;
  league: string;
  value: number;
  count: number;
}

interface ValueBetsHeatmapProps {
  data: HeatmapData[];
}

export default function ValueBetsHeatmap({ data }: ValueBetsHeatmapProps) {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const sports = Array.from(new Set(data.map(d => d.sport)));
  const filteredData = selectedSport === 'all' 
    ? data 
    : data.filter(d => d.sport === selectedSport);

  const maxValue = Math.max(...filteredData.map(d => d.value));

  const getIntensity = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-gold-500';
    if (percentage >= 60) return 'bg-accent-500';
    if (percentage >= 40) return 'bg-primary-500';
    if (percentage >= 20) return 'bg-primary-600';
    return 'bg-primary-700';
  };

  const getOpacity = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'opacity-100';
    if (percentage >= 60) return 'opacity-90';
    if (percentage >= 40) return 'opacity-75';
    if (percentage >= 20) return 'opacity-60';
    return 'opacity-50';
  };

  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-white mb-2">Heatmap de Value Bets</h3>
          <p className="text-sm text-gray-400">Distribución de oportunidades por deporte y liga</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedSport === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
            }`}
          >
            Todos
          </button>
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedSport === sport
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item, index) => {
          const cellId = `${item.sport}-${item.league}`;
          const isHovered = hoveredCell === cellId;
          
          return (
            <div
              key={index}
              className={`relative rounded-lg p-4 border-2 transition-all cursor-pointer group ${
                isHovered
                  ? 'border-gold-400 scale-105 shadow-xl shadow-gold-500/30'
                  : 'border-primary-500/30 hover:border-primary-400/50'
              }`}
              style={{
                background: `linear-gradient(135deg, ${getIntensity(item.value, maxValue)} ${getOpacity(item.value, maxValue)}, transparent)`,
              }}
              onMouseEnter={() => setHoveredCell(cellId)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{item.sport}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.value >= 10 ? 'bg-gold-500/30 text-gold-400' :
                    item.value >= 5 ? 'bg-accent-500/30 text-accent-400' :
                    'bg-primary-500/30 text-primary-400'
                  }`}>
                    +{item.value.toFixed(1)}%
                  </span>
                </div>
                <h4 className="text-white font-black text-lg mb-1">{item.league}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>{item.count} value bets</span>
                  <span className="text-gray-500">•</span>
                  <span>Promedio: +{item.value.toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Glow effect on hover */}
              {isHovered && (
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-accent-500/20 rounded-lg animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-primary-500/20">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="font-semibold">Intensidad:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary-700 rounded"></div>
            <span>Bajo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary-500 rounded"></div>
            <span>Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-500 rounded"></div>
            <span>Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gold-500 rounded"></div>
            <span>Muy Alto</span>
          </div>
        </div>
      </div>
    </div>
  );
}


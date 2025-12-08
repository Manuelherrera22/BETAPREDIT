import { useEffect, useState } from 'react';

interface SimpleChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
  animated?: boolean;
}

export default function SimpleChart({ data, color = 'primary', height = 200, animated = true }: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const [animatedHeights, setAnimatedHeights] = useState<number[]>(new Array(data.length).fill(0));
  
  const colorClasses = {
    primary: 'bg-gradient-to-t from-primary-600 to-primary-400',
    accent: 'bg-gradient-to-t from-accent-600 to-accent-400',
    gold: 'bg-gradient-to-t from-gold-600 to-gold-400',
  };

  const glowClasses = {
    primary: 'shadow-lg shadow-primary-500/50',
    accent: 'shadow-lg shadow-accent-500/50',
    gold: 'shadow-lg shadow-gold-500/50',
  };

  useEffect(() => {
    if (animated) {
      // Animar las barras una por una
      data.forEach((item, index) => {
        setTimeout(() => {
          const barHeight = (item.value / maxValue) * 100;
          setAnimatedHeights(prev => {
            const newHeights = [...prev];
            newHeights[index] = barHeight;
            return newHeights;
          });
        }, index * 100);
      });
    } else {
      // Sin animación, establecer alturas directamente
      setAnimatedHeights(data.map(item => (item.value / maxValue) * 100));
    }
  }, [data, maxValue, animated]);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = animatedHeights[index] || 0;
          return (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                <div
                  className={`w-full ${colorClasses[color as keyof typeof colorClasses]} ${glowClasses[color as keyof typeof glowClasses]} rounded-t-lg transition-all duration-500 ease-out hover:opacity-90 hover:scale-105 relative overflow-hidden`}
                  style={{ 
                    height: `${barHeight}%`,
                    transitionDelay: `${index * 50}ms`
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                {/* Value label on hover */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-900 px-2 py-1 rounded text-xs text-white font-bold whitespace-nowrap z-10 border border-primary-500/30">
                  {item.value}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400 text-center truncate w-full group-hover:text-white transition-colors">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


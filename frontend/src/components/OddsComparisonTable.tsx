import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OddsComparisonTableProps {
  event: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    sport: string;
  };
  odds: Array<{
    platform: string;
    home: number;
    draw?: number;
    away: number;
    value?: number;
    lastUpdated: string;
  }>;
}

export default function OddsComparisonTable({ event, odds }: OddsComparisonTableProps) {
  // Find best odds for each outcome
  const bestHome = Math.max(...odds.map(o => o.home));
  const bestDraw = odds[0]?.draw ? Math.max(...odds.filter(o => o.draw).map(o => o.draw!)) : null;
  const bestAway = Math.max(...odds.map(o => o.away));

  // Estado para resaltar cambios recientes
  const [updatedOdds, setUpdatedOdds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Marcar todas las cuotas como actualizadas
    const allIds = odds.map((_, i) => i.toString());
    setUpdatedOdds(new Set(allIds));
    
    // Remover el resaltado después de 2 segundos
    const timeout = setTimeout(() => {
      setUpdatedOdds(new Set());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [odds]);

  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-6 border border-primary-500/20 shadow-xl">
      <div className="mb-6">
        <h3 className="text-2xl font-black text-white mb-2">
          Comparador de Cuotas
        </h3>
        <p className="text-gray-400 text-sm">
          {event.homeTeam} vs {event.awayTeam} - {event.sport}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-500/20">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Plataforma
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                1 (Local)
              </th>
              {bestDraw && (
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  X (Empate)
                </th>
              )}
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                2 (Visitante)
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {odds.map((odd, index) => {
              const isUpdated = updatedOdds.has(index.toString());
              return (
                <tr
                  key={index}
                  className={`border-b border-primary-500/10 hover:bg-primary-500/5 transition-all ${
                    isUpdated ? 'bg-accent-500/10 animate-pulse-slow' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                      <span className="text-white font-semibold">{odd.platform}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDistanceToNow(new Date(odd.lastUpdated), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`font-black text-lg transition-all ${
                        odd.home === bestHome
                          ? 'text-gold-400 bg-gold-500/20 px-3 py-1 rounded-lg'
                          : 'text-gray-300'
                      } ${isUpdated ? 'scale-110' : ''}`}
                    >
                      {odd.home.toFixed(2)}
                    </span>
                    {odd.home === bestHome && (
                      <span className="ml-2 text-xs text-gold-400">⭐ Mejor</span>
                    )}
                  </td>
                {bestDraw && (
                  <td className="py-4 px-4 text-center">
                    {odd.draw ? (
                      <>
                        <span
                          className={`font-black text-lg transition-all ${
                            odd.draw === bestDraw
                              ? 'text-gold-400 bg-gold-500/20 px-3 py-1 rounded-lg'
                              : 'text-gray-300'
                          } ${isUpdated ? 'scale-110' : ''}`}
                        >
                          {odd.draw.toFixed(2)}
                        </span>
                        {odd.draw === bestDraw && (
                          <span className="ml-2 text-xs text-gold-400">⭐</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                )}
                <td className="py-4 px-4 text-center">
                  <span
                    className={`font-black text-lg transition-all ${
                      odd.away === bestAway
                        ? 'text-gold-400 bg-gold-500/20 px-3 py-1 rounded-lg'
                        : 'text-gray-300'
                    } ${isUpdated ? 'scale-110' : ''}`}
                  >
                    {odd.away.toFixed(2)}
                  </span>
                  {odd.away === bestAway && (
                    <span className="ml-2 text-xs text-gold-400">⭐ Mejor</span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  {odd.value ? (
                    <span
                      className={`font-bold px-3 py-1 rounded-lg transition-all ${
                        odd.value > 0
                          ? 'text-accent-400 bg-accent-500/20'
                          : 'text-gray-500 bg-gray-500/20'
                      } ${isUpdated && odd.value > 0 ? 'animate-pulse' : ''}`}
                    >
                      {odd.value > 0 ? '+' : ''}
                      {odd.value.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-6 border-t border-primary-500/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400 mb-1">Mejor Cuota Local</div>
            <div className="text-gold-400 font-black text-xl">{bestHome.toFixed(2)}</div>
          </div>
          {bestDraw && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Mejor Cuota Empate</div>
              <div className="text-gold-400 font-black text-xl">{bestDraw.toFixed(2)}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-400 mb-1">Mejor Cuota Visitante</div>
            <div className="text-gold-400 font-black text-xl">{bestAway.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


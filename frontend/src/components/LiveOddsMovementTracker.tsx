/**
 * Live Odds Movement Tracker Component
 * Muestra la evolución de cuotas en tiempo real con gráficos
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Icon from './icons/IconSystem';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OddsHistoryPoint {
  timestamp: string;
  decimal: number;
  change?: number;
  changePercent?: number;
}

interface LiveOddsMovementTrackerProps {
  eventId: string;
  marketId: string;
  selection: string;
  currentOdds: number;
  bookmaker?: string;
}

export default function LiveOddsMovementTracker({
  eventId,
  marketId,
  selection,
  currentOdds,
  bookmaker,
}: LiveOddsMovementTrackerProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');

  // Obtener historial de cuotas
  const { data: oddsHistory, isLoading } = useQuery({
    queryKey: ['oddsHistory', eventId, marketId, selection, timeRange],
    queryFn: async () => {
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
      const response = await api.get(`/odds/history/${eventId}`, {
        params: {
          marketId,
          selection,
          hours,
        },
      });
      return response.data.data || [];
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
    enabled: !!eventId && !!marketId && !!selection,
  });

  // Procesar datos para el gráfico
  const chartData = useMemo(() => {
    if (!oddsHistory || !Array.isArray(oddsHistory) || oddsHistory.length === 0) {
      return [];
    }

    const sorted = [...oddsHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sorted.map((point: OddsHistoryPoint, index: number) => {
      const prevPoint = index > 0 ? sorted[index - 1] : null;
      const change = prevPoint ? point.decimal - prevPoint.decimal : 0;
      const changePercent = prevPoint ? ((change / prevPoint.decimal) * 100) : 0;

      return {
        time: format(new Date(point.timestamp), 'HH:mm', { locale: es }),
        odds: point.decimal,
        change,
        changePercent,
        timestamp: point.timestamp,
      };
    });
  }, [oddsHistory]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        min: currentOdds,
        max: currentOdds,
        avg: currentOdds,
        change24h: 0,
        changePercent24h: 0,
        trend: 'stable' as const,
      };
    }

    const odds = chartData.map((d) => d.odds);
    const min = Math.min(...odds);
    const max = Math.max(...odds);
    const avg = odds.reduce((sum, o) => sum + o, 0) / odds.length;
    const first = chartData[0]?.odds || currentOdds;
    const last = chartData[chartData.length - 1]?.odds || currentOdds;
    const change24h = last - first;
    const changePercent24h = first > 0 ? (change24h / first) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent24h > 2) trend = 'up';
    else if (changePercent24h < -2) trend = 'down';

    return {
      min,
      max,
      avg,
      change24h,
      changePercent24h,
      trend,
    };
  }, [chartData, currentOdds]);

  // Detectar "smart money" (movimientos significativos)
  const smartMoneySignals = useMemo(() => {
    if (!chartData || chartData.length < 2) return [];

    const signals: Array<{ time: string; type: 'up' | 'down'; magnitude: number }> = [];
    
    for (let i = 1; i < chartData.length; i++) {
      const change = chartData[i].changePercent || 0;
      if (Math.abs(change) > 5) { // Movimiento >5% es significativo
        signals.push({
          time: chartData[i].time,
          type: change > 0 ? 'up' : 'down',
          magnitude: Math.abs(change),
        });
      }
    }

    return signals;
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-slate-800/70 rounded-xl p-6 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Evolución de Cuotas</h3>
          <p className="text-xs text-gray-400">
            {selection} {bookmaker && `• ${bookmaker}`}
          </p>
        </div>
        <div className="flex gap-2">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-gray-400 mb-1">Cuota Actual</div>
          <div className="text-xl font-black text-white">{currentOdds.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-gray-400 mb-1">Cambio 24h</div>
          <div className={`text-xl font-black ${
            stats.change24h > 0 ? 'text-green-400' : stats.change24h < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            ({stats.changePercent24h >= 0 ? '+' : ''}{stats.changePercent24h.toFixed(1)}%)
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-gray-400 mb-1">Mínimo</div>
          <div className="text-xl font-black text-red-400">{stats.min.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-gray-400 mb-1">Máximo</div>
          <div className="text-xl font-black text-green-400">{stats.max.toFixed(2)}</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className={`mb-4 p-3 rounded-lg border-2 ${
        stats.trend === 'up' 
          ? 'bg-green-500/20 border-green-500/50' 
          : stats.trend === 'down'
          ? 'bg-red-500/20 border-red-500/50'
          : 'bg-gray-500/20 border-gray-500/50'
      }`}>
        <div className="flex items-center gap-2">
          {stats.trend === 'up' && <Icon name="trending-up" size={20} className="text-green-400" />}
          {stats.trend === 'down' && <Icon name="trending-down" size={20} className="text-red-400" />}
          {stats.trend === 'stable' && <Icon name="activity" size={20} className="text-gray-400" />}
          <div>
            <div className="text-sm font-bold text-white">
              Tendencia: {stats.trend === 'up' ? 'Alcista' : stats.trend === 'down' ? 'Bajista' : 'Estable'}
            </div>
            <div className="text-xs text-gray-400">
              {stats.changePercent24h >= 0 ? '+' : ''}{stats.changePercent24h.toFixed(2)}% en las últimas 24h
            </div>
          </div>
        </div>
      </div>

      {/* Smart Money Signals */}
      {smartMoneySignals.length > 0 && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
          <div className="text-xs font-bold text-amber-300 mb-2">💰 Señales de Smart Money</div>
          <div className="space-y-1">
            {smartMoneySignals.slice(0, 3).map((signal, idx) => (
              <div key={idx} className="text-xs text-gray-300">
                {signal.time}: {signal.type === 'up' ? '📈' : '📉'} Movimiento de {signal.magnitude.toFixed(1)}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF" 
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'odds') return [value.toFixed(2), 'Cuota'];
                  if (name === 'changePercent') return [`${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, 'Cambio'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="odds"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 3 }}
                activeDot={{ r: 5 }}
                name="Cuota"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Icon name="chart" size={48} className="mx-auto mb-2 opacity-50" />
            <p>No hay datos históricos disponibles</p>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Actualización en tiempo real cada 30 segundos</span>
        </div>
      </div>
    </div>
  );
}

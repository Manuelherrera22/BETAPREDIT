/**
 * Odds History Chart Component
 * Shows odds changes over time for a specific selection
 */

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import SkeletonLoader from './SkeletonLoader';

interface OddsHistoryChartProps {
  eventId: string;
  marketId: string;
  selection: string;
}

export default function OddsHistoryChart({ eventId, marketId, selection }: OddsHistoryChartProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['oddsHistory', eventId, marketId, selection],
    queryFn: async () => {
      const { data } = await api.get(`/odds/history/${eventId}`, {
        params: { marketId, selection, limit: 100 },
      });
      return data.data || [];
    },
    enabled: !!eventId && !!marketId && !!selection,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10 text-center text-gray-400">
        No hay historial de cuotas disponible aún
      </div>
    );
  }

  // Format data for chart
  const chartData = history
    .map((h: any) => ({
      time: new Date(h.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      odds: h.decimal,
      probability: (1 / h.decimal) * 100,
      timestamp: new Date(h.timestamp).getTime(),
    }))
    .sort((a: any, b: any) => a.timestamp - b.timestamp);

  // Calculate change
  const firstOdds = chartData[0]?.odds || 0;
  const lastOdds = chartData[chartData.length - 1]?.odds || 0;
  const change = firstOdds > 0 ? ((lastOdds - firstOdds) / firstOdds) * 100 : 0;

  return (
    <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">Historial de Cuotas</h4>
          <p className="text-sm text-gray-400">{selection}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Cambio</div>
          <div
            className={`text-lg font-semibold ${
              change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-gray-400'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="odds"
            stroke="#3B82F6"
            fontSize={12}
            label={{ value: 'Cuotas', angle: -90, position: 'insideLeft', style: { fill: '#3B82F6' } }}
          />
          <YAxis
            yAxisId="probability"
            orientation="right"
            stroke="#10B981"
            fontSize={12}
            domain={[0, 100]}
            label={{ value: 'Probabilidad (%)', angle: 90, position: 'insideRight', style: { fill: '#10B981' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #3B82F6',
              borderRadius: '8px',
              color: '#F3F4F6',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'odds') {
                return [value.toFixed(2), 'Cuota'];
              }
              if (name === 'probability') {
                return [`${value.toFixed(1)}%`, 'Probabilidad'];
              }
              return [value, name];
            }}
          />
          <Legend />
          <Line
            yAxisId="odds"
            type="monotone"
            dataKey="odds"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Cuota"
            dot={{ fill: '#3B82F6', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="probability"
            type="monotone"
            dataKey="probability"
            stroke="#10B981"
            strokeWidth={2}
            name="Probabilidad"
            dot={{ fill: '#10B981', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Cuota Inicial</div>
          <div className="text-white font-semibold">{firstOdds.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Cuota Actual</div>
          <div className="text-white font-semibold">{lastOdds.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Puntos de Datos</div>
          <div className="text-white font-semibold">{chartData.length}</div>
        </div>
      </div>
    </div>
  );
}


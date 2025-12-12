/**
 * ROI Tracking Dashboard Component
 * Muestra el ROI real del usuario y comparaciones
 */

import { useQuery } from '@tanstack/react-query';
import { roiTrackingService } from '../services/roiTrackingService';
import { useState } from 'react';
import SimpleChart from './SimpleChart';

export default function ROITrackingDashboard() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all_time'>('all_time');

  // Obtener datos de ROI tracking
  const { data: tracking, isLoading } = useQuery({
    queryKey: ['roiTracking', period],
    queryFn: () => roiTrackingService.getROITracking(period),
    refetchInterval: 60000, // Actualizar cada minuto
  });

  // Obtener historial para gráfico
  const { data: history = [] } = useQuery({
    queryKey: ['roiHistory', period],
    queryFn: () => roiTrackingService.getROIHistory(period === 'all_time' ? 'month' : period),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 text-center">
        <p className="text-gray-400">No hay datos de ROI disponibles todavía</p>
        <p className="text-sm text-gray-500 mt-2">
          Registra y resuelve algunas apuestas para ver tu ROI
        </p>
      </div>
    );
  }

  const chartData = history.length > 0 
    ? history.map((point) => ({
        label: new Date(point.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        value: point.roi,
      }))
    : [];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* ROI Principal - Espectacular */}
      <div className={`bg-gradient-to-br rounded-xl p-4 sm:p-6 md:p-8 border-2 relative overflow-hidden ${
        tracking.totalROI >= 0
          ? 'from-green-500/20 to-green-600/20 border-green-500/40'
          : 'from-red-500/20 to-red-600/20 border-red-500/40'
      }`}>
        {/* Efecto de brillo animado */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          style={{
            animation: 'shimmer 3s infinite',
          }}
        ></div>
        
        <div className="text-center relative z-10">
          <p className="text-xs sm:text-sm text-gray-300 mb-2">ROI Total desde que usas BETAPREDIT</p>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 animate-pulse ${
            tracking.totalROI >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {tracking.totalROI >= 0 ? '+' : ''}{tracking.totalROI.toFixed(2)}%
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">
            {tracking.netProfit >= 0 ? '+' : ''}€{Math.abs(tracking.netProfit).toFixed(2)} de ganancia neta
          </p>
          {tracking.totalBets > 0 && (
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <span className="text-gray-400">
                {tracking.totalBets} apuestas
              </span>
              <span className="text-gray-500 hidden sm:inline">•</span>
              <span className="text-green-400">
                {tracking.totalWins} ganadas
              </span>
              <span className="text-gray-500 hidden sm:inline">•</span>
              <span className="text-gray-400">
                {((tracking.totalWins / tracking.totalBets) * 100).toFixed(1)}% win rate
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparación Antes/Después */}
      {tracking.comparison && (
        <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/40">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-white mb-3 sm:mb-4">Comparación</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Sin BETAPREDIT</p>
              <p className="text-xl sm:text-2xl font-black text-gray-300">
                {tracking.comparison.before !== null 
                  ? `${tracking.comparison.before >= 0 ? '+' : ''}${tracking.comparison.before.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Con BETAPREDIT</p>
              <p className="text-xl sm:text-2xl font-black text-green-400">
                {tracking.comparison.after >= 0 ? '+' : ''}{tracking.comparison.after.toFixed(1)}%
              </p>
            </div>
          </div>
          {tracking.comparison.improvement > 0 && (
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm text-gray-300">
                Mejora: <span className="font-bold text-green-400">+{tracking.comparison.improvement.toFixed(1)} puntos porcentuales</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas Detalladas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/20">
          <p className="text-xs sm:text-sm text-gray-400 mb-2">Total Apostado</p>
          <p className="text-xl sm:text-2xl font-black text-white">€{tracking.totalStaked.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{tracking.totalBets} apuestas</p>
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/20">
          <p className="text-xs sm:text-sm text-gray-400 mb-2">Total Ganado</p>
          <p className="text-xl sm:text-2xl font-black text-green-400">€{tracking.totalWon.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{tracking.totalWins} ganadas</p>
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/20">
          <p className="text-xs sm:text-sm text-gray-400 mb-2">Win Rate</p>
          <p className="text-xl sm:text-2xl font-black text-white">{tracking.totalBets > 0 
            ? ((tracking.totalWins / tracking.totalBets) * 100).toFixed(1)
            : 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{tracking.totalWins} de {tracking.totalBets}</p>
        </div>
      </div>

      {/* Value Bets Metrics */}
      {tracking.valueBetsMetrics.taken > 0 && (
        <div className="bg-gradient-to-br from-gold-500/20 to-accent-500/20 rounded-xl p-4 sm:p-5 md:p-6 border border-gold-500/40">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-white mb-3 sm:mb-4">Value Bets</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Tomados</p>
              <p className="text-xl sm:text-2xl font-black text-white">{tracking.valueBetsMetrics.taken}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Ganados</p>
              <p className="text-xl sm:text-2xl font-black text-green-400">{tracking.valueBetsMetrics.won}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Win Rate</p>
              <p className="text-xl sm:text-2xl font-black text-white">{tracking.valueBetsMetrics.winRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">ROI</p>
              <p className={`text-xl sm:text-2xl font-black ${
                tracking.valueBetsMetrics.roi >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {tracking.valueBetsMetrics.roi >= 0 ? '+' : ''}{tracking.valueBetsMetrics.roi.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gold-500/20">
            <p className="text-xs sm:text-sm text-gray-300">
              Ganancia de Value Bets: <span className="font-bold text-gold-400">
                {tracking.valueBetsMetrics.netProfit >= 0 ? '+' : ''}€{Math.abs(tracking.valueBetsMetrics.netProfit).toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de Evolución */}
      {chartData.length > 0 && (
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-black text-white">Evolución de ROI</h3>
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'year', 'all_time'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    period === p
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : p === 'year' ? 'Año' : 'Todo'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 sm:h-56 md:h-64">
            <SimpleChart data={chartData} color="primary" height={200} />
          </div>
        </div>
      )}

      {/* Comparación Value Bets vs Normal Bets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/20">
          <h3 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">Value Bets</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-400">ROI</span>
              <span className={`text-sm sm:text-base font-bold ${
                tracking.valueBetsROI >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {tracking.valueBetsROI >= 0 ? '+' : ''}{tracking.valueBetsROI.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-400">Apuestas</span>
              <span className="text-sm sm:text-base text-white font-semibold">{tracking.valueBetsMetrics.taken}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-400">Ganancia</span>
              <span className={`text-sm sm:text-base font-bold ${
                tracking.valueBetsMetrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {tracking.valueBetsMetrics.netProfit >= 0 ? '+' : ''}€{Math.abs(tracking.valueBetsMetrics.netProfit).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-4 sm:p-5 md:p-6 border border-primary-500/20">
          <h3 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">Apuestas Normales</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-400">ROI</span>
              <span className={`text-sm sm:text-base font-bold ${
                tracking.normalBetsROI >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {tracking.normalBetsROI >= 0 ? '+' : ''}{tracking.normalBetsROI.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-400">Apuestas</span>
              <span className="text-sm sm:text-base text-white font-semibold">
                {tracking.totalBets - tracking.valueBetsMetrics.taken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-400">Ganancia</span>
              <span className={`text-sm sm:text-base font-bold ${
                (tracking.netProfit - tracking.valueBetsMetrics.netProfit) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(tracking.netProfit - tracking.valueBetsMetrics.netProfit) >= 0 ? '+' : ''}
                €{Math.abs(tracking.netProfit - tracking.valueBetsMetrics.netProfit).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


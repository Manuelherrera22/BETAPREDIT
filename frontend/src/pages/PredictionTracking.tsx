/**
 * Prediction Tracking Page
 * Displays prediction accuracy statistics and tracking
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import PredictionRow from '../components/PredictionRow';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PredictionTracking() {
  const [filters, setFilters] = useState({
    sportId: '',
    marketType: '',
    startDate: '',
    endDate: '',
    modelVersion: '',
  });

  const { data: accuracyStats, isLoading, refetch } = useQuery({
    queryKey: ['predictionAccuracy', filters],
    queryFn: () => predictionsService.getAccuracyTracking({
      sportId: filters.sportId || undefined,
      marketType: filters.marketType || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      modelVersion: filters.modelVersion || undefined,
    }),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });

  if (isLoading && !accuracyStats) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <SkeletonLoader type="text" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SkeletonLoader type="card" count={3} />
        </div>
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (!accuracyStats || accuracyStats.total === 0) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-4xl font-black text-white mb-2">Tracking de Precisión</h1>
        <p className="text-gray-400 mb-8">Seguimiento de la precisión de las predicciones</p>
        <div className="bg-dark-800 rounded-xl p-8 border border-primary-500/20 text-center">
          <p className="text-gray-400">No hay datos de precisión disponibles aún</p>
          <p className="text-sm text-gray-500 mt-2">
            Las estadísticas aparecerán cuando haya predicciones resueltas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Tracking de Precisión</h1>
          <p className="text-gray-400">Seguimiento detallado de la precisión de las predicciones</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Deporte</label>
            <select
              value={filters.sportId}
              onChange={(e) => setFilters({ ...filters, sportId: e.target.value })}
              className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
            >
              <option value="">Todos</option>
              {/* Add sports dynamically if available */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Tipo de Mercado</label>
            <select
              value={filters.marketType}
              onChange={(e) => setFilters({ ...filters, marketType: e.target.value })}
              className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
            >
              <option value="">Todos</option>
              <option value="MATCH_WINNER">Match Winner</option>
              <option value="OVER_UNDER">Over/Under</option>
              <option value="HANDICAP">Handicap</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Precisión General</h3>
          <p className="text-3xl font-black text-white">{accuracyStats.accuracy.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {accuracyStats.correct} de {accuracyStats.total} correctas
          </p>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Precisión Promedio</h3>
          <p className="text-3xl font-black text-white">{(accuracyStats.avgAccuracy * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Promedio de diferencia</p>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Brier Score</h3>
          <p className="text-3xl font-black text-white">{accuracyStats.brierScore.toFixed(3)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {accuracyStats.brierScore < 0.1 ? 'Excelente' : accuracyStats.brierScore < 0.2 ? 'Bueno' : 'Mejorable'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Calibración</h3>
          <p className="text-3xl font-black text-white">{(accuracyStats.calibrationScore * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {accuracyStats.calibrationScore > 0.9 ? 'Excelente' : accuracyStats.calibrationScore > 0.7 ? 'Buena' : 'Mejorable'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Accuracy by Sport - Enhanced Bar Chart */}
        {accuracyStats.bySport.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Precisión por Deporte</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyStats.bySport.map((s) => ({
                deporte: s.sport,
                precisión: s.accuracy,
                correctas: s.correct,
                total: s.total,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="deporte" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="precisión" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {accuracyStats.bySport.map((s) => (
                <div key={s.sport} className="text-gray-400">
                  <span className="font-semibold text-white">{s.sport}:</span> {s.correct}/{s.total} ({s.accuracy.toFixed(1)}%)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accuracy by Market - Enhanced Bar Chart */}
        {accuracyStats.byMarket.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Precisión por Tipo de Mercado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyStats.byMarket.map((m) => ({
                mercado: m.market,
                precisión: m.accuracy,
                correctas: m.correct,
                total: m.total,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mercado" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="precisión" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {accuracyStats.byMarket.map((m) => (
                <div key={m.market} className="text-gray-400">
                  <span className="font-semibold text-white">{m.market}:</span> {m.correct}/{m.total} ({m.accuracy.toFixed(1)}%)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accuracy Trend Over Time */}
        {accuracyStats.recentPredictions.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Tendencia de Precisión (Últimas 20 Predicciones)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyStats.recentPredictions.slice(0, 20).reverse().map((p, idx) => ({
                index: idx + 1,
                precisión: p.accuracy ? p.accuracy * 100 : null,
                confianza: p.confidence * 100,
                probabilidad: p.predictedProbability * 100,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="index" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                  }}
                  formatter={(value: number) => `${value?.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="precisión"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Precisión"
                  dot={{ fill: '#10B981', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="confianza"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Confianza"
                  dot={{ fill: '#3B82F6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Calibration Chart - Enhanced */}
        {accuracyStats.calibrationBins.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Calibración del Modelo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyStats.calibrationBins.map((b) => ({
                predicho: b.bin * 100,
                real: b.avgActual * 100,
                ideal: b.bin * 100, // Perfect calibration line
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="predicho" stroke="#9CA3AF" fontSize={12} label={{ value: 'Probabilidad Predicha (%)', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} label={{ value: 'Probabilidad Real (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="real"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Real"
                  dot={{ fill: '#10B981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#6B7280"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Ideal (Perfecta)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">
              Comparación entre probabilidad predicha vs probabilidad real. La línea ideal muestra calibración perfecta.
            </p>
          </div>
        )}
      </div>

      {/* Recent Predictions */}
      {accuracyStats.recentPredictions.length > 0 && (
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-xl font-black text-white mb-4">Predicciones Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-500/20">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Evento</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Selección</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Probabilidad</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Confianza</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Resultado</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Precisión</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accuracyStats.recentPredictions.map((pred) => (
                  <PredictionRow key={pred.id} prediction={pred} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


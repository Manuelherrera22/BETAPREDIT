/**
 * Prediction Tracking Page
 * Displays prediction accuracy statistics and tracking
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import SimpleChart from '../components/SimpleChart';
import PredictionRow from '../components/PredictionRow';

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
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-4"></div>
            <div className="text-white text-lg font-semibold">Cargando estadísticas de precisión...</div>
            <p className="text-gray-400 text-sm mt-2">Analizando predicciones y resultados</p>
          </div>
        </div>
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
        {/* Accuracy by Sport */}
        {accuracyStats.bySport.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Precisión por Deporte</h3>
            <SimpleChart
              data={accuracyStats.bySport.map((s) => ({
                label: s.sport,
                value: s.accuracy,
              }))}
            />
          </div>
        )}

        {/* Accuracy by Market */}
        {accuracyStats.byMarket.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Precisión por Tipo de Mercado</h3>
            <SimpleChart
              data={accuracyStats.byMarket.map((m) => ({
                label: m.market,
                value: m.accuracy,
              }))}
            />
          </div>
        )}

        {/* Accuracy by Confidence */}
        {accuracyStats.byConfidence.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Precisión por Nivel de Confianza</h3>
            <SimpleChart
              data={accuracyStats.byConfidence.map((c) => ({
                label: `${(c.confidence * 100).toFixed(0)}%`,
                value: c.accuracy,
              }))}
            />
          </div>
        )}

        {/* Calibration Chart */}
        {accuracyStats.calibrationBins.length > 0 && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-black text-white mb-4">Calibración del Modelo</h3>
            <SimpleChart
              data={accuracyStats.calibrationBins.map((b) => ({
                label: `${(b.bin * 100).toFixed(0)}%`,
                value: b.avgActual * 100,
              }))}
            />
            <p className="text-xs text-gray-500 mt-2">
              Comparación entre probabilidad predicha vs probabilidad real
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


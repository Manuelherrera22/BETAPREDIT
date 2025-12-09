/**
 * Prediction Tracking Page
 * Displays prediction accuracy statistics and tracking
 */

import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import SimpleChart from '../components/SimpleChart';

export default function PredictionTracking() {
  const filters = {
    sportId: '',
    marketType: '',
    startDate: '',
    endDate: '',
  };

  const { data: accuracyStats, isLoading } = useQuery({
    queryKey: ['predictionAccuracy', filters],
    queryFn: () => predictionsService.getAccuracyTracking({
      sportId: filters.sportId || undefined,
      marketType: filters.marketType || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Cargando estadísticas...</div>
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
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Tracking de Precisión</h1>
        <p className="text-gray-400">Seguimiento detallado de la precisión de las predicciones</p>
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
                </tr>
              </thead>
              <tbody>
                {accuracyStats.recentPredictions.map((pred) => (
                  <tr key={pred.id} className="border-b border-primary-500/10">
                    <td className="py-3 px-4 text-white text-sm">{pred.eventName}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{pred.selection}</td>
                    <td className="py-3 px-4 text-center text-white text-sm">
                      {(pred.predictedProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300 text-sm">
                      {(pred.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pred.wasCorrect === null ? (
                        <span className="text-gray-500 text-sm">Pendiente</span>
                      ) : pred.wasCorrect ? (
                        <span className="text-green-400 font-semibold text-sm">✓ Correcta</span>
                      ) : (
                        <span className="text-red-400 font-semibold text-sm">✗ Incorrecta</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300 text-sm">
                      {pred.accuracy !== null ? `${(pred.accuracy * 100).toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


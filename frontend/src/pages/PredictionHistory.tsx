import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { predictionsService } from '../services/predictionsService';

interface Prediction {
  id: string;
  event: string;
  sport: string;
  predicted: string;
  actual: string;
  correct: boolean;
  confidence: number;
  date: string;
  value?: number;
  odds?: number;
}

export default function PredictionHistory() {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'value'>('date');

  // Obtener historial real de predicciones
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictionHistory', filter],
    queryFn: () => predictionsService.getPredictionHistory({ limit: 100 }),
    refetchInterval: 60000, // Actualizar cada minuto
  });

  const filteredPredictions = predictions
    .filter((p: Prediction) => {
      if (filter === 'correct') return p.correct;
      if (filter === 'incorrect') return !p.correct;
      return true;
    })
    .sort((a: Prediction, b: Prediction) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'value') return (b.value || 0) - (a.value || 0);
      return 0;
    });

  const accuracy = predictions.length > 0
    ? (predictions.filter((p: Prediction) => p.correct).length / predictions.length) * 100
    : 0;
  const avgConfidence = predictions.length > 0
    ? predictions.reduce((sum: number, p: Prediction) => sum + p.confidence, 0) / predictions.length
    : 0;

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Historial de Predicciones</h1>
          <p className="text-gray-400">Cargando predicciones...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Historial de Predicciones</h1>
        <p className="text-gray-400">Precisión de nuestras predicciones con IA</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 rounded-xl p-6 border border-accent-500/40">
          <div className="text-3xl font-black text-accent-400 mb-1">{accuracy.toFixed(1)}%</div>
          <div className="text-sm text-gray-300">Precisión General</div>
        </div>
        <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-6 border border-primary-500/40">
          <div className="text-3xl font-black text-primary-400 mb-1">{avgConfidence.toFixed(1)}%</div>
          <div className="text-sm text-gray-300">Confianza Promedio</div>
        </div>
        <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 rounded-xl p-6 border border-gold-500/40">
          <div className="text-3xl font-black text-gold-400 mb-1">{predictions.length}</div>
          <div className="text-sm text-gray-300">Total Predicciones</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Filtrar por Resultado</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">Todas</option>
            <option value="correct">Correctas</option>
            <option value="incorrect">Incorrectas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Ordenar por</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="date">Fecha</option>
            <option value="confidence">Confianza</option>
            <option value="value">Valor</option>
          </select>
        </div>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        {filteredPredictions.length === 0 ? (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-12 border border-primary-500/20 text-center">
            <p className="text-gray-400 text-lg mb-2">No hay predicciones resueltas aún</p>
            <p className="text-gray-500 text-sm">Las predicciones aparecerán aquí una vez que los eventos terminen y se actualicen los resultados.</p>
          </div>
        ) : (
          filteredPredictions.map((p: Prediction) => (
          <div
            key={p.id}
            className={`bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border-2 transition-all hover:scale-[1.02] ${
              p.correct
                ? 'border-accent-500/40 hover:border-accent-400/60'
                : 'border-red-500/40 hover:border-red-400/60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs font-semibold rounded">
                    {p.sport}
                  </span>
                  <h3 className="text-white font-black text-lg">{p.event}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Predicción: </span>
                    <span className="text-white font-semibold">{p.predicted}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Resultado: </span>
                    <span className={`font-semibold ${p.correct ? 'text-accent-400' : 'text-red-400'}`}>
                      {p.actual}
                    </span>
                  </div>
                  {p.value && (
                    <div>
                      <span className="text-gray-400">Value: </span>
                      <span className="text-gold-400 font-semibold">+{p.value.toFixed(1)}%</span>
                    </div>
                  )}
                  {p.odds && (
                    <div>
                      <span className="text-gray-400">Cuota: </span>
                      <span className="text-white font-semibold">{p.odds.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className={`px-4 py-2 rounded-lg font-bold ${
                    p.correct
                      ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {p.correct ? '✓ Correcto' : '✗ Incorrecto'}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">Confianza</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-dark-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          p.confidence >= 70
                            ? 'bg-accent-500'
                            : p.confidence >= 60
                            ? 'bg-primary-500'
                            : 'bg-gold-500'
                        }`}
                        style={{ width: `${p.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-bold text-sm">{p.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-primary-500/20 text-xs text-gray-500">
              {format(new Date(p.date), 'dd MMMM yyyy', { locale: es })}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}


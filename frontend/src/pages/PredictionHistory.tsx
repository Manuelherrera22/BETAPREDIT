import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const predictions: Prediction[] = [
    { id: '1', event: 'Real Madrid vs Barcelona', sport: 'Fútbol', predicted: 'Real Madrid', actual: 'Real Madrid', correct: true, confidence: 75, date: '2024-01-15', value: 12.5, odds: 2.15 },
    { id: '2', event: 'Lakers vs Warriors', sport: 'Basketball', predicted: 'Lakers', actual: 'Warriors', correct: false, confidence: 58, date: '2024-01-14', value: 5.2, odds: 1.88 },
    { id: '3', event: 'Nadal vs Djokovic', sport: 'Tenis', predicted: 'Nadal', actual: 'Nadal', correct: true, confidence: 68, date: '2024-01-13', value: 8.3, odds: 2.20 },
    { id: '4', event: 'Manchester City vs Liverpool', sport: 'Fútbol', predicted: 'Manchester City', actual: 'Manchester City', correct: true, confidence: 72, date: '2024-01-12', value: 10.1, odds: 1.95 },
    { id: '5', event: 'Celtics vs Heat', sport: 'Basketball', predicted: 'Celtics', actual: 'Heat', correct: false, confidence: 55, date: '2024-01-11', value: 3.8, odds: 1.92 },
    { id: '6', event: 'PSG vs Bayern Munich', sport: 'Fútbol', predicted: 'PSG', actual: 'PSG', correct: true, confidence: 70, date: '2024-01-10', value: 9.5, odds: 2.05 },
  ];

  const filteredPredictions = predictions
    .filter(p => {
      if (filter === 'correct') return p.correct;
      if (filter === 'incorrect') return !p.correct;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'value') return (b.value || 0) - (a.value || 0);
      return 0;
    });

  const accuracy = (predictions.filter(p => p.correct).length / predictions.length) * 100;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

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
        {filteredPredictions.map((p) => (
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
        ))}
      </div>
    </div>
  );
}


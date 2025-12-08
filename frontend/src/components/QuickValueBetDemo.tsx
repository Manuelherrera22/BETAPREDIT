/**
 * Quick Value Bet Demo
 * Shows a demo value bet immediately to new users
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DemoValueBet {
  id: string;
  event: string;
  selection: string;
  bookmaker: string;
  odds: number;
  predictedProbability: number;
  valuePercentage: number;
  confidence: number;
}

export default function QuickValueBetDemo() {
  const [demoBet, setDemoBet] = useState<DemoValueBet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate finding a value bet
    setTimeout(() => {
      setDemoBet({
        id: 'demo-1',
        event: 'Real Madrid vs Barcelona',
        selection: 'Real Madrid Win',
        bookmaker: 'Bet365',
        odds: 2.15,
        predictedProbability: 0.52,
        valuePercentage: 11.8,
        confidence: 0.85,
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gold-500/20 to-accent-500/20 rounded-xl p-6 border-2 border-gold-500/40 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="text-lg font-black text-white">Buscando tu primer Value Bet...</h3>
            <p className="text-sm text-gray-300">Analizando cuotas en tiempo real</p>
          </div>
        </div>
      </div>
    );
  }

  if (!demoBet) return null;

  return (
    <div className="bg-gradient-to-br from-gold-500/20 to-accent-500/20 rounded-xl p-6 border-2 border-gold-500/40 shadow-2xl shadow-gold-500/20 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gold-500/30 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gold-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-1">¡Value Bet Encontrado! 🎯</h3>
            <p className="text-sm text-gray-300">Tu primera oportunidad de valor</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-gold-500/30 text-gold-300 rounded-full text-xs font-bold">
          +{demoBet.valuePercentage.toFixed(1)}% Valor
        </span>
      </div>

      <div className="bg-dark-900/50 rounded-lg p-4 mb-4 border border-primary-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-400 mb-1">Evento</p>
            <p className="text-lg font-bold text-white">{demoBet.event}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Cuota</p>
            <p className="text-2xl font-black text-gold-400">{demoBet.odds.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary-500/20">
          <div>
            <p className="text-xs text-gray-400 mb-1">Selección</p>
            <p className="text-sm font-semibold text-white">{demoBet.selection}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Casa de Apuestas</p>
            <p className="text-sm font-semibold text-accent-400">{demoBet.bookmaker}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Probabilidad Predicha</p>
              <p className="text-sm font-semibold text-white">
                {(demoBet.predictedProbability * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Confianza</p>
              <p className="text-sm font-semibold text-primary-400">
                {(demoBet.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/odds-comparison"
          className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-lg font-bold text-center transition-all shadow-lg shadow-primary-500/30"
        >
          Ver Más Value Bets
        </Link>
        <button className="px-4 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-lg font-semibold transition-colors">
          Registrar Apuesta
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        💡 Este es un ejemplo. Encuentra value bets reales en tiempo real en la plataforma.
      </p>
    </div>
  );
}


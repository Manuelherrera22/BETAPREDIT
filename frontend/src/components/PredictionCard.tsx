/**
 * Professional Prediction Card Component
 * Beautiful, modern card for displaying predictions
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Icon from './icons/IconSystem';

interface Prediction {
  selection: string;
  predictedProbability: number;
  marketOdds: number;
  value: number;
  confidence: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
}

interface PredictionCardProps {
  prediction: Prediction;
  eventName: string;
  startTime: string;
  sport: string;
  onViewDetails?: () => void;
}

export default function PredictionCard({ prediction, eventName, startTime, sport, onViewDetails }: PredictionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getRecommendationConfig = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return {
          bg: 'bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-600/20',
          border: 'border-emerald-500/50',
          text: 'text-emerald-300',
          glow: 'shadow-lg shadow-emerald-500/30',
          icon: 'flame' as const,
          label: 'COMPRA FUERTE',
          pulse: 'animate-pulse',
        };
      case 'BUY':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/40',
          text: 'text-green-400',
          glow: 'shadow-md shadow-green-500/20',
          icon: 'check-circle' as const,
          label: 'COMPRA',
          pulse: '',
        };
      case 'HOLD':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/40',
          text: 'text-yellow-400',
          glow: 'shadow-md shadow-yellow-500/20',
          icon: 'pause' as const,
          label: 'MANTENER',
          pulse: '',
        };
      case 'AVOID':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/40',
          text: 'text-red-400',
          glow: 'shadow-md shadow-red-500/20',
          icon: 'x-icon' as const,
          label: 'EVITAR',
          pulse: '',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/40',
          text: 'text-gray-400',
          glow: '',
          icon: 'help-circle' as const,
          label: rec,
          pulse: '',
        };
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.75) return { level: 'Muy Alta', color: 'text-emerald-400', icon: 'target' as const };
    if (confidence >= 0.65) return { level: 'Alta', color: 'text-green-400', icon: 'chart' as const };
    if (confidence >= 0.55) return { level: 'Media', color: 'text-yellow-400', icon: 'trending-up' as const };
    return { level: 'Baja', color: 'text-orange-400', icon: 'alert' as const };
  };

  const recConfig = getRecommendationConfig(prediction.recommendation);
  const confLevel = getConfidenceLevel(prediction.confidence);
  const marketProb = (1 / prediction.marketOdds) * 100;
  const valueDiff = prediction.predictedProbability * 100 - marketProb;
  const expectedValue = (prediction.predictedProbability * prediction.marketOdds - 1) * 100;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${recConfig.bg} ${recConfig.border} ${recConfig.glow} ${isHovered ? 'scale-[1.02] shadow-2xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{sport}</span>
              <span className="w-1 h-1 bg-gray-500 rounded-full hidden sm:block"></span>
              <span className="text-xs text-gray-500">
                {format(new Date(startTime), 'dd MMM, HH:mm', { locale: es })}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mb-1 truncate">{eventName}</h3>
            <h4 className="text-xl sm:text-2xl font-black text-white mb-3 break-words">{prediction.selection}</h4>
          </div>
          <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border ${recConfig.border} ${recConfig.bg} ${recConfig.pulse} shrink-0`}>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Icon name={recConfig.icon} size={14} className={recConfig.text} />
              <span className={`text-xs font-black ${recConfig.text} whitespace-nowrap`}>{recConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Probability Comparison - Visual */}
        <div className="mb-4 sm:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comparación de Probabilidades</span>
            <span className={`text-xs font-bold ${confLevel.color} flex items-center gap-1`}>
              <Icon name={confLevel.icon} size={14} />
              <span>{confLevel.level}</span>
            </span>
          </div>

          {/* Our Prediction */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Nuestra Predicción</span>
              <span className="text-xl sm:text-2xl font-black text-primary-400">
                {(prediction.predictedProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-slate-800/50 rounded-full h-2.5 sm:h-3 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 rounded-full transition-all duration-500 shadow-lg shadow-primary-500/50"
                style={{ width: `${prediction.predictedProbability * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Market Probability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Mercado (Implícita)</span>
              <span className="text-base sm:text-lg font-semibold text-gray-300">
                {marketProb.toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-slate-800/50 rounded-full h-2.5 sm:h-3 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full transition-all duration-500"
                style={{ width: `${marketProb}%` }}
              ></div>
            </div>
          </div>

          {/* Value Difference Indicator */}
          {valueDiff !== 0 && (
            <div className={`mt-2 text-xs font-bold flex items-center gap-1 ${valueDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {valueDiff > 0 ? '↑' : '↓'} {Math.abs(valueDiff).toFixed(1)}% diferencia
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1 font-medium">Valor</div>
            <div className={`text-lg sm:text-xl font-black ${prediction.value > 10 ? 'text-emerald-400' : prediction.value > 5 ? 'text-green-400' : prediction.value > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {prediction.value >= 0 ? '+' : ''}{prediction.value.toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1 font-medium">Confianza</div>
            <div className={`text-lg sm:text-xl font-black ${confLevel.color}`}>
              {(prediction.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1 font-medium">Cuota</div>
            <div className="text-lg sm:text-xl font-black text-white">
              {prediction.marketOdds.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Expected Value */}
        <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary-500/30 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-1 font-medium">Valor Esperado (EV)</div>
              <div className="text-xl sm:text-2xl font-black text-primary-400">
                {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(1)}%
              </div>
            </div>
            <div className="shrink-0 ml-2">
              {expectedValue > 10 ? (
                <Icon name="rocket" size={28} className="text-emerald-400" />
              ) : expectedValue > 5 ? (
                <Icon name="trending-up" size={28} className="text-green-400" />
              ) : expectedValue > 0 ? (
                <Icon name="arrow-up-right" size={28} className="text-yellow-400" />
              ) : (
                <Icon name="trending-down" size={28} className="text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/50 flex items-center justify-center gap-2"
          >
            <span className="hidden sm:inline">Ver Análisis Completo</span>
            <span className="sm:hidden">Ver Detalles</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Shine effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine pointer-events-none"></div>
      )}
    </div>
  );
}


/**
 * Professional Prediction Card Component
 * Beautiful, modern card for displaying predictions
 * Optimized with React.memo for performance
 */

import { useState, memo, useMemo } from 'react';
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

const PredictionCard = memo(function PredictionCard({ prediction, eventName, startTime, sport, onViewDetails }: PredictionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getRecommendationConfig = useMemo(() => (rec: string) => {
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
  }, []);

  const getConfidenceLevel = useMemo(() => (confidence: number) => {
    if (confidence >= 0.75) return { level: 'Muy Alta', color: 'text-emerald-400', icon: 'target' as const };
    if (confidence >= 0.65) return { level: 'Alta', color: 'text-green-400', icon: 'chart' as const };
    if (confidence >= 0.55) return { level: 'Media', color: 'text-yellow-400', icon: 'trending-up' as const };
    return { level: 'Baja', color: 'text-orange-400', icon: 'alert' as const };
  }, []);

  const recConfig = useMemo(() => getRecommendationConfig(prediction.recommendation), [prediction.recommendation, getRecommendationConfig]);
  const confLevel = useMemo(() => getConfidenceLevel(prediction.confidence), [prediction.confidence, getConfidenceLevel]);
  const marketProb = useMemo(() => (1 / prediction.marketOdds) * 100, [prediction.marketOdds]);
  const valueDiff = useMemo(() => prediction.predictedProbability * 100 - marketProb, [prediction.predictedProbability, marketProb]);
  const expectedValue = useMemo(() => (prediction.predictedProbability * prediction.marketOdds - 1) * 100, [prediction.predictedProbability, prediction.marketOdds]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${recConfig.bg} ${recConfig.border} ${recConfig.glow} ${isHovered ? 'scale-[1.02] shadow-xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content - Más compacto */}
      <div className="relative p-3 sm:p-4">
        {/* Header - Más compacto */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{sport}</span>
              <span className="w-0.5 h-0.5 bg-gray-500 rounded-full"></span>
              <span className="text-[10px] text-gray-500">
                {format(new Date(startTime), 'dd MMM, HH:mm', { locale: es })}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1 truncate leading-tight">{eventName}</h3>
            <h4 className="text-base font-black text-white mb-2 line-clamp-2 leading-tight">{prediction.selection}</h4>
          </div>
          <div className={`px-2 py-1 rounded-lg border ${recConfig.border} ${recConfig.bg} ${recConfig.pulse} shrink-0`}>
            <div className="flex items-center gap-1">
              <Icon name={recConfig.icon} size={12} className={recConfig.text} />
              <span className={`text-[10px] font-black ${recConfig.text} whitespace-nowrap`}>{recConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Probability Comparison - Más compacto */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Probabilidades</span>
            <span className={`text-[10px] font-bold ${confLevel.color} flex items-center gap-1`}>
              <Icon name={confLevel.icon} size={10} />
              <span>{confLevel.level}</span>
            </span>
          </div>

          {/* Our Prediction - Compacto */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400">Nuestra</span>
              <span className="text-base font-black text-primary-400">
                {(prediction.predictedProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500 shadow-md shadow-primary-500/30"
                style={{ width: `${prediction.predictedProbability * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Market Probability - Compacto */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400">Mercado</span>
              <span className="text-sm font-semibold text-gray-300">
                {marketProb.toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full transition-all duration-500"
                style={{ width: `${marketProb}%` }}
              ></div>
            </div>
          </div>

          {/* Value Difference - Compacto */}
          {valueDiff !== 0 && (
            <div className={`mt-1.5 text-[10px] font-bold flex items-center gap-1 ${valueDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {valueDiff > 0 ? '↑' : '↓'} {Math.abs(valueDiff).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Key Metrics Grid - Más compacto */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Valor</div>
            <div className={`text-sm font-black ${prediction.value > 10 ? 'text-emerald-400' : prediction.value > 5 ? 'text-green-400' : prediction.value > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {prediction.value >= 0 ? '+' : ''}{prediction.value.toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Confianza</div>
            <div className={`text-sm font-black ${confLevel.color}`}>
              {(prediction.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Cuota</div>
            <div className="text-sm font-black text-white">
              {prediction.marketOdds.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Expected Value - Más compacto */}
        <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg p-2 border border-primary-500/30 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 mb-0.5 font-medium">Valor Esperado</div>
              <div className="text-base font-black text-primary-400">
                {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(1)}%
              </div>
            </div>
            <div className="shrink-0 ml-2">
              {expectedValue > 10 ? (
                <Icon name="rocket" size={18} className="text-emerald-400" />
              ) : expectedValue > 5 ? (
                <Icon name="trending-up" size={18} className="text-green-400" />
              ) : expectedValue > 0 ? (
                <Icon name="arrow-up-right" size={18} className="text-yellow-400" />
              ) : (
                <Icon name="trending-down" size={18} className="text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Action Button - Más compacto */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-bold text-xs transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:shadow-primary-500/30 flex items-center justify-center gap-1.5"
          >
            <span>Ver Análisis</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
});

export default PredictionCard;


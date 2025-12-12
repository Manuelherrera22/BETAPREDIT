/**
 * Professional Prediction Card Component
 * Beautiful, modern card for displaying predictions
 * Optimized with React.memo for performance
 */

import { useState, memo, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Icon from './icons/IconSystem';
import RegisterBetForm from './RegisterBetForm';

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
  eventId?: string; // ID del evento para vincular con apuesta
  onViewDetails?: () => void;
}

const PredictionCard = memo(function PredictionCard({ prediction, eventName, startTime, sport, eventId, onViewDetails }: PredictionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRegisterBetOpen, setIsRegisterBetOpen] = useState(false);

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
      className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${recConfig.bg} ${recConfig.border} ${recConfig.glow} ${isHovered ? 'scale-[1.01] shadow-lg' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content - Diseño horizontal ultra compacto */}
      <div className="relative p-2">
        {/* Header - Todo en una línea */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[7px] font-bold text-gray-400 uppercase">{sport}</span>
              <span className="w-0.5 h-0.5 bg-gray-500 rounded-full"></span>
              <span className="text-[7px] text-gray-500">
                {format(new Date(startTime), 'dd MMM, HH:mm', { locale: es })}
              </span>
            </div>
            <h3 className="text-[9px] font-bold text-white truncate leading-tight mb-0.5">{eventName}</h3>
            <h4 className="text-[9px] font-black text-white line-clamp-1 leading-tight">{prediction.selection}</h4>
          </div>
          <div className={`px-1 py-0.5 rounded border ${recConfig.border} ${recConfig.bg} ${recConfig.pulse} shrink-0`}>
            <div className="flex items-center gap-0.5">
              <Icon name={recConfig.icon} size={7} className={recConfig.text} />
              <span className={`text-[7px] font-black ${recConfig.text} whitespace-nowrap`}>{recConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Probability Comparison - Todo horizontal ultra compacto */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[7px] font-semibold text-gray-400">Prob.</span>
            <span className={`text-[7px] font-bold ${confLevel.color} flex items-center gap-0.5`}>
              <Icon name={confLevel.icon} size={6} />
              <span>{confLevel.level}</span>
            </span>
          </div>

          {/* Probabilidades lado a lado - sin barras, solo números */}
          <div className="grid grid-cols-2 gap-1 mb-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-gray-400">Nuestra</span>
              <span className="text-[9px] font-black text-primary-400">
                {(prediction.predictedProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-gray-400">Mercado</span>
              <span className="text-[8px] font-semibold text-gray-300">
                {marketProb.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Value Difference - Inline */}
          {valueDiff !== 0 && (
            <div className={`text-[7px] font-bold text-center ${valueDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {valueDiff > 0 ? '↑' : '↓'} {Math.abs(valueDiff).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Key Metrics - Todo en una línea horizontal */}
        <div className="grid grid-cols-4 gap-0.5 mb-1">
          <div className="bg-slate-900/50 rounded p-0.5 border border-slate-700/50">
            <div className="text-[6px] text-gray-500 mb-0.5">Valor</div>
            <div className={`text-[8px] font-black ${prediction.value > 10 ? 'text-emerald-400' : prediction.value > 5 ? 'text-green-400' : prediction.value > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {prediction.value >= 0 ? '+' : ''}{prediction.value.toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-0.5 border border-slate-700/50">
            <div className="text-[6px] text-gray-500 mb-0.5">Conf.</div>
            <div className={`text-[8px] font-black ${confLevel.color}`}>
              {(prediction.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-0.5 border border-slate-700/50">
            <div className="text-[6px] text-gray-500 mb-0.5">Cuota</div>
            <div className="text-[8px] font-black text-white">
              {prediction.marketOdds.toFixed(2)}
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded p-0.5 border border-primary-500/30">
            <div className="text-[6px] text-gray-400">EV</div>
            <div className="text-[8px] font-black text-primary-400">
              {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Action Buttons - Ultra compacto en grid */}
        <div className="grid grid-cols-2 gap-1">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="py-0.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded font-bold text-[7px] transition-all duration-200 hover:scale-[1.01] hover:shadow-sm hover:shadow-primary-500/20 flex items-center justify-center gap-0.5"
            >
              <span>Ver Análisis</span>
              <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsRegisterBetOpen(true)}
            className="py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded font-bold text-[7px] transition-all duration-200 hover:scale-[1.01] hover:shadow-sm hover:shadow-emerald-500/20 flex items-center justify-center gap-0.5"
          >
            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Registrar</span>
          </button>
        </div>
      </div>

      {/* Shine effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine pointer-events-none"></div>
      )}

      {/* Register Bet Form Modal */}
      <RegisterBetForm
        isOpen={isRegisterBetOpen}
        onClose={() => setIsRegisterBetOpen(false)}
        initialData={{
          eventId: eventId,
          selection: prediction.selection,
          odds: prediction.marketOdds,
          marketType: 'Match Winner', // Default, puede ser ajustado
          betPlacedAt: new Date().toISOString(),
          notes: `Predicción: ${(prediction.predictedProbability * 100).toFixed(1)}% confianza, ${prediction.value >= 0 ? '+' : ''}${prediction.value.toFixed(1)}% valor`,
          metadata: {
            predictionConfidence: prediction.confidence,
            predictionValue: prediction.value,
            predictedProbability: prediction.predictedProbability,
            recommendation: prediction.recommendation,
          },
        }}
      />
    </div>
  );
});

export default PredictionCard;


/**
 * Prediction Details Modal
 * Shows complete analysis when clicking "Ver Detalles"
 */

import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import PredictionAnalysisExplained from './PredictionAnalysisExplained';
import SkeletonLoader from './SkeletonLoader';
import Icon from './icons/IconSystem';

interface PredictionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionId?: string;
  eventId?: string;
  marketId?: string;
  selection?: string;
  predictedProbability?: number;
  confidence?: number;
  eventName?: string;
  sport?: string;
}

export default function PredictionDetailsModal({
  isOpen,
  onClose,
  predictionId,
  eventId,
  marketId,
  selection,
  predictedProbability = 0,
  confidence = 0,
  eventName = '',
  sport = '',
}: PredictionDetailsModalProps) {
  // Get prediction with factors if we have predictionId
  const { data: predictionWithFactors, isLoading } = useQuery({
    queryKey: ['predictionFactors', predictionId],
    queryFn: () => predictionsService.getPredictionFactors(predictionId!),
    enabled: !!predictionId && isOpen,
  });

  if (!isOpen) return null;

  // Prepare prediction data for PredictionAnalysisExplained
  const predictionData = {
    id: predictionId || `temp-${eventId}-${selection}`,
    eventId: eventId || '',
    marketId: marketId || '',
    eventName: eventName || '',
    selection: selection || '',
    predictedProbability: predictionWithFactors?.predictedProbability || predictedProbability,
    confidence: predictionWithFactors?.confidence || confidence,
    sport: sport || '',
  };

  // Extract factors from the prediction response - check multiple locations
  // IMPORTANT: The factors are stored directly in prediction.factors in the database
  // factorExplanation is generated on-the-fly by the backend service
  const factors = predictionWithFactors?.factorExplanation?.advancedFeatures || 
                  predictionWithFactors?.factors?.advancedFeatures ||
                  predictionWithFactors?.factors || // Direct factors from DB (PRIMARY SOURCE)
                  predictionWithFactors?.factorExplanation ||
                  null;
  
  // Debug: Log factors to help diagnose
  if (process.env.NODE_ENV === 'development' && predictionWithFactors) {
    console.log('Prediction with factors:', {
      hasFactorExplanation: !!predictionWithFactors.factorExplanation,
      hasFactors: !!predictionWithFactors.factors,
      factorsType: typeof predictionWithFactors.factors,
      factorsKeys: predictionWithFactors.factors ? Object.keys(predictionWithFactors.factors) : [],
      hasAdvancedFeatures: !!(predictionWithFactors.factors as any)?.advancedFeatures,
      advancedFeaturesKeys: (predictionWithFactors.factors as any)?.advancedFeatures ? Object.keys((predictionWithFactors.factors as any).advancedFeatures) : [],
      extractedFactors: factors ? Object.keys(factors) : [],
      marketAverage: !!(predictionWithFactors.factors as any)?.marketAverage,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-dark-900 rounded-2xl border-2 border-primary-500/30 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-500/20 bg-gradient-to-r from-primary-500/10 to-transparent">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-1">Análisis Completo de la Predicción</h2>
              <p className="text-sm text-gray-400">{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && !predictionWithFactors ? (
              <div className="space-y-4">
                <SkeletonLoader type="card" count={3} />
              </div>
            ) : (
              <PredictionAnalysisExplained
                prediction={predictionData}
                factors={factors}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


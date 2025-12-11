/**
 * Prediction Row Component
 * Displays a single prediction with factors and feedback options
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import toast from 'react-hot-toast';
import PredictionAnalysisExplained from './PredictionAnalysisExplained';

interface PredictionRowProps {
  prediction: {
    id: string;
    eventName: string;
    selection: string;
    predictedProbability: number;
    confidence: number;
    wasCorrect: boolean | null;
    accuracy: number | null;
    createdAt: string;
    eventFinishedAt: string | null;
  };
}

export default function PredictionRow({ prediction }: PredictionRowProps) {
  const [showFactors, setShowFactors] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const queryClient = useQueryClient();

  // Get prediction factors
  const { data: predictionWithFactors, isLoading: loadingFactors } = useQuery({
    queryKey: ['predictionFactors', prediction.id],
    queryFn: () => predictionsService.getPredictionFactors(prediction.id),
    enabled: showFactors,
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: (data: { wasCorrect: boolean; userConfidence?: number; notes?: string }) =>
      predictionsService.submitFeedback(prediction.id, data),
    onSuccess: () => {
      toast.success('Feedback enviado correctamente');
      setShowFeedback(false);
      setFeedbackNotes('');
      queryClient.invalidateQueries({ queryKey: ['predictionAccuracy'] });
    },
    onError: (error: any) => {
      toast.error(`Error al enviar feedback: ${error.message}`);
    },
  });

  const handleFeedback = (wasCorrect: boolean) => {
    feedbackMutation.mutate({
      wasCorrect,
      notes: feedbackNotes || undefined,
    });
  };

  return (
    <>
      <tr className="border-b border-primary-500/10 hover:bg-dark-800/50 transition-colors">
        <td className="py-3 px-4 text-white text-sm">{prediction.eventName}</td>
        <td className="py-3 px-4 text-gray-300 text-sm">{prediction.selection}</td>
        <td className="py-3 px-4 text-center text-white text-sm font-semibold">
          {(prediction.predictedProbability * 100).toFixed(1)}%
        </td>
        <td className="py-3 px-4 text-center text-gray-300 text-sm">
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              prediction.confidence > 0.8
                ? 'bg-green-500/20 text-green-400'
                : prediction.confidence > 0.6
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {(prediction.confidence * 100).toFixed(0)}%
          </span>
        </td>
        <td className="py-3 px-4 text-center">
          {prediction.wasCorrect === null ? (
            <span className="text-gray-500 text-sm">Pendiente</span>
          ) : prediction.wasCorrect ? (
            <span className="text-green-400 font-semibold text-sm flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Correcta
            </span>
          ) : (
            <span className="text-red-400 font-semibold text-sm flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Incorrecta
            </span>
          )}
        </td>
        <td className="py-3 px-4 text-center text-gray-300 text-sm">
          {prediction.accuracy !== null ? (
            <span
              className={`font-semibold ${
                prediction.accuracy > 0.8
                  ? 'text-green-400'
                  : prediction.accuracy > 0.6
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {(prediction.accuracy * 100).toFixed(1)}%
            </span>
          ) : (
            '-'
          )}
        </td>
        <td className="py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowFactors(!showFactors)}
              className="px-3 py-1 text-xs bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors font-semibold"
              title="Ver factores"
            >
              {showFactors ? 'Ocultar' : 'Factores'}
            </button>
            {prediction.eventFinishedAt && (
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="px-3 py-1 text-xs bg-accent-500/20 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-colors font-semibold"
                title="Dar feedback"
              >
                Feedback
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Factors Row - Enhanced Analysis */}
      {showFactors && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-dark-800/30">
            {loadingFactors ? (
              <div className="text-center text-gray-400 py-4">Cargando análisis completo...</div>
            ) : predictionWithFactors ? (
              <PredictionAnalysisExplained
                prediction={{
                  ...prediction,
                  eventId: predictionWithFactors.eventId || predictionWithFactors.event?.id,
                  marketId: predictionWithFactors.marketId || predictionWithFactors.market?.id,
                  sport: predictionWithFactors.event?.sport?.name || predictionWithFactors.event?.sport?.slug,
                }}
                factors={predictionWithFactors.factorExplanation?.advancedFeatures || predictionWithFactors.factors}
              />
            ) : (
              <div className="text-center text-gray-500 py-4">
                No se pudieron cargar los factores de la predicción
              </div>
            )}
          </td>
        </tr>
      )}

      {/* Feedback Row */}
      {showFeedback && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-dark-800/30">
            <div className="space-y-3">
              <h4 className="text-lg font-black text-white mb-2">Tu Feedback sobre esta Predicción</h4>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={feedbackMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors font-semibold disabled:opacity-50"
                >
                  ✓ Fue Correcta
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  disabled={feedbackMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-semibold disabled:opacity-50"
                >
                  ✗ Fue Incorrecta
                </button>
              </div>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Notas adicionales (opcional)..."
                className="w-full px-4 py-2 bg-dark-900 border border-primary-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedbackNotes('');
                  }}
                  className="px-4 py-2 bg-gray-500/20 border border-gray-500/40 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


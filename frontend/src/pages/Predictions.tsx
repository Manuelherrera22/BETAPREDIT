/**
 * Predictions Page - Premium Prediction System
 * The flagship feature: Best-in-market prediction system
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import { eventsService } from '../services/eventsService';
import { theOddsApiService } from '../services/theOddsApiService';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface EventPrediction {
  eventId: string;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  sport: string;
  predictions: Array<{
    selection: string;
    predictedProbability: number;
    marketOdds: number;
    value: number;
    confidence: number;
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
  }>;
}

export default function Predictions() {
  const [selectedSport, setSelectedSport] = useState<string>('all'); // Changed to 'all' to show all predictions
  const [minConfidence, setMinConfidence] = useState<number>(0.5); // Reduced from 0.7 to show more predictions
  const [minValue, setMinValue] = useState<number>(0); // Reduced from 0.05 to show more predictions

  // Get available sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => theOddsApiService.getSports(),
    staleTime: 3600000,
  });

  // Get upcoming events with predictions
  const { data: eventsWithPredictions, isLoading } = useQuery({
    queryKey: ['eventsWithPredictions', selectedSport],
    queryFn: async () => {
      try {
        // Get events - if 'all', don't filter by sport
        const events = await eventsService.getUpcomingEvents(
          selectedSport !== 'all' ? selectedSport : undefined,
          undefined,
          true
        );
        
        // Validate events is an array
        if (!events || !Array.isArray(events) || events.length === 0) {
          console.log(`No events found for sport: ${selectedSport}`);
          return [];
        }
        
        console.log(`Found ${events.length} events for sport: ${selectedSport}`);
        
        // For each event, get predictions
        const eventsWithPreds: EventPrediction[] = [];
        
        // Increase limit when showing all sports to get more predictions
        const eventLimit = selectedSport === 'all' ? 50 : 20;
        for (const event of events.slice(0, eventLimit)) {
          try {
            // Get predictions for this event
            const predictions = await predictionsService.getEventPredictions(event.id);
            
            console.log(`Event ${event.id}: Found ${predictions.length} predictions`);
            
            if (predictions && predictions.length > 0) {
              // Get event details with odds
              let eventDetails;
              try {
                eventDetails = await eventsService.getEventDetails(event.id);
              } catch (err: any) {
                console.warn(`Error getting event details for ${event.id}:`, err.message);
                eventDetails = null;
              }
              
              const predictionsWithOdds = predictions.map((pred: any) => {
                // Find corresponding odds from event markets
                let marketOdds = 2.0; // Default
                if (eventDetails?.markets && eventDetails.markets.length > 0) {
                  const market = eventDetails.markets.find((m: any) => m.id === pred.marketId);
                  if (market?.odds) {
                    const odds = market.odds.find((o: any) => o.selection === pred.selection);
                    if (odds) marketOdds = odds.decimal;
                  }
                }
                
                // Calculate value
                const impliedMarketProb = 1 / marketOdds;
                const value = pred.predictedProbability - impliedMarketProb;
                const valuePercentage = value * 100;
                
                // Determine recommendation
                let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
                if (valuePercentage > 10 && pred.confidence > 0.8) {
                  recommendation = 'STRONG_BUY';
                } else if (valuePercentage > 5 && pred.confidence > 0.7) {
                  recommendation = 'BUY';
                } else if (valuePercentage > 0) {
                  recommendation = 'HOLD';
                } else {
                  recommendation = 'AVOID';
                }
                
                return {
                  selection: pred.selection,
                  predictedProbability: pred.predictedProbability,
                  marketOdds,
                  value: valuePercentage,
                  confidence: pred.confidence,
                  recommendation,
                };
              });
              
              eventsWithPreds.push({
                eventId: event.id,
                eventName: `${event.homeTeam} vs ${event.awayTeam}`,
                homeTeam: event.homeTeam,
                awayTeam: event.awayTeam,
                startTime: event.startTime,
                sport: event.sport?.name || 'Unknown',
                predictions: predictionsWithOdds,
              });
            }
          } catch (err: any) {
            // Log error but continue with other events
            console.warn(`Error getting predictions for event ${event.id}:`, err.message || err);
          }
        }
        
        return eventsWithPreds;
      } catch (error: any) {
        console.error('Error loading predictions:', error);
        toast.error('Error al cargar predicciones');
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: !!selectedSport,
  });

  // Filter predictions (show all that meet confidence and value thresholds)
  const filteredEvents = eventsWithPredictions?.filter((event) => {
    return event.predictions.some(
      (pred) =>
        pred.confidence >= minConfidence &&
        pred.value >= minValue
    );
  }) || [];

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return 'bg-green-500 text-white border-green-400';
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'HOLD':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'AVOID':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return '🔥 COMPRA FUERTE';
      case 'BUY':
        return '✅ COMPRA';
      case 'HOLD':
        return '⏸️ MANTENER';
      case 'AVOID':
        return '❌ EVITAR';
      default:
        return rec;
    }
  };

  const queryClient = useQueryClient();

  // Mutation to generate predictions manually
  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      console.log('Generating predictions...');
      const result = await predictionsService.generatePredictions();
      console.log('Predictions generated:', result);
      return { data: result };
    },
    onSuccess: (data) => {
      if (data.data.generated === 0 && data.data.updated === 0) {
        const suggestion = (data.data as any).suggestion;
        const message = suggestion === 'sync_events_first'
          ? 'No se generaron predicciones. Primero sincroniza los eventos desde la página de Eventos para obtener las odds.'
          : 'No se generaron predicciones. Verifica que hay eventos próximos con odds disponibles.';
        
        toast(message, {
          icon: 'ℹ️',
          duration: 6000,
        });
      } else {
        toast.success(`Predicciones generadas: ${data.data.generated} nuevas, ${data.data.updated} actualizadas`);
      }
      // Force immediate refetch of predictions after generation
      console.log('🔄 Invalidating queries and refetching...');
      queryClient.invalidateQueries({ queryKey: ['eventsWithPredictions'] });
      // Also refetch immediately
      queryClient.refetchQueries({ queryKey: ['eventsWithPredictions'] });
    },
    onError: (error: any) => {
      console.error('Error generating predictions:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Error desconocido';
      toast.error(`Error al generar predicciones: ${errorMessage}`);
    },
  });

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-white">Sistema de Predicciones Premium</h1>
            <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-black border border-gold-500/40">
              🏆 TANQUE INSIGNIA
            </span>
          </div>
          <button
            onClick={() => generatePredictionsMutation.mutate()}
            disabled={generatePredictionsMutation.isPending}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generatePredictionsMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generando...
              </>
            ) : (
              <>
                <span>⚡</span>
                Generar Predicciones
              </>
            )}
          </button>
        </div>
        <p className="text-gray-400">
          Predicciones probabilísticas avanzadas con comparación en tiempo real vs cuotas del mercado
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Deporte</label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="all">🌍 Todos los Deportes</option>
            {sports?.filter(s => s.active).map((sport) => (
              <option key={sport.key} value={sport.key}>
                {sport.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Confianza Mínima: {(minConfidence * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Valor Mínimo: {minValue >= 0 ? '+' : ''}{(minValue * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="-0.1"
            max="0.2"
            step="0.01"
            value={minValue}
            onChange={(e) => setMinValue(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Estadísticas</label>
          <div className="px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg">
            <div className="text-white font-semibold">{filteredEvents.length} eventos</div>
            <div className="text-xs text-gray-400">
              {filteredEvents.reduce((sum, e) => sum + e.predictions.length, 0)} predicciones
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <div className="text-white">Cargando predicciones premium...</div>
          </div>
        </div>
      )}

      {/* Events with Predictions */}
      {!isLoading && filteredEvents.length > 0 && (
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <div
              key={event.eventId}
              className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition-all"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-semibold">
                      {event.sport}
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      {event.homeTeam} vs {event.awayTeam}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    {format(new Date(event.startTime), 'dd MMM yyyy, HH:mm', { locale: es })} •{' '}
                    {formatDistanceToNow(new Date(event.startTime), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <Link
                  to={`/events/${event.eventId}`}
                  className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-semibold"
                >
                  Ver Detalles →
                </Link>
              </div>

              {/* Predictions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.predictions
                  .filter((pred) => pred.confidence >= minConfidence && pred.value >= minValue)
                  .map((prediction, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-4 border-2 ${
                        prediction.recommendation === 'STRONG_BUY'
                          ? 'bg-green-500/10 border-green-500/40'
                          : prediction.recommendation === 'BUY'
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-dark-800/50 border-primary-500/20'
                      }`}
                    >
                      {/* Selection Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-black text-white">{prediction.selection}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-black border ${getRecommendationColor(
                            prediction.recommendation
                          )}`}
                        >
                          {getRecommendationText(prediction.recommendation)}
                        </span>
                      </div>

                      {/* Comparison */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Nuestra Predicción:</span>
                          <span className="text-lg font-black text-primary-400">
                            {(prediction.predictedProbability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Mercado (Implícita):</span>
                          <span className="text-lg font-semibold text-gray-300">
                            {((1 / prediction.marketOdds) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Cuota del Mercado:</span>
                          <span className="text-lg font-semibold text-white">
                            {prediction.marketOdds.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-px bg-primary-500/20 my-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-300">Valor Encontrado:</span>
                          <span
                            className={`text-xl font-black ${
                              prediction.value > 10
                                ? 'text-green-400'
                                : prediction.value > 5
                                ? 'text-green-300'
                                : 'text-yellow-400'
                            }`}
                          >
                            +{prediction.value.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Confidence & Metrics */}
                      <div className="flex items-center justify-between pt-3 border-t border-primary-500/10">
                        <div>
                          <span className="text-xs text-gray-500">Confianza:</span>
                          <span
                            className={`ml-2 text-sm font-semibold ${
                              prediction.confidence > 0.8
                                ? 'text-green-400'
                                : prediction.confidence > 0.7
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          >
                            {(prediction.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          EV: +{((prediction.predictedProbability * prediction.marketOdds - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* No predictions message */}
              {event.predictions.filter(
                (pred) => pred.confidence >= minConfidence && pred.value >= minValue
              ).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay predicciones que cumplan los filtros para este evento
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEvents.length === 0 && (
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-12 border border-primary-500/20 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-400 mb-2 text-lg font-semibold">No hay predicciones disponibles</p>
          <p className="text-sm text-gray-500">
            Ajusta los filtros o intenta con otro deporte. Las predicciones se generan automáticamente para eventos
            próximos.
          </p>
        </div>
      )}
    </div>
  );
}


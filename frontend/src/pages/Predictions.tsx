/**
 * Predictions Page - Premium Prediction System
 * The flagship feature: Best-in-market prediction system
 * 
 * IMPORTANT: These are probabilistic predictions, not guarantees.
 * Confidence levels indicate the model's certainty, not a promise of outcome.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import { eventsService } from '../services/eventsService';
import { theOddsApiService } from '../services/theOddsApiService';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';

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
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [minValue, setMinValue] = useState<number>(0);

  // Get available sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => theOddsApiService.getSports(),
    staleTime: 3600000,
  });

  const queryClient = useQueryClient();

  // WebSocket for real-time prediction updates
  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    autoConnect: true,
    channels: ['predictions:all'],
  });

  // Listen for prediction updates via WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const handlePredictionUpdate = (data: any) => {
      // Invalidate queries to refetch predictions
      queryClient.invalidateQueries({ queryKey: ['eventsWithPredictions'] });
      
      // Show toast notification if prediction changed significantly
      if (data.prediction?.change && Math.abs(data.prediction.change) > 0.1) {
        const changePercent = (data.prediction.change * 100).toFixed(1);
        const direction = data.prediction.change > 0 ? 'aumentó' : 'disminuyó';
        toast.success(
          `Predicción actualizada: ${data.prediction.eventName} - ${data.prediction.selection} ${direction} ${Math.abs(changePercent)}%`,
          { duration: 5000 }
        );
      }
    };

    const handleBatchUpdate = (data: any) => {
      // Invalidate queries to refetch all predictions
      queryClient.invalidateQueries({ queryKey: ['eventsWithPredictions'] });
      
      if (data.updates && data.updates.length > 0) {
        toast.success(
          `${data.updates.length} predicción${data.updates.length > 1 ? 'es' : ''} actualizada${data.updates.length > 1 ? 's' : ''}`,
          { duration: 3000 }
        );
      }
    };

    subscribe('prediction:update', handlePredictionUpdate);
    subscribe('prediction:batch-update', handleBatchUpdate);

    return () => {
      unsubscribe('prediction:update', handlePredictionUpdate);
      unsubscribe('prediction:batch-update', handleBatchUpdate);
    };
  }, [isConnected, subscribe, unsubscribe, queryClient]);

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
            const errorMessage = err.message || err.toString() || 'Unknown error';
            // Only log if it's not the markets error (we handle that gracefully)
            if (!errorMessage.includes('markets')) {
              console.warn(`Error getting predictions for event ${event.id}:`, errorMessage);
            }
          }
        }
        
        return eventsWithPreds;
      } catch (error: any) {
        console.error('Error loading predictions:', error);
        toast.error('Error al cargar predicciones');
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    staleTime: 15000, // Consider stale after 15 seconds
    enabled: true, // Always enabled, even when 'all' is selected
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
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 shadow-lg shadow-green-500/30';
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'HOLD':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'AVOID':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return 'COMPRA FUERTE';
      case 'BUY':
        return 'COMPRA';
      case 'HOLD':
        return 'MANTENER';
      case 'AVOID':
        return 'EVITAR';
      default:
        return rec;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) {
      return { text: 'Muy Alta', color: 'text-green-400 bg-green-500/20 border-green-500/40', icon: '🔥' };
    } else if (confidence >= 0.75) {
      return { text: 'Alta', color: 'text-blue-400 bg-blue-500/20 border-blue-500/40', icon: '⭐' };
    } else if (confidence >= 0.65) {
      return { text: 'Media', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40', icon: '📊' };
    } else {
      return { text: 'Baja', color: 'text-gray-400 bg-gray-500/20 border-gray-500/40', icon: '⚠️' };
    }
  };

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

  const totalPredictions = filteredEvents.reduce((sum, e) => sum + e.predictions.length, 0);
  const avgConfidence = filteredEvents.length > 0
    ? filteredEvents.reduce((sum, e) => 
        sum + e.predictions.reduce((pSum, p) => pSum + p.confidence, 0) / e.predictions.length, 0
      ) / filteredEvents.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  Predicciones Premium
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/40">
                  PREMIUM
                </span>
              </div>
              <p className="text-gray-400 text-lg">
                Análisis probabilístico avanzado con comparación en tiempo real vs cuotas del mercado
              </p>
            </div>
            <button
              onClick={() => generatePredictionsMutation.mutate()}
              disabled={generatePredictionsMutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary-500/30"
            >
              {generatePredictionsMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generar Predicciones</span>
                </>
              )}
            </button>
          </div>

          {/* Important Disclaimer */}
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-amber-300 font-bold mb-1">Importante: Predicciones Probabilísticas</h3>
                <p className="text-amber-100/90 text-sm leading-relaxed">
                  Estas son <strong>predicciones probabilísticas</strong> basadas en análisis de datos y modelos estadísticos, 
                  <strong> no son garantías de resultados</strong>. Los niveles de confianza indican la certeza del modelo, 
                  no una promesa de resultado. El 93% de confianza significa que el modelo estima una probabilidad del 93%, 
                  pero <strong>siempre existe riesgo</strong>. Apuesta responsablemente y nunca arriesgues más de lo que puedes permitirte perder.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Deporte</label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="all">🌍 Todos los Deportes</option>
                {sports?.filter(s => s.active).map((sport) => (
                  <option key={sport.key} value={sport.key}>
                    {sport.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Confianza Mínima: <span className="text-primary-400">{(minConfidence * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Value Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Valor Mínimo: <span className="text-primary-400">{minValue >= 0 ? '+' : ''}{(minValue * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="-0.1"
                max="0.2"
                step="0.01"
                value={minValue}
                onChange={(e) => setMinValue(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-10%</span>
                <span>+20%</span>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Resumen</label>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Eventos</span>
                    <span className="text-white font-bold text-lg">{filteredEvents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Predicciones</span>
                    <span className="text-white font-bold text-lg">{totalPredictions}</span>
                  </div>
                  {avgConfidence > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                      <span className="text-gray-400 text-sm">Confianza Promedio</span>
                      <span className="text-primary-400 font-bold">{(avgConfidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-4"></div>
              <div className="text-white text-lg font-semibold">Cargando predicciones...</div>
              <p className="text-gray-400 text-sm mt-2">Analizando eventos y calculando probabilidades</p>
            </div>
          </div>
        )}

        {/* Events with Predictions */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="space-y-8">
            {filteredEvents.map((event) => (
              <div
                key={event.eventId}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:border-slate-600 transition-all duration-300"
              >
                {/* Event Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 border-b border-slate-700">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-xs font-bold border border-primary-500/40">
                          {event.sport}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black text-white">
                          {event.homeTeam} <span className="text-gray-500">vs</span> {event.awayTeam}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(event.startTime), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDistanceToNow(new Date(event.startTime), { addSuffix: true, locale: es })}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/events/${event.eventId}`}
                      className="px-5 py-2.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/40 text-primary-300 rounded-xl hover:border-primary-500/60 transition-all text-sm font-semibold flex items-center gap-2"
                    >
                      Ver Detalles
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Predictions Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.predictions
                      .filter((pred) => pred.confidence >= minConfidence && pred.value >= minValue)
                      .map((prediction, idx) => {
                        const confidenceBadge = getConfidenceBadge(prediction.confidence);
                        return (
                          <div
                            key={idx}
                            className={`rounded-xl p-5 border-2 transition-all duration-200 hover:scale-[1.02] ${
                              prediction.recommendation === 'STRONG_BUY'
                                ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/50 shadow-lg shadow-green-500/20'
                                : prediction.recommendation === 'BUY'
                                ? 'bg-green-500/5 border-green-500/30'
                                : prediction.recommendation === 'HOLD'
                                ? 'bg-yellow-500/5 border-yellow-500/30'
                                : 'bg-red-500/5 border-red-500/30'
                            }`}
                          >
                            {/* Selection Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-black text-white mb-2">{prediction.selection}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${confidenceBadge.color}`}>
                                    {confidenceBadge.icon} {confidenceBadge.text}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(prediction.confidence * 100).toFixed(0)}% confianza
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-black border ${getRecommendationColor(
                                  prediction.recommendation
                                )}`}
                              >
                                {getRecommendationText(prediction.recommendation)}
                              </span>
                            </div>

                            {/* Probability Comparison */}
                            <div className="space-y-3 mb-4">
                              <div className="bg-slate-900/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-400 font-medium">Nuestra Predicción</span>
                                  <span className="text-xl font-black text-primary-400">
                                    {(prediction.predictedProbability * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                                    style={{ width: `${prediction.predictedProbability * 100}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="bg-slate-900/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-400 font-medium">Mercado (Implícita)</span>
                                  <span className="text-lg font-semibold text-gray-300">
                                    {((1 / prediction.marketOdds) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-gray-500 h-2 rounded-full"
                                    style={{ width: `${(1 / prediction.marketOdds) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Valor Encontrado</div>
                                <div
                                  className={`text-lg font-black ${
                                    prediction.value > 10
                                      ? 'text-green-400'
                                      : prediction.value > 5
                                      ? 'text-green-300'
                                      : prediction.value > 0
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                                  }`}
                                >
                                  {prediction.value >= 0 ? '+' : ''}{prediction.value.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Cuota Mercado</div>
                                <div className="text-lg font-bold text-white">
                                  {prediction.marketOdds.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Expected Value */}
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Valor Esperado (EV)</span>
                                <span className="text-sm font-bold text-primary-400">
                                  +{((prediction.predictedProbability * prediction.marketOdds - 1) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* No predictions message */}
                  {event.predictions.filter(
                    (pred) => pred.confidence >= minConfidence && pred.value >= minValue
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No hay predicciones que cumplan los filtros para este evento</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEvents.length === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-16 border border-slate-700/50 text-center shadow-xl">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No hay predicciones disponibles</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Ajusta los filtros o intenta con otro deporte. Las predicciones se generan automáticamente para eventos próximos con odds disponibles.
            </p>
            <button
              onClick={() => generatePredictionsMutation.mutate()}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors"
            >
              Generar Predicciones
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Predictions Page - Premium Prediction System
 * Professional, modern, and beautiful interface
 * The flagship feature: Best-in-market prediction system
 * 
 * IMPORTANT: These are probabilistic predictions, not guarantees.
 * Confidence levels indicate the model's certainty, not a promise of outcome.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { predictionsService } from '../services/predictionsService';
import { eventsService } from '../services/eventsService';
import { theOddsApiService } from '../services/theOddsApiService';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';
import PredictionCard from '../components/PredictionCard';
import PredictionComparisonChart from '../components/PredictionComparisonChart';
import PredictionStatsDashboard from '../components/PredictionStatsDashboard';
import PredictionDetailsModal from '../components/PredictionDetailsModal';
import PredictionConfidenceHeatmap from '../components/PredictionConfidenceHeatmap';
import { VirtualizedList } from '../components/VirtualizedList';
import Icon from '../components/icons/IconSystem';

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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Leer parámetros de la URL al cargar la página
  const urlSport = searchParams.get('sport') || 'all';
  const urlLeague = searchParams.get('league') || null;
  
  const [selectedSport, setSelectedSport] = useState<string>(urlSport);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(urlLeague);
  // Si hay filtro de league desde el heatmap, usar filtros más permisivos inicialmente
  const [minConfidence, setMinConfidence] = useState<number>(urlLeague ? 0.0 : 0.0);
  const [minValue, setMinValue] = useState<number>(urlLeague ? -0.2 : -0.1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'confidence' | 'value' | 'time'>('value');
  const [selectedPrediction, setSelectedPrediction] = useState<{
    predictionId?: string;
    eventId: string;
    marketId?: string;
    selection: string;
    predictedProbability: number;
    confidence: number;
    eventName: string;
    sport: string;
  } | null>(null);

  // Sincronizar selectedSport con parámetros de URL cuando cambian
  useEffect(() => {
    const sportParam = searchParams.get('sport');
    const leagueParam = searchParams.get('league');
    
    if (sportParam && sportParam !== selectedSport) {
      setSelectedSport(sportParam);
    }
    
    if (leagueParam !== selectedLeague) {
      setSelectedLeague(leagueParam);
    }
  }, [searchParams, selectedSport, selectedLeague]);

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
      queryClient.invalidateQueries({ queryKey: ['eventsWithPredictions'] });
      
      if (data.prediction?.change && Math.abs(data.prediction.change) > 0.1) {
        const changePercent = (data.prediction.change * 100).toFixed(1);
        const direction = data.prediction.change > 0 ? 'aumentó' : 'disminuyó';
        toast.success(
          `Predicción actualizada: ${data.prediction.eventName} - ${data.prediction.selection} ${direction} ${Math.abs(parseFloat(changePercent))}%`,
          { duration: 5000 }
        );
      }
    };

    const handleBatchUpdate = (data: any) => {
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
    queryKey: ['eventsWithPredictions', selectedSport, selectedLeague],
    queryFn: async () => {
      try {
        // Si hay un filtro de league, obtener todos los eventos del sport primero
        // y luego filtrar por league en el cliente (ya que el backend puede no soportar filtro de league)
        const sportFilter = selectedSport !== 'all' ? selectedSport : undefined;
        
        // Mapear nombres de sport comunes
        let sportKey = sportFilter;
        if (sportFilter) {
          const sportMap: Record<string, string> = {
            'football': 'soccer',
            'soccer': 'soccer',
            'futbol': 'soccer',
            'basketball': 'basketball',
            'baseball': 'baseball',
          };
          sportKey = sportMap[sportFilter.toLowerCase()] || sportFilter;
        }
        
        const events = await eventsService.getUpcomingEvents(
          sportKey,
          undefined,
          true
        );
        
        if (!events || !Array.isArray(events) || events.length === 0) {
          console.log(`No events found for sport: ${selectedSport}`);
          return [];
        }
        
        console.log(`Found ${events.length} events for sport: ${selectedSport} (key: ${sportKey})`);
        
        const eventsWithPreds: EventPrediction[] = [];
        // Increased limits to show more predictions - mercado completo
        const eventLimit = selectedSport === 'all' ? 200 : 100;
        
        for (const event of events.slice(0, eventLimit)) {
          try {
            const predictions = await predictionsService.getEventPredictions(event.id);
            
            // Log para debug cuando hay filtro de league
            if (selectedLeague) {
              const eventAny = event as any;
              const eventLeague = eventAny.metadata?.league || eventAny.league || 'none';
              console.log(`Event ${event.id} (${event.homeTeam} vs ${event.awayTeam}): ${predictions.length} predictions, league="${eventLeague}", sport="${event.sport?.name}"`);
            } else {
              console.log(`Event ${event.id}: Found ${predictions.length} predictions`);
            }
            
            if (predictions && predictions.length > 0) {
              let eventDetails;
              try {
                eventDetails = await eventsService.getEventDetails(event.id);
              } catch (err: any) {
                console.warn(`Error getting event details for ${event.id}:`, err.message);
                eventDetails = null;
              }
              
              const predictionsWithOdds = predictions.map((pred: any) => {
                let marketOdds = 2.0;
                if (eventDetails?.markets && eventDetails.markets.length > 0) {
                  const market = eventDetails.markets.find((m: any) => m.id === pred.marketId);
                  if (market?.odds) {
                    const odds = market.odds.find((o: any) => o.selection === pred.selection);
                    if (odds) marketOdds = odds.decimal;
                  }
                }
                
                // Try to get market odds from factors if available
                if (pred.factors) {
                  const factors = pred.factors as any;
                  if (factors.marketAverage) {
                    // Calculate average odds from marketAverage
                    const selection = pred.selection.toLowerCase();
                    let impliedProb = 0.33; // Default
                    if (selection.includes('home') || selection === '1') {
                      impliedProb = factors.marketAverage.home || impliedProb;
                    } else if (selection.includes('away') || selection === '2') {
                      impliedProb = factors.marketAverage.away || impliedProb;
                    } else if (selection.includes('draw') || selection === 'x' || selection === '3') {
                      impliedProb = factors.marketAverage.draw || impliedProb;
                    }
                    if (impliedProb > 0) {
                      marketOdds = 1 / impliedProb;
                    }
                  }
                  // Also check marketOdds directly
                  if (factors.advancedFeatures?.marketOdds?.median) {
                    marketOdds = factors.advancedFeatures.marketOdds.median;
                  }
                }
                
                const impliedMarketProb = 1 / marketOdds;
                const value = pred.predictedProbability - impliedMarketProb;
                const valuePercentage = value * 100;
                
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
                  id: pred.id, // Include prediction ID
                  eventId: event.id,
                  marketId: pred.marketId,
                  selection: pred.selection,
                  predictedProbability: pred.predictedProbability,
                  marketOdds,
                  value: valuePercentage,
                  confidence: pred.confidence,
                  recommendation,
                  factors: pred.factors, // Include factors for modal
                };
              });
              
              // Incluir metadata del evento para filtrado de league
              const eventWithMetadata = {
                eventId: event.id,
                eventName: `${event.homeTeam} vs ${event.awayTeam}`,
                homeTeam: event.homeTeam,
                awayTeam: event.awayTeam,
                startTime: event.startTime,
                sport: event.sport?.name || 'Unknown',
                predictions: predictionsWithOdds,
                // Incluir metadata para filtrado
                metadata: (event as any).metadata,
                league: (event as any).metadata?.league || (event as any).league,
                event: event, // Incluir el evento completo para acceso a metadata
              };
              
              eventsWithPreds.push(eventWithMetadata as EventPrediction);
            }
          } catch (err: any) {
            const errorMessage = err.message || err.toString() || 'Unknown error';
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
    refetchInterval: 15000, // Update every 15 seconds for real-time feel
    staleTime: 5000, // Consider stale after 5 seconds
    enabled: true,
  });

  // Filter and sort predictions - Memoizado con filtro de league mejorado
  const filteredEvents = useMemo(() => {
    if (!eventsWithPredictions) return [];
    
    console.log(`\n=== FILTRANDO PREDICCIONES ===`);
    console.log(`Total eventos: ${eventsWithPredictions.length}`);
    console.log(`Filtros: sport="${selectedSport}", league="${selectedLeague}"`);
    console.log(`Min confidence: ${minConfidence}, Min value: ${minValue}`);
    
    const filtered = eventsWithPredictions.filter((event) => {
      // Filtrar por sport si está seleccionado - comparación flexible
      if (selectedSport !== 'all') {
        const eventSport = (event.sport || '').toLowerCase().trim();
        const selectedSportLower = selectedSport.toLowerCase().trim();
        
        // Mapeo de nombres comunes de deportes (más completo)
        const sportMappings: Record<string, string[]> = {
          'football': ['football', 'soccer', 'futbol', 'fútbol'],
          'soccer': ['football', 'soccer', 'futbol', 'fútbol'],
          'futbol': ['football', 'soccer', 'futbol', 'fútbol'],
          'basketball': ['basketball', 'baloncesto'],
          'baseball': ['baseball', 'beisbol', 'béisbol'],
        };
        
        // Verificar coincidencia directa o mediante mapeo
        const sportMatches = eventSport === selectedSportLower || 
                            eventSport.includes(selectedSportLower) ||
                            selectedSportLower.includes(eventSport) ||
                            sportMappings[selectedSportLower]?.includes(eventSport) ||
                            sportMappings[eventSport]?.includes(selectedSportLower);
        
        if (!sportMatches) {
          console.log(`Event ${event.eventId} filtered out: sport "${eventSport}" !== "${selectedSportLower}"`);
          return false;
        }
      }
      
      // Filtrar por league si está seleccionado - MUY PERMISIVO
      // Si el heatmap muestra predicciones para una liga, esos eventos DEBEN aparecer
      if (selectedLeague) {
        const eventAny = event as any;
        
        // Usar la misma lógica que el heatmap
        const sportName = event.sport || 'Unknown';
        const eventLeagueName = eventAny.metadata?.league || 
                               eventAny.league || 
                               eventAny.event?.metadata?.league || 
                               eventAny.event?.league || 
                               eventAny.sport?.name || 
                               sportName;
        
        const homeTeam = (event.homeTeam || '').toLowerCase();
        const awayTeam = (event.awayTeam || '').toLowerCase();
        const selectedLeagueLower = selectedLeague.toLowerCase();
        const eventLeagueLower = (eventLeagueName || '').toLowerCase();
        
        // Normalizar para comparación
        const normalize = (name: string) => {
          if (!name) return '';
          return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/premierleague|premier|englishpremierleague|englishpremier|english/g, 'epl')
            .replace(/laliga|spain|spanishlaliga|spanish/g, 'laliga')
            .replace(/seriea|italy|italianseriea|italian/g, 'seriea');
        };
        
        const normalizedSelected = normalize(selectedLeague);
        const normalizedEvent = normalize(eventLeagueName);
        
        // Equipos conocidos por liga
        const eplTeams = ['manchester', 'liverpool', 'chelsea', 'arsenal', 'tottenham', 'city', 'united', 'everton', 'newcastle', 'brighton', 'crystal', 'wolves', 'villa', 'leicester', 'southampton', 'burnley', 'watford', 'norwich', 'brentford', 'fulham', 'bournemouth'];
        const laligaTeams = ['real madrid', 'barcelona', 'atletico', 'sevilla', 'valencia', 'villarreal', 'sociedad', 'athletic', 'betis', 'espanyol', 'getafe', 'celta', 'levante', 'granada'];
        const serieaTeams = ['juventus', 'inter', 'milan', 'napoli', 'roma', 'atalanta', 'lazio', 'fiorentina', 'torino', 'sampdoria', 'udinese', 'bologna', 'verona', 'sassuolo'];
        
        // Múltiples formas de verificar coincidencia
        const exactMatch = eventLeagueLower === selectedLeagueLower ||
                          eventLeagueLower.includes(selectedLeagueLower) ||
                          selectedLeagueLower.includes(eventLeagueLower);
        
        const normalizedMatch = normalizedEvent === normalizedSelected ||
                               normalizedEvent.includes(normalizedSelected) ||
                               normalizedSelected.includes(normalizedEvent);
        
        const teamMatch = 
          (normalizedSelected === 'epl' && eplTeams.some(t => homeTeam.includes(t) || awayTeam.includes(t))) ||
          (normalizedSelected === 'laliga' && laligaTeams.some(t => homeTeam.includes(t) || awayTeam.includes(t))) ||
          (normalizedSelected === 'seriea' && serieaTeams.some(t => homeTeam.includes(t) || awayTeam.includes(t)));
        
        // Si el heatmap mostró predicciones para esta liga, ser MUY permisivo
        // Si el sport coincide y es football/soccer, probablemente es de esa liga
        const sportMatch = selectedSport !== 'all' && 
                          (event.sport?.toLowerCase().includes('football') || 
                           event.sport?.toLowerCase().includes('soccer')) &&
                          (selectedSport.toLowerCase().includes('football') || 
                           selectedSport.toLowerCase().includes('soccer'));
        
        const leagueMatches = exactMatch || normalizedMatch || teamMatch || 
                             // Si no hay metadata.league específica y el sport coincide, permitir
                             (sportMatch && !eventAny.metadata?.league && normalizedSelected !== '');
        
        if (!leagueMatches) {
          console.log(`✗ Event ${event.eventId} filtered: "${eventLeagueName}" !== "${selectedLeague}"`);
          console.log(`  - Teams: ${homeTeam} vs ${awayTeam}`);
          console.log(`  - Normalized: "${normalizedEvent}" vs "${normalizedSelected}"`);
          return false;
        } else {
          console.log(`✓ Event ${event.eventId} MATCHES: "${eventLeagueName}" (${event.predictions.length} preds)`);
        }
      }
      
      // Filtrar por confianza y valor - PERO solo si hay predicciones que cumplan
      // Si hay filtro de league, ser más permisivo con los filtros de confianza/valor
      const effectiveMinConfidence = selectedLeague ? Math.max(0, minConfidence - 0.1) : minConfidence;
      const effectiveMinValue = selectedLeague ? Math.max(-0.2, minValue - 0.05) : minValue;
      
      const validPredictions = event.predictions.filter(
        (pred) =>
          pred.confidence >= effectiveMinConfidence &&
          pred.value >= effectiveMinValue
      );
      
      const hasValidPredictions = validPredictions.length > 0;
      
      if (!hasValidPredictions) {
        console.log(`Event ${event.eventId} filtered out: no predictions match confidence>=${effectiveMinConfidence} and value>=${effectiveMinValue}`);
        console.log(`  - Total predictions: ${event.predictions.length}`);
        if (event.predictions.length > 0) {
          const minConf = Math.min(...event.predictions.map(p => p.confidence));
          const maxConf = Math.max(...event.predictions.map(p => p.confidence));
          const minVal = Math.min(...event.predictions.map(p => p.value));
          const maxVal = Math.max(...event.predictions.map(p => p.value));
          console.log(`  - Confidence range: ${minConf.toFixed(2)} - ${maxConf.toFixed(2)}`);
          console.log(`  - Value range: ${minVal.toFixed(2)} - ${maxVal.toFixed(2)}`);
        }
      } else {
        console.log(`✓ Event ${event.eventId} has ${validPredictions.length} valid predictions (from ${event.predictions.length} total)`);
      }
      
      return hasValidPredictions;
    });
    
    console.log(`Filtered to ${filtered.length} events (from ${eventsWithPredictions.length})`);
    return filtered;
  }, [eventsWithPredictions, minConfidence, minValue, selectedSport, selectedLeague]);

  // Sort events - Memoizado
  const sortedEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort((a: EventPrediction, b: EventPrediction) => {
      if (sortBy === 'time') {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
      
      const aBest = Math.max(...a.predictions.map((p: { confidence: number; value: number }) => sortBy === 'confidence' ? p.confidence : p.value));
      const bBest = Math.max(...b.predictions.map((p: { confidence: number; value: number }) => sortBy === 'confidence' ? p.confidence : p.value));
      return bBest - aBest;
    });
    return sorted;
  }, [filteredEvents, sortBy]);

  // Flatten predictions for list view - Memoizado
  const allPredictions = useMemo(() => {
    const flattened = sortedEvents.flatMap((event: EventPrediction) =>
      event.predictions
        .filter((pred: { confidence: number; value: number }) => pred.confidence >= minConfidence && pred.value >= minValue)
        .map((pred: { selection: string; predictedProbability: number; marketOdds: number; value: number; confidence: number; recommendation: string }) => ({ ...pred, event }))
    );

    // Sort flattened predictions
    if (sortBy === 'value') {
      flattened.sort((a: { value: number }, b: { value: number }) => b.value - a.value);
    } else if (sortBy === 'confidence') {
      flattened.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);
    }
    
    return flattened;
  }, [sortedEvents, minConfidence, minValue, sortBy]);

  // Mutation to generate predictions manually
  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      console.log('Generating predictions...');
      return await predictionsService.generatePredictions();
    },
    onSuccess: (data) => {
      toast.success(`Predicciones generadas: ${data.generated} nuevas, ${data.updated} actualizadas`);
      queryClient.invalidateQueries({ queryKey: ['eventsWithPredictions'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Error desconocido';
      toast.error(`Error al generar predicciones: ${errorMessage}`);
    },
  });

  // Calculate statistics - Memoizado
  const totalPredictions = useMemo(() => filteredEvents.reduce((sum: number, e: EventPrediction) => sum + e.predictions.length, 0), [filteredEvents]);
  const avgConfidence = useMemo(() => filteredEvents.length > 0
    ? filteredEvents.reduce((sum: number, e: EventPrediction) => 
        sum + e.predictions.reduce((pSum: number, p: { confidence: number }) => pSum + p.confidence, 0) / e.predictions.length, 0
      ) / filteredEvents.length
    : 0, [filteredEvents]);
  const highValueCount = useMemo(() => allPredictions.filter((p: { value: number }) => p.value > 10).length, [allPredictions]);
  const strongBuyCount = useMemo(() => allPredictions.filter((p: { recommendation: string }) => p.recommendation === 'STRONG_BUY').length, [allPredictions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background - Mejorado */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 z-10">
        {/* Header Section - Better organized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  Predicciones Premium
                </h1>
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 rounded-full text-xs sm:text-sm font-black border-2 border-amber-500/40 shadow-lg shadow-amber-500/20 w-fit">
                  ⭐ PREMIUM
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg font-medium max-w-2xl">
                Análisis probabilístico avanzado con comparación en tiempo real vs cuotas del mercado
              </p>
            </div>
            <button
              onClick={() => generatePredictionsMutation.mutate()}
              disabled={generatePredictionsMutation.isPending}
              className="px-5 sm:px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:scale-105 w-full md:w-auto shrink-0"
            >
              {generatePredictionsMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Icon name="zap" size={20} />
                  <span>Generar Predicciones</span>
                </>
              )}
            </button>
          </div>

          {/* Important Disclaimer - More compact */}
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Icon name="alert" size={24} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-amber-300 font-bold mb-1.5 text-sm sm:text-base">Importante: Predicciones Probabilísticas</h3>
                <p className="text-amber-100/90 text-xs sm:text-sm leading-relaxed">
                  Estas son <strong>predicciones probabilísticas</strong> basadas en análisis de datos y modelos estadísticos, 
                  <strong> no son garantías de resultados</strong>. Los niveles de confianza indican la certeza del modelo, 
                  no una promesa de resultado. <strong>Siempre existe riesgo</strong>. Apuesta responsablemente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mb-6 sm:mb-8">
          <PredictionStatsDashboard
            totalEvents={filteredEvents.length}
            totalPredictions={totalPredictions}
            avgConfidence={avgConfidence}
            highValueCount={highValueCount}
            strongBuyCount={strongBuyCount}
          />
        </div>

        {/* Prediction Confidence Heatmap - Mejorado con mejor integración */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl border-2 border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center border border-primary-500/40 shadow-lg">
                  <Icon name="chart" size={20} className="text-primary-300" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Mapa de Confianza de Predicciones</h2>
                  <p className="text-xs text-gray-400">Visualiza dónde el modelo tiene mayor confianza por deporte y liga</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <PredictionConfidenceHeatmap />
            </div>
          </div>
        </div>

        {/* Filters Section - Mejorado */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl border-2 border-slate-700/50 p-5 sm:p-6 mb-6 sm:mb-8 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
              <Icon name="settings" size={16} className="text-primary-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">Filtros y Opciones</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {/* Sport Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Deporte</label>
              <select
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value);
                  // Actualizar URL cuando cambia el filtro
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value === 'all') {
                    newParams.delete('sport');
                  } else {
                    newParams.set('sport', e.target.value);
                  }
                  // Si cambia el sport, eliminar el filtro de league
                  if (e.target.value !== selectedSport) {
                    newParams.delete('league');
                    setSelectedLeague(null);
                  }
                  setSearchParams(newParams);
                }}
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="all">🌍 Todos los Deportes</option>
                {sports?.filter(s => s.active).map((sport) => (
                  <option key={sport.key} value={sport.key}>
                    {sport.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* League Filter - Mostrar si hay league en URL o si está seleccionado un sport */}
            {selectedLeague && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Liga: <span className="text-primary-400 font-bold">{selectedLeague}</span>
                </label>
                <button
                  onClick={() => {
                    setSelectedLeague(null);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('league');
                    setSearchParams(newParams);
                  }}
                  className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 text-sm font-semibold transition-all"
                >
                  Limpiar Filtro de Liga
                </button>
              </div>
            )}

            {/* Confidence Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Confianza: <span className="text-primary-400 font-bold">{(minConfidence * 100).toFixed(0)}%</span>
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
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Valor: <span className="text-primary-400 font-bold">{minValue >= 0 ? '+' : ''}{(minValue * 100).toFixed(0)}%</span>
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

            {/* View Mode */}
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Vista</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="chart" size={18} />
                    <span>Grid</span>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="file" size={18} />
                    <span>Lista</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Ordenar</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'confidence' | 'value' | 'time')}
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="value">Por Valor</option>
                <option value="confidence">Por Confianza</option>
                <option value="time">Por Tiempo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-primary-500 border-t-transparent mb-6"></div>
              <div className="text-white text-2xl font-black mb-2">Cargando predicciones...</div>
              <p className="text-gray-400 text-lg">Analizando eventos y calculando probabilidades</p>
            </div>
          </div>
        )}

        {/* Predictions Display */}
        {!isLoading && (
          <>
            {viewMode === 'grid' ? (
              // Grid View
              <div className="space-y-8">
                {sortedEvents.map((event: EventPrediction) => (
                  <div
                    key={event.eventId}
                    className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-slate-700/50 overflow-hidden shadow-2xl hover:shadow-primary-500/20 hover:border-primary-500/30 transition-all duration-300 hover:scale-[1.01] group"
                  >
                    {/* Event Header - Mejorado */}
                    <div className="bg-gradient-to-r from-slate-800/90 via-slate-900/90 to-slate-800/90 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b-2 border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
                      {/* Subtle shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-500/20 text-primary-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black border-2 border-primary-500/40 w-fit">
                              {event.sport}
                            </span>
                            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white break-words">
                              {event.homeTeam} <span className="text-gray-500">vs</span> {event.awayTeam}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(event.startTime), 'dd MMM yyyy, HH:mm', { locale: es })}
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDistanceToNow(new Date(event.startTime), { addSuffix: true, locale: es })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Open modal with first prediction or event details
                            const firstPred = event.predictions.find((p: any) => p.confidence >= minConfidence && p.value >= minValue);
                            if (firstPred) {
                              setSelectedPrediction({
                                predictionId: (firstPred as any).id,
                                eventId: event.eventId,
                                marketId: (firstPred as any).marketId,
                                selection: firstPred.selection,
                                predictedProbability: firstPred.predictedProbability,
                                confidence: firstPred.confidence,
                                eventName: event.eventName,
                                sport: event.sport,
                              });
                            } else {
                              // Fallback: navigate to event page
                              window.location.href = `/events/${event.eventId}`;
                            }
                          }}
                          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500/20 hover:bg-primary-500/30 border-2 border-primary-500/40 text-primary-300 rounded-lg sm:rounded-xl hover:border-primary-500/60 transition-all font-black text-sm sm:text-base flex items-center justify-center gap-2 hover:scale-105 w-full md:w-auto shrink-0"
                        >
                          Ver Detalles
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Predictions Grid - Mercado Completo Mejorado */}
                    <div className="p-4 sm:p-6 md:p-8">
                      <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-primary-500/30">
                              <Icon name="chart" size={16} className="text-primary-300" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-black text-white">
                              Mercado de Predicciones
                            </h4>
                          </div>
                          <p className="text-sm text-gray-400 ml-0 sm:ml-11">
                            <span className="font-semibold text-white">
                              {event.predictions.filter((pred) => pred.confidence >= minConfidence && pred.value >= minValue).length}
                            </span> predicciones disponibles • 
                            <span className="font-semibold text-emerald-400">
                              {' '}{event.predictions.filter((pred) => pred.recommendation === 'STRONG_BUY').length}
                            </span> oportunidades destacadas
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 py-2 rounded-full border border-green-500/30 shadow-lg">
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          <span className="font-bold text-green-400">Tiempo Real</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {event.predictions
                          .filter((pred) => pred.confidence >= minConfidence && pred.value >= minValue)
                          .sort((a, b) => b.value - a.value) // Sort by value (best first)
                          .map((prediction, idx) => (
                            <PredictionCard
                              key={idx}
                              prediction={prediction}
                              eventName={event.eventName}
                              startTime={event.startTime}
                              sport={event.sport}
                              onViewDetails={() => {
                                setSelectedPrediction({
                                  predictionId: (prediction as any).id,
                                  eventId: event.eventId,
                                  marketId: (prediction as any).marketId,
                                  selection: prediction.selection,
                                  predictedProbability: prediction.predictedProbability,
                                  confidence: prediction.confidence,
                                  eventName: event.eventName,
                                  sport: event.sport,
                                });
                              }}
                            />
                          ))}
                      </div>

                      {event.predictions.filter(
                        (pred: { confidence: number; value: number }) => pred.confidence >= minConfidence && pred.value >= minValue
                      ).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <p className="text-lg">No hay predicciones que cumplan los filtros para este evento</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View - Virtualizado para listas grandes (aumentado el límite)
              allPredictions.length > 100 ? (
                <VirtualizedList
                  items={allPredictions}
                  itemHeight={200}
                  containerHeight={600}
                  renderItem={(pred: { selection: string; predictedProbability: number; marketOdds: number; value: number; confidence: number; recommendation: string; event: EventPrediction }, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-800/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-700/50 p-4 sm:p-6 hover:border-slate-600 transition-all duration-200 hover:shadow-xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Event Info */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{pred.event.sport}</div>
                        <h3 className="text-lg sm:text-xl font-black text-white mb-2 break-words">{pred.event.eventName}</h3>
                        <div className="text-xl sm:text-2xl font-black text-primary-400 mb-2 break-words">{pred.selection}</div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {format(new Date(pred.event.startTime), 'dd MMM, HH:mm', { locale: es })}
                        </div>
                      </div>

                      {/* Comparison Chart */}
                      <div>
                        <PredictionComparisonChart
                          ourPrediction={pred.predictedProbability}
                          marketProbability={1 / pred.marketOdds}
                        />
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                          <div className="text-xs text-gray-500 mb-1">Valor</div>
                          <div className={`text-xl sm:text-2xl font-black ${pred.value > 10 ? 'text-emerald-400' : pred.value > 5 ? 'text-green-400' : pred.value > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {pred.value >= 0 ? '+' : ''}{pred.value.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                          <div className="text-xs text-gray-500 mb-1">Confianza</div>
                          <div className="text-xl sm:text-2xl font-black text-primary-400">
                            {(pred.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                          <div className="text-xs text-gray-500 mb-1">Cuota</div>
                          <div className="text-xl sm:text-2xl font-black text-white">
                            {pred.marketOdds.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                          <div className="text-xs text-gray-500 mb-1">Recomendación</div>
                          <div className={`text-sm sm:text-base md:text-lg font-black break-words ${
                            pred.recommendation === 'STRONG_BUY' ? 'text-emerald-400' :
                            pred.recommendation === 'BUY' ? 'text-green-400' :
                            pred.recommendation === 'HOLD' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {pred.recommendation === 'STRONG_BUY' ? '🔥 COMPRA FUERTE' :
                             pred.recommendation === 'BUY' ? '✅ COMPRA' :
                             pred.recommendation === 'HOLD' ? '⏸️ MANTENER' : '❌ EVITAR'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                />
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {allPredictions.map((pred: { selection: string; predictedProbability: number; marketOdds: number; value: number; confidence: number; recommendation: string; event: EventPrediction }, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-800/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-700/50 p-4 sm:p-6 hover:border-slate-600 transition-all duration-200 hover:shadow-xl"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Event Info */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{pred.event.sport}</div>
                          <h3 className="text-lg sm:text-xl font-black text-white mb-2 break-words">{pred.event.eventName}</h3>
                          <div className="text-xl sm:text-2xl font-black text-primary-400 mb-2 break-words">{pred.selection}</div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            {format(new Date(pred.event.startTime), 'dd MMM, HH:mm', { locale: es })}
                          </div>
                        </div>

                        {/* Comparison Chart */}
                        <div>
                          <PredictionComparisonChart
                            ourPrediction={pred.predictedProbability}
                            marketProbability={1 / pred.marketOdds}
                          />
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                            <div className="text-xs text-gray-500 mb-1">Valor</div>
                            <div className={`text-xl sm:text-2xl font-black ${pred.value > 10 ? 'text-emerald-400' : pred.value > 5 ? 'text-green-400' : pred.value > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {pred.value >= 0 ? '+' : ''}{pred.value.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                            <div className="text-xs text-gray-500 mb-1">Confianza</div>
                            <div className="text-xl sm:text-2xl font-black text-primary-400">
                              {(pred.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                            <div className="text-xs text-gray-500 mb-1">Cuota</div>
                            <div className="text-xl sm:text-2xl font-black text-white">
                              {pred.marketOdds.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                            <div className="text-xs text-gray-500 mb-1">Recomendación</div>
                            <div className={`text-sm sm:text-base md:text-lg font-black break-words ${
                              pred.recommendation === 'STRONG_BUY' ? 'text-emerald-400' :
                              pred.recommendation === 'BUY' ? 'text-green-400' :
                              pred.recommendation === 'HOLD' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {pred.recommendation === 'STRONG_BUY' ? '🔥 COMPRA FUERTE' :
                               pred.recommendation === 'BUY' ? '✅ COMPRA' :
                               pred.recommendation === 'HOLD' ? '⏸️ MANTENER' : '❌ EVITAR'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Empty State - Mejorado con información de filtros */}
            {allPredictions.length === 0 && (
              <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 sm:p-20 border-2 border-slate-700/50 text-center shadow-2xl">
                <div className="mb-8">
                  <div className="relative inline-block">
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 sm:mb-4">Mercado de Predicciones Vacío</h3>
                <p className="text-gray-400 mb-4 max-w-md mx-auto text-base sm:text-lg">
                  {selectedSport !== 'all' || selectedLeague ? (
                    <>
                      No se encontraron predicciones para{' '}
                      {selectedSport !== 'all' && <span className="text-primary-400 font-bold">{selectedSport}</span>}
                      {selectedSport !== 'all' && selectedLeague && ' en '}
                      {selectedLeague && <span className="text-primary-400 font-bold">{selectedLeague}</span>}
                      {' '}con los filtros actuales.
                    </>
                  ) : (
                    'No hay predicciones que cumplan los filtros actuales. El sistema genera predicciones automáticamente para múltiples mercados (1X2, Over/Under, Both Teams to Score, etc.) cuando hay eventos próximos con odds disponibles.'
                  )}
                </p>
                {(selectedSport !== 'all' || selectedLeague) && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-amber-300">
                      💡 <strong>Tip:</strong> Intenta ajustar los filtros de confianza y valor, o ver todas las predicciones sin filtros de deporte/liga.
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => {
                      setMinConfidence(0);
                      setMinValue(-0.1);
                      setSelectedSport('all');
                      setSelectedLeague(null);
                      const newParams = new URLSearchParams();
                      setSearchParams(newParams);
                    }}
                    className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all border border-slate-600"
                  >
                    Restablecer Todos los Filtros
                  </button>
                  <button
                    onClick={() => generatePredictionsMutation.mutate()}
                    disabled={generatePredictionsMutation.isPending}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-2xl shadow-primary-500/50 hover:scale-105"
                  >
                    {generatePredictionsMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="zap" size={20} />
                        <span>Generar Predicciones</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Prediction Details Modal */}
      {selectedPrediction && (
        <PredictionDetailsModal
          isOpen={!!selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
          predictionId={selectedPrediction.predictionId}
          eventId={selectedPrediction.eventId}
          marketId={selectedPrediction.marketId}
          selection={selectedPrediction.selection}
          predictedProbability={selectedPrediction.predictedProbability}
          confidence={selectedPrediction.confidence}
          eventName={selectedPrediction.eventName}
          sport={selectedPrediction.sport}
        />
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-shine {
          animation: shine 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

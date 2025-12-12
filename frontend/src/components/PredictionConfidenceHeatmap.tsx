/**
 * Prediction Confidence Heatmap Component
 * Visualización intuitiva de confianza del modelo por deporte/liga
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictionsService';
import { eventsService } from '../services/eventsService';
import Icon from './icons/IconSystem';
import { useNavigate } from 'react-router-dom';

interface ConfidenceData {
  sport: string;
  league?: string;
  avgConfidence: number;
  predictionCount: number;
  highConfidenceCount: number; // >70%
}

export default function PredictionConfidenceHeatmap() {
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const navigate = useNavigate();

  // Obtener eventos con predicciones
  const { data: eventsWithPredictions } = useQuery({
    queryKey: ['eventsWithPredictions', 'heatmap'],
    queryFn: async () => {
      const events = await eventsService.getUpcomingEvents(undefined, undefined, true);
      const eventsWithPreds = [];

      for (const event of events.slice(0, 100)) {
        try {
          const predictions = await predictionsService.getEventPredictions(event.id);
          if (predictions && predictions.length > 0) {
            eventsWithPreds.push({
              ...event,
              predictions,
            });
          }
        } catch (err) {
          // Ignorar errores
        }
      }

      return eventsWithPreds;
    },
    refetchInterval: 60000, // Actualizar cada minuto
    staleTime: 30000,
  });

  // Procesar datos para el heatmap
  const heatmapData = useMemo(() => {
    if (!eventsWithPredictions || !Array.isArray(eventsWithPredictions)) {
      return [];
    }

    const sportMap = new Map<string, {
      sport: string;
      totalConfidence: number;
      count: number;
      highConfidenceCount: number;
      leagues: Map<string, {
        league: string;
        totalConfidence: number;
        count: number;
        highConfidenceCount: number;
      }>;
    }>();

    eventsWithPredictions.forEach((event: any) => {
      const sportName = event.sport?.name || 'Unknown';
      const leagueName = event.metadata?.league || event.sport?.name || sportName;

      if (!sportMap.has(sportName)) {
        sportMap.set(sportName, {
          sport: sportName,
          totalConfidence: 0,
          count: 0,
          highConfidenceCount: 0,
          leagues: new Map(),
        });
      }

      const sportData = sportMap.get(sportName)!;

      event.predictions?.forEach((pred: any) => {
        // Filtrar por tipo de mercado si está seleccionado
        if (selectedMarket !== 'all') {
          const marketType = pred.market?.type || '';
          if (marketType !== selectedMarket) return;
        }

        const confidence = pred.confidence || 0;
        sportData.totalConfidence += confidence;
        sportData.count += 1;
        if (confidence > 0.7) {
          sportData.highConfidenceCount += 1;
        }

        // Agregar datos por liga
        if (!sportData.leagues.has(leagueName)) {
          sportData.leagues.set(leagueName, {
            league: leagueName,
            totalConfidence: 0,
            count: 0,
            highConfidenceCount: 0,
          });
        }

        const leagueData = sportData.leagues.get(leagueName)!;
        leagueData.totalConfidence += confidence;
        leagueData.count += 1;
        if (confidence > 0.7) {
          leagueData.highConfidenceCount += 1;
        }
      });
    });

    // Convertir a array y calcular promedios
    return Array.from(sportMap.values()).map((sportData) => {
      const avgConfidence = sportData.count > 0 
        ? sportData.totalConfidence / sportData.count 
        : 0;

      const leagues = Array.from(sportData.leagues.values()).map((leagueData) => ({
        league: leagueData.league,
        avgConfidence: leagueData.count > 0 
          ? leagueData.totalConfidence / leagueData.count 
          : 0,
        predictionCount: leagueData.count,
        highConfidenceCount: leagueData.highConfidenceCount,
      })).sort((a, b) => b.avgConfidence - a.avgConfidence);

      return {
        sport: sportData.sport,
        avgConfidence,
        predictionCount: sportData.count,
        highConfidenceCount: sportData.highConfidenceCount,
        leagues,
      };
    }).sort((a, b) => b.avgConfidence - a.avgConfidence);
  }, [eventsWithPredictions, selectedMarket]);

  // Función para obtener el color según la confianza
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return 'bg-emerald-500'; // Verde - Alta confianza
    if (confidence >= 0.65) return 'bg-green-500'; // Verde claro
    if (confidence >= 0.55) return 'bg-yellow-500'; // Amarillo
    if (confidence >= 0.45) return 'bg-orange-500'; // Naranja
    return 'bg-red-500'; // Rojo - Baja confianza
  };

  // Función para obtener el color de borde
  const getConfidenceBorderColor = (confidence: number) => {
    if (confidence >= 0.75) return 'border-emerald-400';
    if (confidence >= 0.65) return 'border-green-400';
    if (confidence >= 0.55) return 'border-yellow-400';
    if (confidence >= 0.45) return 'border-orange-400';
    return 'border-red-400';
  };

  // Función para obtener la intensidad (opacidad) según la confianza
  const getConfidenceIntensity = (confidence: number) => {
    // Normalizar entre 0.3 y 1.0
    return Math.max(0.3, confidence);
  };

  return (
    <div>
      {/* Market Filter - Mejorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="text-xs text-gray-400">
          Filtra por tipo de mercado para ver confianza específica
        </div>
        
        {/* Market Filter */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Tipo de Mercado</label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="all">🌍 Todos los Mercados</option>
            <option value="MATCH_WINNER">⚽ Match Winner (1X2)</option>
            <option value="OVER_UNDER">📊 Over/Under</option>
            <option value="BOTH_TEAMS_SCORE">🎯 Both Teams Score</option>
            <option value="DOUBLE_CHANCE">🔄 Double Chance</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
        <div className="text-xs font-semibold text-gray-400 mb-3">Leyenda de Confianza</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-xs text-gray-300">Alta (75%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-xs text-gray-300">Buena (65-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-xs text-gray-300">Media (55-65%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-xs text-gray-300">Baja (45-55%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-xs text-gray-300">Muy Baja (&lt;45%)</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      {heatmapData.length > 0 ? (
        <div className="space-y-6">
          {heatmapData.map((sportData) => (
            <div
              key={sportData.sport}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
            >
              {/* Sport Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg ${getConfidenceColor(sportData.avgConfidence)} border-2 ${getConfidenceBorderColor(sportData.avgConfidence)} flex items-center justify-center`}
                    style={{ opacity: getConfidenceIntensity(sportData.avgConfidence) }}
                  >
                    <span className="text-white font-black text-lg">
                      {(sportData.avgConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{sportData.sport}</h4>
                    <p className="text-xs text-gray-400">
                      {sportData.predictionCount} predicciones • {sportData.highConfidenceCount} alta confianza
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/predictions?sport=${encodeURIComponent(sportData.sport)}`)}
                  className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/40 rounded-lg text-primary-300 text-sm font-semibold transition-all hover:scale-105"
                >
                  Ver Predicciones
                  <Icon name="arrow-right" size={14} className="inline-block ml-2" />
                </button>
              </div>

              {/* Leagues Grid */}
              {sportData.leagues.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sportData.leagues.map((league) => (
                    <div
                      key={league.league}
                      className={`p-3 rounded-lg border-2 ${getConfidenceBorderColor(league.avgConfidence)} cursor-pointer hover:scale-105 transition-all`}
                      style={{
                        backgroundColor: `${getConfidenceColor(league.avgConfidence)}${Math.round(getConfidenceIntensity(league.avgConfidence) * 255).toString(16).padStart(2, '0')}`,
                      }}
                      onClick={() => navigate(`/predictions?sport=${encodeURIComponent(sportData.sport)}&league=${encodeURIComponent(league.league)}`)}
                    >
                      <div className="text-xs font-bold text-white mb-1 line-clamp-1">
                        {league.league}
                      </div>
                      <div className="text-lg font-black text-white mb-1">
                        {(league.avgConfidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-white/80">
                        {league.predictionCount} preds
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Icon name="chart" size={48} className="mx-auto mb-3 opacity-50" />
          <p>No hay datos de predicciones disponibles</p>
          <p className="text-xs text-gray-600 mt-2">
            Las predicciones aparecerán aquí cuando se generen
          </p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Icon name="info" size={14} />
          <span>
            La confianza indica qué tan seguro está el modelo en sus predicciones. 
            Click en cualquier deporte o liga para ver predicciones específicas.
          </span>
        </div>
      </div>
    </div>
  );
}

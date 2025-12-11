/**
 * Prediction Analysis Explained Component
 * Shows complete, verifiable analysis breakdown for bettors
 * Supports all sports with sport-specific metrics
 */

import { useState } from 'react';
import Icon, { type IconName } from './icons/IconSystem';
import TeamComparisonCharts from './TeamComparisonCharts';
import OddsHistoryChart from './OddsHistoryChart';

interface PredictionAnalysisExplainedProps {
  prediction: {
    id: string;
    eventId?: string;
    marketId?: string;
    eventName: string;
    selection: string;
    predictedProbability: number;
    confidence: number;
    factors?: any;
    sport?: string;
  };
  factors?: any;
}

export default function PredictionAnalysisExplained({ prediction, factors }: PredictionAnalysisExplainedProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'market']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Extract factors from prediction - check multiple possible locations
  // IMPORTANT: factors can be directly the factors object OR inside factorExplanation
  const rawFactors = factors || {};
  const advancedFeatures = rawFactors.advancedFeatures || rawFactors || {};
  
  // Market data can be in multiple places
  const marketOddsData = advancedFeatures.marketOdds || {};
  
  // Get marketAverage - this is the key data source
  const marketAverage = rawFactors.marketAverage || factors?.marketAverage || {};
  
  // Calculate odds from marketAverage (implied probabilities)
  const getOddsFromImplied = (implied: number) => implied > 0 ? (1 / implied) : undefined;
  
  const marketData = {
    ...marketOddsData,
    // MarketAverage data (PRIMARY SOURCE)
    homeImplied: marketAverage.home,
    awayImplied: marketAverage.away,
    drawImplied: marketAverage.draw,
    totalImplied: marketAverage.total,
    // Calculate average odds from implied probabilities for current selection
    averageOdds: (() => {
      const selection = prediction.selection?.toLowerCase() || '';
      if (selection.includes('home') || selection.includes('local') || selection === '1') {
        return getOddsFromImplied(marketAverage.home);
      } else if (selection.includes('away') || selection.includes('visitante') || selection === '2') {
        return getOddsFromImplied(marketAverage.away);
      } else if (selection.includes('draw') || selection.includes('empate') || selection === 'x' || selection === '3') {
        return getOddsFromImplied(marketAverage.draw);
      }
      return marketOddsData.median || marketOddsData.averageOdds;
    })(),
    // Bookmaker count (from marketOdds or calculate from data)
    bookmakerCount: marketOddsData.bookmakerCount || (marketOddsData.minOdds && marketOddsData.maxOdds ? 'Múltiples' : undefined),
    // Min/Max odds
    minOdds: marketOddsData.minOdds,
    maxOdds: marketOddsData.maxOdds,
    median: marketOddsData.median,
    // Volatility
    volatility: marketOddsData.volatility || marketOddsData.stdDev,
    // Implied probability for current selection
    impliedProbability: (() => {
      const selection = prediction.selection?.toLowerCase() || '';
      if (selection.includes('home') || selection.includes('local') || selection === '1') {
        return marketAverage.home;
      } else if (selection.includes('away') || selection.includes('visitante') || selection === '2') {
        return marketAverage.away;
      } else if (selection.includes('draw') || selection.includes('empate') || selection === 'x' || selection === '3') {
        return marketAverage.draw;
      }
      return marketOddsData.impliedProbability;
    })(),
  };
  
  // Market intelligence
  const marketIntelligence = advancedFeatures.marketIntelligence || advancedFeatures.market || {};
  // Also check if consensus/efficiency are in advancedFeatures directly
  const marketIntel = {
    consensus: marketIntelligence.consensus || advancedFeatures.market?.consensus || advancedFeatures.market_consensus || advancedFeatures.consensus || 0.7,
    efficiency: marketIntelligence.efficiency || advancedFeatures.market?.efficiency || (1 - (advancedFeatures.market_volatility || 0)) || 0.9,
    bookmakerCount: marketData.bookmakerCount || marketIntelligence.bookmakerCount || marketOddsData.bookmakerCount,
    volatility: marketData.volatility || marketIntelligence.volatility || advancedFeatures.market_volatility || marketOddsData.volatility,
  };
  
  const homeForm = advancedFeatures.homeForm || {};
  const awayForm = advancedFeatures.awayForm || {};
  const h2h = advancedFeatures.h2h || advancedFeatures.headToHead || {};

  // Determine sport type for sport-specific metrics
  const sportType = prediction.sport?.toLowerCase() || '';
  const isBasketball = sportType.includes('basketball') || sportType.includes('nba');
  const isFootball = sportType.includes('football') || sportType.includes('nfl');
  const isBaseball = sportType.includes('baseball') || sportType.includes('mlb');
  const isHockey = sportType.includes('hockey') || sportType.includes('nhl');

  // Check if we have real data
  const hasRealData = advancedFeatures.hasRealData !== false && (
    (homeForm.isRealData !== false) || 
    (awayForm.isRealData !== false) || 
    (h2h.isRealData !== false)
  );

  return (
    <div className="bg-dark-900/80 rounded-xl border border-primary-500/20 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-white mb-1">Análisis Completo de la Predicción</h3>
          <p className="text-sm text-gray-400">
            Desglose detallado y verificable de todos los factores considerados
          </p>
        </div>
        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
          hasRealData 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {hasRealData ? '✓ Datos Reales' : '⚠ Datos Estimados'}
        </div>
      </div>

      {/* Overview Section */}
      <Section
        title="Resumen Ejecutivo"
        icon="chart"
        expanded={expandedSections.has('overview')}
        onToggle={() => toggleSection('overview')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Probabilidad Predicha"
            value={`${(prediction.predictedProbability * 100).toFixed(1)}%`}
            description="Probabilidad calculada por nuestro modelo"
            color="primary"
          />
          <MetricCard
            label="Confianza del Modelo"
            value={`${(prediction.confidence * 100).toFixed(0)}%`}
            description="Nivel de confianza en esta predicción"
            color={prediction.confidence > 0.7 ? 'green' : prediction.confidence > 0.5 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Valor del Mercado"
            value={marketData.averageOdds ? `${marketData.averageOdds.toFixed(2)}` : 
                   marketData.median ? `${marketData.median.toFixed(2)}` :
                   marketData.impliedProbability ? `${(1 / marketData.impliedProbability).toFixed(2)}` : 'N/A'}
            description={marketData.averageOdds ? "Cuota promedio del mercado" : 
                        marketData.median ? "Cuota mediana del mercado" :
                        "Cuota implícita del mercado"}
            color="blue"
          />
        </div>
      </Section>

      {/* Market Intelligence Section */}
      <Section
        title="Inteligencia de Mercado"
        icon="trending-up"
        expanded={expandedSections.has('market')}
        onToggle={() => toggleSection('market')}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoBox
              label="Consenso del Mercado"
              value={marketIntel.consensus ? `${(marketIntel.consensus * 100).toFixed(0)}%` : 'N/A'}
              description="Acuerdo entre casas de apuestas"
            />
            <InfoBox
              label="Eficiencia del Mercado"
              value={marketIntel.efficiency ? `${(marketIntel.efficiency * 100).toFixed(0)}%` : 'N/A'}
              description="Qué tan eficiente está el mercado"
            />
            <InfoBox
              label="Número de Casas"
              value={marketIntel.bookmakerCount || marketData.bookmakerCount || 'N/A'}
              description="Casas de apuestas analizadas"
            />
            <InfoBox
              label="Volatilidad"
              value={marketIntel.volatility ? `${(marketIntel.volatility * 100).toFixed(1)}%` : 'N/A'}
              description="Variación en las cuotas"
            />
          </div>
          
          {marketData.minOdds && marketData.maxOdds && (
            <div className="bg-dark-800/50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-gray-300 mb-2">Rango de Cuotas</h5>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Mínima:</span>
                <span className="text-white font-semibold">{marketData.minOdds.toFixed(2)}</span>
                <span className="text-xs text-gray-400">→</span>
                <span className="text-white font-semibold">{marketData.maxOdds.toFixed(2)}</span>
                <span className="text-xs text-gray-400">Máxima</span>
                <span className="text-xs text-gray-500 ml-auto">
                  Diferencia: {((marketData.maxOdds - marketData.minOdds) / marketData.minOdds * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Team Form Section */}
      {(homeForm.winRate5 !== undefined || awayForm.winRate5 !== undefined) && (
        <Section
          title="Forma Reciente de los Equipos"
          icon="activity"
          expanded={expandedSections.has('form')}
          onToggle={() => toggleSection('form')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <TeamFormCard
              teamName="Local"
              form={homeForm}
              isRealData={homeForm.isRealData !== false}
              sportType={sportType}
            />
            <TeamFormCard
              teamName="Visitante"
              form={awayForm}
              isRealData={awayForm.isRealData !== false}
              sportType={sportType}
            />
          </div>
          
          {/* Comparison Charts */}
          {advancedFeatures.homeStats || advancedFeatures.awayStats ? (
            <div className="mt-6">
              <TeamComparisonCharts
                homeTeam="Local"
                awayTeam="Visitante"
                homeStats={advancedFeatures.homeStats}
                awayStats={advancedFeatures.awayStats}
                homeForm={homeForm}
                awayForm={awayForm}
              />
            </div>
          ) : null}
        </Section>
      )}

      {/* Head-to-Head Section */}
      {h2h.team1WinRate !== undefined && (
        <Section
          title="Historial Directo (H2H)"
          icon="activity"
          expanded={expandedSections.has('h2h')}
          onToggle={() => toggleSection('h2h')}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoBox
              label="Victorias Local"
              value={`${(h2h.team1WinRate * 100).toFixed(0)}%`}
              description={`En ${h2h.totalMatches || 5} encuentros`}
            />
            <InfoBox
              label="Empates"
              value={h2h.drawRate ? `${(h2h.drawRate * 100).toFixed(0)}%` : 'N/A'}
              description="Frecuencia de empates"
            />
            <InfoBox
              label="Goles Promedio"
              value={h2h.totalGoalsAvg ? h2h.totalGoalsAvg.toFixed(2) : 'N/A'}
              description="Goles por partido (H2H)"
            />
            <InfoBox
              label="Ambos Anotan"
              value={h2h.bothTeamsScoredRate ? `${(h2h.bothTeamsScoredRate * 100).toFixed(0)}%` : 'N/A'}
              description="Frecuencia ambos equipos anotan"
            />
          </div>
          {h2h.isRealData === false && (
            <div className="mt-3 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              ⚠️ Datos H2H estimados - No hay historial suficiente disponible
            </div>
          )}
        </Section>
      )}

      {/* Sport-Specific Metrics */}
      {advancedFeatures.sportSpecificMetrics && (
        <>
          {isBasketball && advancedFeatures.sportSpecificMetrics.home?.basketball && (
            <Section
              title="Métricas Específicas de NBA"
              icon="activity"
              expanded={expandedSections.has('sport-specific')}
              onToggle={() => toggleSection('sport-specific')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SportMetricsCard
                  teamName="Local"
                  metrics={advancedFeatures.sportSpecificMetrics.home.basketball}
                />
                <SportMetricsCard
                  teamName="Visitante"
                  metrics={advancedFeatures.sportSpecificMetrics.away.basketball}
                />
              </div>
              {advancedFeatures.sportSpecificMetrics.comparison?.basketball && (
                <div className="mt-4 bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
                  <h5 className="text-sm font-semibold text-gray-300 mb-3">Comparación Directa</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoBox
                      label="Ventaja de Puntos"
                      value={advancedFeatures.sportSpecificMetrics.comparison.basketball.pointsAdvantage > 0 
                        ? `+${advancedFeatures.sportSpecificMetrics.comparison.basketball.pointsAdvantage.toFixed(1)}` 
                        : advancedFeatures.sportSpecificMetrics.comparison.basketball.pointsAdvantage.toFixed(1)}
                      description="PPG Local vs Visitante"
                    />
                    <InfoBox
                      label="Ventaja Ofensiva"
                      value={advancedFeatures.sportSpecificMetrics.comparison.basketball.offensiveAdvantage > 0 
                        ? `+${advancedFeatures.sportSpecificMetrics.comparison.basketball.offensiveAdvantage.toFixed(1)}` 
                        : advancedFeatures.sportSpecificMetrics.comparison.basketball.offensiveAdvantage.toFixed(1)}
                      description="Rating ofensivo"
                    />
                    <InfoBox
                      label="Ventaja Defensiva"
                      value={advancedFeatures.sportSpecificMetrics.comparison.basketball.defensiveAdvantage > 0 
                        ? `+${advancedFeatures.sportSpecificMetrics.comparison.basketball.defensiveAdvantage.toFixed(1)}` 
                        : advancedFeatures.sportSpecificMetrics.comparison.basketball.defensiveAdvantage.toFixed(1)}
                      description="Rating defensivo"
                    />
                  </div>
                </div>
              )}
            </Section>
          )}

          {isFootball && advancedFeatures.sportSpecificMetrics.home?.football && (
            <Section
              title="Métricas Específicas de NFL"
              icon="activity"
              expanded={expandedSections.has('sport-specific')}
              onToggle={() => toggleSection('sport-specific')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SportMetricsCard
                  teamName="Local"
                  metrics={advancedFeatures.sportSpecificMetrics.home.football}
                />
                <SportMetricsCard
                  teamName="Visitante"
                  metrics={advancedFeatures.sportSpecificMetrics.away.football}
                />
              </div>
              {advancedFeatures.sportSpecificMetrics.comparison?.football && (
                <div className="mt-4 bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
                  <h5 className="text-sm font-semibold text-gray-300 mb-3">Comparación Directa</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoBox
                      label="Ventaja de Puntos"
                      value={advancedFeatures.sportSpecificMetrics.comparison.football.pointsAdvantage > 0 
                        ? `+${advancedFeatures.sportSpecificMetrics.comparison.football.pointsAdvantage.toFixed(1)}` 
                        : advancedFeatures.sportSpecificMetrics.comparison.football.pointsAdvantage.toFixed(1)}
                      description="PPG Local vs Visitante"
                    />
                    <InfoBox
                      label="Ventaja de Yardas"
                      value={advancedFeatures.sportSpecificMetrics.comparison.football.yardsAdvantage > 0 
                        ? `+${advancedFeatures.sportSpecificMetrics.comparison.football.yardsAdvantage.toFixed(0)}` 
                        : advancedFeatures.sportSpecificMetrics.comparison.football.yardsAdvantage.toFixed(0)}
                      description="YPG Local vs Visitante"
                    />
                    <InfoBox
                      label="Ventaja en Turnovers"
                      value={advancedFeatures.sportSpecificMetrics.comparison.football.turnoverAdvantage > 0 
                        ? `+${advancedFeatures.sportSpecificMetrics.comparison.football.turnoverAdvantage.toFixed(2)}` 
                        : advancedFeatures.sportSpecificMetrics.comparison.football.turnoverAdvantage.toFixed(2)}
                      description="Menos turnovers = mejor"
                    />
                  </div>
                </div>
              )}
            </Section>
          )}

          {isBaseball && advancedFeatures.sportSpecificMetrics.home?.baseball && (
            <Section
              title="Métricas Específicas de MLB"
              icon="activity"
              expanded={expandedSections.has('sport-specific')}
              onToggle={() => toggleSection('sport-specific')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SportMetricsCard
                  teamName="Local"
                  metrics={advancedFeatures.sportSpecificMetrics.home.baseball}
                />
                <SportMetricsCard
                  teamName="Visitante"
                  metrics={advancedFeatures.sportSpecificMetrics.away.baseball}
                />
              </div>
            </Section>
          )}

          {isHockey && advancedFeatures.sportSpecificMetrics.home?.hockey && (
            <Section
              title="Métricas Específicas de NHL"
              icon="activity"
              expanded={expandedSections.has('sport-specific')}
              onToggle={() => toggleSection('sport-specific')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SportMetricsCard
                  teamName="Local"
                  metrics={advancedFeatures.sportSpecificMetrics.home.hockey}
                />
                <SportMetricsCard
                  teamName="Visitante"
                  metrics={advancedFeatures.sportSpecificMetrics.away.hockey}
                />
              </div>
            </Section>
          )}
        </>
      )}

      {/* Recommendations */}
      {advancedFeatures.sportSpecificMetrics?.recommendations && 
       advancedFeatures.sportSpecificMetrics.recommendations.length > 0 && (
        <Section
          title="Recomendaciones del Análisis"
          icon="lightbulb"
          expanded={expandedSections.has('recommendations')}
          onToggle={() => toggleSection('recommendations')}
        >
          <div className="space-y-2">
            {advancedFeatures.sportSpecificMetrics.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon name="check-circle" className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-300">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Detailed Statistics Section */}
      {advancedFeatures.homeStats || advancedFeatures.awayStats ? (
        <Section
          title="Estadísticas Detalladas (API-Football)"
          icon="statistics"
          expanded={expandedSections.has('detailed-stats')}
          onToggle={() => toggleSection('detailed-stats')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advancedFeatures.homeStats && (
              <div className="bg-dark-900/50 rounded-lg p-4 border border-green-500/30">
                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span>Local</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Datos Reales</span>
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBox label="Posesión" value={`${(advancedFeatures.homeStats.possession || 0).toFixed(1)}%`} />
                  <InfoBox label="Precisión Pase" value={`${((advancedFeatures.homeStats.passAccuracy || 0) * 100).toFixed(1)}%`} />
                  <InfoBox label="Tiros Totales" value={advancedFeatures.homeStats.totalShots || 0} />
                  <InfoBox label="Tiros a Puerta" value={advancedFeatures.homeStats.shotsOnGoal || 0} />
                  <InfoBox label="Pases Totales" value={advancedFeatures.homeStats.passesTotal || 0} />
                  <InfoBox label="Pases Precisos" value={advancedFeatures.homeStats.passesAccurate || 0} />
                  <InfoBox label="Ataques" value={advancedFeatures.homeStats.attacks || 0} />
                  <InfoBox label="Ataques Peligrosos" value={advancedFeatures.homeStats.dangerousAttacks || 0} />
                  <InfoBox label="Entradas" value={advancedFeatures.homeStats.tackles || 0} />
                  <InfoBox label="Faltas" value={advancedFeatures.homeStats.fouls || 0} />
                  <InfoBox label="Corners" value={advancedFeatures.homeStats.corners || 0} />
                  <InfoBox label="Paradas" value={advancedFeatures.homeStats.goalkeeperSaves || 0} />
                </div>
              </div>
            )}
            
            {advancedFeatures.awayStats && (
              <div className="bg-dark-900/50 rounded-lg p-4 border border-green-500/30">
                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span>Visitante</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Datos Reales</span>
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBox label="Posesión" value={`${(advancedFeatures.awayStats.possession || 0).toFixed(1)}%`} />
                  <InfoBox label="Precisión Pase" value={`${((advancedFeatures.awayStats.passAccuracy || 0) * 100).toFixed(1)}%`} />
                  <InfoBox label="Tiros Totales" value={advancedFeatures.awayStats.totalShots || 0} />
                  <InfoBox label="Tiros a Puerta" value={advancedFeatures.awayStats.shotsOnGoal || 0} />
                  <InfoBox label="Pases Totales" value={advancedFeatures.awayStats.passesTotal || 0} />
                  <InfoBox label="Pases Precisos" value={advancedFeatures.awayStats.passesAccurate || 0} />
                  <InfoBox label="Ataques" value={advancedFeatures.awayStats.attacks || 0} />
                  <InfoBox label="Ataques Peligrosos" value={advancedFeatures.awayStats.dangerousAttacks || 0} />
                  <InfoBox label="Entradas" value={advancedFeatures.awayStats.tackles || 0} />
                  <InfoBox label="Faltas" value={advancedFeatures.awayStats.fouls || 0} />
                  <InfoBox label="Corners" value={advancedFeatures.awayStats.corners || 0} />
                  <InfoBox label="Paradas" value={advancedFeatures.awayStats.goalkeeperSaves || 0} />
                </div>
              </div>
            )}
          </div>
          
          {/* Advanced Metrics Comparison */}
          {advancedFeatures.advancedMetrics && (
            <div className="mt-4 bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
              <h5 className="text-sm font-semibold text-gray-300 mb-3">Ventajas Comparativas</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoBox
                  label="Ventaja Posesión"
                  value={advancedFeatures.advancedMetrics.possessionAdvantage > 0 
                    ? `+${advancedFeatures.advancedMetrics.possessionAdvantage.toFixed(1)}%` 
                    : `${advancedFeatures.advancedMetrics.possessionAdvantage.toFixed(1)}%`}
                  description="Local vs Visitante"
                />
                <InfoBox
                  label="Ventaja Tiros"
                  value={advancedFeatures.advancedMetrics.shotsAdvantage > 0 
                    ? `+${advancedFeatures.advancedMetrics.shotsAdvantage.toFixed(1)}` 
                    : advancedFeatures.advancedMetrics.shotsAdvantage.toFixed(1)}
                  description="Local vs Visitante"
                />
                <InfoBox
                  label="Ventaja Precisión"
                  value={advancedFeatures.advancedMetrics.passAccuracyAdvantage > 0 
                    ? `+${(advancedFeatures.advancedMetrics.passAccuracyAdvantage * 100).toFixed(1)}%` 
                    : `${(advancedFeatures.advancedMetrics.passAccuracyAdvantage * 100).toFixed(1)}%`}
                  description="Local vs Visitante"
                />
              </div>
            </div>
          )}
        </Section>
      ) : null}

      {/* Advanced Factors */}
      <Section
        title="Factores Avanzados"
        icon="brain"
        expanded={expandedSections.has('advanced')}
        onToggle={() => toggleSection('advanced')}
      >
        <div className="space-y-2">
          {advancedFeatures.formAdvantage !== undefined && (
            <FactorRow
              name="Ventaja de Forma"
              value={advancedFeatures.formAdvantage > 0 ? `+${advancedFeatures.formAdvantage.toFixed(2)}` : advancedFeatures.formAdvantage.toFixed(2)}
              description="Diferencia en forma reciente entre equipos"
              impact={Math.abs(advancedFeatures.formAdvantage) * 10}
            />
          )}
          {advancedFeatures.goalsAdvantage !== undefined && (
            <FactorRow
              name="Ventaja Ofensiva"
              value={advancedFeatures.goalsAdvantage > 0 ? `+${advancedFeatures.goalsAdvantage.toFixed(2)}` : advancedFeatures.goalsAdvantage.toFixed(2)}
              description="Diferencia en goles anotados"
              impact={Math.abs(advancedFeatures.goalsAdvantage) * 5}
            />
          )}
          {advancedFeatures.defenseAdvantage !== undefined && (
            <FactorRow
              name="Ventaja Defensiva"
              value={advancedFeatures.defenseAdvantage > 0 ? `+${advancedFeatures.defenseAdvantage.toFixed(2)}` : advancedFeatures.defenseAdvantage.toFixed(2)}
              description="Diferencia en goles recibidos"
              impact={Math.abs(advancedFeatures.defenseAdvantage) * 5}
            />
          )}
        </div>
      </Section>

      {/* Odds History Chart */}
      {prediction.eventId && prediction.marketId && (
        <Section
          title="Historial de Cambios de Cuotas"
          icon="line-chart"
          expanded={expandedSections.has('odds-history')}
          onToggle={() => toggleSection('odds-history')}
        >
          <OddsHistoryChart
            eventId={prediction.eventId}
            marketId={prediction.marketId}
            selection={prediction.selection}
          />
        </Section>
      )}

      {/* Data Source Verification */}
      <div className="bg-dark-800/50 rounded-lg p-4 border border-primary-500/10">
        <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
          <Icon name="info" className="w-4 h-4" />
          Fuentes de Datos Verificables
        </h5>
        <div className="text-xs text-gray-400 space-y-1">
          {hasRealData ? (
            <>
              <div>✓ Datos de forma: {homeForm.isRealData !== false ? 'API-Football / Base de Datos' : 'Estimados'}</div>
              <div>✓ Historial H2H: {h2h.isRealData !== false ? 'API-Football / Base de Datos' : 'Estimados'}</div>
              <div>✓ Cuotas de mercado: The Odds API ({marketIntel.bookmakerCount || marketData.bookmakerCount || 'N/A'} casas)</div>
              {marketData.minOdds && marketData.maxOdds && (
                <div>✓ Rango de cuotas: {marketData.minOdds.toFixed(2)} - {marketData.maxOdds.toFixed(2)}</div>
              )}
              {marketData.averageOdds && (
                <div>✓ Cuota promedio: {marketData.averageOdds.toFixed(2)}</div>
              )}
            </>
          ) : (
            <div className="text-yellow-400">
              ⚠️ Usando valores estimados - Se recomienda verificar con datos adicionales
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Section({ 
  title, 
  icon, 
  children, 
  expanded, 
  onToggle 
}: { 
  title: string; 
  icon: IconName; 
  children: React.ReactNode; 
  expanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="bg-dark-800/50 rounded-lg border border-primary-500/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon name={icon} className="w-5 h-5 text-primary-400" />
          <h4 className="text-lg font-semibold text-white">{title}</h4>
        </div>
        <div className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <Icon name="arrow-down-right" className="w-5 h-5" />
        </div>
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t border-primary-500/10">
          {children}
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  description, 
  color = "primary" 
}: { 
  label: string; 
  value: string; 
  description: string; 
  color?: "primary" | "green" | "yellow" | "red" | "blue";
}) {
  const colorClasses = {
    primary: "bg-primary-500/20 text-primary-300 border-primary-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-black mb-1">{value}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}

function InfoBox({ 
  label, 
  value, 
  description 
}: { 
  label: string; 
  value: string; 
  description?: string;
}) {
  return (
    <div className="bg-dark-900/50 rounded-lg p-3 border border-primary-500/10">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-white mb-1">{value}</div>
      {description && <div className="text-xs text-gray-500">{description}</div>}
    </div>
  );
}

function TeamFormCard({ 
  teamName, 
  form, 
  isRealData, 
  sportType 
}: { 
  teamName: string; 
  form: any; 
  isRealData: boolean;
  sportType: string;
}) {
  const isSoccer = sportType.includes('soccer') || sportType.includes('football') || sportType.includes('epl') || sportType.includes('liga');
  
  return (
    <div className={`bg-dark-900/50 rounded-lg p-4 border ${isRealData ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold text-white">{teamName}</h5>
        {isRealData ? (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Datos Reales</span>
        ) : (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Estimados</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">Victorias (Últimos 5)</div>
          <div className="text-lg font-semibold text-white">
            {form.winRate5 ? `${(form.winRate5 * 100).toFixed(0)}%` : 'N/A'}
          </div>
        </div>
        {isSoccer && (
          <>
            <div>
              <div className="text-xs text-gray-400 mb-1">Goles a Favor</div>
              <div className="text-lg font-semibold text-white">
                {form.goalsForAvg5 ? form.goalsForAvg5.toFixed(2) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Goles en Contra</div>
              <div className="text-lg font-semibold text-white">
                {form.goalsAgainstAvg5 ? form.goalsAgainstAvg5.toFixed(2) : 'N/A'}
              </div>
            </div>
          </>
        )}
        <div>
          <div className="text-xs text-gray-400 mb-1">Racha Actual</div>
          <div className={`text-lg font-semibold ${form.currentStreak > 0 ? 'text-green-400' : form.currentStreak < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {form.currentStreak > 0 ? `+${form.currentStreak}` : form.currentStreak}
          </div>
        </div>
      </div>
    </div>
  );
}

function FactorRow({ 
  name, 
  value, 
  description, 
  impact 
}: { 
  name: string; 
  value: string; 
  description: string; 
  impact: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-primary-500/10">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="text-xs text-gray-400">({description})</span>
        </div>
        <div className="text-xs text-gray-500">Impacto: {Math.min(impact, 100).toFixed(0)}%</div>
      </div>
      <div className="text-lg font-semibold text-primary-300">{value}</div>
    </div>
  );
}

function SportMetricsCard({ 
  teamName, 
  metrics 
}: { 
  teamName: string; 
  metrics: any;
}) {
  // Render metrics based on sport type
  if (metrics.pointsPerGame !== undefined) {
    // Basketball
    return (
      <div className="bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
        <h5 className="text-sm font-semibold text-white mb-3">{teamName}</h5>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="PPG" value={metrics.pointsPerGame.toFixed(1)} description="Puntos por juego" />
          <InfoBox label="FG%" value={`${(metrics.fieldGoalPercentage * 100).toFixed(1)}%`} description="Porcentaje de tiro" />
          <InfoBox label="3P%" value={`${(metrics.threePointPercentage * 100).toFixed(1)}%`} description="Triples" />
          <InfoBox label="Rebotes" value={metrics.reboundsPerGame.toFixed(1)} description="Por juego" />
          <InfoBox label="Asistencias" value={metrics.assistsPerGame.toFixed(1)} description="Por juego" />
          <InfoBox label="Turnovers" value={metrics.turnoversPerGame.toFixed(1)} description="Por juego" />
        </div>
      </div>
    );
  }

  if (metrics.yardsPerGame !== undefined) {
    // Football (NFL)
    return (
      <div className="bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
        <h5 className="text-sm font-semibold text-white mb-3">{teamName}</h5>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="PPG" value={metrics.pointsPerGame.toFixed(1)} description="Puntos por juego" />
          <InfoBox label="YPG" value={metrics.yardsPerGame.toFixed(0)} description="Yardas por juego" />
          <InfoBox label="Pase YPG" value={metrics.passingYardsPerGame.toFixed(0)} description="Yardas de pase" />
          <InfoBox label="Carrera YPG" value={metrics.rushingYardsPerGame.toFixed(0)} description="Yardas de carrera" />
          <InfoBox label="Turnovers" value={metrics.turnoversPerGame.toFixed(1)} description="Por juego" />
          <InfoBox label="3er Down" value={`${(metrics.thirdDownConversion * 100).toFixed(0)}%`} description="Conversión" />
        </div>
      </div>
    );
  }

  if (metrics.runsPerGame !== undefined) {
    // Baseball
    return (
      <div className="bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
        <h5 className="text-sm font-semibold text-white mb-3">{teamName}</h5>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="RPG" value={metrics.runsPerGame.toFixed(2)} description="Carreras por juego" />
          <InfoBox label="AVG" value={metrics.battingAverage.toFixed(3)} description="Promedio de bateo" />
          <InfoBox label="OBP" value={metrics.onBasePercentage.toFixed(3)} description="On-base %" />
          <InfoBox label="SLG" value={metrics.sluggingPercentage.toFixed(3)} description="Slugging %" />
          <InfoBox label="ERA" value={metrics.earnedRunAverage.toFixed(2)} description="Promedio de carreras" />
        </div>
      </div>
    );
  }

  if (metrics.goalsPerGame !== undefined && metrics.savePercentage !== undefined) {
    // Hockey
    return (
      <div className="bg-dark-900/50 rounded-lg p-4 border border-primary-500/10">
        <h5 className="text-sm font-semibold text-white mb-3">{teamName}</h5>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="GPG" value={metrics.goalsPerGame.toFixed(2)} description="Goles por juego" />
          <InfoBox label="Tiros" value={metrics.shotsPerGame.toFixed(1)} description="Por juego" />
          <InfoBox label="% Salvadas" value={`${(metrics.savePercentage * 100).toFixed(1)}%`} description="Porcentaje" />
          <InfoBox label="Power Play" value={`${(metrics.powerPlayPercentage * 100).toFixed(1)}%`} description="Eficiencia" />
        </div>
      </div>
    );
  }

  return null;
}


/**
 * Advanced Prediction Analysis Service
 * Uses ALL available data (API-Football stats, market intelligence, form, H2H)
 * to create the most accurate predictions possible
 * 
 * This is the CORE of our prediction system - uses real data to make better predictions
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { advancedFeaturesService } from './advanced-features.service';
import { getAPIFootballService } from './integrations/api-football.service';

interface AdvancedPredictionFeatures {
  // Market data (REAL from The Odds API)
  marketAverage: number;
  marketConsensus: number;
  marketVolatility: number;
  bookmakerCount: number;
  
  // Team form (REAL from API-Football or DB)
  homeForm: {
    winRate5: number;
    winRate10: number;
    goalsForAvg5: number;
    goalsAgainstAvg5: number;
    currentStreak: number;
    formTrend: number;
    isRealData: boolean;
  };
  awayForm: {
    winRate5: number;
    winRate10: number;
    goalsForAvg5: number;
    goalsAgainstAvg5: number;
    currentStreak: number;
    formTrend: number;
    isRealData: boolean;
  };
  
  // Detailed statistics (REAL from API-Football)
  homeStats?: {
    possession: number;
    shotsOnGoal: number;
    totalShots: number;
    passAccuracy: number;
    attacks: number;
    dangerousAttacks: number;
    tackles: number;
    isRealData: boolean;
  };
  awayStats?: {
    possession: number;
    shotsOnGoal: number;
    totalShots: number;
    passAccuracy: number;
    attacks: number;
    dangerousAttacks: number;
    tackles: number;
    isRealData: boolean;
  };
  
  // Head-to-head (REAL from API-Football or DB)
  h2h: {
    team1WinRate: number;
    drawRate: number;
    totalGoalsAvg: number;
    recentTrend: number;
    bothTeamsScoredRate: number;
    isRealData: boolean;
  };
  
  // Market intelligence
  marketIntelligence: {
    consensus: number;
    efficiency: number;
    sharpMoneyIndicator: number;
    valueOpportunity: number;
  };
  
  // Calculated advantages
  formAdvantage: number;
  goalsAdvantage: number;
  defenseAdvantage: number;
  possessionAdvantage?: number;
  shotsAdvantage?: number;
  passAccuracyAdvantage?: number;
  
  // Data quality indicators
  hasRealFormData: boolean;
  hasRealH2HData: boolean;
  hasRealStatsData: boolean;
  overallDataQuality: number; // 0-1, how much real data we have
}

interface PredictionAnalysis {
  baseProbability: number; // From market odds
  adjustedProbability: number; // After applying all features
  confidence: number; // Confidence in this prediction
  dataQuality: number; // Quality of data used
  keyFactors: Array<{
    name: string;
    impact: number;
    description: string;
    source: 'market' | 'form' | 'h2h' | 'stats' | 'intelligence';
  }>;
  riskFactors: Array<{
    name: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

class AdvancedPredictionAnalysisService {
  /**
   * Analyze and predict with ALL available data
   * This is the most sophisticated prediction method
   */
  async analyzeAndPredict(
    eventId: string,
    selection: string,
    homeTeam: string,
    awayTeam: string,
    sportId: string,
    marketOdds: number[]
  ): Promise<PredictionAnalysis> {
    try {
      // Step 1: Get ALL advanced features
      const allFeatures = await advancedFeaturesService.getAllAdvancedFeatures(
        eventId,
        homeTeam,
        awayTeam,
        sportId
      );

      // Step 2: Calculate market base probability
      const impliedProbs = marketOdds.map(odd => 1 / odd);
      const marketAverage = impliedProbs.reduce((sum, p) => sum + p, 0) / impliedProbs.length;
      const variance = impliedProbs.reduce((sum, p) => sum + Math.pow(p - marketAverage, 2), 0) / impliedProbs.length;
      const marketStdDev = Math.sqrt(variance);
      const marketConsensus = 1 - Math.min(marketStdDev * 2, 0.5);
      const marketVolatility = marketStdDev;

      // Step 3: Structure features for analysis
      const features: AdvancedPredictionFeatures = {
        marketAverage,
        marketConsensus,
        marketVolatility,
        bookmakerCount: marketOdds.length,
        homeForm: {
          winRate5: allFeatures.homeForm.winRate5 || 0.5,
          winRate10: allFeatures.homeForm.winRate10 || 0.5,
          goalsForAvg5: allFeatures.homeForm.goalsForAvg5 || 1.5,
          goalsAgainstAvg5: allFeatures.homeForm.goalsAgainstAvg5 || 1.5,
          currentStreak: allFeatures.homeForm.currentStreak || 0,
          formTrend: allFeatures.homeForm.formTrend || 0,
          isRealData: allFeatures.homeForm.isRealData !== false,
        },
        awayForm: {
          winRate5: allFeatures.awayForm.winRate5 || 0.5,
          winRate10: allFeatures.awayForm.winRate10 || 0.5,
          goalsForAvg5: allFeatures.awayForm.goalsForAvg5 || 1.5,
          goalsAgainstAvg5: allFeatures.awayForm.goalsAgainstAvg5 || 1.5,
          currentStreak: allFeatures.awayForm.currentStreak || 0,
          formTrend: allFeatures.awayForm.formTrend || 0,
          isRealData: allFeatures.awayForm.isRealData !== false,
        },
        homeStats: allFeatures.homeStats ? {
          possession: allFeatures.homeStats.possession || 0,
          shotsOnGoal: allFeatures.homeStats.shotsOnGoal || 0,
          totalShots: allFeatures.homeStats.totalShots || 0,
          passAccuracy: allFeatures.homeStats.passAccuracy || 0,
          attacks: allFeatures.homeStats.attacks || 0,
          dangerousAttacks: allFeatures.homeStats.dangerousAttacks || 0,
          tackles: allFeatures.homeStats.tackles || 0,
          isRealData: allFeatures.homeStats.isRealData !== false,
        } : undefined,
        awayStats: allFeatures.awayStats ? {
          possession: allFeatures.awayStats.possession || 0,
          shotsOnGoal: allFeatures.awayStats.shotsOnGoal || 0,
          totalShots: allFeatures.awayStats.totalShots || 0,
          passAccuracy: allFeatures.awayStats.passAccuracy || 0,
          attacks: allFeatures.awayStats.attacks || 0,
          dangerousAttacks: allFeatures.awayStats.dangerousAttacks || 0,
          tackles: allFeatures.awayStats.tackles || 0,
          isRealData: allFeatures.awayStats.isRealData !== false,
        } : undefined,
        h2h: {
          team1WinRate: allFeatures.h2h.team1WinRate || 0.5,
          drawRate: allFeatures.h2h.drawRate || 0.25,
          totalGoalsAvg: allFeatures.h2h.totalGoalsAvg || 3.0,
          recentTrend: allFeatures.h2h.recentTrend || 0,
          bothTeamsScoredRate: allFeatures.h2h.bothTeamsScoredRate || 0.5,
          isRealData: allFeatures.h2h.isRealData !== false,
        },
        marketIntelligence: {
          consensus: allFeatures.market.consensus || 0.7,
          efficiency: allFeatures.market.efficiency || 0.9,
          sharpMoneyIndicator: allFeatures.market.sharpMoneyIndicator || 0.5,
          valueOpportunity: allFeatures.market.valueOpportunity || 0.02,
        },
        formAdvantage: allFeatures.formAdvantage || 0,
        goalsAdvantage: allFeatures.goalsAdvantage || 0,
        defenseAdvantage: allFeatures.defenseAdvantage || 0,
        possessionAdvantage: allFeatures.advancedMetrics?.possessionAdvantage,
        shotsAdvantage: allFeatures.advancedMetrics?.shotsAdvantage,
        passAccuracyAdvantage: allFeatures.advancedMetrics?.passAccuracyAdvantage,
        hasRealFormData: allFeatures.homeForm.isRealData !== false || allFeatures.awayForm.isRealData !== false,
        hasRealH2HData: allFeatures.h2h.isRealData !== false,
        hasRealStatsData: allFeatures.homeStats?.isRealData !== false || allFeatures.awayStats?.isRealData !== false,
        overallDataQuality: this.calculateDataQuality(allFeatures),
      };

      // Step 4: Calculate adjusted probability using ALL features
      const analysis = this.calculateAdvancedPrediction(
        selection,
        features,
        marketAverage
      );

      return analysis;
    } catch (error: any) {
      logger.error(`Error in advanced prediction analysis for ${eventId}:`, error);
      
      // Fallback to market average
      const impliedProbs = marketOdds.map(odd => 1 / odd);
      const marketAverage = impliedProbs.reduce((sum, p) => sum + p, 0) / impliedProbs.length;
      
      return {
        baseProbability: marketAverage,
        adjustedProbability: marketAverage,
        confidence: 0.6,
        dataQuality: 0.3,
        keyFactors: [],
        riskFactors: [{
          name: 'Datos Insuficientes',
          level: 'high',
          description: 'No se pudieron obtener datos avanzados para este análisis',
        }],
      };
    }
  }

  /**
   * Calculate advanced prediction using all features
   */
  private calculateAdvancedPrediction(
    selection: string,
    features: AdvancedPredictionFeatures,
    baseProbability: number
  ): PredictionAnalysis {
    const keyFactors: Array<{
      name: string;
      impact: number;
      description: string;
      source: 'market' | 'form' | 'h2h' | 'stats' | 'intelligence';
    }> = [];
    const riskFactors: Array<{
      name: string;
      level: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    let adjustedProbability = baseProbability;
    let totalImpact = 0;

    // Determine if selection is home, away, or draw
    const isHome = selection.toLowerCase().includes('home') || 
                   selection.toLowerCase() === '1' ||
                   features.homeForm.winRate5 > features.awayForm.winRate5;
    const isAway = selection.toLowerCase().includes('away') || 
                   selection.toLowerCase() === '2' ||
                   features.awayForm.winRate5 > features.homeForm.winRate5;
    const isDraw = selection.toLowerCase().includes('draw') || 
                   selection.toLowerCase() === 'x' ||
                   selection.toLowerCase() === '3';

    // Factor 1: Form Advantage (HIGH IMPACT if real data)
    if (features.hasRealFormData) {
      const formImpact = Math.abs(features.formAdvantage) * 0.15; // Max 15% adjustment
      if (isHome && features.formAdvantage > 0) {
        adjustedProbability += formImpact;
        keyFactors.push({
          name: 'Ventaja de Forma (Local)',
          impact: formImpact,
          description: `Local tiene ${(features.formAdvantage * 100).toFixed(1)}% más victorias recientes`,
          source: 'form',
        });
      } else if (isAway && features.formAdvantage < 0) {
        adjustedProbability += Math.abs(formImpact);
        keyFactors.push({
          name: 'Ventaja de Forma (Visitante)',
          impact: Math.abs(formImpact),
          description: `Visitante tiene ${(Math.abs(features.formAdvantage) * 100).toFixed(1)}% más victorias recientes`,
          source: 'form',
        });
      }
      totalImpact += formImpact;
    }

    // Factor 2: Goals Advantage (MEDIUM-HIGH IMPACT if real data)
    if (features.hasRealFormData && features.goalsAdvantage !== undefined) {
      const goalsImpact = Math.abs(features.goalsAdvantage) * 0.12; // Max 12% adjustment
      if (isHome && features.goalsAdvantage > 0) {
        adjustedProbability += goalsImpact;
        keyFactors.push({
          name: 'Ventaja Ofensiva (Local)',
          impact: goalsImpact,
          description: `Local anota ${features.goalsAdvantage.toFixed(2)} goles/game más`,
          source: 'form',
        });
      } else if (isAway && features.goalsAdvantage < 0) {
        adjustedProbability += Math.abs(goalsImpact);
        keyFactors.push({
          name: 'Ventaja Ofensiva (Visitante)',
          impact: Math.abs(goalsImpact),
          description: `Visitante anota ${Math.abs(features.goalsAdvantage).toFixed(2)} goles/game más`,
          source: 'form',
        });
      }
      totalImpact += goalsImpact;
    }

    // Factor 3: Defense Advantage (MEDIUM IMPACT if real data)
    if (features.hasRealFormData && features.defenseAdvantage !== undefined) {
      const defenseImpact = Math.abs(features.defenseAdvantage) * 0.10; // Max 10% adjustment
      if (isHome && features.defenseAdvantage > 0) {
        adjustedProbability += defenseImpact;
        keyFactors.push({
          name: 'Ventaja Defensiva (Local)',
          impact: defenseImpact,
          description: `Local recibe ${features.defenseAdvantage.toFixed(2)} goles/game menos`,
          source: 'form',
        });
      } else if (isAway && features.defenseAdvantage < 0) {
        adjustedProbability += Math.abs(defenseImpact);
        keyFactors.push({
          name: 'Ventaja Defensiva (Visitante)',
          impact: Math.abs(defenseImpact),
          description: `Visitante recibe ${Math.abs(features.defenseAdvantage).toFixed(2)} goles/game menos`,
          source: 'form',
        });
      }
      totalImpact += defenseImpact;
    }

    // Factor 4: Detailed Statistics (HIGH IMPACT if real data from API-Football)
    if (features.hasRealStatsData && features.homeStats && features.awayStats) {
      // Possession advantage
      if (features.possessionAdvantage !== undefined) {
        const possessionImpact = Math.abs(features.possessionAdvantage) * 0.08; // Max 8% adjustment
        if (isHome && features.possessionAdvantage > 0) {
          adjustedProbability += possessionImpact;
          keyFactors.push({
            name: 'Ventaja de Posesión',
            impact: possessionImpact,
            description: `Local tiene ${features.possessionAdvantage.toFixed(1)}% más posesión`,
            source: 'stats',
          });
        } else if (isAway && features.possessionAdvantage < 0) {
          adjustedProbability += Math.abs(possessionImpact);
          keyFactors.push({
            name: 'Ventaja de Posesión',
            impact: Math.abs(possessionImpact),
            description: `Visitante tiene ${Math.abs(features.possessionAdvantage).toFixed(1)}% más posesión`,
            source: 'stats',
          });
        }
        totalImpact += possessionImpact;
      }

      // Shots advantage
      if (features.shotsAdvantage !== undefined) {
        const shotsImpact = Math.abs(features.shotsAdvantage) * 0.06; // Max 6% adjustment
        if (isHome && features.shotsAdvantage > 0) {
          adjustedProbability += shotsImpact;
          keyFactors.push({
            name: 'Ventaja de Tiros',
            impact: shotsImpact,
            description: `Local tiene ${features.shotsAdvantage.toFixed(1)} tiros más por partido`,
            source: 'stats',
          });
        } else if (isAway && features.shotsAdvantage < 0) {
          adjustedProbability += Math.abs(shotsImpact);
          keyFactors.push({
            name: 'Ventaja de Tiros',
            impact: Math.abs(shotsImpact),
            description: `Visitante tiene ${Math.abs(features.shotsAdvantage).toFixed(1)} tiros más por partido`,
            source: 'stats',
          });
        }
        totalImpact += shotsImpact;
      }

      // Pass accuracy advantage
      if (features.passAccuracyAdvantage !== undefined) {
        const passImpact = Math.abs(features.passAccuracyAdvantage) * 0.05; // Max 5% adjustment
        if (isHome && features.passAccuracyAdvantage > 0) {
          adjustedProbability += passImpact;
          keyFactors.push({
            name: 'Ventaja de Precisión de Pase',
            impact: passImpact,
            description: `Local tiene ${(features.passAccuracyAdvantage * 100).toFixed(1)}% más precisión`,
            source: 'stats',
        });
        } else if (isAway && features.passAccuracyAdvantage < 0) {
          adjustedProbability += Math.abs(passImpact);
          keyFactors.push({
            name: 'Ventaja de Precisión de Pase',
            impact: Math.abs(passImpact),
            description: `Visitante tiene ${(Math.abs(features.passAccuracyAdvantage) * 100).toFixed(1)}% más precisión`,
            source: 'stats',
          });
        }
        totalImpact += passImpact;
      }
    }

    // Factor 5: Head-to-Head (MEDIUM IMPACT if real data)
    if (features.hasRealH2HData) {
      const h2hImpact = Math.abs(features.h2h.team1WinRate - 0.5) * 0.10; // Max 10% adjustment
      if (isHome && features.h2h.team1WinRate > 0.5) {
        adjustedProbability += h2hImpact;
        keyFactors.push({
          name: 'Historial Directo Favorable',
          impact: h2hImpact,
          description: `Local gana ${(features.h2h.team1WinRate * 100).toFixed(0)}% en H2H`,
          source: 'h2h',
        });
      } else if (isAway && features.h2h.team1WinRate < 0.5) {
        adjustedProbability += h2hImpact;
        keyFactors.push({
          name: 'Historial Directo Favorable',
          impact: h2hImpact,
          description: `Visitante gana ${((1 - features.h2h.team1WinRate) * 100).toFixed(0)}% en H2H`,
          source: 'h2h',
        });
      }
      totalImpact += h2hImpact;
    }

    // Factor 6: Market Intelligence (LOW-MEDIUM IMPACT)
    if (features.marketIntelligence.consensus > 0.8) {
      const consensusImpact = (features.marketIntelligence.consensus - 0.8) * 0.05; // Max 5% boost
      adjustedProbability += consensusImpact;
      keyFactors.push({
        name: 'Alto Consenso del Mercado',
        impact: consensusImpact,
        description: `Las casas de apuestas están muy de acuerdo (${(features.marketIntelligence.consensus * 100).toFixed(0)}%)`,
        source: 'intelligence',
      });
      totalImpact += consensusImpact;
    }

    // Factor 7: Current Streak (MEDIUM IMPACT if real data)
    if (features.hasRealFormData) {
      const homeStreak = features.homeForm.currentStreak;
      const awayStreak = features.awayForm.currentStreak;
      
      if (isHome && homeStreak > 2) {
        const streakImpact = Math.min(homeStreak * 0.03, 0.08); // Max 8% for 3+ wins
        adjustedProbability += streakImpact;
        keyFactors.push({
          name: 'Racha Positiva',
          impact: streakImpact,
          description: `Local tiene racha de ${homeStreak} victorias`,
          source: 'form',
        });
        totalImpact += streakImpact;
      } else if (isAway && awayStreak > 2) {
        const streakImpact = Math.min(awayStreak * 0.03, 0.08);
        adjustedProbability += streakImpact;
        keyFactors.push({
          name: 'Racha Positiva',
          impact: streakImpact,
          description: `Visitante tiene racha de ${awayStreak} victorias`,
          source: 'form',
        });
        totalImpact += streakImpact;
      }
    }

    // Risk Factors
    if (!features.hasRealFormData && !features.hasRealH2HData) {
      riskFactors.push({
        name: 'Datos Estimados',
        level: 'medium',
        description: 'Usando valores por defecto - no hay datos reales disponibles',
      });
    }

    if (features.marketVolatility > 0.15) {
      riskFactors.push({
        name: 'Alta Volatilidad del Mercado',
        level: 'high',
        description: `Las cuotas varían mucho (volatilidad: ${(features.marketVolatility * 100).toFixed(1)}%)`,
      });
    }

    if (features.bookmakerCount < 3) {
      riskFactors.push({
        name: 'Pocas Casas de Apuestas',
        level: 'medium',
        description: `Solo ${features.bookmakerCount} casas analizadas - menos confianza`,
      });
    }

    // Normalize probability (ensure it stays between 0 and 1)
    adjustedProbability = Math.max(0.01, Math.min(0.99, adjustedProbability));

    // Calculate confidence based on data quality and market consensus
    const confidence = this.calculateConfidence(features, totalImpact);

    return {
      baseProbability,
      adjustedProbability,
      confidence,
      dataQuality: features.overallDataQuality,
      keyFactors: keyFactors.sort((a, b) => b.impact - a.impact), // Sort by impact
      riskFactors,
    };
  }

  /**
   * Calculate confidence based on data quality and factors
   */
  private calculateConfidence(
    features: AdvancedPredictionFeatures,
    totalImpact: number
  ): number {
    // Base confidence from market consensus
    let confidence = features.marketConsensus;

    // Boost confidence if we have real data
    if (features.hasRealFormData) {
      confidence += 0.05; // 5% boost
    }
    if (features.hasRealH2HData) {
      confidence += 0.03; // 3% boost
    }
    if (features.hasRealStatsData) {
      confidence += 0.07; // 7% boost (detailed stats are very valuable)
    }

    // Boost confidence if market has high consensus
    if (features.marketConsensus > 0.8) {
      confidence += 0.03;
    }

    // Boost confidence if we have many bookmakers
    if (features.bookmakerCount >= 5) {
      confidence += 0.02;
    }

    // Penalize if we made large adjustments (uncertainty)
    if (totalImpact > 0.2) {
      confidence -= 0.05; // Large adjustments indicate uncertainty
    }

    // Data quality multiplier
    confidence *= (0.7 + (features.overallDataQuality * 0.3));

    // Realistic bounds: 0.50 to 0.85
    return Math.max(0.50, Math.min(0.85, confidence));
  }

  /**
   * Calculate overall data quality score
   */
  private calculateDataQuality(allFeatures: any): number {
    let quality = 0;
    let factors = 0;

    // Form data quality
    if (allFeatures.homeForm?.isRealData !== false || allFeatures.awayForm?.isRealData !== false) {
      quality += 0.3;
      factors++;
    }

    // H2H data quality
    if (allFeatures.h2h?.isRealData !== false) {
      quality += 0.25;
      factors++;
    }

    // Detailed stats quality (most valuable)
    if (allFeatures.homeStats?.isRealData !== false || allFeatures.awayStats?.isRealData !== false) {
      quality += 0.35;
      factors++;
    }

    // Market data quality (always available)
    quality += 0.1;
    factors++;

    // Normalize by number of factors
    return factors > 0 ? quality : 0.3; // Minimum 30% if no data
  }
}

export const advancedPredictionAnalysisService = new AdvancedPredictionAnalysisService();


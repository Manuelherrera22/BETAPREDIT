/**
 * Normalized Prediction Service
 * Calculates probabilities for all market selections (Home/Away/Draw) 
 * ensuring they sum to approximately 100% (accounting for bookmaker margin)
 * 
 * CRITICAL: This fixes the bug where each selection had 90%+ probability
 */

import { logger } from '../utils/logger';
import { improvedPredictionService } from './improved-prediction.service';
import { universalPredictionService } from './universal-prediction.service';
import { advancedFeaturesService } from './advanced-features.service';
import { advancedPredictionAnalysisService } from './advanced-prediction-analysis.service';

interface MarketSelections {
  home: number[]; // Array of odds for home team
  away: number[]; // Array of odds for away team
  draw?: number[]; // Array of odds for draw (if applicable)
}

interface NormalizedPredictions {
  home: {
    predictedProbability: number;
    confidence: number;
    factors: any;
  };
  away: {
    predictedProbability: number;
    confidence: number;
    factors: any;
  };
  draw?: {
    predictedProbability: number;
    confidence: number;
    factors: any;
  };
}

class NormalizedPredictionService {
  /**
   * Calculate normalized probabilities for all market selections
   * Ensures probabilities sum to ~100% (accounting for bookmaker margin)
   */
  async calculateNormalizedProbabilities(
    eventId: string,
    eventName: string,
    homeTeam: string,
    awayTeam: string,
    sportId: string,
    selections: MarketSelections
  ): Promise<NormalizedPredictions> {
    try {
      // Step 1: Calculate raw implied probabilities from odds
      const homeImpliedProbs = selections.home.map(odd => 1 / odd);
      const awayImpliedProbs = selections.away.map(odd => 1 / odd);
      const drawImpliedProbs = selections.draw ? selections.draw.map(odd => 1 / odd) : [];

      // Step 2: Calculate market averages (raw implied probabilities)
      const homeAvgImplied = homeImpliedProbs.reduce((sum, p) => sum + p, 0) / homeImpliedProbs.length;
      const awayAvgImplied = awayImpliedProbs.reduce((sum, p) => sum + p, 0) / awayImpliedProbs.length;
      const drawAvgImplied = drawImpliedProbs.length > 0
        ? drawImpliedProbs.reduce((sum, p) => sum + p, 0) / drawImpliedProbs.length
        : 0;

      // Step 3: Calculate total implied probability (should be > 1.0 due to bookmaker margin)
      const totalImplied = homeAvgImplied + awayAvgImplied + drawAvgImplied;
      
      // Step 4: Normalize to account for bookmaker margin
      // If total > 1.0, we need to normalize. If total < 1.0, there's an arbitrage opportunity
      // Typically, bookmaker margin is 2-5%, so total should be around 1.02-1.05
      const normalizedHome = homeAvgImplied / totalImplied;
      const normalizedAway = awayAvgImplied / totalImplied;
      const normalizedDraw = drawAvgImplied / totalImplied;

      // Step 5: Get advanced features to adjust probabilities
      let allFeatures: any = {};
      try {
        allFeatures = await advancedFeaturesService.getAllAdvancedFeatures(
          eventId,
          homeTeam,
          awayTeam,
          sportId
        );
      } catch (error: any) {
        logger.warn(`Could not fetch advanced features for event ${eventId}: ${error.message}`);
      }

      // Step 6: Structure advanced features properly for ML (50+ features)
      const homeForm = allFeatures.homeForm || {};
      const awayForm = allFeatures.awayForm || {};
      const h2h = allFeatures.h2h || {};
      const market = allFeatures.market || {};
      
      // Calculate marketOdds from selections
      const allOdds = [...selections.home, ...selections.away, ...(selections.draw || [])];
      const oddsNums = allOdds.map(Number).filter(o => o > 0);
      let marketOdds: any = {
        impliedProbability: 0,
        consensus: market.consensus || 0.7,
        volatility: 1 - (market.efficiency || 0.9),
        bookmakerCount: 0,
        stdDev: 0,
        median: 0,
        minOdds: 0,
        maxOdds: 0,
      };
      
      if (oddsNums.length > 0) {
        const probs = oddsNums.map(odd => 1 / odd);
        const meanProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
        const variance = probs.reduce((sum, p) => sum + Math.pow(p - meanProb, 2), 0) / probs.length;
        const stdDev = Math.sqrt(variance);
        const sortedOdds = [...oddsNums].sort((a, b) => a - b);
        const median = sortedOdds.length % 2 === 0
          ? (sortedOdds[sortedOdds.length / 2 - 1] + sortedOdds[sortedOdds.length / 2]) / 2
          : sortedOdds[Math.floor(sortedOdds.length / 2)];
        
        marketOdds = {
          impliedProbability: meanProb,
          consensus: market.consensus || 0.7,
          volatility: 1 - (market.efficiency || 0.9),
          bookmakerCount: oddsNums.length,
          stdDev,
          median,
          minOdds: Math.min(...oddsNums),
          maxOdds: Math.max(...oddsNums),
        };
      }
      
      // Structure advanced features for ML (COMPLETE - all 50+ features)
      const advancedFeatures = {
        // Team form (detailed)
        homeForm: {
          winRate5: homeForm.winRate5 || 0.5,
          winRate10: homeForm.winRate10 || 0.5,
          goalsForAvg5: homeForm.goalsForAvg5 || 1.5,
          goalsAgainstAvg5: homeForm.goalsAgainstAvg5 || 1.5,
          currentStreak: homeForm.currentStreak || 0,
          formTrend: homeForm.formTrend || 0,
          wins5: Math.round((homeForm.winRate5 || 0.5) * 5),
          losses5: Math.round((1 - (homeForm.winRate5 || 0.5)) * 5),
          draws5: 0,
        },
        awayForm: {
          winRate5: awayForm.winRate5 || 0.5,
          winRate10: awayForm.winRate10 || 0.5,
          goalsForAvg5: awayForm.goalsForAvg5 || 1.5,
          goalsAgainstAvg5: awayForm.goalsAgainstAvg5 || 1.5,
          currentStreak: awayForm.currentStreak || 0,
          formTrend: awayForm.formTrend || 0,
          wins5: Math.round((awayForm.winRate5 || 0.5) * 5),
          losses5: Math.round((1 - (awayForm.winRate5 || 0.5)) * 5),
          draws5: 0,
        },
        form: {
          winRate: ((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) / 2,
          goalsScored: (homeForm.goalsForAvg5 || 1.5) + (awayForm.goalsForAvg5 || 1.5),
          goalsConceded: (homeForm.goalsAgainstAvg5 || 1.5) + (awayForm.goalsAgainstAvg5 || 1.5),
          matchesCount: 5,
          momentum: (homeForm.currentStreak || 0) + (awayForm.currentStreak || 0),
          recentWins: Math.round(((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) * 2.5),
          recentLosses: Math.round(((1 - (homeForm.winRate5 || 0.5)) + (1 - (awayForm.winRate5 || 0.5))) * 2.5),
          recentDraws: 0,
          impact: 0.3,
        },
        // H2H (detailed)
        h2h: {
          team1WinRate: h2h.team1WinRate || 0.5,
          drawRate: h2h.drawRate || 0.25,
          totalGoalsAvg: h2h.totalGoalsAvg || 3.0,
          recentTrend: h2h.recentTrend || 0,
          totalMatches: 5,
          bothTeamsScoredRate: 0.5,
        },
        headToHead: {
          winRate: h2h.team1WinRate || 0.5,
          goalsAvg: h2h.totalGoalsAvg || 3.0,
          matchesCount: 5,
          recentTrend: h2h.recentTrend || 0,
          avgTotalGoals: h2h.totalGoalsAvg || 3.0,
          bothTeamsScoredRate: 0.5,
          impact: 0.2,
          homeAdvantage: 0.1,
        },
        // Market intelligence (detailed)
        market: {
          consensus: market.consensus || 0.7,
          efficiency: market.efficiency || 0.9,
          sharpMoneyIndicator: market.sharpMoneyIndicator || 0.5,
          valueOpportunity: market.valueOpportunity || 0.02,
          oddsSpread: market.oddsSpread || 0.1,
        },
        marketOdds: marketOdds,
        marketIntelligence: {
          sentiment: market.sharpMoneyIndicator || 0.5,
          volume: market.valueOpportunity || 0.02,
          movement: 0,
          trend: market.oddsSpread || 0.1,
          confidence: market.consensus || 0.7,
        },
        // Historical performance
        historicalPerformance: {
          winRate: ((homeForm.winRate5 || 0.5) + (awayForm.winRate5 || 0.5)) / 2,
          goalsAvg: (homeForm.goalsForAvg5 || 1.5) + (awayForm.goalsForAvg5 || 1.5),
          goalsAgainstAvg: (homeForm.goalsAgainstAvg5 || 1.5) + (awayForm.goalsAgainstAvg5 || 1.5),
          matchesCount: 5,
          impact: 0.3,
          cleanSheets: 0.2,
          avgPossession: 0.5,
          shotsOnTarget: 5.0,
        },
        // Team strength
        teamStrength: {
          home: (allFeatures.formAdvantage || 0) > 0 ? 1 : 0,
          away: (allFeatures.formAdvantage || 0) < 0 ? 1 : 0,
        },
        // Relative features (for ML)
        formAdvantage: allFeatures.formAdvantage || 0,
        goalsAdvantage: allFeatures.goalsAdvantage || 0,
        defenseAdvantage: allFeatures.defenseAdvantage || 0,
        // Market intelligence direct properties (for ML extraction)
        market_consensus: market.consensus || 0.7,
        market_volatility: 1 - (market.efficiency || 0.9),
        market_sentiment: market.sharpMoneyIndicator || 0.5,
        // Trend and momentum
        trend: allFeatures.formAdvantage || 0,
        momentum: (homeForm.currentStreak || 0) + (awayForm.currentStreak || 0),
        // Additional features for ML (injuries, weather, etc.)
        injuries: {
          count: 0,
          keyPlayersCount: 0,
          riskLevel: 'low',
          suspensionsCount: 0,
          goalkeeperInjured: 0,
          defenderInjured: 0,
          midfielderInjured: 0,
          forwardInjured: 0,
        },
        weather: {
          risk: 'low',
          temperature: 20,
          windSpeed: 0,
        },
      };

      // Step 6: Use ADVANCED prediction analysis for each selection
      // This uses ALL available data (form, H2H, detailed stats) for better predictions
      const allOdds = [...selections.home, ...selections.away, ...(selections.draw || [])];
      
      // Get advanced analysis for each selection
      const homeAnalysis = await advancedPredictionAnalysisService.analyzeAndPredict(
        eventId,
        homeTeam,
        homeTeam,
        awayTeam,
        sportId,
        selections.home
      );
      
      const awayAnalysis = await advancedPredictionAnalysisService.analyzeAndPredict(
        eventId,
        awayTeam,
        homeTeam,
        awayTeam,
        sportId,
        selections.away
      );
      
      const drawAnalysis = selections.draw && selections.draw.length > 0
        ? await advancedPredictionAnalysisService.analyzeAndPredict(
            eventId,
            'Draw',
            homeTeam,
            awayTeam,
            sportId,
            selections.draw
          )
        : null;

      // Step 7: Use advanced analysis probabilities directly
      // The advanced analysis already incorporates ALL features (form, H2H, stats, etc.)
      // We use the adjusted probabilities from the analysis, but normalize them to sum to 1.0
      const hasRealData = allFeatures.hasRealData !== false;
      
      let adjustedHome: number;
      let adjustedAway: number;
      let adjustedDraw: number;
      
      if (hasRealData && homeAnalysis && awayAnalysis) {
        // Use adjusted probabilities from advanced analysis
        adjustedHome = homeAnalysis.adjustedProbability;
        adjustedAway = awayAnalysis.adjustedProbability;
        adjustedDraw = drawAnalysis?.adjustedProbability || normalizedDraw;
        
        // Re-normalize to ensure sum = 1.0 (accounting for bookmaker margin)
        const adjustedTotal = adjustedHome + adjustedAway + adjustedDraw;
        if (adjustedTotal > 0) {
          adjustedHome = adjustedHome / adjustedTotal;
          adjustedAway = adjustedAway / adjustedTotal;
          adjustedDraw = adjustedDraw / adjustedTotal;
        } else {
          // Fallback to normalized if something went wrong
          adjustedHome = normalizedHome;
          adjustedAway = normalizedAway;
          adjustedDraw = normalizedDraw;
        }
      } else {
        // No real data - use simple normalized probabilities
        adjustedHome = normalizedHome;
        adjustedAway = normalizedAway;
        adjustedDraw = normalizedDraw;
      }

      // Step 9: Calculate confidence based on advanced analysis
      // Use the confidence from the specific selection's analysis (not max of all)
      // This ensures each prediction has its own appropriate confidence level
      const selection = prediction.selection || '';
      const isHome = selection.toLowerCase().includes('home') || selection.toLowerCase() === '1';
      const isAway = selection.toLowerCase().includes('away') || selection.toLowerCase() === '2';
      const isDraw = selection.toLowerCase().includes('draw') || selection.toLowerCase() === 'x' || selection.toLowerCase() === '3';
      
      let confidence: number;
      if (isHome && homeAnalysis) {
        confidence = homeAnalysis.confidence;
      } else if (isAway && awayAnalysis) {
        confidence = awayAnalysis.confidence;
      } else if (isDraw && drawAnalysis) {
        confidence = drawAnalysis.confidence;
      } else {
        // Fallback: use max if selection doesn't match
        const confidences = [
          homeAnalysis?.confidence || 0.6,
          awayAnalysis?.confidence || 0.6,
          drawAnalysis?.confidence || 0.6,
        ];
        confidence = Math.max(...confidences);
      }
      
      // Ensure confidence is within reasonable bounds (0.45 to 0.95)
      // Allow higher confidence for high-quality predictions
      confidence = Math.max(0.45, Math.min(0.95, confidence));

      // Step 10: Prepare factors for storage (include advanced analysis)
      const factors = {
        marketAverage: {
          home: homeAvgImplied,
          away: awayAvgImplied,
          draw: drawAvgImplied,
          total: totalImplied,
        },
        normalized: {
          home: normalizedHome,
          away: normalizedAway,
          draw: normalizedDraw,
        },
        advancedAnalysis: hasRealData ? {
          home: {
            baseProbability: homeAnalysis.baseProbability,
            adjustedProbability: homeAnalysis.adjustedProbability,
            dataQuality: homeAnalysis.dataQuality,
            keyFactors: homeAnalysis.keyFactors,
            riskFactors: homeAnalysis.riskFactors,
          },
          away: {
            baseProbability: awayAnalysis.baseProbability,
            adjustedProbability: awayAnalysis.adjustedProbability,
            dataQuality: awayAnalysis.dataQuality,
            keyFactors: awayAnalysis.keyFactors,
            riskFactors: awayAnalysis.riskFactors,
          },
          draw: drawAnalysis ? {
            baseProbability: drawAnalysis.baseProbability,
            adjustedProbability: drawAnalysis.adjustedProbability,
            dataQuality: drawAnalysis.dataQuality,
            keyFactors: drawAnalysis.keyFactors,
            riskFactors: drawAnalysis.riskFactors,
          } : null,
        } : null,
        advancedFeatures: advancedFeatures, // Properly structured object with all 50+ features
        bookmakerMargin: totalImplied > 1 ? ((totalImplied - 1) * 100).toFixed(2) : 0,
      };

      return {
        home: {
          predictedProbability: Math.max(0.01, Math.min(0.99, adjustedHome)),
          confidence,
          factors,
        },
        away: {
          predictedProbability: Math.max(0.01, Math.min(0.99, adjustedAway)),
          confidence,
          factors,
        },
        draw: drawAvgImplied > 0 ? {
          predictedProbability: Math.max(0.01, Math.min(0.99, adjustedDraw)),
          confidence,
          factors,
        } : undefined,
      };
    } catch (error: any) {
      logger.error('Error calculating normalized probabilities:', error);
      
      // Fallback: Simple normalization without adjustments
      const homeAvg = selections.home.reduce((sum, odd) => sum + (1 / odd), 0) / selections.home.length;
      const awayAvg = selections.away.reduce((sum, odd) => sum + (1 / odd), 0) / selections.away.length;
      const drawAvg = selections.draw && selections.draw.length > 0
        ? selections.draw.reduce((sum, odd) => sum + (1 / odd), 0) / selections.draw.length
        : 0;
      
      const total = homeAvg + awayAvg + drawAvg;
      
      return {
        home: {
          predictedProbability: homeAvg / total,
          confidence: 0.6,
          factors: { fallback: true },
        },
        away: {
          predictedProbability: awayAvg / total,
          confidence: 0.6,
          factors: { fallback: true },
        },
        draw: drawAvg > 0 ? {
          predictedProbability: drawAvg / total,
          confidence: 0.6,
          factors: { fallback: true },
        } : undefined,
      };
    }
  }


  /**
   * Calculate confidence based on market consensus and features
   * This is a fallback method when advanced analysis is not available
   */
  private calculateConfidence(
    selections: MarketSelections,
    advancedFeatures: any,
    totalImplied: number
  ): number {
    // Base confidence from market consensus
    // If totalImplied is close to 1.0, market is efficient (high confidence)
    // If totalImplied is far from 1.0, market has inefficiencies (lower confidence)
    const marketEfficiency = 1 - Math.abs(totalImplied - 1.05) * 2; // Optimal margin is ~5%
    let confidence = Math.max(0.5, Math.min(0.85, marketEfficiency));

    // Adjust based on number of bookmakers (more = slightly more confidence)
    const totalBookmakers = selections.home.length + selections.away.length + (selections.draw?.length || 0);
    const bookmakerFactor = Math.min(1.15, 1 + (totalBookmakers - 3) * 0.02);
    confidence *= bookmakerFactor;

    // Adjust based on advanced features availability
    if (advancedFeatures.homeForm && advancedFeatures.awayForm) {
      confidence *= 1.08; // 8% boost if we have form data
    }
    
    if (advancedFeatures.h2h || advancedFeatures.headToHead) {
      confidence *= 1.05; // 5% boost if we have H2H data
    }

    // Realistic bounds: 0.45 to 0.90 (allow higher confidence for high-quality data)
    return Math.max(0.45, Math.min(0.90, confidence));
  }
}

export const normalizedPredictionService = new NormalizedPredictionService();


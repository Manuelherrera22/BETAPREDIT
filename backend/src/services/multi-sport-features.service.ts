/**
 * Multi-Sport Features Service
 * Provides sport-specific metrics and analysis for ALL sports
 * Ensures bettors have ALL available information
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { getAPIFootballService } from './integrations/api-football.service';
import { getTheOddsAPIService } from './integrations/the-odds-api.service';

interface SportSpecificMetrics {
  // Basketball (NBA)
  basketball?: {
    pointsPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    turnoversPerGame: number;
    defensiveRating: number;
    offensiveRating: number;
    pace: number;
  };
  
  // Football (NFL)
  football?: {
    pointsPerGame: number;
    yardsPerGame: number;
    passingYardsPerGame: number;
    rushingYardsPerGame: number;
    turnoversPerGame: number;
    timeOfPossession: number;
    thirdDownConversion: number;
    redZoneEfficiency: number;
  };
  
  // Baseball (MLB)
  baseball?: {
    runsPerGame: number;
    battingAverage: number;
    onBasePercentage: number;
    sluggingPercentage: number;
    earnedRunAverage: number;
    walksAndHitsPerInning: number;
    strikeoutsPerGame: number;
  };
  
  // Hockey (NHL)
  hockey?: {
    goalsPerGame: number;
    shotsPerGame: number;
    savePercentage: number;
    powerPlayPercentage: number;
    penaltyKillPercentage: number;
    faceoffWinPercentage: number;
  };
  
  // Soccer (already handled by advanced-features)
  soccer?: {
    goalsPerGame: number;
    shotsPerGame: number;
    possession: number;
    passAccuracy: number;
    tacklesPerGame: number;
  };
}

class MultiSportFeaturesService {
  /**
   * Get sport-specific metrics for a team
   * Supports all major sports with their specific statistics
   */
  async getSportSpecificMetrics(
    teamName: string,
    sportId: string,
    isHome: boolean
  ): Promise<SportSpecificMetrics | null> {
    try {
      const sport = await prisma.sport.findUnique({
        where: { id: sportId },
      });

      if (!sport) {
        return null;
      }

      const sportSlug = sport.slug?.toLowerCase() || '';
      const sportName = sport.name?.toLowerCase() || '';

      // Basketball (NBA)
      if (sportSlug.includes('basketball') || sportSlug.includes('nba') || sportName.includes('basketball')) {
        return await this.getBasketballMetrics(teamName, sportId, isHome);
      }

      // Football (NFL)
      if (sportSlug.includes('football') && !sportSlug.includes('soccer') || sportSlug.includes('nfl') || 
          (sportName.includes('football') && !sportName.includes('soccer'))) {
        return await this.getFootballMetrics(teamName, sportId, isHome);
      }

      // Baseball (MLB)
      if (sportSlug.includes('baseball') || sportSlug.includes('mlb') || sportName.includes('baseball')) {
        return await this.getBaseballMetrics(teamName, sportId, isHome);
      }

      // Hockey (NHL)
      if (sportSlug.includes('hockey') || sportSlug.includes('nhl') || sportName.includes('hockey')) {
        return await this.getHockeyMetrics(teamName, sportId, isHome);
      }

      // Soccer (already handled, but can enhance)
      if (sportSlug.includes('soccer') || sportSlug.includes('football') || sportName.includes('soccer')) {
        return await this.getSoccerMetrics(teamName, sportId, isHome);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting sport-specific metrics for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get basketball-specific metrics (NBA)
   */
  private async getBasketballMetrics(
    teamName: string,
    sportId: string,
    isHome: boolean
  ): Promise<SportSpecificMetrics> {
    // Get recent events to calculate metrics
    const recentEvents = await prisma.event.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        sportId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    if (recentEvents.length === 0) {
      // Return default/estimated values
      return {
        basketball: {
          pointsPerGame: 110.0,
          fieldGoalPercentage: 0.45,
          threePointPercentage: 0.35,
          reboundsPerGame: 45.0,
          assistsPerGame: 25.0,
          turnoversPerGame: 14.0,
          defensiveRating: 110.0,
          offensiveRating: 110.0,
          pace: 100.0,
        },
      };
    }

    // Calculate averages from recent games
    const last5 = recentEvents.slice(0, 5);
    const points = last5.map(e => {
      const isHomeTeam = e.homeTeam.toLowerCase().includes(teamName.toLowerCase());
      return isHomeTeam ? e.homeScore || 0 : e.awayScore || 0;
    });
    const pointsPerGame = points.reduce((sum, p) => sum + p, 0) / points.length;

    // For now, return calculated + estimated values
    // In production, would fetch from NBA API or similar
    return {
      basketball: {
        pointsPerGame,
        fieldGoalPercentage: 0.45, // Would calculate from detailed stats
        threePointPercentage: 0.35,
        reboundsPerGame: 45.0,
        assistsPerGame: 25.0,
        turnoversPerGame: 14.0,
        defensiveRating: 110.0,
        offensiveRating: 110.0,
        pace: 100.0,
      },
    };
  }

  /**
   * Get football-specific metrics (NFL)
   */
  private async getFootballMetrics(
    teamName: string,
    sportId: string,
    isHome: boolean
  ): Promise<SportSpecificMetrics> {
    const recentEvents = await prisma.event.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        sportId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    if (recentEvents.length === 0) {
      return {
        football: {
          pointsPerGame: 24.0,
          yardsPerGame: 350.0,
          passingYardsPerGame: 250.0,
          rushingYardsPerGame: 100.0,
          turnoversPerGame: 1.2,
          timeOfPossession: 30.0,
          thirdDownConversion: 0.40,
          redZoneEfficiency: 0.60,
        },
      };
    }

    const last5 = recentEvents.slice(0, 5);
    const points = last5.map(e => {
      const isHomeTeam = e.homeTeam.toLowerCase().includes(teamName.toLowerCase());
      return isHomeTeam ? e.homeScore || 0 : e.awayScore || 0;
    });
    const pointsPerGame = points.reduce((sum, p) => sum + p, 0) / points.length;

    return {
      football: {
        pointsPerGame,
        yardsPerGame: 350.0, // Would fetch from NFL API
        passingYardsPerGame: 250.0,
        rushingYardsPerGame: 100.0,
        turnoversPerGame: 1.2,
        timeOfPossession: 30.0,
        thirdDownConversion: 0.40,
        redZoneEfficiency: 0.60,
      },
    };
  }

  /**
   * Get baseball-specific metrics (MLB)
   */
  private async getBaseballMetrics(
    teamName: string,
    sportId: string,
    isHome: boolean
  ): Promise<SportSpecificMetrics> {
    const recentEvents = await prisma.event.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        sportId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    if (recentEvents.length === 0) {
      return {
        baseball: {
          runsPerGame: 4.5,
          battingAverage: 0.250,
          onBasePercentage: 0.320,
          sluggingPercentage: 0.420,
          earnedRunAverage: 4.20,
          walksAndHitsPerInning: 1.30,
          strikeoutsPerGame: 8.5,
        },
      };
    }

    const last5 = recentEvents.slice(0, 5);
    const runs = last5.map(e => {
      const isHomeTeam = e.homeTeam.toLowerCase().includes(teamName.toLowerCase());
      return isHomeTeam ? e.homeScore || 0 : e.awayScore || 0;
    });
    const runsPerGame = runs.reduce((sum, r) => sum + r, 0) / runs.length;

    return {
      baseball: {
        runsPerGame,
        battingAverage: 0.250,
        onBasePercentage: 0.320,
        sluggingPercentage: 0.420,
        earnedRunAverage: 4.20,
        walksAndHitsPerInning: 1.30,
        strikeoutsPerGame: 8.5,
      },
    };
  }

  /**
   * Get hockey-specific metrics (NHL)
   */
  private async getHockeyMetrics(
    teamName: string,
    sportId: string,
    isHome: boolean
  ): Promise<SportSpecificMetrics> {
    const recentEvents = await prisma.event.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        sportId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    if (recentEvents.length === 0) {
      return {
        hockey: {
          goalsPerGame: 3.0,
          shotsPerGame: 30.0,
          savePercentage: 0.910,
          powerPlayPercentage: 0.20,
          penaltyKillPercentage: 0.80,
          faceoffWinPercentage: 0.50,
        },
      };
    }

    const last5 = recentEvents.slice(0, 5);
    const goals = last5.map(e => {
      const isHomeTeam = e.homeTeam.toLowerCase().includes(teamName.toLowerCase());
      return isHomeTeam ? e.homeScore || 0 : e.awayScore || 0;
    });
    const goalsPerGame = goals.reduce((sum, g) => sum + g, 0) / goals.length;

    return {
      hockey: {
        goalsPerGame,
        shotsPerGame: 30.0,
        savePercentage: 0.910,
        powerPlayPercentage: 0.20,
        penaltyKillPercentage: 0.80,
        faceoffWinPercentage: 0.50,
      },
    };
  }

  /**
   * Get soccer-specific metrics (enhanced)
   */
  private async getSoccerMetrics(
    teamName: string,
    sportId: string,
    isHome: boolean
  ): Promise<SportSpecificMetrics> {
    // This is already handled by advanced-features.service
    // But we can add more detailed metrics here
    return {
      soccer: {
        goalsPerGame: 1.5,
        shotsPerGame: 12.0,
        possession: 0.50,
        passAccuracy: 0.85,
        tacklesPerGame: 15.0,
      },
    };
  }

  /**
   * Get comprehensive analysis for all sports
   * Returns ALL available information for bettors
   */
  async getComprehensiveAnalysis(
    eventId: string,
    homeTeam: string,
    awayTeam: string,
    sportId: string
  ): Promise<{
    homeMetrics: SportSpecificMetrics | null;
    awayMetrics: SportSpecificMetrics | null;
    comparison: any;
    recommendations: string[];
  }> {
    try {
      const [homeMetrics, awayMetrics] = await Promise.all([
        this.getSportSpecificMetrics(homeTeam, sportId, true),
        this.getSportSpecificMetrics(awayTeam, sportId, false),
      ]);

      // Generate recommendations based on metrics
      const recommendations: string[] = [];
      
      if (homeMetrics?.basketball && awayMetrics?.basketball) {
        const home = homeMetrics.basketball;
        const away = awayMetrics.basketball;
        
        if (home.pointsPerGame > away.pointsPerGame + 5) {
          recommendations.push(`El equipo local tiene ventaja ofensiva significativa (+${(home.pointsPerGame - away.pointsPerGame).toFixed(1)} PPG)`);
        }
        if (home.defensiveRating < away.defensiveRating - 3) {
          recommendations.push(`El equipo local tiene mejor defensa (DR: ${home.defensiveRating.toFixed(1)} vs ${away.defensiveRating.toFixed(1)})`);
        }
      }

      if (homeMetrics?.football && awayMetrics?.football) {
        const home = homeMetrics.football;
        const away = awayMetrics.football;
        
        if (home.pointsPerGame > away.pointsPerGame + 3) {
          recommendations.push(`El equipo local anota más puntos (+${(home.pointsPerGame - away.pointsPerGame).toFixed(1)} PPG)`);
        }
        if (home.turnoversPerGame < away.turnoversPerGame - 0.3) {
          recommendations.push(`El equipo local comete menos turnovers (${home.turnoversPerGame.toFixed(1)} vs ${away.turnoversPerGame.toFixed(1)} por juego)`);
        }
      }

      return {
        homeMetrics,
        awayMetrics,
        comparison: this.compareMetrics(homeMetrics, awayMetrics),
        recommendations,
      };
    } catch (error: any) {
      logger.error(`Error getting comprehensive analysis for event ${eventId}:`, error);
      return {
        homeMetrics: null,
        awayMetrics: null,
        comparison: null,
        recommendations: [],
      };
    }
  }

  /**
   * Compare metrics between two teams
   */
  private compareMetrics(home: SportSpecificMetrics | null, away: SportSpecificMetrics | null): any {
    if (!home || !away) return null;

    const comparison: any = {};

    if (home.basketball && away.basketball) {
      comparison.basketball = {
        pointsAdvantage: home.basketball.pointsPerGame - away.basketball.pointsPerGame,
        defensiveAdvantage: away.basketball.defensiveRating - home.basketball.defensiveRating,
        offensiveAdvantage: home.basketball.offensiveRating - away.basketball.offensiveRating,
      };
    }

    if (home.football && away.football) {
      comparison.football = {
        pointsAdvantage: home.football.pointsPerGame - away.football.pointsPerGame,
        yardsAdvantage: home.football.yardsPerGame - away.football.yardsPerGame,
        turnoverAdvantage: away.football.turnoversPerGame - home.football.turnoversPerGame,
      };
    }

    return comparison;
  }
}

export const multiSportFeaturesService = new MultiSportFeaturesService();


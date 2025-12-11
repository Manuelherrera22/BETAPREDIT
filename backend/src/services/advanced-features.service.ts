/**
 * Advanced Features Service
 * Calculates sophisticated features for predictions
 * Makes our system the most advanced in the market
 */

import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { getAPIFootballService } from './integrations/api-football.service';
import { featuresCacheService } from './features-cache.service';

interface TeamForm {
  winRate5: number;
  winRate10: number;
  goalsForAvg5: number;
  goalsAgainstAvg5: number;
  currentStreak: number;
  formTrend: number;
  isRealData?: boolean; // Indicates if data is real or default
}

interface HeadToHead {
  team1WinRate: number;
  drawRate: number;
  totalGoalsAvg: number;
  recentTrend: number;
  isRealData?: boolean; // Indicates if data is real or default
}

interface MarketIntelligence {
  consensus: number;
  efficiency: number;
  sharpMoneyIndicator: number;
  valueOpportunity: number;
  oddsSpread: number;
}

class AdvancedFeaturesService {
  /**
   * Calculate team form from recent matches
   * Uses cache to avoid recalculating frequently
   * CRITICAL: Tries API-Football first for real data, falls back to DB, then defaults
   */
  async calculateTeamForm(teamName: string, sportId: string, isHome: boolean, limit: number = 10): Promise<TeamForm & { isRealData: boolean }> {
    return featuresCacheService.getTeamForm(
      teamName,
      sportId,
      isHome,
      async () => {
        try {
          // STEP 1: Try API-Football for real data (only for soccer/football)
          const apiFootball = getAPIFootballService();
          const isSoccer = sportId.includes('soccer') || sportId.includes('football') || 
                          sportId.includes('serie_a') || sportId.includes('la_liga') || 
                          sportId.includes('epl') || sportId.includes('bundesliga');
          
          if (apiFootball && isSoccer) {
            try {
              // Search for team in API-Football (try multiple variations)
              let teams = await apiFootball.searchTeams(teamName);
              
              // If no results, try without common prefixes/suffixes
              if (teams.length === 0) {
                const cleanName = teamName
                  .replace(/^(FC|CF|AC|AS|SC|RC|UD|CD|SD|CF|Athletic|Atletico|Atletico|Real|Deportivo|Sporting|Racing|Villarreal|Valencia|Sevilla|Betis|Espanyol|Getafe|Osasuna|Celta|Mallorca|Granada|Levante|Alaves|Eibar|Huesca|Valladolid|Elche|Cadiz|Rayo|Girona|Las Palmas|Almeria)\s+/i, '')
                  .replace(/\s+(FC|CF|AC|AS|SC|RC|UD|CD|SD|CF)$/i, '')
                  .trim();
                
                if (cleanName !== teamName && cleanName.length > 3) {
                  teams = await apiFootball.searchTeams(cleanName);
                }
              }
              
              // Try partial match if still no results
              if (teams.length === 0 && teamName.length > 5) {
                const words = teamName.split(' ').filter(w => w.length > 3);
                if (words.length > 0) {
                  teams = await apiFootball.searchTeams(words[0]);
                }
              }
              
              if (teams.length > 0) {
                const team = teams[0]; // Use first match
                const teamId = team.id;
                
                // Get recent fixtures for this team
                const fixtures = await apiFootball.getFixtures({
                  team: teamId,
                  last: limit,
                });
                
                if (fixtures.length > 0) {
                  // Calculate form from real API-Football data
                  const finishedFixtures = fixtures.filter(f => 
                    f.fixture.status.short === 'FT' && 
                    f.goals.home !== null && 
                    f.goals.away !== null
                  );
                  
                  if (finishedFixtures.length >= 3) {
                    const last5 = finishedFixtures.slice(0, 5);
                    const last10 = finishedFixtures.slice(0, 10);
                    
                    const wins5 = last5.filter(f => {
                      const isHomeTeam = f.teams.home.id === teamId;
                      return isHomeTeam ? f.goals.home! > f.goals.away! : f.goals.away! > f.goals.home!;
                    }).length;
                    
                    const wins10 = last10.filter(f => {
                      const isHomeTeam = f.teams.home.id === teamId;
                      return isHomeTeam ? f.goals.home! > f.goals.away! : f.goals.away! > f.goals.home!;
                    }).length;
                    
                    const goalsFor5 = last5.reduce((sum, f) => {
                      const isHomeTeam = f.teams.home.id === teamId;
                      return sum + (isHomeTeam ? f.goals.home! : f.goals.away!);
                    }, 0);
                    
                    const goalsAgainst5 = last5.reduce((sum, f) => {
                      const isHomeTeam = f.teams.home.id === teamId;
                      return sum + (isHomeTeam ? f.goals.away! : f.goals.home!);
                    }, 0);
                    
                    // Calculate streak
                    let streak = 0;
                    for (const f of finishedFixtures) {
                      const isHomeTeam = f.teams.home.id === teamId;
                      const won = isHomeTeam ? f.goals.home! > f.goals.away! : f.goals.away! > f.goals.home!;
                      if (won) {
                        if (streak >= 0) streak++;
                        else break;
                      } else {
                        if (streak <= 0) streak--;
                        else break;
                      }
                    }
                    
                    // Form trend
                    const older5 = finishedFixtures.slice(5, 10);
                    const older5Wins = older5.filter(f => {
                      const isHomeTeam = f.teams.home.id === teamId;
                      return isHomeTeam ? f.goals.home! > f.goals.away! : f.goals.away! > f.goals.home!;
                    }).length;
                    const formTrend = (wins5 - older5Wins) / 5.0;
                    
                    logger.info(`✅ Using REAL API-Football data for ${teamName} (${finishedFixtures.length} matches)`);
                    
                    return {
                      winRate5: wins5 / last5.length,
                      winRate10: wins10 / last10.length,
                      goalsForAvg5: goalsFor5 / last5.length,
                      goalsAgainstAvg5: goalsAgainst5 / last5.length,
                      currentStreak: streak,
                      formTrend,
                      isRealData: true,
                    };
                  }
                }
              }
            } catch (error: any) {
              logger.debug(`API-Football not available for ${teamName}, trying DB: ${error.message}`);
            }
          }
          
          // STEP 2: Fallback to database
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
            take: limit,
          });

          if (recentEvents.length === 0) {
            logger.warn(`⚠️ No data found for ${teamName}, using defaults`);
            return { ...this.getDefaultForm(), isRealData: false };
          }
          
          logger.info(`✅ Using DB data for ${teamName} (${recentEvents.length} matches)`);

          // Calculate form metrics from DB
          const last5 = recentEvents.slice(0, 5);
          const last10 = recentEvents.slice(0, 10);

          const wins5 = last5.filter(e => this.teamWon(e, teamName, isHome)).length;
          const wins10 = last10.filter(e => this.teamWon(e, teamName, isHome)).length;

          const goalsFor5 = last5.reduce((sum, e) => sum + this.getGoalsFor(e, teamName, isHome), 0);
          const goalsAgainst5 = last5.reduce((sum, e) => sum + this.getGoalsAgainst(e, teamName, isHome), 0);

          // Calculate streak
          let streak = 0;
          for (const event of recentEvents) {
            if (this.teamWon(event, teamName, isHome)) {
              if (streak >= 0) streak++;
              else break;
            } else {
              if (streak <= 0) streak--;
              else break;
            }
          }

          // Form trend (last 5 vs previous 5)
          const older5 = recentEvents.slice(5, 10);
          const older5Wins = older5.filter(e => this.teamWon(e, teamName, isHome)).length;
          const formTrend = (wins5 - older5Wins) / 5.0;

          return {
            winRate5: wins5 / last5.length,
            winRate10: wins10 / last10.length,
            goalsForAvg5: goalsFor5 / last5.length,
            goalsAgainstAvg5: goalsAgainst5 / last5.length,
            currentStreak: streak,
            formTrend,
            isRealData: true, // DB data is real
          };
        } catch (error: any) {
          logger.error(`Error calculating team form for ${teamName}:`, error);
          return { ...this.getDefaultForm(), isRealData: false };
        }
      }
    );
  }

  /**
   * Calculate head-to-head statistics
   * Uses cache to avoid recalculating frequently
   * CRITICAL: Tries API-Football first for real data, falls back to DB, then defaults
   */
  async calculateHeadToHead(team1: string, team2: string, sportId: string, limit: number = 10): Promise<HeadToHead> {
    return featuresCacheService.getHeadToHead(
      team1,
      team2,
      sportId,
      async () => {
        try {
          // STEP 1: Try API-Football for real data (only for soccer/football)
          const apiFootball = getAPIFootballService();
          const isSoccer = sportId.includes('soccer') || sportId.includes('football') || 
                          sportId.includes('serie_a') || sportId.includes('la_liga') || 
                          sportId.includes('epl') || sportId.includes('bundesliga');
          
          if (apiFootball && isSoccer) {
            try {
              // Helper function to search team with multiple attempts
              const searchTeamFlexible = async (name: string) => {
                let teams = await apiFootball.searchTeams(name);
                
                if (teams.length === 0) {
                  const cleanName = name
                    .replace(/^(FC|CF|AC|AS|SC|RC|UD|CD|SD|CF|Athletic|Atletico|Atletico|Real|Deportivo|Sporting|Racing|Villarreal|Valencia|Sevilla|Betis|Espanyol|Getafe|Osasuna|Celta|Mallorca|Granada|Levante|Alaves|Eibar|Valladolid|Elche|Cadiz|Rayo|Girona|Las Palmas|Almeria)\s+/i, '')
                    .replace(/\s+(FC|CF|AC|AS|SC|RC|UD|CD|SD|CF)$/i, '')
                    .trim();
                  
                  if (cleanName !== name && cleanName.length > 3) {
                    teams = await apiFootball.searchTeams(cleanName);
                  }
                }
                
                if (teams.length === 0 && name.length > 5) {
                  const words = name.split(' ').filter(w => w.length > 3);
                  if (words.length > 0) {
                    teams = await apiFootball.searchTeams(words[0]);
                  }
                }
                
                return teams;
              };
              
              // Search for both teams
              const [teams1, teams2] = await Promise.all([
                searchTeamFlexible(team1),
                searchTeamFlexible(team2),
              ]);
              
              if (teams1.length > 0 && teams2.length > 0) {
                const team1Id = teams1[0].id;
                const team2Id = teams2[0].id;
                
                // Get H2H from API-Football
                const h2hMatches = await apiFootball.getHeadToHead(team1Id, team2Id, limit);
                
                if (h2hMatches.length > 0) {
                  const team1Wins = h2hMatches.filter(m => {
                    const isHome = m.teams.home.id === team1Id;
                    return isHome ? m.goals.home > m.goals.away : m.goals.away > m.goals.home;
                  }).length;
                  
                  const draws = h2hMatches.filter(m => m.goals.home === m.goals.away).length;
                  const totalGoals = h2hMatches.reduce((sum, m) => sum + m.goals.home + m.goals.away, 0);
                  
                  // Recent trend (last 3)
                  const recent3 = h2hMatches.slice(0, 3);
                  const recent3Wins = recent3.filter(m => {
                    const isHome = m.teams.home.id === team1Id;
                    return isHome ? m.goals.home > m.goals.away : m.goals.away > m.goals.home;
                  }).length;
                  const recentTrend = (recent3Wins - 1.5) / 1.5;
                  
                  const bothTeamsScored = h2hMatches.filter(m => m.goals.home > 0 && m.goals.away > 0).length;
                  const bothTeamsScoredRate = h2hMatches.length > 0 ? bothTeamsScored / h2hMatches.length : 0.5;
                  
                  logger.info(`✅ Using REAL API-Football H2H data for ${team1} vs ${team2} (${h2hMatches.length} matches)`);
                  
                  return {
                    team1WinRate: team1Wins / h2hMatches.length,
                    drawRate: draws / h2hMatches.length,
                    totalGoalsAvg: totalGoals / h2hMatches.length,
                    recentTrend,
                    totalMatches: h2hMatches.length,
                    bothTeamsScoredRate,
                    isRealData: true,
                  };
                }
              }
            } catch (error: any) {
              logger.debug(`API-Football H2H not available for ${team1} vs ${team2}, trying DB: ${error.message}`);
            }
          }
          
          // STEP 2: Fallback to database
          const h2hEvents = await prisma.event.findMany({
            where: {
              sportId,
              status: 'FINISHED',
              homeScore: { not: null },
              awayScore: { not: null },
              OR: [
                {
                  AND: [
                    { homeTeam: { contains: team1, mode: 'insensitive' } },
                    { awayTeam: { contains: team2, mode: 'insensitive' } },
                  ],
                },
                {
                  AND: [
                    { homeTeam: { contains: team2, mode: 'insensitive' } },
                    { awayTeam: { contains: team1, mode: 'insensitive' } },
                  ],
                },
              ],
            },
            orderBy: { startTime: 'desc' },
            take: limit,
          });

          if (h2hEvents.length === 0) {
            logger.warn(`⚠️ No H2H data found for ${team1} vs ${team2}, using defaults`);
            return { ...this.getDefaultH2H(), isRealData: false };
          }
          
          logger.info(`✅ Using DB H2H data for ${team1} vs ${team2} (${h2hEvents.length} matches)`);

          const team1Wins = h2hEvents.filter(e => this.teamWon(e, team1, true) || this.teamWon(e, team1, false)).length;
          const draws = h2hEvents.filter(e => e.homeScore === e.awayScore).length;
          const totalGoals = h2hEvents.reduce((sum, e) => sum + (e.homeScore || 0) + (e.awayScore || 0), 0);

          // Recent trend (last 3)
          const recent3 = h2hEvents.slice(0, 3);
          const recent3Wins = recent3.filter(e => this.teamWon(e, team1, true) || this.teamWon(e, team1, false)).length;
          const recentTrend = (recent3Wins - 1.5) / 1.5;

          // Calculate both teams scored rate
          const bothTeamsScored = h2hEvents.filter(e => (e.homeScore || 0) > 0 && (e.awayScore || 0) > 0).length;
          const bothTeamsScoredRate = h2hEvents.length > 0 ? bothTeamsScored / h2hEvents.length : 0.5;

          return {
            team1WinRate: team1Wins / h2hEvents.length,
            drawRate: draws / h2hEvents.length,
            totalGoalsAvg: totalGoals / h2hEvents.length,
            recentTrend,
            totalMatches: h2hEvents.length,
            bothTeamsScoredRate,
            isRealData: true, // DB data is real
          };
        } catch (error: any) {
          logger.error(`Error calculating H2H for ${team1} vs ${team2}:`, error);
          return { ...this.getDefaultH2H(), isRealData: false };
        }
      }
    );
  }

  /**
   * Calculate advanced market intelligence
   * Uses cache to avoid recalculating frequently
   */
  async calculateMarketIntelligence(eventId: string, marketId: string): Promise<MarketIntelligence> {
    return featuresCacheService.getMarketIntelligence(
      eventId,
      marketId,
      async () => {
        try {
          // Get all active odds for this market
          const odds = await prisma.odds.findMany({
        where: {
          marketId,
          isActive: true,
        },
      });

      if (odds.length === 0) {
        return this.getDefaultMarketIntelligence();
      }

      const oddsValues = odds.map(o => o.decimal).filter(o => o > 0);
      const probs = oddsValues.map(odd => 1 / odd);

      const meanProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
      const variance = probs.reduce((sum, p) => sum + Math.pow(p - meanProb, 2), 0) / probs.length;
      const stdProb = Math.sqrt(variance);

      // Market consensus
      const consensus = 1.0 - Math.min(stdProb * 2, 0.5);

      // Market efficiency
      const efficiency = 1.0 - stdProb;

      // Odds spread
      const bestOdd = Math.max(...oddsValues);
      const worstOdd = Math.min(...oddsValues);
      const oddsSpread = (bestOdd - worstOdd) / worstOdd;

      // Value opportunity
      const valueOpportunity = oddsSpread * (1 - consensus);

      // Sharp money indicator (simplified - would need odds history)
      const sharpMoneyIndicator = 0.5; // Placeholder

          return {
            consensus,
            efficiency,
            sharpMoneyIndicator,
            valueOpportunity,
            oddsSpread,
          };
        } catch (error: any) {
          logger.error(`Error calculating market intelligence for event ${eventId}:`, error);
          return this.getDefaultMarketIntelligence();
        }
      }
    );
  }

  /**
   * Get all advanced features for an event
   */
  async getAllAdvancedFeatures(eventId: string, homeTeam: string, awayTeam: string, sportId: string) {
    try {
      const [homeForm, awayForm, h2h, market] = await Promise.all([
        this.calculateTeamForm(homeTeam, sportId, true),
        this.calculateTeamForm(awayTeam, sportId, false),
        this.calculateHeadToHead(homeTeam, awayTeam, sportId),
        // Get market intelligence for MATCH_WINNER market
        (async () => {
          const market = await prisma.market.findFirst({
            where: {
              eventId,
              type: 'MATCH_WINNER',
            },
          });
          if (market) {
            return this.calculateMarketIntelligence(eventId, market.id);
          }
          return this.getDefaultMarketIntelligence();
        })(),
      ]);

      // Check if we have real data
      const hasRealData = (homeForm.isRealData !== false) || (awayForm.isRealData !== false) || (h2h.isRealData !== false);
      
      if (!hasRealData) {
        logger.warn(`⚠️ Using default values for event ${eventId} - no real data available`);
      }
      
      return {
        homeForm,
        awayForm,
        h2h,
        market,
        // Relative features
        formAdvantage: homeForm.winRate5 - awayForm.winRate5,
        goalsAdvantage: homeForm.goalsForAvg5 - awayForm.goalsForAvg5,
        defenseAdvantage: awayForm.goalsAgainstAvg5 - homeForm.goalsAgainstAvg5,
        // Flag to indicate if we have real data
        hasRealData,
      };
    } catch (error: any) {
      logger.error(`Error getting advanced features for event ${eventId}:`, error);
      return {
        homeForm: this.getDefaultForm(),
        awayForm: this.getDefaultForm(),
        h2h: this.getDefaultH2H(),
        market: this.getDefaultMarketIntelligence(),
        formAdvantage: 0,
        goalsAdvantage: 0,
        defenseAdvantage: 0,
        hasRealData: false, // Mark as no real data
      };
    }
  }

  // Helper methods
  private teamWon(event: any, teamName: string, isHome: boolean): boolean {
    const homeScore = event.homeScore || 0;
    const awayScore = event.awayScore || 0;
    const homeTeam = event.homeTeam || '';
    const awayTeam = event.awayTeam || '';

    if (isHome && homeTeam.toLowerCase().includes(teamName.toLowerCase())) {
      return homeScore > awayScore;
    } else if (!isHome && awayTeam.toLowerCase().includes(teamName.toLowerCase())) {
      return awayScore > homeScore;
    }
    return false;
  }

  private getGoalsFor(event: any, teamName: string, isHome: boolean): number {
    const homeTeam = event.homeTeam || '';
    const awayTeam = event.awayTeam || '';

    if (isHome && homeTeam.toLowerCase().includes(teamName.toLowerCase())) {
      return event.homeScore || 0;
    } else if (!isHome && awayTeam.toLowerCase().includes(teamName.toLowerCase())) {
      return event.awayScore || 0;
    }
    return 0;
  }

  private getGoalsAgainst(event: any, teamName: string, isHome: boolean): number {
    const homeTeam = event.homeTeam || '';
    const awayTeam = event.awayTeam || '';

    if (isHome && homeTeam.toLowerCase().includes(teamName.toLowerCase())) {
      return event.awayScore || 0;
    } else if (!isHome && awayTeam.toLowerCase().includes(teamName.toLowerCase())) {
      return event.homeScore || 0;
    }
    return 0;
  }

  private getDefaultForm(): TeamForm {
    return {
      winRate5: 0.5,
      winRate10: 0.5,
      goalsForAvg5: 1.5,
      goalsAgainstAvg5: 1.5,
      currentStreak: 0,
      formTrend: 0,
      isRealData: false, // Mark as default/not real
    };
  }

  private getDefaultH2H(): HeadToHead & { totalMatches: number; bothTeamsScoredRate: number } {
    return {
      team1WinRate: 0.5,
      drawRate: 0.25,
      totalGoalsAvg: 3.0,
      recentTrend: 0,
      totalMatches: 5,
      bothTeamsScoredRate: 0.5,
      isRealData: false, // Mark as default/not real
    };
  }

  private getDefaultMarketIntelligence(): MarketIntelligence {
    return {
      consensus: 0.7,
      efficiency: 0.9,
      sharpMoneyIndicator: 0.5,
      valueOpportunity: 0.02,
      oddsSpread: 0.1,
    };
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();


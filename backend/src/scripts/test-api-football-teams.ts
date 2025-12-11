/**
 * Test script to verify API-Football team search and data retrieval
 */

import dotenv from 'dotenv';
import { getAPIFootballService, initializeAPIFootballService } from '../services/integrations/api-football.service';
import { advancedFeaturesService } from '../services/advanced-features.service';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testAPIFootballTeams() {
  try {
    logger.info('🧪 Testing API-Football integration with real teams...');
    logger.info('');

    // Initialize API-Football service
    initializeAPIFootballService();
    
    const apiFootball = getAPIFootballService();
    
    if (!apiFootball) {
      logger.error('❌ API-Football service not initialized');
      logger.info('💡 Make sure API_FOOTBALL_KEY is set in .env');
      process.exit(1);
    }

    // Test teams from different leagues
    const testTeams = [
      { name: 'Real Madrid', league: 'La Liga' },
      { name: 'Barcelona', league: 'La Liga' },
      { name: 'Real Sociedad', league: 'La Liga' },
      { name: 'Girona', league: 'La Liga' },
      { name: 'AC Milan', league: 'Serie A' },
      { name: 'Juventus', league: 'Serie A' },
      { name: 'Manchester City', league: 'Premier League' },
      { name: 'Liverpool', league: 'Premier League' },
    ];

    logger.info('📋 Testing team search:');
    logger.info('');

    for (const testTeam of testTeams) {
      try {
        logger.info(`🔍 Searching for: ${testTeam.name} (${testTeam.league})`);
        
        // Test direct search
        const teams = await apiFootball.searchTeams(testTeam.name);
        
        if (teams.length > 0) {
          const team = teams[0];
          logger.info(`   ✅ Found: ${team.name} (ID: ${team.id})`);
          
          // Test getting fixtures with league and season
          // Try to get fixtures from current season (2024)
          const currentYear = new Date().getFullYear();
          const fixtures = await apiFootball.getFixtures({
            team: team.id,
            last: 5,
            season: currentYear,
          });
          
          // If no results, try previous season
          let allFixtures = fixtures;
          if (fixtures.length === 0) {
            allFixtures = await apiFootball.getFixtures({
              team: team.id,
              last: 5,
              season: currentYear - 1,
            });
          }
          
          const finishedFixtures = allFixtures.filter(f => 
            f.fixture.status.short === 'FT' && 
            f.goals.home !== null && 
            f.goals.away !== null
          );
          
          if (finishedFixtures.length > 0) {
            logger.info(`   ✅ Found ${finishedFixtures.length} finished fixtures`);
            
            // Test form calculation
            const form = await advancedFeaturesService.calculateTeamForm(
              testTeam.name,
              'soccer_spain_la_liga', // Using a soccer sport ID
              true,
              5
            );
            
            if (form.isRealData) {
              logger.info(`   ✅ Form calculated with REAL data:`);
              logger.info(`      - Win Rate (last 5): ${(form.winRate5 * 100).toFixed(1)}%`);
              logger.info(`      - Goals For (avg): ${form.goalsForAvg5.toFixed(2)}`);
              logger.info(`      - Goals Against (avg): ${form.goalsAgainstAvg5.toFixed(2)}`);
              logger.info(`      - Current Streak: ${form.currentStreak}`);
            } else {
              logger.warn(`   ⚠️ Form calculated with DEFAULT values`);
            }
          } else {
            logger.warn(`   ⚠️ No finished fixtures found`);
          }
        } else {
          logger.warn(`   ❌ Team not found in API-Football`);
        }
        
        logger.info('');
      } catch (error: any) {
        logger.error(`   ❌ Error testing ${testTeam.name}:`, error.message);
        logger.info('');
      }
    }

    // Test H2H between two known teams
    logger.info('📋 Testing Head-to-Head:');
    logger.info('');
    
    try {
      logger.info('🔍 Testing H2H: Real Madrid vs Barcelona');
      const h2h = await advancedFeaturesService.calculateHeadToHead(
        'Real Madrid',
        'Barcelona',
        'soccer_spain_la_liga',
        10
      );
      
      if (h2h.isRealData) {
        logger.info(`   ✅ H2H calculated with REAL data:`);
        logger.info(`      - Real Madrid Win Rate: ${(h2h.team1WinRate * 100).toFixed(1)}%`);
        logger.info(`      - Draw Rate: ${(h2h.drawRate * 100).toFixed(1)}%`);
        logger.info(`      - Total Goals (avg): ${h2h.totalGoalsAvg.toFixed(2)}`);
        logger.info(`      - Total Matches: ${h2h.totalMatches || 'N/A'}`);
      } else {
        logger.warn(`   ⚠️ H2H calculated with DEFAULT values`);
      }
    } catch (error: any) {
      logger.error(`   ❌ Error testing H2H:`, error.message);
    }

    logger.info('');
    logger.info('✅ Test completed');
    
  } catch (error: any) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  testAPIFootballTeams();
}

export { testAPIFootballTeams };

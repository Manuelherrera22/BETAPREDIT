/**
 * Test Feature Extraction Script
 * Verifies that all 50+ features are being extracted correctly
 */

import { automlTrainingService } from '../services/automl-training.service';
import { logger } from '../utils/logger';

async function testFeatureExtraction() {
  try {
    logger.info('Testing feature extraction...');
    
    // Get a small sample of training data
    const trainingData = await automlTrainingService.getTrainingDataFromDatabase(10);
    
    if (trainingData.length === 0) {
      logger.warn('No training data available. Make sure there are predictions with wasCorrect set.');
      return;
    }
    
    // Analyze first sample
    const sample = trainingData[0];
    const featureCount = Object.keys(sample.features).length;
    const featureNames = Object.keys(sample.features).sort();
    
    logger.info(`\n=== FEATURE EXTRACTION TEST RESULTS ===`);
    logger.info(`Sample size: ${trainingData.length} predictions`);
    logger.info(`Features extracted: ${featureCount}`);
    logger.info(`\nFeature list (${featureNames.length} total):`);
    featureNames.forEach((name, idx) => {
      const value = sample.features[name];
      logger.info(`  ${idx + 1}. ${name}: ${value}`);
    });
    
    // Check if we have at least 50 features
    if (featureCount >= 50) {
      logger.info(`\n✅ SUCCESS: ${featureCount} features extracted (target: 50+)`);
    } else {
      logger.warn(`\n⚠️  WARNING: Only ${featureCount} features extracted (target: 50+)`);
      logger.warn('This may indicate that factors JSON is missing advanced features.');
    }
    
    // Check for key feature categories
    const categories = {
      'Basic': ['predicted_probability', 'confidence', 'avg_odds'],
      'Market Intelligence': ['market_consensus', 'market_volatility', 'market_sentiment'],
      'Historical': ['historical_win_rate', 'historical_goals_avg'],
      'Form': ['form_win_rate', 'form_momentum', 'team_form_momentum'],
      'H2H': ['h2h_win_rate', 'h2h_goals_avg'],
      'Injuries': ['injuries_count', 'injuries_key_players'],
      'Weather': ['weather_risk', 'weather_temperature'],
      'Calculated': ['odds_implied_prob', 'probability_difference', 'value_bet_score'],
    };
    
    logger.info(`\n=== FEATURE CATEGORIES ===`);
    for (const [category, expectedFeatures] of Object.entries(categories)) {
      const found = expectedFeatures.filter(f => featureNames.includes(f));
      const missing = expectedFeatures.filter(f => !featureNames.includes(f));
      logger.info(`${category}: ${found.length}/${expectedFeatures.length} found`);
      if (missing.length > 0) {
        logger.warn(`  Missing: ${missing.join(', ')}`);
      }
    }
    
  } catch (error: any) {
    logger.error('Error testing feature extraction:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testFeatureExtraction()
    .then(() => {
      logger.info('Feature extraction test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Feature extraction test failed:', error);
      process.exit(1);
    });
}

export { testFeatureExtraction };


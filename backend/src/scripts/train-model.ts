/**
 * Script to re-train ML model with all advanced features (50+)
 * This will use:
 * - All 50+ advanced features from factors JSON
 * - AutoGluon with best_quality preset (uses ALL algorithms)
 * - 5000+ training samples
 * - 2 hours training time
 * 
 * Expected accuracy improvement: 59% -> 70-75%
 */

import { automlTrainingService } from '../services/automl-training.service';
import { logger } from '../utils/logger';

async function trainModel() {
  try {
    logger.info('🚀 Starting ML model re-training with all advanced features...');
    logger.info('📊 Configuration:');
    logger.info('  - Framework: AutoGluon (best_quality preset)');
    logger.info('  - Algorithms: NeuralNetTorch, CatBoost, LightGBM, XGBoost, RandomForest, ExtraTrees, NeuralNetFastAI');
    logger.info('  - Ensembles: 5-fold bagging + 2-level stacking');
    logger.info('  - Training samples: 5000');
    logger.info('  - Time limit: 7200 seconds (2 hours)');
    logger.info('  - Features: 50+ advanced features');
    logger.info('');
    
    const result = await automlTrainingService.trainSportsModel({
      framework: 'autogluon',
      timeLimit: 7200, // 2 hours
      useRealData: true,
      limit: 5000, // More data = better model
    });

    logger.info('');
    logger.info('✅ Model training completed successfully!');
    logger.info('📈 Results:');
    logger.info(`  - Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
    logger.info(`  - Training time: ${(result.trainingTime / 60).toFixed(2)} minutes`);
    logger.info(`  - Best model: ${result.bestModel}`);
    logger.info(`  - Features used: ${result.features.length}`);
    logger.info(`  - Model path: ${result.modelPath}`);
    logger.info('');
    
    if (result.accuracy >= 0.70) {
      logger.info('🎉 EXCELLENT! Accuracy is 70%+ as expected!');
    } else if (result.accuracy >= 0.65) {
      logger.info('✅ GOOD! Accuracy improved significantly!');
    } else {
      logger.warn('⚠️  Accuracy could be better. Check if all features are being extracted correctly.');
    }

    return result;
  } catch (error: any) {
    logger.error('❌ Model training failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  trainModel()
    .then(() => {
      logger.info('Model training script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Model training script failed:', error);
      process.exit(1);
    });
}

export { trainModel };




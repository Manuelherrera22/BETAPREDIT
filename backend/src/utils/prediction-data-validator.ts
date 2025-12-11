/**
 * Prediction Data Validator
 * Validates the quality and completeness of prediction data before displaying
 */

import { logger } from './logger';

export interface PredictionDataQuality {
  isValid: boolean;
  completeness: number; // 0-1 score
  missingFields: string[];
  warnings: string[];
  canDisplay: boolean;
}

/**
 * Validates prediction factors structure
 */
export function validatePredictionFactors(factors: any): PredictionDataQuality {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  let completeness = 0;
  const totalChecks = 8;

  // Check 1: factors exists
  if (!factors || typeof factors !== 'object') {
    return {
      isValid: false,
      completeness: 0,
      missingFields: ['factors'],
      warnings: ['No se encontraron factores de predicción'],
      canDisplay: false,
    };
  }
  completeness += 1;

  // Check 2: marketAverage or advancedFeatures.marketOdds
  const hasMarketAverage = factors.marketAverage !== undefined;
  const hasMarketOdds = factors.advancedFeatures?.marketOdds !== undefined;
  if (!hasMarketAverage && !hasMarketOdds) {
    missingFields.push('marketAverage o advancedFeatures.marketOdds');
    warnings.push('No hay datos de cuotas del mercado disponibles');
  } else {
    completeness += 1;
  }

  // Check 3: advancedFeatures exists
  if (!factors.advancedFeatures || typeof factors.advancedFeatures !== 'object') {
    missingFields.push('advancedFeatures');
    warnings.push('No se encontraron características avanzadas');
  } else {
    completeness += 1;

    // Check 4: homeForm
    if (!factors.advancedFeatures.homeForm) {
      missingFields.push('advancedFeatures.homeForm');
      warnings.push('No hay datos de forma del equipo local');
    } else {
      completeness += 0.5;
      // Check if it's real data
      if (factors.advancedFeatures.homeForm.isRealData === false) {
        warnings.push('Forma del equipo local basada en datos por defecto');
      }
    }

    // Check 5: awayForm
    if (!factors.advancedFeatures.awayForm) {
      missingFields.push('advancedFeatures.awayForm');
      warnings.push('No hay datos de forma del equipo visitante');
    } else {
      completeness += 0.5;
      // Check if it's real data
      if (factors.advancedFeatures.awayForm.isRealData === false) {
        warnings.push('Forma del equipo visitante basada en datos por defecto');
      }
    }

    // Check 6: h2h or headToHead
    const hasH2H = factors.advancedFeatures.h2h || factors.advancedFeatures.headToHead;
    if (!hasH2H) {
      missingFields.push('advancedFeatures.h2h o headToHead');
      warnings.push('No hay datos de enfrentamientos directos');
    } else {
      completeness += 0.5;
      const h2hData = factors.advancedFeatures.h2h || factors.advancedFeatures.headToHead;
      if (h2hData.isRealData === false) {
        warnings.push('Datos de enfrentamientos directos basados en valores por defecto');
      }
    }

    // Check 7: marketIntelligence or market
    const hasMarketIntelligence = 
      factors.advancedFeatures.marketIntelligence || 
      factors.advancedFeatures.market ||
      factors.market;
    if (!hasMarketIntelligence) {
      missingFields.push('advancedFeatures.marketIntelligence o market');
      warnings.push('No hay datos de inteligencia de mercado');
    } else {
      completeness += 0.5;
    }

    // Check 8: advancedAnalysis
    if (!factors.advancedAnalysis) {
      missingFields.push('advancedAnalysis');
      warnings.push('No hay análisis avanzado disponible');
    } else {
      completeness += 0.5;
    }
  }

  // Check 9: Basic factors
  if (factors.formAdvantage === undefined) {
    missingFields.push('formAdvantage');
  } else {
    completeness += 0.5;
  }

  if (factors.goalsAdvantage === undefined) {
    missingFields.push('goalsAdvantage');
  } else {
    completeness += 0.5;
  }

  const finalCompleteness = Math.min(1, completeness / totalChecks);
  const canDisplay = finalCompleteness >= 0.5; // At least 50% complete

  return {
    isValid: finalCompleteness >= 0.7, // 70%+ is considered valid
    completeness: finalCompleteness,
    missingFields,
    warnings,
    canDisplay,
  };
}

/**
 * Validates prediction probability and confidence ranges
 */
export function validatePredictionValues(
  predictedProbability: number,
  confidence: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (predictedProbability < 0 || predictedProbability > 1) {
    errors.push(`Probabilidad predicha fuera de rango: ${predictedProbability} (debe estar entre 0 y 1)`);
  }

  if (confidence < 0.45 || confidence > 0.95) {
    errors.push(`Confianza fuera de rango: ${confidence} (debe estar entre 0.45 y 0.95)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates complete prediction data before displaying
 */
export function validatePredictionData(prediction: any): {
  isValid: boolean;
  quality: PredictionDataQuality;
  valueErrors: string[];
  canDisplay: boolean;
  message?: string;
} {
  // Validate factors
  const quality = validatePredictionFactors(prediction.factors);

  // Validate values
  const valueValidation = validatePredictionValues(
    prediction.predictedProbability,
    prediction.confidence
  );

  const canDisplay = quality.canDisplay && valueValidation.isValid;

  let message: string | undefined;
  if (!canDisplay) {
    if (quality.completeness < 0.5) {
      message = 'Datos insuficientes para mostrar esta predicción. Los datos se están actualizando.';
    } else if (!valueValidation.isValid) {
      message = 'Valores de predicción inválidos. Por favor, contacta al soporte.';
    } else {
      message = 'Algunos datos no están disponibles. La predicción puede ser menos precisa.';
    }
  } else if (quality.completeness < 0.8) {
    message = 'Algunos datos no están completamente disponibles. La predicción puede ser menos precisa.';
  }

  return {
    isValid: quality.isValid && valueValidation.isValid,
    quality,
    valueErrors: valueValidation.errors,
    canDisplay,
    message,
  };
}

/**
 * Sanitizes prediction data for display
 */
export function sanitizePredictionForDisplay(prediction: any): any {
  const sanitized = { ...prediction };

  // Ensure factors is always an object
  if (!sanitized.factors || typeof sanitized.factors !== 'object') {
    sanitized.factors = {};
  }

  // Ensure predictedProbability is within bounds
  if (sanitized.predictedProbability !== undefined) {
    sanitized.predictedProbability = Math.max(0, Math.min(1, sanitized.predictedProbability));
  }

  // Ensure confidence is within bounds
  if (sanitized.confidence !== undefined) {
    sanitized.confidence = Math.max(0.45, Math.min(0.95, sanitized.confidence));
  }

  return sanitized;
}


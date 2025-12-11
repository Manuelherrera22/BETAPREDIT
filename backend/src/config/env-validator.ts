/**
 * Environment Variables Validator
 * Validates all required environment variables at startup
 */

import { logger } from '../utils/logger';

interface EnvVarConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const ENV_VARS: EnvVarConfig[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    errorMessage: 'DATABASE_URL debe ser una URL de PostgreSQL válida',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'JWT_SECRET debe tener al menos 32 caracteres',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres',
  },
  {
    name: 'FRONTEND_URL',
    required: true,
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    errorMessage: 'FRONTEND_URL debe ser una URL válida',
  },
  {
    name: 'NODE_ENV',
    required: false,
    defaultValue: 'development',
  },
  {
    name: 'PORT',
    required: false,
    defaultValue: '3000',
    validator: (value) => !isNaN(Number(value)) && Number(value) > 0 && Number(value) < 65536,
    errorMessage: 'PORT debe ser un número entre 1 y 65535',
  },
  {
    name: 'THE_ODDS_API_KEY',
    required: false,
    errorMessage: 'THE_ODDS_API_KEY no está configurada - algunas funcionalidades no estarán disponibles',
  },
  {
    name: 'API_FOOTBALL_KEY',
    required: false,
    errorMessage: 'API_FOOTBALL_KEY no está configurada - las predicciones usarán datos por defecto',
  },
  {
    name: 'SUPABASE_URL',
    required: false,
    errorMessage: 'SUPABASE_URL no está configurada - funcionalidades de Supabase no estarán disponibles',
  },
  {
    name: 'SUPABASE_ANON_KEY',
    required: false,
    errorMessage: 'SUPABASE_ANON_KEY no está configurada',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    errorMessage: 'SUPABASE_SERVICE_ROLE_KEY no está configurada',
  },
  {
    name: 'REDIS_URL',
    required: false,
    errorMessage: 'REDIS_URL no está configurada - se usará cache en memoria',
  },
  {
    name: 'SENTRY_DSN',
    required: false,
    errorMessage: 'SENTRY_DSN no está configurada - errores no se enviarán a Sentry',
  },
];

/**
 * Validate all environment variables
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(`❌ ${envVar.name} es requerida pero no está configurada`);
      } else if (envVar.errorMessage) {
        warnings.push(`⚠️ ${envVar.name}: ${envVar.errorMessage}`);
      } else if (envVar.defaultValue) {
        process.env[envVar.name] = envVar.defaultValue;
        logger.info(`✅ ${envVar.name} usando valor por defecto: ${envVar.defaultValue}`);
      }
      continue;
    }

    // Validate value if validator provided
    if (envVar.validator && !envVar.validator(value)) {
      if (envVar.required) {
        errors.push(`❌ ${envVar.name}: ${envVar.errorMessage || 'Valor inválido'}`);
      } else {
        warnings.push(`⚠️ ${envVar.name}: ${envVar.errorMessage || 'Valor inválido'}`);
      }
      continue;
    }

    // Sanitize sensitive values for logging
    const displayValue = envVar.name.includes('SECRET') || envVar.name.includes('KEY') || envVar.name.includes('PASSWORD')
      ? '***'
      : value;

    logger.info(`✅ ${envVar.name} configurada: ${displayValue}`);
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Advertencias de configuración:');
    warnings.forEach(warning => logger.warn(warning));
  }

  // Throw error if required vars are missing
  if (errors.length > 0) {
    logger.error('❌ Errores de configuración:');
    errors.forEach(error => logger.error(error));
    throw new Error(`Faltan variables de entorno requeridas: ${errors.length} error(es)`);
  }

  logger.info('✅ Todas las variables de entorno requeridas están configuradas');
}


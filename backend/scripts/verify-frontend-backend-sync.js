/**
 * Verificar Sincronización Frontend-Backend
 * Verifica que todos los servicios del frontend estén sincronizados con las Edge Functions
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '../../frontend/src/services');
const EDGE_FUNCTIONS_DIR = path.join(__dirname, '../../supabase/functions');

// Mapeo de servicios frontend a Edge Functions
const SERVICE_MAPPING = {
  'valueBetAlertsService.ts': 'value-bet-alerts',
  'notificationsService.ts': 'notifications',
  'roiTrackingService.ts': 'roi-tracking',
  'valueBetDetectionService.ts': 'value-bet-detection',
  'arbitrageService.ts': 'arbitrage',
  'valueBetAnalyticsService.ts': 'value-bet-analytics',
  'userPreferencesService.ts': 'user-preferences',
  'referralService.ts': 'referrals',
  'platformMetricsService.ts': 'platform-metrics',
  'predictionsService.ts': 'predictions',
  'userProfileService.ts': 'user-profile',
  'externalBetsService.ts': 'external-bets',
  'userStatisticsService.ts': 'user-statistics',
};

// Endpoints esperados por servicio
const EXPECTED_ENDPOINTS = {
  'value-bet-alerts': [
    '/value-bet-alerts/my-alerts',
    '/value-bet-alerts/stats',
    '/value-bet-alerts/:id/click',
    '/value-bet-alerts/:id/taken',
  ],
  'notifications': [
    '/notifications',
    '/notifications/unread-count',
    '/notifications/:id/read',
    '/notifications/:id/click',
    '/notifications/read-all',
    '/notifications/:id',
  ],
  'roi-tracking': [
    '/roi-tracking',
    '/roi-tracking/history',
    '/roi-tracking/top-value-bets',
  ],
  'value-bet-detection': [
    '/value-bet-detection/sport/:sport',
    '/value-bet-detection/scan-all',
  ],
  'arbitrage': [
    '/arbitrage/opportunities',
    '/arbitrage/event/:eventId',
    '/arbitrage/calculate-stakes',
  ],
  'value-bet-analytics': [
    '/value-bet-analytics',
    '/value-bet-analytics/top',
    '/value-bet-analytics/trends',
    '/value-bet-analytics/track/:alertId',
  ],
  'user-preferences': [
    '/user-preferences',
    '/user-preferences/value-bets',
  ],
  'referrals': [
    '/referrals/me',
    '/referrals/leaderboard',
    '/referrals/process',
  ],
  'platform-metrics': [
    '/platform-metrics',
  ],
  'predictions': [
    '/predictions/accuracy',
    '/predictions/stats',
    '/predictions/history',
    '/predictions/:predictionId/feedback',
    '/predictions/:predictionId/factors',
  ],
  'user-profile': [
    '/user-profile',
  ],
};

function checkServiceFile(serviceFile) {
  const servicePath = path.join(SERVICES_DIR, serviceFile);
  if (!fs.existsSync(servicePath)) {
    return { exists: false, errors: [`Service file not found: ${serviceFile}`] };
  }

  const content = fs.readFileSync(servicePath, 'utf-8');
  const edgeFunctionName = SERVICE_MAPPING[serviceFile];
  
  if (!edgeFunctionName) {
    return { exists: true, usesEdgeFunction: false, note: 'No Edge Function mapping' };
  }

  const edgeFunctionPath = path.join(EDGE_FUNCTIONS_DIR, edgeFunctionName, 'index.ts');
  const edgeFunctionExists = fs.existsSync(edgeFunctionPath);

  const checks = {
    usesEdgeFunction: content.includes('getSupabaseFunctionsUrl') || content.includes('supabaseUrl'),
    usesProductionCheck: content.includes('import.meta.env.PROD') || content.includes('isProduction'),
    hasFallback: content.includes('Fallback') || content.includes('fallback'),
    edgeFunctionExists,
    hasAuthToken: content.includes('getSupabaseAuthToken') || content.includes('getSession'),
  };

  const errors = [];
  if (!checks.usesEdgeFunction) {
    errors.push('No usa Edge Functions (no tiene getSupabaseFunctionsUrl)');
  }
  if (!checks.usesProductionCheck) {
    errors.push('No verifica entorno de producción');
  }
  if (!checks.hasFallback) {
    errors.push('No tiene fallback a backend local');
  }
  if (!checks.edgeFunctionExists) {
    errors.push(`Edge Function no existe: ${edgeFunctionName}`);
  }
  if (!checks.hasAuthToken) {
    errors.push('No obtiene token de autenticación');
  }

  // Verificar endpoints
  const endpointErrors = [];
  const expectedEndpoints = EXPECTED_ENDPOINTS[edgeFunctionName] || [];
  expectedEndpoints.forEach(endpoint => {
    const endpointPath = endpoint.replace(':id', '').replace(':sport', '').replace(':eventId', '').replace(':predictionId', '');
    if (!content.includes(endpointPath) && !content.includes(endpoint.replace('/', ''))) {
      endpointErrors.push(`Endpoint no encontrado: ${endpoint}`);
    }
  });

  return {
    exists: true,
    usesEdgeFunction: checks.usesEdgeFunction,
    edgeFunctionExists: checks.edgeFunctionExists,
    errors: errors.length > 0 ? errors : null,
    endpointErrors: endpointErrors.length > 0 ? endpointErrors : null,
    checks,
  };
}

function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN DE SINCRONIZACIÓN FRONTEND-BACKEND');
  console.log('='.repeat(70) + '\n');

  const results = {};
  let totalServices = 0;
  let syncedServices = 0;
  let issuesFound = 0;

  Object.keys(SERVICE_MAPPING).forEach(serviceFile => {
    totalServices++;
    const result = checkServiceFile(serviceFile);
    results[serviceFile] = result;

    if (result.exists && result.usesEdgeFunction && !result.errors) {
      syncedServices++;
      console.log(`✅ ${serviceFile}`);
      console.log(`   Edge Function: ${SERVICE_MAPPING[serviceFile]}`);
      if (result.endpointErrors) {
        console.log(`   ⚠️  Endpoints faltantes: ${result.endpointErrors.length}`);
        result.endpointErrors.forEach(err => console.log(`      - ${err}`));
        issuesFound++;
      }
    } else {
      issuesFound++;
      const status = result.exists ? '⚠️' : '❌';
      console.log(`${status} ${serviceFile}`);
      if (!result.exists) {
        console.log(`   ❌ Archivo no existe`);
      } else {
        if (!result.usesEdgeFunction) {
          console.log(`   ❌ No usa Edge Functions`);
        }
        if (result.errors) {
          result.errors.forEach(err => console.log(`   ❌ ${err}`));
        }
        if (result.endpointErrors) {
          result.endpointErrors.forEach(err => console.log(`   ⚠️  ${err}`));
        }
      }
    }
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('📊 RESUMEN');
  console.log('='.repeat(70));
  console.log(`Total de servicios: ${totalServices}`);
  console.log(`✅ Sincronizados: ${syncedServices}`);
  console.log(`⚠️  Con problemas: ${issuesFound}`);
  console.log(`Tasa de sincronización: ${((syncedServices / totalServices) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  if (issuesFound === 0) {
    console.log('\n🎉 ¡Todos los servicios están perfectamente sincronizados!');
  } else {
    console.log('\n⚠️  Se encontraron problemas. Revisa los detalles arriba.');
  }

  return { totalServices, syncedServices, issuesFound, results };
}

if (require.main === module) {
  main();
}

module.exports = { checkServiceFile, main };

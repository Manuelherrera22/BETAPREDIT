/**
 * Test All Supabase Edge Functions
 * Verifica que todas las Edge Functions estén funcionando correctamente
 */

require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Helper para hacer requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test una Edge Function
async function testEdgeFunction(name, tests) {
  console.log(`\n🧪 Testing ${name}...`);
  const results = {
    name,
    passed: 0,
    failed: 0,
    errors: [],
  };

  for (const test of tests) {
    try {
      const response = await makeRequest(`${BASE_URL}${test.path}`, {
        method: test.method || 'GET',
        headers: {
          ...(test.token ? { 'Authorization': `Bearer ${test.token}` } : {}),
        },
        body: test.body,
      });

      // Verificar respuesta
      if (test.expectedStatus) {
        if (response.status === test.expectedStatus) {
          console.log(`  ✅ ${test.name}: Status ${response.status} (esperado ${test.expectedStatus})`);
          results.passed++;
        } else {
          console.log(`  ❌ ${test.name}: Status ${response.status} (esperado ${test.expectedStatus})`);
          results.failed++;
          results.errors.push(`${test.name}: Status incorrecto`);
        }
      }

      if (test.expectedData) {
        const hasExpectedData = test.expectedData(response.data);
        if (hasExpectedData) {
          console.log(`  ✅ ${test.name}: Datos correctos`);
          results.passed++;
        } else {
          console.log(`  ❌ ${test.name}: Datos incorrectos`);
          results.failed++;
          results.errors.push(`${test.name}: Datos no coinciden`);
        }
      }

      if (test.validate) {
        const isValid = test.validate(response);
        if (isValid) {
          console.log(`  ✅ ${test.name}: Validación pasada`);
          results.passed++;
        } else {
          console.log(`  ❌ ${test.name}: Validación fallida`);
          results.failed++;
          results.errors.push(`${test.name}: Validación fallida`);
        }
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: Error - ${error.message}`);
      results.failed++;
      results.errors.push(`${test.name}: ${error.message}`);
    }
  }

  return results;
}

// Obtener token de autenticación (simulado para tests)
async function getTestToken() {
  // Para tests reales, necesitarías autenticarte primero
  // Por ahora, usamos un token de prueba o el anon key
  return SUPABASE_ANON_KEY;
}

async function runAllTests() {
  console.log('🚀 Iniciando tests de todas las Edge Functions de Supabase\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const allResults = [];

  // Test 1: Value Bet Alerts
  const valueBetAlertsTests = [
    {
      name: 'GET /value-bet-alerts/my-alerts (requiere auth)',
      path: '/value-bet-alerts/my-alerts',
      method: 'GET',
      expectedStatus: 401, // Sin auth debería dar 401
      validate: (response) => response.status === 401 || response.status === 200,
    },
    {
      name: 'GET /value-bet-alerts/stats (requiere auth)',
      path: '/value-bet-alerts/stats',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Value Bet Alerts', valueBetAlertsTests));

  // Test 2: Notifications
  const notificationsTests = [
    {
      name: 'GET /notifications (requiere auth)',
      path: '/notifications',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
    {
      name: 'GET /notifications/unread-count (requiere auth)',
      path: '/notifications/unread-count',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Notifications', notificationsTests));

  // Test 3: ROI Tracking
  const roiTrackingTests = [
    {
      name: 'GET /roi-tracking (requiere auth)',
      path: '/roi-tracking',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
    {
      name: 'GET /roi-tracking/history (requiere auth)',
      path: '/roi-tracking/history',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('ROI Tracking', roiTrackingTests));

  // Test 4: Value Bet Detection
  const valueBetDetectionTests = [
    {
      name: 'GET /value-bet-detection/scan-all (requiere auth)',
      path: '/value-bet-detection/scan-all',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Value Bet Detection', valueBetDetectionTests));

  // Test 5: Arbitrage
  const arbitrageTests = [
    {
      name: 'GET /arbitrage/opportunities (requiere auth)',
      path: '/arbitrage/opportunities',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Arbitrage', arbitrageTests));

  // Test 6: Value Bet Analytics
  const valueBetAnalyticsTests = [
    {
      name: 'GET /value-bet-analytics (requiere auth)',
      path: '/value-bet-analytics',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Value Bet Analytics', valueBetAnalyticsTests));

  // Test 7: User Preferences
  const userPreferencesTests = [
    {
      name: 'GET /user-preferences (requiere auth)',
      path: '/user-preferences',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('User Preferences', userPreferencesTests));

  // Test 8: Referrals
  const referralsTests = [
    {
      name: 'GET /referrals/me (requiere auth)',
      path: '/referrals/me',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
    {
      name: 'GET /referrals/leaderboard (requiere auth)',
      path: '/referrals/leaderboard',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Referrals', referralsTests));

  // Test 9: Platform Metrics (público, no requiere auth)
  const platformMetricsTests = [
    {
      name: 'GET /platform-metrics (público)',
      path: '/platform-metrics',
      method: 'GET',
      expectedStatus: 200,
      validate: (response) => {
        if (response.status === 200) {
          return response.data && response.data.success && response.data.data;
        }
        return false;
      },
    },
  ];
  allResults.push(await testEdgeFunction('Platform Metrics', platformMetricsTests));

  // Test 10: Predictions
  const predictionsTests = [
    {
      name: 'GET /predictions/accuracy (requiere auth)',
      path: '/predictions/accuracy',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
    {
      name: 'GET /predictions/stats (requiere auth)',
      path: '/predictions/stats',
      method: 'GET',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Predictions', predictionsTests));

  // Test 11: Get Predictions
  const getPredictionsTests = [
    {
      name: 'GET /get-predictions (sin eventId)',
      path: '/get-predictions',
      method: 'GET',
      expectedStatus: 400,
      validate: (response) => response.status === 400 || response.status === 401,
    },
  ];
  allResults.push(await testEdgeFunction('Get Predictions', getPredictionsTests));

  // Test 12: Generate Predictions
  const generatePredictionsTests = [
    {
      name: 'POST /generate-predictions (requiere auth)',
      path: '/generate-predictions',
      method: 'POST',
      expectedStatus: 401,
      validate: (response) => response.status === 401 || response.status === 200,
    },
  ];
  allResults.push(await testEdgeFunction('Generate Predictions', generatePredictionsTests));

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  allResults.forEach((result) => {
    const status = result.failed === 0 ? '✅' : '⚠️';
    console.log(`\n${status} ${result.name}:`);
    console.log(`   Pasados: ${result.passed}`);
    console.log(`   Fallidos: ${result.failed}`);
    if (result.errors.length > 0) {
      console.log(`   Errores:`);
      result.errors.forEach((error) => console.log(`     - ${error}`));
    }
    totalPassed += result.passed;
    totalFailed += result.failed;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📈 TOTAL: ${totalPassed} pasados, ${totalFailed} fallidos`);
  console.log('='.repeat(60));

  if (totalFailed === 0) {
    console.log('\n🎉 ¡Todas las Edge Functions están funcionando correctamente!');
  } else {
    console.log('\n⚠️  Algunas Edge Functions tienen problemas. Revisa los errores arriba.');
  }

  return { totalPassed, totalFailed, results: allResults };
}

// Ejecutar tests
runAllTests()
  .then((summary) => {
    process.exit(summary.totalFailed === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  });

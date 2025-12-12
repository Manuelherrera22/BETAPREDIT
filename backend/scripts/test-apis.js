/**
 * Script para probar las APIs del sistema
 * Verifica que todas las APIs estén funcionando correctamente
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || '';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function testAPI(endpoint, method = 'GET', data = null, requiresAuth = false) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {},
    };

    if (requiresAuth && TEST_USER_TOKEN) {
      config.headers.Authorization = `Bearer ${TEST_USER_TOKEN}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message,
    };
  }
}

async function runTests() {
  logSection('🧪 TESTING BETAPREDIT APIs');
  log(`Testing against: ${API_BASE_URL}`, 'blue');
  log(`Auth Token: ${TEST_USER_TOKEN ? '✅ Provided' : '❌ Not provided (some tests will fail)'}`, 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // ==========================================
  // 1. THE ODDS API - Comparador de Cuotas
  // ==========================================
  logSection('1️⃣ THE ODDS API - Comparador de Cuotas');

  // Test 1.1: Get Sports
  log('\n📋 Test 1.1: GET /the-odds-api/sports');
  const sportsTest = await testAPI('/the-odds-api/sports');
  if (sportsTest.success && sportsTest.data?.success) {
    log('✅ PASSED - Sports retrieved', 'green');
    log(`   Found ${sportsTest.data.data?.length || 0} sports`, 'blue');
    results.passed++;
  } else {
    log('❌ FAILED - Could not retrieve sports', 'red');
    log(`   Status: ${sportsTest.status}`, 'red');
    log(`   Error: ${JSON.stringify(sportsTest.error)}`, 'red');
    results.failed++;
  }

  // Test 1.2: Get Odds (soccer_epl)
  log('\n📋 Test 1.2: GET /the-odds-api/sports/soccer_epl/odds');
  const oddsTest = await testAPI('/the-odds-api/sports/soccer_epl/odds?regions=us,uk&markets=h2h');
  if (oddsTest.success && oddsTest.data?.success) {
    log('✅ PASSED - Odds retrieved', 'green');
    log(`   Found ${oddsTest.data.data?.length || 0} events`, 'blue');
    results.passed++;
    
    // Test 1.3: Compare Odds (if we have events)
    if (oddsTest.data.data?.length > 0) {
      const firstEvent = oddsTest.data.data[0];
      log(`\n📋 Test 1.3: GET /the-odds-api/sports/soccer_epl/events/${firstEvent.id}/compare`);
      const compareTest = await testAPI(`/the-odds-api/sports/soccer_epl/events/${firstEvent.id}/compare?market=h2h`);
      if (compareTest.success && compareTest.data?.success) {
        log('✅ PASSED - Odds comparison retrieved', 'green');
        const comparisons = compareTest.data.data?.comparisons || {};
        log(`   Found ${Object.keys(comparisons).length} comparisons`, 'blue');
        results.passed++;
      } else {
        log('❌ FAILED - Could not compare odds', 'red');
        log(`   Status: ${compareTest.status}`, 'red');
        results.failed++;
      }
    } else {
      log('⚠️  SKIPPED - No events to compare', 'yellow');
      results.skipped++;
    }
  } else {
    log('❌ FAILED - Could not retrieve odds', 'red');
    log(`   Status: ${oddsTest.status}`, 'red');
    log(`   Error: ${JSON.stringify(oddsTest.error)}`, 'red');
    results.failed++;
    results.skipped++; // Skip comparison test
  }

  // ==========================================
  // 2. ODDS SERVICE - Gestión de Cuotas
  // ==========================================
  logSection('2️⃣ ODDS SERVICE - Gestión de Cuotas');

  // Test 2.1: Get Event Odds (requires auth)
  log('\n📋 Test 2.1: GET /odds/event/:eventId (requires auth)');
  if (TEST_USER_TOKEN) {
    // We need a real eventId, so we'll skip if we don't have one
    log('⚠️  SKIPPED - Requires valid eventId from database', 'yellow');
    results.skipped++;
  } else {
    log('⚠️  SKIPPED - Requires authentication token', 'yellow');
    results.skipped++;
  }

  // ==========================================
  // 3. ARBITRAGE SERVICE
  // ==========================================
  logSection('3️⃣ ARBITRAGE SERVICE');

  // Test 3.1: Get Arbitrage Opportunities
  log('\n📋 Test 3.1: GET /arbitrage/opportunities (requires auth)');
  if (TEST_USER_TOKEN) {
    const arbitrageTest = await testAPI('/arbitrage/opportunities?minMargin=0.01&limit=10', 'GET', null, true);
    if (arbitrageTest.success && arbitrageTest.data?.success) {
      log('✅ PASSED - Arbitrage opportunities retrieved', 'green');
      const opportunities = arbitrageTest.data.data || [];
      log(`   Found ${opportunities.length} opportunities`, 'blue');
      results.passed++;
    } else {
      log('❌ FAILED - Could not retrieve arbitrage opportunities', 'red');
      log(`   Status: ${arbitrageTest.status}`, 'red');
      log(`   Error: ${JSON.stringify(arbitrageTest.error)}`, 'red');
      results.failed++;
    }
  } else {
    log('⚠️  SKIPPED - Requires authentication token', 'yellow');
    results.skipped++;
  }

  // ==========================================
  // 4. USER STATISTICS
  // ==========================================
  logSection('4️⃣ USER STATISTICS');

  // Test 4.1: Get My Statistics
  log('\n📋 Test 4.1: GET /statistics/me (requires auth)');
  if (TEST_USER_TOKEN) {
    const statsTest = await testAPI('/statistics/me?period=month', 'GET', null, true);
    if (statsTest.success && statsTest.data?.success) {
      log('✅ PASSED - Statistics retrieved', 'green');
      log(`   ROI: ${statsTest.data.data?.roi || 0}%`, 'blue');
      log(`   Win Rate: ${statsTest.data.data?.winRate || 0}%`, 'blue');
      results.passed++;
    } else {
      log('❌ FAILED - Could not retrieve statistics', 'red');
      log(`   Status: ${statsTest.status}`, 'red');
      results.failed++;
    }
  } else {
    log('⚠️  SKIPPED - Requires authentication token', 'yellow');
    results.skipped++;
  }

  // ==========================================
  // 5. VALUE BET ALERTS
  // ==========================================
  logSection('5️⃣ VALUE BET ALERTS');

  // Test 5.1: Get My Alerts
  log('\n📋 Test 5.1: GET /value-bet-alerts/my-alerts (requires auth)');
  if (TEST_USER_TOKEN) {
    const alertsTest = await testAPI('/value-bet-alerts/my-alerts?status=ACTIVE', 'GET', null, true);
    if (alertsTest.success && alertsTest.data?.success) {
      log('✅ PASSED - Alerts retrieved', 'green');
      const alerts = alertsTest.data.data || [];
      log(`   Found ${alerts.length} active alerts`, 'blue');
      results.passed++;
    } else {
      log('❌ FAILED - Could not retrieve alerts', 'red');
      log(`   Status: ${alertsTest.status}`, 'red');
      results.failed++;
    }
  } else {
    log('⚠️  SKIPPED - Requires authentication token', 'yellow');
    results.skipped++;
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  logSection('📊 TEST SUMMARY');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Skipped: ${results.skipped}`, 'yellow');
  log(`📈 Total: ${results.passed + results.failed + results.skipped}`, 'blue');

  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (results.failed > 0) {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});





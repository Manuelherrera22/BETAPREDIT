/**
 * Test Directo de API-Football
 * Prueba la API key directamente sin pasar por el backend
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const API_KEY = '0b3bf1ec6ca5311d2017a109f46af9c27f651b7644cca84ad548511c1b87edb8';
const BASE_URL = 'https://v3.football.api-sports.io';

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDirectAPI() {
  log('\n🔍 TEST DIRECTO DE API-FOOTBALL', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n📋 API Key: ${API_KEY.substring(0, 20)}...`, 'blue');
  log(`📋 Base URL: ${BASE_URL}`, 'blue');
  
  // Test 1: Status endpoint
  log('\n1️⃣ Probando endpoint de status...', 'cyan');
  try {
    const statusResponse = await axios.get(`${BASE_URL}/status`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      timeout: 10000,
    });
    
    log('✅ Status endpoint responde!', 'green');
    log(`   Response: ${JSON.stringify(statusResponse.data, null, 2)}`, 'gray');
  } catch (error) {
    log('❌ Error en status endpoint', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
  }
  
  // Test 2: Leagues endpoint (simple)
  log('\n2️⃣ Probando endpoint de leagues...', 'cyan');
  try {
    const leaguesResponse = await axios.get(`${BASE_URL}/leagues`, {
      params: {
        id: 39, // Premier League
      },
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      timeout: 10000,
    });
    
    log('✅ Leagues endpoint funciona!', 'green');
    if (leaguesResponse.data.response && leaguesResponse.data.response.length > 0) {
      const league = leaguesResponse.data.response[0];
      log(`   League: ${league.league?.name || 'N/A'}`, 'gray');
    }
    log(`   Requests remaining: ${leaguesResponse.headers['x-ratelimit-requests-remaining'] || 'N/A'}`, 'gray');
  } catch (error) {
    log('❌ Error en leagues endpoint', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Status Text: ${error.response.statusText}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      
      if (error.response.status === 401) {
        log('\n💡 La API key es inválida o ha expirado', 'yellow');
        log('   Verifica en: https://dashboard.api-football.com/', 'yellow');
      } else if (error.response.status === 403) {
        log('\n💡 La API key no tiene permisos para este endpoint', 'yellow');
      } else if (error.response.status === 429) {
        log('\n💡 Has excedido el límite de requests', 'yellow');
      }
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
  }
  
  // Test 3: Fixtures endpoint
  log('\n3️⃣ Probando endpoint de fixtures...', 'cyan');
  try {
    const fixturesResponse = await axios.get(`${BASE_URL}/fixtures`, {
      params: {
        league: 39, // Premier League
        season: 2024,
        next: 3,
      },
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      timeout: 15000,
    });
    
    log('✅ Fixtures endpoint funciona!', 'green');
    if (fixturesResponse.data.response && fixturesResponse.data.response.length > 0) {
      const fixture = fixturesResponse.data.response[0];
      log(`   Próximo partido: ${fixture.teams?.home?.name || 'N/A'} vs ${fixture.teams?.away?.name || 'N/A'}`, 'gray');
    }
    log(`   Fixtures encontrados: ${fixturesResponse.data.response?.length || 0}`, 'gray');
    log(`   Requests remaining: ${fixturesResponse.headers['x-ratelimit-requests-remaining'] || 'N/A'}`, 'gray');
  } catch (error) {
    log('❌ Error en fixtures endpoint', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n💡 Si todos los tests fallan con 401:', 'yellow');
  log('   - La API key es inválida o expiró', 'white');
  log('   - Verifica en: https://dashboard.api-football.com/', 'white');
  log('   - Asegúrate de que sea una key de API-Football (no de otro servicio)', 'white');
}

testDirectAPI().catch(console.error);




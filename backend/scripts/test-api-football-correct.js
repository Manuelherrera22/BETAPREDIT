/**
 * Test con el formato CORRECTO de API-Football
 * Usa x-apisports-key en lugar de x-rapidapi-key
 */

const axios = require('axios');

const API_KEY = '0b3bf1ec6ca5311d2017a109f46af9c27f651b7644cca84ad548511c1b87edb8';
const BASE_URL = 'https://v3.football.api-sports.io';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCorrectFormat() {
  log('\n✅ TEST CON FORMATO CORRECTO (x-apisports-key)', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n📋 API Key: ${API_KEY.substring(0, 20)}...`, 'yellow');
  log(`📋 Header: x-apisports-key`, 'yellow');
  
  // Test 1: Status
  log('\n1️⃣ Probando endpoint de status...', 'cyan');
  try {
    const response = await axios.get(`${BASE_URL}/status`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      timeout: 10000,
    });
    
    if (response.data.errors && response.data.errors.token) {
      log(`❌ Error: ${response.data.errors.token}`, 'red');
    } else {
      log('✅ Status funciona!', 'green');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'gray');
    }
  } catch (error) {
    log('❌ Error', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
  
  // Test 2: Leagues
  log('\n2️⃣ Probando endpoint de leagues...', 'cyan');
  try {
    const response = await axios.get(`${BASE_URL}/leagues`, {
      params: {
        id: 39, // Premier League
      },
      headers: {
        'x-apisports-key': API_KEY,
      },
      timeout: 10000,
    });
    
    if (response.data.errors && response.data.errors.token) {
      log(`❌ Error: ${response.data.errors.token}`, 'red');
    } else {
      log('✅ Leagues funciona!', 'green');
      if (response.data.response && response.data.response.length > 0) {
        const league = response.data.response[0];
        log(`   League: ${league.league?.name || 'N/A'}`, 'gray');
      }
      log(`   Requests remaining: ${response.headers['x-ratelimit-requests-remaining'] || 'N/A'}`, 'gray');
    }
  } catch (error) {
    log('❌ Error', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
  
  // Test 3: Fixtures
  log('\n3️⃣ Probando endpoint de fixtures...', 'cyan');
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      params: {
        league: 39,
        season: 2024,
        next: 3,
      },
      headers: {
        'x-apisports-key': API_KEY,
      },
      timeout: 15000,
    });
    
    if (response.data.errors && response.data.errors.token) {
      log(`❌ Error: ${response.data.errors.token}`, 'red');
    } else {
      log('✅ Fixtures funciona!', 'green');
      if (response.data.response && response.data.response.length > 0) {
        const fixture = response.data.response[0];
        log(`   Próximo: ${fixture.teams?.home?.name || 'N/A'} vs ${fixture.teams?.away?.name || 'N/A'}`, 'gray');
      }
      log(`   Fixtures: ${response.data.response?.length || 0}`, 'gray');
    }
  } catch (error) {
    log('❌ Error', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
}

testCorrectFormat().catch(console.error);




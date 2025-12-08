/**
 * Test de All Sports API
 * Prueba la API key de allsportsapi.com
 */

const axios = require('axios');

const API_KEY = '0b3bf1ec6ca5311d2017a109f46af9c27f651b7644cca84ad548511c1b87edb8';
const BASE_URL = 'https://allsportsapi.com/api';

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

async function testAllSportsAPI() {
  log('\n⚽ TEST DE ALL SPORTS API', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n📋 API Key: ${API_KEY.substring(0, 20)}...`, 'yellow');
  log(`📋 Base URL: ${BASE_URL}`, 'yellow');
  
  // Probar diferentes formatos de endpoints
  const endpoints = [
    {
      name: 'Football - Leagues',
      url: `${BASE_URL}/football`,
      params: { met: 'Leagues', APIkey: API_KEY },
    },
    {
      name: 'Football - Teams',
      url: `${BASE_URL}/football`,
      params: { met: 'Teams', APIkey: API_KEY },
    },
    {
      name: 'Football - Fixtures',
      url: `${BASE_URL}/football`,
      params: { met: 'Fixtures', APIkey: API_KEY, leagueId: 152 }, // Premier League
    },
    {
      name: 'Basketball - Leagues',
      url: `${BASE_URL}/basketball`,
      params: { met: 'Leagues', APIkey: API_KEY },
    },
  ];
  
  for (const endpoint of endpoints) {
    log(`\n📡 Probando: ${endpoint.name}`, 'cyan');
    try {
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        timeout: 15000,
      });
      
      if (response.data) {
        log('✅ Respuesta recibida!', 'green');
        if (response.data.success !== false) {
          log(`   Status: Success`, 'green');
          if (response.data.result) {
            log(`   Resultados: ${Array.isArray(response.data.result) ? response.data.result.length : 'N/A'}`, 'gray');
          }
        } else {
          log(`   ⚠️  Success: false`, 'yellow');
          if (response.data.error) {
            log(`   Error: ${response.data.error}`, 'yellow');
          }
        }
      }
    } catch (error) {
      log('❌ Error', 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      } else {
        log(`   Error: ${error.message}`, 'red');
      }
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n💡 Si funciona, actualizaré el servicio para usar All Sports API', 'yellow');
}

testAllSportsAPI().catch(console.error);


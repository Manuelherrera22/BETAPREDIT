/**
 * Test de API-Sports.io
 * Prueba la API key de API-Sports
 */

const axios = require('axios');

const API_KEY = '6be68f1a664b8a52112852b808446726';
const BASE_URL = 'https://v3.football.api-sports.io'; // API-Sports.io usa el mismo dominio que API-Football

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

async function testAPISports() {
  log('\n⚽ TEST DE API-SPORTS.IO', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n📋 API Key: ${API_KEY.substring(0, 20)}...`, 'yellow');
  log(`📋 Base URL: ${BASE_URL}`, 'yellow');
  
  // Probar diferentes formatos de headers
  const formats = [
    {
      name: 'Formato 1: x-apisports-key',
      headers: {
        'x-apisports-key': API_KEY,
      },
    },
    {
      name: 'Formato 2: x-rapidapi-key',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    },
    {
      name: 'Formato 3: X-RapidAPI-Key',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    },
  ];
  
  for (const format of formats) {
    log(`\n📡 ${format.name}`, 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/status`, {
        headers: format.headers,
        timeout: 10000,
      });
      
      if (response.data.errors && response.data.errors.token) {
        log(`   ❌ Error: ${response.data.errors.token}`, 'red');
      } else {
        log('   ✅ FUNCIONA!', 'green');
        log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'gray');
        
        // Si funciona, probar un endpoint real
        log(`\n   🧪 Probando endpoint de leagues...`, 'cyan');
        try {
          const leaguesResponse = await axios.get(`${BASE_URL}/leagues`, {
            params: { id: 39 }, // Premier League
            headers: format.headers,
            timeout: 10000,
          });
          
          if (leaguesResponse.data.response && leaguesResponse.data.response.length > 0) {
            const league = leaguesResponse.data.response[0];
            log(`   ✅ Leagues funciona!`, 'green');
            log(`   League: ${league.league?.name || 'N/A'}`, 'gray');
            log(`   Requests remaining: ${leaguesResponse.headers['x-ratelimit-requests-remaining'] || 'N/A'}`, 'gray');
          }
        } catch (err) {
          log(`   ⚠️  Leagues endpoint: ${err.response?.status || err.message}`, 'yellow');
        }
        
        return format; // Retornar el formato que funciona
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          log(`   ❌ Auth failed: ${error.response.status}`, 'red');
        } else {
          log(`   ❌ Status: ${error.response.status}`, 'red');
          if (error.response.data) {
            const dataStr = JSON.stringify(error.response.data).substring(0, 150);
            log(`   Data: ${dataStr}...`, 'red');
          }
        }
      } else {
        log(`   ❌ Error: ${error.message}`, 'red');
      }
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
}

testAPISports().catch(console.error);




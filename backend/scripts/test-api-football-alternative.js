/**
 * Test con formato alternativo de headers
 * Prueba diferentes formatos de autenticación
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

async function testAlternativeFormats() {
  log('\n🔍 PROBANDO DIFERENTES FORMATOS DE HEADERS', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const formats = [
    {
      name: 'Formato 1: x-rapidapi-key (actual)',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    },
    {
      name: 'Formato 2: X-RapidAPI-Key (mayúsculas)',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
      },
    },
    {
      name: 'Formato 3: Authorization Bearer',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    },
    {
      name: 'Formato 4: X-API-Key',
      headers: {
        'X-API-Key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    },
  ];
  
  for (const format of formats) {
    log(`\n📋 ${format.name}`, 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/status`, {
        headers: format.headers,
        timeout: 10000,
      });
      
      if (response.data.errors && response.data.errors.token) {
        log(`   ❌ Error: ${response.data.errors.token}`, 'red');
      } else {
        log(`   ✅ Funciona!`, 'green');
        log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'gray');
        break; // Si funciona, no probar más formatos
      }
    } catch (error) {
      if (error.response) {
        log(`   ❌ Status: ${error.response.status}`, 'red');
        if (error.response.data) {
          log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        }
      } else {
        log(`   ❌ Error: ${error.message}`, 'red');
      }
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n💡 CONCLUSIÓN:', 'yellow');
  log('   Si todos los formatos fallan, la API key NO es válida para API-Football', 'white');
  log('   Necesitas obtener una nueva API key de: https://www.api-football.com/', 'white');
}

testAlternativeFormats().catch(console.error);




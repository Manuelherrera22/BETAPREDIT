/**
 * Test de All Sports API - Versión 2
 * Probando diferentes formatos de endpoints
 */

const axios = require('axios');

const API_KEY = '0b3bf1ec6ca5311d2017a109f46af9c27f651b7644cca84ad548511c1b87edb8';

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

async function testFormats() {
  log('\n🔍 PROBANDO DIFERENTES FORMATOS DE ALL SPORTS API', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const formats = [
    {
      name: 'Formato 1: allsportsapi.com/api/football',
      url: 'https://allsportsapi.com/api/football',
      params: { APIkey: API_KEY, met: 'Leagues' },
    },
    {
      name: 'Formato 2: allsportsapi.com/api/football (sin /api)',
      url: 'https://allsportsapi.com/football',
      params: { APIkey: API_KEY, met: 'Leagues' },
    },
    {
      name: 'Formato 3: Con header API-Key',
      url: 'https://allsportsapi.com/api/football',
      params: { met: 'Leagues' },
      headers: { 'API-Key': API_KEY },
    },
    {
      name: 'Formato 4: Con header X-API-Key',
      url: 'https://allsportsapi.com/api/football',
      params: { met: 'Leagues' },
      headers: { 'X-API-Key': API_KEY },
    },
    {
      name: 'Formato 5: allsportsapi.com/api (root)',
      url: 'https://allsportsapi.com/api',
      params: { APIkey: API_KEY, sport: 'football', met: 'Leagues' },
    },
  ];
  
  for (const format of formats) {
    log(`\n📡 ${format.name}`, 'yellow');
    try {
      const config = {
        url: format.url,
        method: 'GET',
        timeout: 10000,
      };
      
      if (format.params) {
        config.params = format.params;
      }
      
      if (format.headers) {
        config.headers = format.headers;
      }
      
      const response = await axios(config);
      
      if (response.data) {
        if (response.data.success === false || response.data.error) {
          log(`   ⚠️  Error en respuesta: ${JSON.stringify(response.data.error || response.data)}`, 'yellow');
        } else {
          log('   ✅ FUNCIONA!', 'green');
          log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`, 'gray');
          return format; // Retornar el formato que funciona
        }
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          log(`   ❌ 404 - Endpoint no encontrado`, 'red');
        } else {
          log(`   ❌ Status: ${error.response.status}`, 'red');
          if (error.response.data) {
            const dataStr = JSON.stringify(error.response.data).substring(0, 100);
            log(`   Data: ${dataStr}...`, 'red');
          }
        }
      } else {
        log(`   ❌ Error: ${error.message}`, 'red');
      }
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n💡 Si ninguno funciona, necesito la documentación de All Sports API', 'yellow');
  log('   O puedes verificar en tu dashboard cómo se hace la llamada', 'yellow');
}

testFormats().catch(console.error);






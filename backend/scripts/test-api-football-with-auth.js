/**
 * Test de API-Football con autenticación
 * Hace login primero y luego prueba los endpoints
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

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

async function testAPIFootballWithAuth() {
  log('\n⚽ TEST DE API-FOOTBALL CON AUTENTICACIÓN', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Step 1: Login
  log('\n1️⃣ Haciendo login...', 'cyan');
  let token = null;
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@betapredit.com',
      password: 'demo123',
    });
    
    if (loginResponse.data.success && loginResponse.data.data?.token) {
      token = loginResponse.data.data.token;
      log('✅ Login exitoso!', 'green');
      log(`   Token: ${token.substring(0, 20)}...`, 'gray');
    } else {
      log('❌ Login falló: no se obtuvo token', 'red');
      return;
    }
  } catch (error) {
    log('❌ Error en login', 'red');
    log(`   ${error.response?.data?.error?.message || error.message}`, 'red');
    return;
  }
  
  // Step 2: Test API-Football endpoints
  log('\n2️⃣ Probando API-Football endpoints...', 'cyan');
  
  const endpoints = [
    {
      name: 'Fixtures (Próximos partidos)',
      url: `${API_URL}/api-football/fixtures`,
      params: { league: 39, season: 2024, next: 3 },
    },
    {
      name: 'Standings (Tabla de posiciones)',
      url: `${API_URL}/api-football/standings`,
      params: { league: 39, season: 2024 },
    },
  ];
  
  for (const endpoint of endpoints) {
    log(`\n📡 ${endpoint.name}`, 'yellow');
    try {
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });
      
      if (response.data.success) {
        log('✅ Funciona!', 'green');
        const data = response.data.data;
        if (Array.isArray(data)) {
          log(`   Resultados: ${data.length}`, 'gray');
          if (data.length > 0 && endpoint.name.includes('Fixtures')) {
            const first = data[0];
            const home = first.teams?.home?.name || 'N/A';
            const away = first.teams?.away?.name || 'N/A';
            log(`   Ejemplo: ${home} vs ${away}`, 'gray');
          }
        } else if (data && Array.isArray(data[0]?.league?.standings?.[0])) {
          log(`   Standings obtenidos`, 'gray');
        }
      } else {
        log('⚠️  Success: false', 'yellow');
        if (response.data.error) {
          log(`   Error: ${response.data.error.message}`, 'yellow');
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        log('❌ No autorizado (token inválido)', 'red');
      } else if (error.response?.status === 503) {
        log('❌ API-Football service not configured', 'red');
      } else {
        log(`❌ Error: ${error.response?.data?.error?.message || error.message}`, 'red');
      }
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n✅ Test completado!', 'green');
}

testAPIFootballWithAuth().catch(console.error);


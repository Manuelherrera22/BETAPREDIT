/**
 * Test Simple de API-Football
 * Prueba que la API key esté configurada y funcione
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colors
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

async function testAPIFootball() {
  log('\n⚽ TEST SIMPLE DE API-FOOTBALL', 'cyan');
  log('='.repeat(50), 'cyan');

  // Check if API key is configured
  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    log('\n❌ API_FOOTBALL_KEY no está configurada', 'red');
    log('\n📝 Para configurarla:', 'yellow');
    log('   1. Obtén tu API key en: https://dashboard.api-football.com/', 'white');
    log('   2. Agrega al archivo backend/.env:', 'white');
    log('      API_FOOTBALL_KEY=tu_api_key_aqui', 'gray');
    log('   3. Reinicia el backend', 'white');
    return;
  }

  log(`\n✅ API Key encontrada: ${apiKey.substring(0, 8)}...`, 'green');

  // Test 1: Check backend health
  log('\n1️⃣ Verificando backend...', 'cyan');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    log('✅ Backend está corriendo', 'green');
  } catch (error) {
    log('❌ Backend no está corriendo', 'red');
    log('   Inicia el backend con: cd backend && npm run dev', 'yellow');
    return;
  }

  // Test 2: Test API-Football endpoint
  log('\n2️⃣ Probando API-Football...', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/api-football/fixtures`, {
      params: {
        league: 39, // Premier League
        season: 2024,
        next: 3, // Próximos 3 partidos
      },
      timeout: 15000,
    });

    if (response.data.success) {
      const fixtures = response.data.data;
      log('✅ API-Football funcionando!', 'green');
      log(`   Fixtures obtenidos: ${fixtures.length}`, 'reset');
      
      if (fixtures.length > 0) {
        log('\n📊 Próximos partidos:', 'cyan');
        fixtures.slice(0, 3).forEach((fixture, index) => {
          const home = fixture.teams?.home?.name || 'N/A';
          const away = fixture.teams?.away?.name || 'N/A';
          const date = fixture.fixture?.date ? new Date(fixture.fixture.date).toLocaleDateString() : 'N/A';
          log(`   ${index + 1}. ${home} vs ${away} (${date})`, 'white');
        });
      }
    } else {
      log('⚠️  Respuesta sin datos', 'yellow');
      if (response.data.error) {
        log(`   Error: ${response.data.error.message}`, 'yellow');
      }
    }
  } catch (error) {
    if (error.response?.status === 503) {
      log('❌ API-Football service not configured', 'red');
      log('   Verifica que el backend se haya reiniciado después de agregar la API key', 'yellow');
    } else if (error.response?.status === 401) {
      log('❌ API Key inválida', 'red');
      log('   Verifica que la API key sea correcta', 'yellow');
    } else if (error.response?.status === 429) {
      log('❌ Rate limit excedido', 'red');
      log('   Has usado todos tus requests del día (100 en plan free)', 'yellow');
    } else {
      log(`❌ Error: ${error.response?.data?.error?.message || error.message}`, 'red');
    }
  }

  log('\n' + '='.repeat(50), 'cyan');
}

testAPIFootball().catch(console.error);





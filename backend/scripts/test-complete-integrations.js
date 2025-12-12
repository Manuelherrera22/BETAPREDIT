/**
 * Test Completo de Integraciones
 * Prueba API-Football, WebSockets y Email Service
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colors for console
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

async function testBackendHealth() {
  log('\n1️⃣ Verificando Backend Health...', 'cyan');
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    log('✅ Backend está corriendo', 'green');
    log(`   Servicios: ${JSON.stringify(response.data.services)}`, 'reset');
    return true;
  } catch (error) {
    log('❌ Backend no está corriendo', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testAPIFootball() {
  log('\n2️⃣ Probando API-Football...', 'cyan');
  
  // First, we need to login to get a token
  let token = null;
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@betapredit.com',
      password: 'demo123',
    });
    token = loginResponse.data.data?.token;
    if (!token) {
      log('⚠️  No se pudo obtener token, probando sin autenticación...', 'yellow');
    }
  } catch (error) {
    log('⚠️  Login falló, probando sin autenticación...', 'yellow');
  }

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_URL}/api-football/fixtures`, {
      params: {
        league: 39, // Premier League
        season: 2024,
        next: 3,
      },
      headers,
      timeout: 15000,
    });

    if (response.data.success) {
      const fixtures = response.data.data;
      log('✅ API-Football funcionando!', 'green');
      log(`   Fixtures obtenidos: ${fixtures.length}`, 'reset');
      if (fixtures.length > 0) {
        const first = fixtures[0];
        log(`   Ejemplo: ${first.teams?.home?.name || 'N/A'} vs ${first.teams?.away?.name || 'N/A'}`, 'reset');
      }
      return true;
    } else {
      log('⚠️  API-Football responde pero sin datos', 'yellow');
      if (response.data.error) {
        log(`   Error: ${response.data.error.message}`, 'yellow');
      }
      return false;
    }
  } catch (error) {
    if (error.response?.status === 503) {
      log('❌ API-Football service not configured', 'red');
      log('   Verifica que API_FOOTBALL_KEY esté en el .env', 'yellow');
    } else if (error.response?.status === 401) {
      log('⚠️  Requiere autenticación (esto es normal)', 'yellow');
    } else {
      log(`❌ Error: ${error.response?.data?.error?.message || error.message}`, 'red');
    }
    return false;
  }
}

async function testWebSockets() {
  log('\n3️⃣ Probando WebSockets...', 'cyan');
  
  return new Promise((resolve) => {
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 5000,
    });

    let connected = false;

    socket.on('connect', () => {
      connected = true;
      log('✅ WebSocket conectado!', 'green');
      log(`   Socket ID: ${socket.id}`, 'reset');
      
      // Test subscriptions
      socket.emit('subscribe:events');
      log('   ✓ Suscrito a eventos en vivo', 'reset');
      
      socket.emit('subscribe:value-bets');
      log('   ✓ Suscrito a value bets', 'reset');
      
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      log('❌ Error conectando WebSocket', 'red');
      log(`   Error: ${error.message}`, 'red');
      resolve(false);
    });

    socket.on('disconnect', () => {
      if (connected) {
        log('   WebSocket desconectado', 'reset');
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!connected) {
        log('❌ Timeout esperando conexión WebSocket', 'red');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

async function testEmailService() {
  log('\n4️⃣ Verificando Email Service...', 'cyan');
  
  const emailProvider = process.env.EMAIL_PROVIDER;
  const emailApiKey = process.env.EMAIL_API_KEY;
  
  if (!emailProvider) {
    log('⚠️  EMAIL_PROVIDER no configurado', 'yellow');
    log('   El servicio está listo pero no configurado', 'yellow');
    return false;
  }
  
  if (!emailApiKey) {
    log('⚠️  EMAIL_API_KEY no configurado', 'yellow');
    log('   El servicio está listo pero no configurado', 'yellow');
    return false;
  }
  
  log(`✅ Email Service configurado`, 'green');
  log(`   Provider: ${emailProvider}`, 'reset');
  log(`   API Key: ${emailApiKey.substring(0, 8)}...`, 'reset');
  return true;
}

async function testTheOddsAPI() {
  log('\n5️⃣ Verificando The Odds API...', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/the-odds-api/sports`, {
      timeout: 10000,
    });
    
    if (response.data.success) {
      const sports = response.data.data;
      log('✅ The Odds API funcionando!', 'green');
      log(`   Deportes disponibles: ${sports.length}`, 'reset');
      return true;
    } else {
      log('⚠️  The Odds API responde pero sin datos', 'yellow');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 503) {
      log('❌ The Odds API service not configured', 'red');
    } else {
      log(`❌ Error: ${error.response?.data?.error?.message || error.message}`, 'red');
    }
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 TEST COMPLETO DE INTEGRACIONES', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const results = {
    backend: false,
    apiFootball: false,
    websockets: false,
    email: false,
    theOddsAPI: false,
  };
  
  // Test 1: Backend Health
  results.backend = await testBackendHealth();
  
  if (!results.backend) {
    log('\n❌ Backend no está corriendo. Inicia el backend primero.', 'red');
    return;
  }
  
  // Test 2: The Odds API (ya sabemos que funciona)
  results.theOddsAPI = await testTheOddsAPI();
  
  // Test 3: API-Football
  results.apiFootball = await testAPIFootball();
  
  // Test 4: WebSockets
  results.websockets = await testWebSockets();
  
  // Test 5: Email Service
  results.email = await testEmailService();
  
  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 RESUMEN DE TESTS', 'cyan');
  log('='.repeat(50), 'cyan');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${test}: ${passed ? 'PASÓ' : 'FALLÓ'}`, color);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  log(`\n📈 Resultado: ${passedCount}/${totalCount} tests pasaron`, passedCount === totalCount ? 'green' : 'yellow');
  
  if (passedCount === totalCount) {
    log('\n🎉 ¡Todas las integraciones funcionan correctamente!', 'green');
  } else {
    log('\n💡 Revisa la configuración de las integraciones que fallaron', 'yellow');
  }
}

runAllTests().catch(console.error);






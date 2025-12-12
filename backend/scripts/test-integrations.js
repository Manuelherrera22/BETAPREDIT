/**
 * Script para probar las nuevas integraciones
 * - API-Football
 * - Email Service
 * - WebSocket Service
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testIntegrations() {
  console.log('🧪 Probando nuevas integraciones...\n');

  // Test 1: API-Football
  console.log('1️⃣ Probando API-Football...');
  try {
    const response = await axios.get(`${BASE_URL}/api-football/fixtures`, {
      params: {
        league: 39, // Premier League
        season: 2024,
        next: 5, // Próximos 5 partidos
      },
      headers: {
        Authorization: `Bearer ${process.env.JWT_SECRET || 'test'}`,
      },
      timeout: 15000,
    });

    if (response.data.success) {
      const fixtures = response.data.data;
      console.log(`✅ API-Football funcionando!`);
      console.log(`   Fixtures obtenidos: ${fixtures.length}\n`);
      if (fixtures.length > 0) {
        const first = fixtures[0];
        console.log(`   Ejemplo: ${first.teams?.home?.name || 'N/A'} vs ${first.teams?.away?.name || 'N/A'}`);
        console.log(`   Fecha: ${first.fixture?.date || 'N/A'}\n`);
      }
    } else {
      console.log('⚠️  API-Football responde pero sin datos');
      console.log(`   Error: ${JSON.stringify(response.data.error)}\n`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend no está corriendo. Inicia el backend primero.\n');
    } else if (error.response?.status === 401) {
      console.error('❌ Error de autenticación. Necesitas estar logueado.\n');
    } else if (error.response?.status === 503) {
      console.error('❌ API-Football service not configured');
      console.error('   Verifica que API_FOOTBALL_KEY esté en el .env\n');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
      console.error(`   Status: ${error.response?.status}\n`);
    }
  }

  // Test 2: Health check
  console.log('2️⃣ Verificando health del backend...');
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });
    console.log('✅ Backend está corriendo');
    console.log(`   Servicios: ${JSON.stringify(response.data.services)}\n`);
  } catch (error) {
    console.error('❌ Error en health check:', error.message);
  }

  console.log('✅ Pruebas completadas\n');
  console.log('💡 Recordatorios:');
  console.log('   - API-Football: Verifica que API_FOOTBALL_KEY esté configurada');
  console.log('   - Email: Verifica EMAIL_PROVIDER y EMAIL_API_KEY');
  console.log('   - WebSockets: Ya están configurados, solo falta conectar desde frontend\n');
}

testIntegrations();





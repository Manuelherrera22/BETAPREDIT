/**
 * Script de prueba LIMITADO para The Odds API
 * Usa caché y hace solo las requests necesarias
 * 
 * IMPORTANTE: No ejecutar múltiples veces para no agotar el límite de 500 requests/mes
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const API_KEY = process.env.THE_ODDS_API_KEY;
const BASE_URL = 'http://localhost:3000/api/the-odds-api';

async function testLimited() {
  console.log('🧪 Prueba LIMITADA de The Odds API (usando caché del backend)\n');

  if (!API_KEY) {
    console.error('❌ Error: THE_ODDS_API_KEY no encontrada en .env');
    process.exit(1);
  }

  console.log('⚠️  IMPORTANTE: Este script hace requests mínimas\n');
  console.log('📊 Tests a realizar:\n');

  // Test 1: Get Sports (1 request, se cachea por 1 hora)
  try {
    console.log('1️⃣ GET /sports (usa caché si está disponible)...');
    const sportsResponse = await axios.get(`${BASE_URL}/sports`, {
      timeout: 10000,
    });

    if (sportsResponse.data.success) {
      const sports = sportsResponse.data.data;
      console.log(`✅ Deportes obtenidos: ${sports.length}`);
      console.log(`   Primeros 3: ${sports.slice(0, 3).map(s => s.title).join(', ')}\n`);
    } else {
      console.log('⚠️  Respuesta inesperada:', sportsResponse.data);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend no está corriendo. Inicia el backend primero.\n');
      process.exit(1);
    }
    console.error('❌ Error:', error.response?.data || error.message);
    return;
  }

  // Test 2: Get Odds para UN solo deporte (1 request, se cachea por 1 minuto)
  try {
    console.log('2️⃣ GET /sports/soccer_epl/odds (usa caché si está disponible)...');
    const oddsResponse = await axios.get(`${BASE_URL}/sports/soccer_epl/odds`, {
      params: {
        regions: 'us,uk',
        markets: 'h2h',
        oddsFormat: 'decimal',
      },
      timeout: 15000,
    });

    if (oddsResponse.data.success) {
      const events = oddsResponse.data.data;
      console.log(`✅ Eventos obtenidos: ${events.length}`);
      if (events.length > 0) {
        const firstEvent = events[0];
        console.log(`   Ejemplo: ${firstEvent.home_team} vs ${firstEvent.away_team}`);
        console.log(`   Bookmakers: ${firstEvent.bookmakers?.length || 0}\n`);
      }
    } else {
      console.log('⚠️  Respuesta inesperada:', oddsResponse.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n✅ Pruebas completadas\n');
  console.log('💡 Recordatorios:');
  console.log('   - El backend usa caché Redis para minimizar requests');
  console.log('   - Sports se cachean por 1 hora');
  console.log('   - Odds se cachean por 1 minuto');
  console.log('   - No ejecutar este script múltiples veces seguidas');
  console.log('   - Verificar requests restantes en los headers de respuesta\n');
}

testLimited();


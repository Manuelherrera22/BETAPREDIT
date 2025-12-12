/**
 * Script para probar la conexión con The Odds API
 * 
 * Uso:
 *   node backend/scripts/test-the-odds-api.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const API_KEY = process.env.THE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

async function testConnection() {
  console.log('🧪 Probando conexión con The Odds API...\n');

  if (!API_KEY) {
    console.error('❌ Error: THE_ODDS_API_KEY no encontrada en .env');
    console.log('   Agrega al .env: THE_ODDS_API_KEY=tu_api_key\n');
    process.exit(1);
  }

  console.log(`📍 API Key: ${API_KEY.substring(0, 8)}...\n`);

  // Test 1: Get Sports
  try {
    console.log('1️⃣ Probando GET /sports...');
    const response = await axios.get(`${BASE_URL}/sports`, {
      params: { apiKey: API_KEY },
      timeout: 10000,
    });

    console.log('✅ Conexión exitosa!\n');
    console.log(`📊 Deportes disponibles: ${response.data.length}\n`);
    console.log('📋 Primeros 5 deportes:');
    response.data.slice(0, 5).forEach((sport, index) => {
      console.log(`   ${index + 1}. ${sport.title} (${sport.key})`);
    });
    console.log('');

    // Test 2: Get Odds for Soccer (if available)
    const soccer = response.data.find((s) => s.key === 'soccer' || s.key === 'soccer_epl');
    if (soccer) {
      console.log(`2️⃣ Probando GET /sports/${soccer.key}/odds...`);
      try {
        const oddsResponse = await axios.get(`${BASE_URL}/sports/${soccer.key}/odds`, {
          params: {
            apiKey: API_KEY,
            regions: 'us,uk',
            markets: 'h2h',
            oddsFormat: 'decimal',
          },
          timeout: 15000,
        });

        console.log(`✅ Cuotas obtenidas: ${oddsResponse.data.length} eventos\n`);
        if (oddsResponse.data.length > 0) {
          const firstEvent = oddsResponse.data[0];
          console.log('📋 Ejemplo de evento:');
          console.log(`   ${firstEvent.home_team} vs ${firstEvent.away_team}`);
          console.log(`   Bookmakers: ${firstEvent.bookmakers.length}`);
          if (firstEvent.bookmakers.length > 0) {
            const firstBookmaker = firstEvent.bookmakers[0];
            console.log(`   - ${firstBookmaker.title}: ${firstBookmaker.markets[0]?.outcomes.length || 0} outcomes`);
          }
        }

        // Check remaining requests
        const remaining = oddsResponse.headers['x-requests-remaining'];
        const used = oddsResponse.headers['x-requests-used'];
        if (remaining) {
          console.log(`\n📊 Requests restantes: ${remaining} (usadas: ${used})`);
        }
      } catch (error) {
        if (error.response) {
          console.error(`❌ Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Prueba completada!\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Reinicia el backend');
    console.log('   2. Prueba desde el backend:');
    console.log('      GET http://localhost:3000/api/the-odds-api/sports');
    console.log('      GET http://localhost:3000/api/the-odds-api/sports/soccer/odds\n');

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        console.log('\n💡 Verifica que la API key sea correcta');
      } else if (error.response.status === 429) {
        console.log('\n💡 Has excedido el límite de requests. Espera o actualiza tu plan');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testConnection();





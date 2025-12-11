/**
 * Script para probar la conexión con Kalshi API
 * 
 * Uso:
 *   node backend/scripts/test-kalshi-connection.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE_URL = process.env.KALSHI_BASE_URL || 'https://api.elections.kalshi.com';
const API_URL = `${BASE_URL}/trade-api/v2`;

async function testConnection() {
  console.log('🧪 Probando conexión con Kalshi API...\n');
  console.log(`📍 URL Base: ${BASE_URL}\n`);

  // Test 1: Exchange Status (no requiere auth)
  try {
    console.log('1️⃣ Probando endpoint público (exchange/status)...');
    const statusResponse = await axios.get(`${API_URL}/exchange/status`, {
      timeout: 10000,
    });
    console.log('✅ Exchange Status:', statusResponse.data);
    console.log(`   - Exchange Active: ${statusResponse.data.exchange_active}`);
    console.log(`   - Trading Active: ${statusResponse.data.trading_active}\n`);
  } catch (error) {
    console.error('❌ Error en exchange/status:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.log('');
  }

  // Test 2: Series (requiere auth si está configurado)
  if (process.env.KALSHI_API_KEY && process.env.KALSHI_API_SECRET) {
    console.log('2️⃣ Credenciales encontradas, probando endpoint autenticado...');
    console.log('   (Nota: Este test requiere autenticación RSA-PSS)\n');
    console.log('💡 Para probar endpoints autenticados, usa el backend directamente:');
    console.log('   GET http://localhost:3000/api/kalshi/series\n');
  } else {
    console.log('2️⃣ Credenciales no encontradas en .env');
    console.log('   Los endpoints públicos funcionarán, pero los autenticados no.\n');
  }

  console.log('✅ Prueba completada\n');
  console.log('📝 Próximos pasos:');
  console.log('   1. Reinicia el backend si está corriendo');
  console.log('   2. Prueba desde el backend:');
  console.log('      GET http://localhost:3000/api/kalshi/exchange/status');
  console.log('      GET http://localhost:3000/api/kalshi/series (requiere auth)');
  console.log('      GET http://localhost:3000/api/kalshi/events\n');
}

testConnection().catch(console.error);




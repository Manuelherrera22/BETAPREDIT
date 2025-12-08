/**
 * Script para obtener API key de Kalshi usando el endpoint "Generate API Key"
 * 
 * Este endpoint genera automáticamente un par de claves RSA y te devuelve:
 * - api_key_id (para usar como KALSHI_API_KEY)
 * - private_key (para usar como KALSHI_API_SECRET)
 * 
 * Uso:
 *   node scripts/get-kalshi-api-key.js
 * 
 * Requiere:
 *   - Tener una cuenta en Kalshi
 *   - Tener credenciales existentes para autenticarte (si es tu primera vez, 
 *     necesitarás crear la primera API key desde la web UI)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const axios = require('axios');

const BASE_URL = process.env.KALSHI_BASE_URL || 'https://api.elections.kalshi.com';
const API_URL = `${BASE_URL}/trade-api/v2`;

async function generateSignature(method, path, timestamp, body, privateKey) {
  const stringToSign = `${method}\n${path}\n${timestamp}\n${body}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(stringToSign);
  sign.end();
  
  return sign.sign(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
    },
    'base64'
  );
}

async function generateApiKey() {
  try {
    console.log('🔑 Generando API key en Kalshi...\n');

    // Check if we have existing credentials
    if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_API_SECRET) {
      console.error('❌ Error: Se necesitan credenciales existentes para generar una nueva API key');
      console.log('\n📝 Opciones:');
      console.log('   1. Crear la primera API key desde la web UI de Kalshi:');
      console.log('      - Ve a https://kalshi.com');
      console.log('      - Inicia sesión');
      console.log('      - Configuración → Claves API → Crear nueva clave');
      console.log('      - Guarda el api_key_id y la private_key');
      console.log('\n   2. O usar el endpoint "Create API Key" con tu propia clave pública');
      console.log('\n   Luego agrega al .env:');
      console.log('   KALSHI_API_KEY=<api_key_id>');
      console.log('   KALSHI_API_SECRET=<private_key>');
      console.log('\n   Y ejecuta este script de nuevo para generar más API keys.\n');
      process.exit(1);
    }

    const apiKey = process.env.KALSHI_API_KEY;
    const privateKey = process.env.KALSHI_API_SECRET.replace(/\\n/g, '\n');

    // Prepare request
    const method = 'POST';
    const requestPath = '/api-keys/generate';
    const timestamp = Date.now().toString();
    const body = JSON.stringify({
      name: 'BETAPREDIT Integration',
    });

    // Generate signature
    const signature = await generateSignature(method, requestPath, timestamp, body, privateKey);

    // Make request
    const response = await axios.post(`${API_URL}${requestPath}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'KALSHI-ACCESS-KEY': apiKey,
        'KALSHI-ACCESS-TIMESTAMP': timestamp,
        'KALSHI-ACCESS-SIGNATURE': signature,
      },
    });

    console.log('✅ API key generada exitosamente!\n');
    console.log('📋 Información:');
    console.log(`   API Key ID: ${response.data.api_key_id}`);
    console.log(`   Name: BETAPREDIT Integration\n`);
    console.log('📝 Agrega al .env:');
    console.log(`   KALSHI_API_KEY=${response.data.api_key_id}`);
    console.log(`   KALSHI_API_SECRET="${response.data.private_key.replace(/\n/g, '\\n')}"\n`);
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Guarda la private_key de forma segura');
    console.log('   - NO podrás verla de nuevo');
    console.log('   - Esta es tu nueva API key para usar en BETAPREDIT\n');

    // Save to file (optional)
    const fs = require('fs');
    const path = require('path');
    const savePath = path.join(__dirname, '..', 'kalshi_api_key.txt');
    fs.writeFileSync(savePath, `API Key ID: ${response.data.api_key_id}\n\nPrivate Key:\n${response.data.private_key}`);
    console.log(`💾 También guardado en: ${savePath}\n`);

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        console.log('\n💡 Verifica que tus credenciales en .env sean correctas');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

generateApiKey();


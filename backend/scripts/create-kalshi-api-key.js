/**
 * Script para crear una API key en Kalshi usando la clave pública
 * 
 * Uso:
 *   node scripts/create-kalshi-api-key.js
 * 
 * Requiere:
 *   - kalshi_public_key.pem (generado con generate-kalshi-keys.js)
 *   - Credenciales existentes en .env para autenticarse
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
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

async function createApiKey() {
  try {
    // Check if public key exists
    const publicKeyPath = path.join(__dirname, '..', 'kalshi_public_key.pem');
    if (!fs.existsSync(publicKeyPath)) {
      console.error('❌ Error: kalshi_public_key.pem no encontrado');
      console.log('   Ejecuta primero: node scripts/generate-kalshi-keys.js');
      process.exit(1);
    }

    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    // Check if we have existing credentials
    if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_API_SECRET) {
      console.error('❌ Error: Se necesitan credenciales existentes para crear una nueva API key');
      console.log('   Agrega al .env:');
      console.log('   KALSHI_API_KEY=<api_key_id_existente>');
      console.log('   KALSHI_API_SECRET=<clave_privada_existente>');
      process.exit(1);
    }

    const apiKey = process.env.KALSHI_API_KEY;
    const privateKey = process.env.KALSHI_API_SECRET.replace(/\\n/g, '\n');

    // Prepare request
    const method = 'POST';
    const requestPath = '/api-keys';
    const timestamp = Date.now().toString();
    const body = JSON.stringify({
      name: 'BETAPREDIT Integration',
      public_key: publicKey,
    });

    // Generate signature
    const signature = await generateSignature(method, requestPath, timestamp, body, privateKey);

    // Make request
    console.log('🔑 Creando API key en Kalshi...\n');
    
    const response = await axios.post(`${API_URL}${requestPath}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'KALSHI-ACCESS-KEY': apiKey,
        'KALSHI-ACCESS-TIMESTAMP': timestamp,
        'KALSHI-ACCESS-SIGNATURE': signature,
      },
    });

    console.log('✅ API key creada exitosamente!\n');
    console.log('📋 Información:');
    console.log(`   API Key ID: ${response.data.api_key_id}\n`);
    console.log('📝 Agrega al .env:');
    console.log(`   KALSHI_API_KEY=${response.data.api_key_id}`);
    console.log(`   KALSHI_API_SECRET=<contenido de kalshi_private_key.pem>\n`);
    console.log('⚠️  IMPORTANTE: Guarda estos valores de forma segura!\n');

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createApiKey();




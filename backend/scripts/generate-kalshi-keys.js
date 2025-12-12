/**
 * Script para generar claves RSA para Kalshi API
 * 
 * Uso:
 *   node scripts/generate-kalshi-keys.js
 * 
 * Esto generará:
 *   - kalshi_private_key.pem (para KALSHI_API_SECRET)
 *   - kalshi_public_key.pem (para crear la API key en Kalshi)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generando claves RSA para Kalshi API...\n');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Create scripts directory if it doesn't exist
const scriptsDir = path.join(__dirname, '..');
const privateKeyPath = path.join(scriptsDir, 'kalshi_private_key.pem');
const publicKeyPath = path.join(scriptsDir, 'kalshi_public_key.pem');

// Write keys to files
fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log('✅ Claves generadas exitosamente!\n');
console.log('📁 Archivos creados:');
console.log(`   - ${privateKeyPath}`);
console.log(`   - ${publicKeyPath}\n`);

console.log('📋 Próximos pasos:\n');
console.log('1. Copia el contenido de kalshi_public_key.pem');
console.log('2. Usa la API de Kalshi para crear la API key:');
console.log('   POST https://api.elections.kalshi.com/trade-api/v2/api-keys');
console.log('   Body: { "name": "BETAPREDIT", "public_key": "<contenido>" }');
console.log('3. Guarda el api_key_id de la respuesta');
console.log('4. Agrega al .env:');
console.log('   KALSHI_API_KEY=<api_key_id>');
console.log('   KALSHI_API_SECRET=<contenido de kalshi_private_key.pem>\n');

console.log('⚠️  IMPORTANTE: Mantén la clave privada segura y nunca la compartas!\n');

// Show public key for easy copy
console.log('📄 Clave Pública (para crear API key en Kalshi):');
console.log('─'.repeat(60));
console.log(publicKey);
console.log('─'.repeat(60));





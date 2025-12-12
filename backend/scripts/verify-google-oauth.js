/**
 * Script para verificar la configuración de Google OAuth
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DE GOOGLE OAUTH\n');
console.log('='.repeat(70));

const checks = {
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'GOOGLE_REDIRECT_URI': process.env.GOOGLE_REDIRECT_URI,
  'BACKEND_URL': process.env.BACKEND_URL,
  'FRONTEND_URL': process.env.FRONTEND_URL,
};

let allOk = true;

console.log('\n📋 Variables de Entorno:\n');
for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅' : '❌';
  const displayValue = value 
    ? (key.includes('SECRET') ? value.substring(0, 10) + '...' : value)
    : 'NO CONFIGURADA';
  
  console.log(`  ${status} ${key}: ${displayValue}`);
  if (!value && (key === 'GOOGLE_CLIENT_ID' || key === 'GOOGLE_CLIENT_SECRET')) {
    allOk = false;
  }
}

// Check redirect URI
console.log('\n🔗 URI de Redirección:\n');
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
  (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/oauth/google/callback` : null);

if (redirectUri) {
  console.log(`  ✅ URI calculada: ${redirectUri}`);
  console.log(`\n  ⚠️  IMPORTANTE: Esta URI debe estar configurada en Google Cloud Console:`);
  console.log(`     https://console.cloud.google.com/apis/credentials`);
  console.log(`     → Edita tu OAuth 2.0 Client ID`);
  console.log(`     → Agrega esta URI en "Authorized redirect URIs"`);
} else {
  console.log(`  ❌ No se pudo calcular la URI de redirección`);
  console.log(`     Configura GOOGLE_REDIRECT_URI o BACKEND_URL`);
  allOk = false;
}

// Check format
if (redirectUri && !redirectUri.startsWith('http')) {
  console.log(`  ⚠️  ADVERTENCIA: La URI debe comenzar con http:// o https://`);
  allOk = false;
}

console.log('\n' + '='.repeat(70));

if (allOk) {
  console.log('\n✅ Configuración básica correcta');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Verifica que la URI de redirección esté en Google Cloud Console');
  console.log('   2. Verifica que el backend esté corriendo (npm run dev)');
  console.log('   3. Verifica que el endpoint /api/oauth/google esté accesible');
} else {
  console.log('\n❌ Hay problemas con la configuración');
  console.log('\n📝 Acciones requeridas:');
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log('   - Configura GOOGLE_CLIENT_ID en backend/.env');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.log('   - Configura GOOGLE_CLIENT_SECRET en backend/.env');
  }
  if (!redirectUri) {
    console.log('   - Configura GOOGLE_REDIRECT_URI o BACKEND_URL en backend/.env');
  }
}

console.log('\n');






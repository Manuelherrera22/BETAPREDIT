/**
 * Script to verify Supabase configuration
 */

require('dotenv').config();

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DE SUPABASE\n');
console.log('='.repeat(70));

const requiredVars = {
  backend: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  frontend: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ],
};

let allGood = true;

console.log('\n📋 Backend (.env):');
requiredVars.backend.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'SUPABASE_URL') {
      console.log(`   ✅ ${varName}: ${value.substring(0, 50)}...`);
    } else {
      console.log(`   ✅ ${varName}: Configurada (${value.length} caracteres)`);
    }
  } else {
    console.log(`   ❌ ${varName}: NO CONFIGURADA`);
    allGood = false;
  }
});

console.log('\n📋 Frontend (.env):');
console.log('   ℹ️  Nota: Las variables del frontend deben estar en frontend/.env');
console.log('   ℹ️  Verifica manualmente que estén configuradas:');
requiredVars.frontend.forEach(varName => {
  console.log(`      - ${varName}`);
});

console.log('\n' + '='.repeat(70));

if (allGood) {
  console.log('\n✅ Configuración del backend correcta');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Verifica que las variables del frontend estén en frontend/.env');
  console.log('   2. Configura Google OAuth en Supabase Dashboard');
  console.log('   3. Agrega las URLs de redirección en Supabase');
  console.log('   4. Reinicia el backend y frontend');
} else {
  console.log('\n❌ Faltan variables de entorno');
  console.log('\n📝 Agrega las variables faltantes en backend/.env');
}

console.log('\n');




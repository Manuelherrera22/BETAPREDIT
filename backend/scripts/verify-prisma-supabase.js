/**
 * Script de Verificación: Prisma + Supabase
 * Verifica que la configuración esté correcta
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICACIÓN DE PRISMA + SUPABASE\n');
console.log('=' .repeat(50));

// 1. Verificar variables de entorno
console.log('\n1️⃣ Verificando Variables de Entorno...\n');

const requiredVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY,
};

let allVarsOk = true;

Object.entries(requiredVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`   ❌ ${key}: NO CONFIGURADA`);
    allVarsOk = false;
  } else if (key === 'DATABASE_URL') {
    // Verificar formato
    if (value.includes('supabase.co') || value.includes('pooler.supabase.com')) {
      const hasPassword = !value.includes('[PASSWORD]') && value.split('@').length > 1;
      if (hasPassword) {
        console.log(`   ✅ ${key}: Configurada (Supabase)`);
        console.log(`      Formato: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ⚠️  ${key}: Configurada pero falta contraseña`);
        allVarsOk = false;
      }
    } else {
      console.log(`   ⚠️  ${key}: Configurada pero no parece ser Supabase`);
    }
  } else if (key.includes('KEY')) {
    console.log(`   ✅ ${key}: Configurada (${value.length} caracteres)`);
  } else {
    console.log(`   ✅ ${key}: Configurada`);
  }
});

if (!allVarsOk) {
  console.log('\n   ⚠️  Algunas variables faltan. Revisa backend/.env');
}

// 2. Verificar schema.prisma
console.log('\n2️⃣ Verificando schema.prisma...\n');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('   ✅ schema.prisma existe');
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Verificar que usa PostgreSQL
  if (schemaContent.includes('provider = "postgresql"')) {
    console.log('   ✅ Provider: PostgreSQL');
  } else {
    console.log('   ⚠️  Provider no es PostgreSQL');
  }
  
  // Verificar modelos importantes
  const importantModels = ['User', 'ExternalBet', 'ValueBetAlert', 'Event'];
  importantModels.forEach(model => {
    if (schemaContent.includes(`model ${model}`)) {
      console.log(`   ✅ Modelo ${model}: Existe`);
    } else {
      console.log(`   ⚠️  Modelo ${model}: No encontrado`);
    }
  });
} else {
  console.log('   ❌ schema.prisma no existe');
}

// 3. Verificar migraciones
console.log('\n3️⃣ Verificando Migraciones...\n');

const migrationsPath = path.join(__dirname, '../prisma/migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath)
    .filter(item => fs.statSync(path.join(migrationsPath, item)).isDirectory());
  
  console.log(`   ✅ Directorio de migraciones existe`);
  console.log(`   📦 Migraciones encontradas: ${migrations.length}`);
  
  migrations.forEach(migration => {
    console.log(`      - ${migration}`);
  });
} else {
  console.log('   ⚠️  Directorio de migraciones no existe');
}

// 4. Intentar conectar (si DATABASE_URL está configurada)
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[PASSWORD]')) {
  console.log('\n4️⃣ Probando Conexión...\n');
  
  try {
    // Intentar validar schema
    execSync('npx prisma validate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    console.log('   ✅ Schema válido');
  } catch (error) {
    console.log('   ⚠️  Error validando schema:', error.message);
  }
  
  try {
    // Intentar generar client
    execSync('npx prisma generate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    console.log('   ✅ Prisma Client generado');
  } catch (error) {
    console.log('   ⚠️  Error generando client:', error.message);
  }
} else {
  console.log('\n4️⃣ Saltando prueba de conexión (DATABASE_URL no configurada)\n');
}

// 5. Resumen
console.log('\n' + '='.repeat(50));
console.log('\n📊 RESUMEN\n');

if (allVarsOk) {
  console.log('   ✅ Configuración básica: OK');
} else {
  console.log('   ⚠️  Configuración básica: Faltan variables');
}

console.log('\n📝 Próximos Pasos:\n');
console.log('   1. Si faltan variables, configura backend/.env');
console.log('   2. Ejecuta: npx prisma generate');
console.log('   3. Ejecuta: npx prisma migrate deploy');
console.log('   4. Verifica: npx prisma migrate status');
console.log('\n');


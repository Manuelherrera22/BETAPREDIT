/**
 * Test de Backend para Deploy
 * Verifica que todo está configurado correctamente para producción
 */

require('dotenv').config();

console.log('\n🚀 TEST DE BACKEND PARA DEPLOY\n');
console.log('='.repeat(50));

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Variables de entorno críticas
console.log('\n1️⃣ Test: Variables de Entorno Críticas...\n');

const criticalVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY,
  'JWT_SECRET': process.env.JWT_SECRET,
  'NODE_ENV': process.env.NODE_ENV || 'development',
};

Object.entries(criticalVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`   ❌ ${key}: NO CONFIGURADA`);
    testsFailed++;
  } else {
    if (key === 'DATABASE_URL') {
      const isSupabase = value.includes('supabase.co') || value.includes('pooler.supabase.com');
      if (isSupabase) {
        console.log(`   ✅ ${key}: Configurada (Supabase)`);
        testsPassed++;
      } else {
        console.log(`   ⚠️  ${key}: Configurada pero no parece ser Supabase`);
        testsFailed++;
      }
    } else if (key.includes('KEY') || key === 'JWT_SECRET') {
      console.log(`   ✅ ${key}: Configurada (${value.length} caracteres)`);
      testsPassed++;
    } else {
      console.log(`   ✅ ${key}: Configurada`);
      testsPassed++;
    }
  }
});

// Test 2: Verificar que DATABASE_URL apunta a Supabase
console.log('\n2️⃣ Test: DATABASE_URL apunta a Supabase...\n');
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const isSupabase = dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com');
  const hasPassword = !dbUrl.includes('[PASSWORD]') && dbUrl.split('@').length > 1;
  
  if (isSupabase && hasPassword) {
    console.log('   ✅ DATABASE_URL correctamente configurada para Supabase');
    console.log(`   📍 Host: ${dbUrl.match(/@([^:]+)/)?.[1] || 'N/A'}`);
    testsPassed++;
  } else {
    console.log('   ❌ DATABASE_URL no está correctamente configurada');
    if (!isSupabase) console.log('      - No apunta a Supabase');
    if (!hasPassword) console.log('      - Falta contraseña o tiene [PASSWORD]');
    testsFailed++;
  }
} else {
  console.log('   ❌ DATABASE_URL no configurada');
  testsFailed++;
}

// Test 3: Verificar estructura de directorios
console.log('\n3️⃣ Test: Estructura de Directorios...\n');
const fs = require('fs');
const path = require('path');

const requiredDirs = [
  'src',
  'src/api',
  'src/api/routes',
  'src/api/controllers',
  'src/services',
  'prisma',
  'prisma/migrations',
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir}/ existe`);
    testsPassed++;
  } else {
    console.log(`   ❌ ${dir}/ NO existe`);
    testsFailed++;
  }
});

// Test 4: Verificar archivos críticos
console.log('\n4️⃣ Test: Archivos Críticos...\n');
const requiredFiles = [
  'src/index.ts',
  'src/config/database.ts',
  'src/config/supabase.ts',
  'src/api/routes/external-bets.routes.ts',
  'src/services/external-bets.service.ts',
  'prisma/schema.prisma',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} existe`);
    testsPassed++;
  } else {
    console.log(`   ❌ ${file} NO existe`);
    testsFailed++;
  }
});

// Test 5: Verificar que Prisma Client está generado
console.log('\n5️⃣ Test: Prisma Client Generado...\n');
try {
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('   ✅ Prisma Client está generado');
    testsPassed++;
  } else {
    console.log('   ⚠️  Prisma Client no encontrado (ejecuta: npm run generate)');
    testsFailed++;
  }
} catch (error) {
  console.log('   ⚠️  No se pudo verificar Prisma Client');
}

// Test 6: Verificar migraciones
console.log('\n6️⃣ Test: Migraciones...\n');
try {
  const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
  if (fs.existsSync(migrationsPath)) {
    const migrations = fs.readdirSync(migrationsPath)
      .filter(item => {
        const itemPath = path.join(migrationsPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    if (migrations.length > 0) {
      console.log(`   ✅ Migraciones encontradas: ${migrations.length}`);
      testsPassed++;
    } else {
      console.log('   ⚠️  No hay migraciones');
      testsFailed++;
    }
  } else {
    console.log('   ❌ Directorio de migraciones no existe');
    testsFailed++;
  }
} catch (error) {
  console.log('   ❌ Error verificando migraciones:', error.message);
  testsFailed++;
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('\n📊 RESUMEN DE TESTS DE DEPLOY\n');
console.log(`   ✅ Tests pasados: ${testsPassed}`);
console.log(`   ❌ Tests fallidos: ${testsFailed}`);
console.log(`   📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n   🎉 ¡BACKEND LISTO PARA DEPLOY!');
  console.log('   ✅ Todas las verificaciones pasaron');
  console.log('   🚀 Puedes desplegar con confianza');
} else {
  console.log('\n   ⚠️  Algunas verificaciones fallaron');
  console.log('   🔍 Revisa los errores antes de desplegar');
  console.log('   💡 Ejecuta: npm run verify-prisma');
}

console.log('\n📝 Checklist para Deploy:\n');
console.log('   [ ] Variables de entorno configuradas en plataforma de deploy');
console.log('   [ ] DATABASE_URL apunta a Supabase producción');
console.log('   [ ] Migraciones aplicadas: npm run db:migrate');
console.log('   [ ] Prisma Client generado: npm run generate');
console.log('   [ ] Build exitoso: npm run build');
console.log('   [ ] Tests pasan: npm run test:external-bets');
console.log('\n');


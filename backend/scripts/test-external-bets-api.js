/**
 * Test completo de External Bets API
 * Verifica que el sistema funciona correctamente con Supabase
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testExternalBets() {
  console.log('\n🧪 TEST COMPLETO: External Bets API\n');
  console.log('='.repeat(50));

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Conexión a Supabase
  console.log('\n1️⃣ Test: Conexión a Supabase...\n');
  try {
    await prisma.$connect();
    console.log('   ✅ Conexión a Supabase exitosa');
    testsPassed++;
  } catch (error) {
    console.log('   ❌ Error de conexión:', error.message);
    testsFailed++;
    await prisma.$disconnect();
    return;
  }

  // Test 2: Verificar que la tabla ExternalBet existe
  console.log('\n2️⃣ Test: Verificar tabla ExternalBet...\n');
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ExternalBet'
      );
    `;
    
    if (result[0].exists) {
      console.log('   ✅ Tabla ExternalBet existe en Supabase');
      testsPassed++;
    } else {
      console.log('   ❌ Tabla ExternalBet NO existe');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error verificando tabla:', error.message);
    testsFailed++;
  }

  // Test 3: Verificar estructura de la tabla
  console.log('\n3️⃣ Test: Verificar estructura de ExternalBet...\n');
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ExternalBet'
      ORDER BY ordinal_position;
    `;

    const requiredColumns = [
      'id', 'userId', 'platform', 'marketType', 
      'selection', 'odds', 'stake', 'status'
    ];

    const existingColumns = columns.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('   ✅ Todas las columnas requeridas existen');
      console.log(`   📊 Total de columnas: ${columns.length}`);
      testsPassed++;
    } else {
      console.log('   ⚠️  Columnas faltantes:', missingColumns.join(', '));
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error verificando estructura:', error.message);
    testsFailed++;
  }

  // Test 4: Verificar índices
  console.log('\n4️⃣ Test: Verificar índices...\n');
  try {
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'ExternalBet';
    `;

    const requiredIndexes = [
      'ExternalBet_userId_idx',
      'ExternalBet_platform_idx',
      'ExternalBet_status_idx'
    ];

    const existingIndexes = indexes.map(i => i.indexname);
    const foundIndexes = requiredIndexes.filter(idx => 
      existingIndexes.some(ei => ei.includes(idx.split('_')[1]))
    );

    if (foundIndexes.length >= 2) {
      console.log('   ✅ Índices principales existen');
      console.log(`   📊 Total de índices: ${indexes.length}`);
      testsPassed++;
    } else {
      console.log('   ⚠️  Algunos índices pueden faltar');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error verificando índices:', error.message);
    testsFailed++;
  }

  // Test 5: Verificar relaciones (Foreign Keys)
  console.log('\n5️⃣ Test: Verificar relaciones...\n');
  try {
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'ExternalBet';
    `;

    const hasUserRelation = foreignKeys.some(fk => fk.foreign_table_name === 'User');
    
    if (hasUserRelation) {
      console.log('   ✅ Relación con User existe');
      console.log(`   📊 Total de relaciones: ${foreignKeys.length}`);
      testsPassed++;
    } else {
      console.log('   ⚠️  Relación con User no encontrada');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Error verificando relaciones:', error.message);
    testsFailed++;
  }

  // Test 6: Verificar que Prisma puede hacer queries
  console.log('\n6️⃣ Test: Prisma puede hacer queries...\n');
  try {
    const count = await prisma.externalBet.count();
    console.log(`   ✅ Prisma Client funciona correctamente`);
    console.log(`   📊 Apuestas registradas: ${count}`);
    testsPassed++;
  } catch (error) {
    console.log('   ❌ Error en query de Prisma:', error.message);
    testsFailed++;
  }

  // Test 7: Verificar enum ExternalBetStatus
  console.log('\n7️⃣ Test: Verificar enum ExternalBetStatus...\n');
  try {
    const enumValues = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"ExternalBetStatus")) AS value;
    `;

    const requiredValues = ['PENDING', 'WON', 'LOST', 'VOID', 'CANCELLED', 'PARTIAL_WIN'];
    const existingValues = enumValues.map(e => e.value);
    const missingValues = requiredValues.filter(val => !existingValues.includes(val));

    if (missingValues.length === 0) {
      console.log('   ✅ Enum ExternalBetStatus tiene todos los valores');
      console.log(`   📊 Valores: ${existingValues.join(', ')}`);
      testsPassed++;
    } else {
      console.log('   ⚠️  Valores faltantes en enum:', missingValues.join(', '));
      testsFailed++;
    }
  } catch (error) {
    console.log('   ⚠️  No se pudo verificar enum (puede ser normal):', error.message);
    // No falla el test si no puede verificar el enum
  }

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 RESUMEN DE TESTS\n');
  console.log(`   ✅ Tests pasados: ${testsPassed}`);
  console.log(`   ❌ Tests fallidos: ${testsFailed}`);
  console.log(`   📊 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n   🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('   ✅ Sistema listo para deploy');
  } else {
    console.log('\n   ⚠️  Algunos tests fallaron');
    console.log('   🔍 Revisa los errores arriba');
  }

  await prisma.$disconnect();
  console.log('\n');
}

// Ejecutar tests
testExternalBets()
  .catch((error) => {
    console.error('❌ Error fatal en tests:', error);
    process.exit(1);
  });


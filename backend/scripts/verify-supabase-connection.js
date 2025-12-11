/**
 * Script para verificar conexión a Supabase
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function verifyConnection() {
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('🔍 Verificando conexión a Supabase...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Conexión exitosa a Supabase!\n');

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test exitoso:', result);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📊 Tablas encontradas:');
    if (tables.length === 0) {
      console.log('   ⚠️  No hay tablas. Necesitas ejecutar migraciones:');
      console.log('   npx prisma migrate dev --name init');
    } else {
      tables.forEach((table) => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }

    console.log('\n✅ Verificación completa!');
  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(error.message);
    
    if (error.message.includes('P1001')) {
      console.error('\n💡 Posibles soluciones:');
      console.error('   1. Verifica que DATABASE_URL esté correcto en .env');
      console.error('   2. Verifica que la contraseña sea correcta');
      console.error('   3. Verifica que el proyecto de Supabase esté activo');
    } else if (error.message.includes('P1003')) {
      console.error('\n💡 La base de datos no existe o no tienes permisos');
    } else if (error.message.includes('P1017')) {
      console.error('\n💡 El servidor cerró la conexión. Verifica la URL.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection();




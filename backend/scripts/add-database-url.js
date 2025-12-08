/**
 * Script para agregar DATABASE_URL al .env
 * Uso: node scripts/add-database-url.js "postgresql://postgres:password@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const databaseUrl = process.argv[2];

if (!databaseUrl) {
  console.error('❌ Error: Debes proporcionar la DATABASE_URL como argumento');
  console.log('\nUso:');
  console.log('  node scripts/add-database-url.js "postgresql://postgres:password@db.mdjzqxhjbisnlfpbjfgb.supabase.co:5432/postgres"');
  process.exit(1);
}

// Verificar que el formato sea correcto
if (!databaseUrl.includes('postgresql://')) {
  console.error('❌ Error: La URL debe comenzar con postgresql://');
  process.exit(1);
}

try {
  let envContent = '';
  
  // Leer .env existente si existe
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Verificar si ya existe DATABASE_URL
  const lines = envContent.split('\n');
  let found = false;
  const newLines = lines.map(line => {
    if (line.trim().startsWith('DATABASE_URL=')) {
      found = true;
      return `DATABASE_URL="${databaseUrl}"`;
    }
    return line;
  });
  
  // Si no existe, agregarlo
  if (!found) {
    if (envContent && !envContent.endsWith('\n')) {
      newLines.push('');
    }
    newLines.push(`DATABASE_URL="${databaseUrl}"`);
  }
  
  // Escribir el archivo
  fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
  
  console.log('✅ DATABASE_URL agregado/actualizado en .env');
  console.log('\n📝 Verificando...');
  
  // Verificar que se guardó correctamente
  const verifyContent = fs.readFileSync(envPath, 'utf8');
  if (verifyContent.includes('DATABASE_URL')) {
    console.log('✅ Verificación exitosa');
    console.log('\n🚀 Ahora puedes ejecutar:');
    console.log('   npm run verify-db');
  } else {
    console.error('❌ Error: No se pudo verificar que se guardó correctamente');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error al escribir el archivo .env:', error.message);
  process.exit(1);
}


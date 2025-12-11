import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Check if DATABASE_URL is set and valid
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.includes('changeme')) {
  const errorMessage = `
❌ DATABASE_URL not configured or invalid!

To fix this:
1. Set DATABASE_URL in your .env file
2. Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
3. Or use: postgresql://user:password@localhost:5432/dbname

The application requires a real database connection and will not work with mock data.
  `.trim();
  
  logger.error(errorMessage);
  throw new Error('DATABASE_URL is required. Please configure your database connection.');
}

// Initialize Prisma with real database only
logger.info('Connecting to database...');
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? [
        {
          emit: 'event',
          level: 'query',
        },
        'warn',
        'error',
      ]
    : ['error'],
});

// Query profiling in development
if (process.env.NODE_ENV === 'development') {
  const { queryProfiler } = require('../utils/query-profiler');
  prisma.$on('query' as never, (e: any) => {
    queryProfiler.profileQuery(e);
  });
}

// Connection event handlers
prisma.$on('error' as never, (e: Error) => {
  logger.error('Prisma error:', e);
});

// Graceful disconnect on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Test connection (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  prisma.$connect()
    .then(() => {
      logger.info('✅ Connected to database successfully');
    })
    .catch((error: any) => {
      logger.error('❌ Database connection failed:', error.message);
      logger.error('Please check your DATABASE_URL configuration.');
      process.exit(1);
    });
}

export { prisma };


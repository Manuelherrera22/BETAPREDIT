import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Try to use real Prisma, fallback to simple mock if DB not available
let prisma: any;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

  // Connection event handlers
  prisma.$on('error' as never, (e: Error) => {
    logger.error('Prisma error:', e);
  });

  // Graceful disconnect on process termination
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
} catch (error) {
  logger.warn('Database not available, using mock data');
  // Use simple mock if Prisma fails
  prisma = {
    $queryRaw: async () => [{ '?column?': 1 }],
    $disconnect: async () => {},
    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async (args: any) => ({ id: '1', ...args.data }),
      findMany: async () => [],
    },
    event: {
      findUnique: async () => null,
      findMany: async () => [],
    },
    odds: {
      findUnique: async () => null,
      findMany: async () => [],
    },
    bet: {
      findMany: async () => [],
      findFirst: async () => null,
      create: async (args: any) => ({ id: '1', ...args.data }),
    },
    responsibleGaming: {
      findUnique: async () => null,
      create: async (args: any) => ({ id: '1', ...args.data }),
      upsert: async (args: any) => ({ id: '1', ...args.create }),
    },
    riskExposure: {
      findMany: async () => [],
      upsert: async (args: any) => ({ id: '1', ...args.create }),
      aggregate: async () => ({ _sum: { potentialLiability: 0 } }),
    },
    fraudAlert: {
      findMany: async () => [],
      create: async (args: any) => ({ id: '1', ...args.data }),
      count: async () => 0,
    },
    transaction: {
      findMany: async () => [],
      aggregate: async () => ({ _sum: { amount: 0 } }),
    },
    session: {
      findUnique: async () => null,
      create: async (args: any) => ({ id: '1', ...args.data }),
      deleteMany: async () => ({ count: 0 }),
    },
    oddsHistory: {
      findMany: async () => [],
    },
    $transaction: async (queries: any[]) => {
      const results = [];
      for (const query of queries) {
        results.push(await query);
      }
      return results;
    },
  };
}

export { prisma };


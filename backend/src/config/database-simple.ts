// Versión simplificada de la base de datos para desarrollo sin Docker
// Simula Prisma client cuando no hay conexión a BD

export const prisma = {
  $queryRaw: async () => [{ '?column?': 1 }],
  $disconnect: async () => {},
  user: {
    findUnique: async (args: any) => null,
    findFirst: async (args: any) => null,
    create: async (args: any) => ({ id: '1', ...args.data }),
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
    findMany: async () => [],
  },
  event: {
    findUnique: async (args: any) => null,
    findMany: async () => [],
    create: async (args: any) => ({ id: '1', ...args.data }),
  },
  odds: {
    findUnique: async (args: any) => null,
    findMany: async () => [],
    create: async (args: any) => ({ id: '1', ...args.data }),
    updateMany: async () => ({ count: 0 }),
  },
  bet: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async (args: any) => ({ id: '1', ...args.data }),
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
  },
  market: {
    findMany: async () => [],
  },
  sport: {
    findMany: async () => [],
  },
  responsibleGaming: {
    findUnique: async () => null,
    create: async (args: any) => ({ id: '1', ...args.data }),
    update: async (args: any) => ({ id: args.where.userId, ...args.data }),
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
    create: async (args: any) => ({ id: '1', ...args.data }),
  },
  $transaction: async (queries: any[]) => {
    const results = [];
    for (const query of queries) {
      results.push(await query);
    }
    return results;
  },
} as any;


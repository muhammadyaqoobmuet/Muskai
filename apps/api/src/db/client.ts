import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

/**
 * Prisma client singleton (avoids exhausting connections under tsx watch
 * reloads) + boot-time filesystem guarantees.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** Storage dir must exist before the worker downloads anything. */
export function ensureStorageDir(): void {
  fs.mkdirSync(config.storageDir, { recursive: true });
}

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Vercel serverless functions have a read-only filesystem except for /tmp.
  // We copy the database there so the app can handle writes (like logging in).
  const tmpDbPath = '/tmp/dev.db';
  try {
    if (!fs.existsSync(tmpDbPath)) {
      const bundledDbPath1 = path.join(process.cwd(), 'dev.db');
      const bundledDbPath2 = path.join(process.cwd(), 'prisma', 'dev.db');
      
      if (fs.existsSync(bundledDbPath1)) {
        fs.copyFileSync(bundledDbPath1, tmpDbPath);
      } else if (fs.existsSync(bundledDbPath2)) {
        fs.copyFileSync(bundledDbPath2, tmpDbPath);
      }
    }
    dbUrl = `file:${tmpDbPath}`;
  } catch (e) {
    console.error('Failed to copy SQLite db to /tmp', e);
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

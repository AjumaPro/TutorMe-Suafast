import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL uses absolute path for SQLite
let databaseUrl = process.env.DATABASE_URL || ''
if (databaseUrl.startsWith('file:./')) {
  // Convert relative path to absolute
  const dbPath = databaseUrl.replace('file:', '')
  const absolutePath = path.resolve(process.cwd(), dbPath)
  databaseUrl = `file:${absolutePath}`
  process.env.DATABASE_URL = databaseUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl || process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}


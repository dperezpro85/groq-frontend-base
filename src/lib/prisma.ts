import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

function createPrismaClient(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            //log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn'],
        })
    }
    return prisma
}

export { createPrismaClient }

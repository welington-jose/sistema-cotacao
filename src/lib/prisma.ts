import { PrismaClient } from "@prisma/client";

// Uma única conexão por processo (evita esgotar o banco em desenvolvimento e na Vercel).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

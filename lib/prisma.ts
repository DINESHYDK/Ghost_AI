import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  if (url.startsWith("prisma+postgres://")) {
    // Accelerate, per the Prisma 7 docs. Cast to the base client type so both branches export one type:
    // Accelerate-only query options (e.g. cacheStrategy) are not type-checked, and this branch has not
    // been exercised (the project's database is Neon).
    return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

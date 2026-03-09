import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initSqlitePragmas(p: PrismaClient) {
  await p.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
  await p.$queryRawUnsafe("PRAGMA foreign_keys = ON;");
  await p.$queryRawUnsafe("PRAGMA busy_timeout = 10000;");
  await p.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
}

initSqlitePragmas(prisma);

export { prisma };

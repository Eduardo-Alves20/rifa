import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Usa o driver `pg` (Node/OpenSSL) via driver adapter em vez do Query Engine
// nativo do Prisma. No host compartilhado (CloudLinux/CageFS) o engine Rust
// entra em pânico ("timer has gone away") ao falar com o pooler do Supabase;
// o `pg` conecta sem problemas.
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Falha rápido em vez de pendurar a requisição se o banco não responder.
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});
const adapter = new PrismaPg(pool);

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

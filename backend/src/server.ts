import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function main() {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] SorteioFácil API → http://localhost:${env.PORT}`);
    console.log(`[server] env=${env.NODE_ENV} · frontend=${env.FRONTEND_URL}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} recebido — encerrando…`);
    server.close(() => console.log("[server] HTTP encerrado"));
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[server] falha ao iniciar:", err);
  process.exit(1);
});

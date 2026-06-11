import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { apiLimiter } from "./middlewares/rateLimit";
import { errorHandler, notFound } from "./middlewares/error";

import authRoutes from "./routes/auth.routes";
import couponsRoutes from "./routes/coupons.routes";
import entriesRoutes from "./routes/entries.routes";
import rafflesRoutes from "./routes/raffles.routes";
import usersRoutes from "./routes/users.routes";
import lojasRoutes from "./routes/lojas.routes";

// Frontend estático (Next export) — fica em backend/public, servido pelo mesmo app.
const publicDir = path.join(__dirname, "..", "public");

export function createApp() {
  const app = express();

  // trust proxy — Hostinger fica atrás de um reverse proxy
  app.set("trust proxy", 1);

  // CSP desligado: o app serve o frontend estático (Next), que usa scripts/estilos
  // inline. As demais proteções do helmet continuam ativas.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  // 6mb para acomodar foto do prêmio enviada como data URL (base64) na criação de sorteio
  app.use(express.json({ limit: "6mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, env: env.NODE_ENV, ts: new Date().toISOString() });
  });

  // Rate limit só na API (não nos assets estáticos).
  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/coupons", couponsRoutes);
  app.use("/api/entries", entriesRoutes);
  app.use("/api/raffles", rafflesRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/lojas", lojasRoutes);

  // ===== Frontend (arquivos estáticos do Next export) =====
  app.use(express.static(publicDir, { extensions: ["html"], index: "index.html" }));
  // Qualquer GET fora de /api que não casou com um arquivo → 404 do front.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.status(404).sendFile(path.join(publicDir, "404.html"), (err) => {
      if (err) next();
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

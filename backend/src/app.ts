import express from "express";
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

export function createApp() {
  const app = express();

  // trust proxy — Hostinger fica atrás de um reverse proxy
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  // 6mb para acomodar foto do prêmio enviada como data URL (base64) na criação de sorteio
  app.use(express.json({ limit: "6mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, env: env.NODE_ENV, ts: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/coupons", couponsRoutes);
  app.use("/api/entries", entriesRoutes);
  app.use("/api/raffles", rafflesRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/lojas", lojasRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

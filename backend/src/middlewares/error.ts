import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { env } from "../config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validação falhou",
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      return res.status(409).json({
        error: `Já existe um registro com este valor único${target ? `: ${target}` : ""}`,
        code: "UNIQUE_CONSTRAINT",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro não encontrado", code: "NOT_FOUND" });
    }
  }

  console.error("[unhandled]", err);
  res.status(500).json({
    error: "Erro interno do servidor",
    code: "INTERNAL_ERROR",
    ...(env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack, message: err.message }
      : {}),
  });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Rota não encontrada", code: "ROUTE_NOT_FOUND" });
}

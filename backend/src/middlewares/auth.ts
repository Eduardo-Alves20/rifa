import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { verifyToken, type JwtPayload } from "../lib/jwt";
import { HttpError } from "../utils/httpError";

/**
 * Exige Authorization: Bearer <token>. Popula req.user.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw HttpError.unauthorized("Token ausente");
    }
    const token = header.slice("Bearer ".length);
    const payload = await verifyToken<JwtPayload>(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      nome: payload.nome,
      primeiroAcesso: payload.primeiroAcesso,
    };
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(HttpError.unauthorized("Token inválido ou expirado"));
  }
}

/**
 * Após requireAuth, exige um dos roles informados.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(HttpError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(HttpError.forbidden(`Requer permissão: ${roles.join(", ")}`));
    }
    next();
  };
}

/**
 * RN-09: bloqueia toda navegação enquanto primeiroAcesso = true (exceto rota de troca).
 */
export function blockIfFirstAccess(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.primeiroAcesso) {
    return next(HttpError.forbidden("Troca de senha obrigatória antes de continuar"));
  }
  next();
}

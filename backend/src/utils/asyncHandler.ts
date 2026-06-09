import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrapper que captura rejeições de promise e direciona para o error handler.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

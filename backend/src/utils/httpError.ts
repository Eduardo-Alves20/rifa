export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, message, "BAD_REQUEST", details);
  }
  static unauthorized(message = "Não autorizado") {
    return new HttpError(401, message, "UNAUTHORIZED");
  }
  static forbidden(message = "Acesso negado") {
    return new HttpError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Recurso não encontrado") {
    return new HttpError(404, message, "NOT_FOUND");
  }
  static conflict(message: string) {
    return new HttpError(409, message, "CONFLICT");
  }
  static tooMany(message = "Muitas requisições") {
    return new HttpError(429, message, "TOO_MANY_REQUESTS");
  }
}

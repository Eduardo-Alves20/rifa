import rateLimit from "express-rate-limit";

/**
 * Doc 7: Força bruta no código do cupom — máx 5 tentativas / 10min por IP.
 */
export const couponRedeemLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de resgate. Tente novamente em 1 hora.",
    code: "TOO_MANY_REQUESTS",
  },
});

/**
 * Doc 5.1.1: 5 tentativas erradas em 10min bloqueia conta por 30min.
 * Aqui aplicamos rate limit por IP — bloqueio por CPF é feito no service.
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20, // janela mais frouxa por IP (CPF tem trava própria)
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de login deste IP. Aguarde 10 minutos.",
    code: "TOO_MANY_REQUESTS",
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

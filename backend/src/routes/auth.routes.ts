import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { loginLimiter } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/auth";
import * as authService from "../services/auth.service";

const router = Router();

const loginSchema = z.object({
  identificador: z.string().min(3).optional(),
  cpf: z.string().min(11).optional(), // compatibilidade com clientes antigos
  senha: z.string().min(6),
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { identificador, cpf, senha } = loginSchema.parse(req.body);
    const loginId = identificador ?? cpf;
    if (!loginId) {
      return res.status(400).json({ error: "Informe CPF, e-mail ou usuário" });
    }
    const ip = req.ip ?? "unknown";
    const result = await authService.login(loginId, senha, ip);
    res.json(result);
  }),
);

const checkSchema = z.object({ cpf: z.string().min(11) });

router.post(
  "/check-first-access",
  asyncHandler(async (req, res) => {
    const { cpf } = checkSchema.parse(req.body);
    const result = await authService.checkFirstAccess(cpf);
    res.json(result);
  }),
);

const registerSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().min(11),
  usuario: z.string().min(3).max(40).optional(),
  celular: z.string().min(10),
  dataNasc: z.string(), // ISO
  email: z.string().email().optional(),
  senha: z.string().min(6),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const user = await authService.registerParticipante(data);
    res.status(201).json({ user });
  }),
);

const changePasswordSchema = z.object({ novaSenha: z.string().min(6) });

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { novaSenha } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, novaSenha);
    res.json({ ok: true });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

export default router;

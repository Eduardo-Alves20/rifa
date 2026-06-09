import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole, blockIfFirstAccess } from "../middlewares/auth";
import * as userService from "../services/user.service";

const router = Router();

// 5.2.2: Colaborador cadastra cliente rapidinho
const quickRegisterSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().min(11),
  usuario: z.string().min(3).max(40).optional(),
  celular: z.string().min(10),
  dataNasc: z.string(),
  email: z.string().email().optional(),
});

router.post(
  "/quick-register",
  requireAuth,
  blockIfFirstAccess,
  requireRole("colaborador", "admin"),
  asyncHandler(async (req, res) => {
    const data = quickRegisterSchema.parse(req.body);
    const user = await userService.quickRegisterParticipante({ ...data, criadoPorId: req.user!.id });
    res.status(201).json({ user });
  }),
);

// 5.5.4: Admin cria colaborador
const createColaboradorSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().min(11),
  usuario: z.string().min(3).max(40).optional(),
  celular: z.string().min(10),
  dataNasc: z.string(),
  email: z.string().email(),
  lojaId: z.string().uuid(),
  senhaInicial: z.string().min(6),
});

router.post(
  "/colaboradores",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = createColaboradorSchema.parse(req.body);
    const user = await userService.createColaborador({ ...data, criadoPorId: req.user!.id });
    res.status(201).json({ user });
  }),
);

router.get(
  "/colaboradores",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const users = await userService.listUsersByRole("colaborador");
    res.json({ users });
  }),
);

router.patch(
  "/:id/active",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);
    const user = await userService.setUserActive(req.params.id, ativo);
    res.json({ user });
  }),
);

// Busca cliente por CPF (para colaborador antes de gerar cupom)
router.get(
  "/by-cpf/:cpf",
  requireAuth,
  blockIfFirstAccess,
  requireRole("colaborador", "admin"),
  asyncHandler(async (req, res) => {
    const user = await userService.findUserByCpf(req.params.cpf);
    if (!user) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json({ user });
  }),
);

export default router;

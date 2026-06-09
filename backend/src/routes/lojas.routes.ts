import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole, blockIfFirstAccess } from "../middlewares/auth";
import * as lojaService from "../services/loja.service";

const router = Router();

// Lista lojas (admin e colaborador — para seletor de sorteio)
router.get(
  "/",
  requireAuth,
  blockIfFirstAccess,
  requireRole("admin", "colaborador"),
  asyncHandler(async (_req, res) => {
    const lojas = await lojaService.listLojas();
    res.json({ lojas });
  }),
);

const createSchema = z.object({
  nome: z.string().min(2).max(120),
  endereco: z.string().max(200).optional(),
});

router.post(
  "/",
  requireAuth,
  blockIfFirstAccess,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const loja = await lojaService.createLoja(data);
    res.status(201).json({ loja });
  }),
);

router.patch(
  "/:id/active",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);
    const loja = await lojaService.setLojaActive(req.params.id, ativo);
    res.json({ loja });
  }),
);

export default router;

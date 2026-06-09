import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, blockIfFirstAccess } from "../middlewares/auth";
import * as entryService from "../services/entry.service";

const router = Router();

// 5.4.2: Confirma escolha de números — endpoint atômico
const confirmSchema = z.object({
  codigo: z.string().min(6),
  numeros: z.array(z.number().int().positive()).min(1).max(1000),
});

router.post(
  "/confirm",
  requireAuth,
  blockIfFirstAccess,
  asyncHandler(async (req, res) => {
    const { codigo, numeros } = confirmSchema.parse(req.body);
    const result = await entryService.confirmNumbers({
      couponCodigo: codigo,
      participanteId: req.user!.id,
      numeros,
    });
    res.json(result);
  }),
);

// Números já ocupados em um sorteio — público (sem auth) para painel funcionar antes do login do QR
router.get(
  "/taken/:raffleId",
  asyncHandler(async (req, res) => {
    const taken = await entryService.getTakenNumbers(req.params.raffleId);
    res.json({ taken });
  }),
);

// Meus números em um sorteio
router.get(
  "/mine/:raffleId",
  requireAuth,
  blockIfFirstAccess,
  asyncHandler(async (req, res) => {
    const numeros = await entryService.getMyNumbers(req.params.raffleId, req.user!.id);
    res.json({ numeros });
  }),
);

export default router;

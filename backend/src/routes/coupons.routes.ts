import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole, blockIfFirstAccess } from "../middlewares/auth";
import { couponRedeemLimiter } from "../middlewares/rateLimit";
import * as couponService from "../services/coupon.service";

const router = Router();

const generateSchema = z.object({
  raffleId: z.string().uuid(),
  participanteCpf: z.string().min(11),
  qtdNumeros: z.number().int().min(1).max(1000),
});

// 5.3: Colaborador gera cupom para um cliente
router.post(
  "/",
  requireAuth,
  blockIfFirstAccess,
  requireRole("colaborador", "admin"),
  asyncHandler(async (req, res) => {
    const data = generateSchema.parse(req.body);
    const ip = req.ip ?? "unknown";
    const result = await couponService.generateCoupon({
      raffleId: data.raffleId,
      participanteCpf: data.participanteCpf,
      qtdNumeros: data.qtdNumeros,
      colaboradorId: req.user!.id,
      ip,
    });
    res.status(201).json(result);
  }),
);

// 5.4.1: Participante valida cupom antes de escolher números
const validateSchema = z.object({
  codigo: z.string().min(6),
  sig: z.string().optional(),
});

router.post(
  "/validate",
  couponRedeemLimiter,
  requireAuth,
  blockIfFirstAccess,
  asyncHandler(async (req, res) => {
    const { codigo, sig } = validateSchema.parse(req.body);
    const coupon = await couponService.validateRedemption({
      codigo,
      participanteId: req.user!.id,
      sig,
    });
    res.json({ coupon });
  }),
);

// 5.2.3: Histórico de cupons do colaborador
router.get(
  "/mine",
  requireAuth,
  blockIfFirstAccess,
  requireRole("colaborador", "admin"),
  asyncHandler(async (req, res) => {
    const filter = (req.query.filter as "hoje" | "7dias" | "todos") ?? "todos";
    const coupons = await couponService.listColaboradorCoupons(req.user!.id, filter);
    res.json({ coupons });
  }),
);

export default router;

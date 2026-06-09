import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole, blockIfFirstAccess } from "../middlewares/auth";
import * as raffleService from "../services/raffle.service";

const router = Router();

const createSchema = z.object({
  nome: z.string().min(3).max(60),
  premio: z.string().min(1).max(120),
  premioValorCentavos: z.number().int().nonnegative().optional(),
  valorNumeroCentavos: z.number().int().nonnegative().optional(),
  totalNumeros: z.number().int().min(10).max(10_000),
  dataHoraSorteio: z.string(),
  prazoResgate: z.string(),
  lojaIds: z.array(z.string().uuid()).min(1),
  // Aceita URL http(s) ou data URL (foto enviada como base64 comprimido)
  imagemUrl: z.string().max(5_000_000).optional(),
  animacao: z.enum(["tambor", "caca_niquel"]),
});

router.post(
  "/",
  requireAuth,
  blockIfFirstAccess,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const raffle = await raffleService.createRaffle({ ...data, criadoPorId: req.user!.id });
    res.status(201).json({ raffle });
  }),
);

router.get(
  "/",
  requireAuth,
  blockIfFirstAccess,
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const filter: { status?: string; ativoColaborador?: string } = {};
    if (status) filter.status = status;
    if (req.user!.role === "colaborador") filter.ativoColaborador = req.user!.id;
    const raffles = await raffleService.listRaffles(filter);
    res.json({ raffles });
  }),
);

// Público — tela ao vivo
router.get(
  "/public/:slug",
  asyncHandler(async (req, res) => {
    const raffle = await raffleService.getRaffleBySlug(req.params.slug);
    if (!raffle) return res.status(404).json({ error: "Sorteio não encontrado" });
    res.json({ raffle });
  }),
);

// Admin — detalhe com estatísticas, funil de cupons e ranking de colaboradores
router.get(
  "/:id/admin-detail",
  requireAuth,
  blockIfFirstAccess,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const detail = await raffleService.getRaffleAdminDetail(req.params.id);
    res.json(detail);
  }),
);

// Admin — mapa de números (quem escolheu cada número). Somente leitura.
router.get(
  "/:id/numbers-map",
  requireAuth,
  blockIfFirstAccess,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const map = await raffleService.getRaffleNumbersMap(req.params.id);
    res.json(map);
  }),
);

router.post(
  "/:id/end-redemption",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const raffle = await raffleService.endRedemption(req.params.id);
    res.json({ raffle });
  }),
);

router.post(
  "/:id/draw",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const ip = req.ip ?? "unknown";
    const raffle = await raffleService.drawWinner(req.params.id, ip);
    res.json({ raffle });
  }),
);

router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const raffle = await raffleService.cancelRaffle(req.params.id);
    res.json({ raffle });
  }),
);

export default router;

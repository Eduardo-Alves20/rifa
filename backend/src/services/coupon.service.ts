import { prisma } from "../lib/prisma";
import { generateCouponCode, signCoupon, verifyCouponSig } from "../lib/crypto";
import { generateCouponQrDataUrl } from "../lib/qrcode";
import { sanitizeCpf, isValidCpf } from "../utils/cpf";
import { HttpError } from "../utils/httpError";

interface GenerateCouponInput {
  raffleId: string;
  participanteCpf: string;
  qtdNumeros: number;
  colaboradorId: string;
  ip: string;
}

export async function generateCoupon(input: GenerateCouponInput) {
  const cpf = sanitizeCpf(input.participanteCpf);
  if (!isValidCpf(cpf)) throw HttpError.badRequest("CPF do cliente inválido");
  if (input.qtdNumeros < 1) throw HttpError.badRequest("Quantidade de números deve ser >= 1");

  const raffle = await prisma.raffle.findUnique({
    where: { id: input.raffleId },
    select: { id: true, nome: true, status: true, prazoResgate: true, totalNumeros: true },
  });
  if (!raffle) throw HttpError.notFound("Sorteio não encontrado");
  if (raffle.status !== "ativo") throw HttpError.badRequest("Sorteio não está aceitando novos cupons");
  if (raffle.prazoResgate <= new Date()) throw HttpError.badRequest("Prazo de resgate já encerrou");

  const participante = await prisma.user.findUnique({
    where: { cpf },
    select: { id: true, role: true, ativo: true },
  });
  if (!participante) throw HttpError.notFound("Cliente não cadastrado");
  if (!participante.ativo) throw HttpError.badRequest("Cliente inativo");
  if (participante.role !== "participante") {
    throw HttpError.badRequest("CPF informado não pertence a um participante");
  }

  // Verifica disponibilidade de números no sorteio
  const usados = await prisma.entry.count({ where: { raffleId: raffle.id } });
  const livres = raffle.totalNumeros - usados;
  if (livres < input.qtdNumeros) {
    throw HttpError.badRequest(`Sorteio só tem ${livres} número(s) disponível(eis)`);
  }

  // Gera código único — retry no caso (improvável) de colisão
  let codigo = "";
  for (let i = 0; i < 5; i++) {
    codigo = generateCouponCode(raffle.nome);
    const dup = await prisma.coupon.findUnique({ where: { codigo } });
    if (!dup) break;
    codigo = "";
  }
  if (!codigo) throw new Error("Falha ao gerar código único de cupom");

  const hmacSig = signCoupon(codigo, raffle.id);

  const coupon = await prisma.coupon.create({
    data: {
      codigo,
      hmacSig,
      raffleId: raffle.id,
      participanteId: participante.id,
      colaboradorId: input.colaboradorId,
      qtdNumeros: input.qtdNumeros,
      ipGeracao: input.ip,
    },
  });

  const qrDataUrl = await generateCouponQrDataUrl(coupon.codigo, raffle.id);

  return { coupon, qrDataUrl };
}

interface RedeemValidateInput {
  codigo: string;
  participanteId: string;
  sig?: string; // opcional — só obrigatório quando veio do QR
}

/**
 * Valida que o cupom pode ser usado. NÃO consome — isso só acontece quando
 * o participante confirma a seleção de números (entry.service:confirmNumbers).
 */
export async function validateRedemption(input: RedeemValidateInput) {
  const codigo = input.codigo.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { codigo },
    include: {
      raffle: { select: { id: true, nome: true, slug: true, totalNumeros: true, prazoResgate: true, status: true } },
    },
  });
  if (!coupon) throw HttpError.notFound("Cupom não encontrado");

  // RN-01: vinculado ao CPF
  if (coupon.participanteId !== input.participanteId) {
    throw HttpError.forbidden("Este cupom pertence a outra pessoa");
  }

  if (coupon.status === "resgatado") {
    throw HttpError.conflict("Cupom já foi resgatado");
  }
  if (coupon.status === "expirado") {
    throw HttpError.badRequest("Cupom expirado");
  }

  if (coupon.raffle.status !== "ativo") {
    throw HttpError.badRequest("Sorteio não está mais aceitando resgates");
  }
  if (coupon.raffle.prazoResgate <= new Date()) {
    throw HttpError.badRequest("Prazo de resgate encerrado");
  }

  // Se veio do QR Code, valida HMAC
  if (input.sig && !verifyCouponSig(coupon.codigo, coupon.raffleId, input.sig)) {
    throw HttpError.unauthorized("Assinatura do QR Code inválida — possível adulteração");
  }

  // Verifica disponibilidade
  const usados = await prisma.entry.count({ where: { raffleId: coupon.raffleId } });
  const livres = coupon.raffle.totalNumeros - usados;
  if (livres < coupon.qtdNumeros) {
    throw HttpError.conflict(`Sorteio só tem ${livres} número(s) disponível(eis)`);
  }

  return coupon;
}

export async function listColaboradorCoupons(colaboradorId: string, filter: "hoje" | "7dias" | "todos" = "todos") {
  const where: { colaboradorId: string; criadoEm?: { gte: Date } } = { colaboradorId };
  if (filter === "hoje") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.criadoEm = { gte: today };
  } else if (filter === "7dias") {
    where.criadoEm = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  return prisma.coupon.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      raffle: { select: { id: true, nome: true } },
      participante: { select: { id: true, nome: true, cpf: true } },
    },
    take: 200,
  });
}

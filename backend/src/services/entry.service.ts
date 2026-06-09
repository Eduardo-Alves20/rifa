import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

/**
 * Resgate atômico: marca cupom como "resgatado" + insere entries.
 * Garante:
 *   - RN-02: cupom usado uma única vez (atomic UPDATE com WHERE status=pendente)
 *   - RN-05: número único por sorteio (UNIQUE constraint no banco)
 *   - Race condition de seleção simultânea → P2002 → 409
 */
export async function confirmNumbers(input: {
  couponCodigo: string;
  participanteId: string;
  numeros: number[];
}) {
  const codigo = input.couponCodigo.trim().toUpperCase();
  const numerosUnicos = [...new Set(input.numeros)];
  if (numerosUnicos.length !== input.numeros.length) {
    throw HttpError.badRequest("Lista de números contém duplicatas");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({
        where: { codigo },
        include: { raffle: { select: { id: true, totalNumeros: true, prazoResgate: true, status: true } } },
      });
      if (!coupon) throw HttpError.notFound("Cupom não encontrado");
      if (coupon.participanteId !== input.participanteId) {
        throw HttpError.forbidden("Cupom pertence a outra pessoa");
      }
      if (coupon.status !== "pendente") throw HttpError.conflict("Cupom já foi resgatado");
      if (coupon.raffle.status !== "ativo") throw HttpError.badRequest("Sorteio não está ativo");
      if (coupon.raffle.prazoResgate <= new Date()) throw HttpError.badRequest("Prazo de resgate encerrado");

      if (numerosUnicos.length !== coupon.qtdNumeros) {
        throw HttpError.badRequest(
          `Selecione exatamente ${coupon.qtdNumeros} número(s)`,
        );
      }
      for (const n of numerosUnicos) {
        if (!Number.isInteger(n) || n < 1 || n > coupon.raffle.totalNumeros) {
          throw HttpError.badRequest(`Número ${n} fora do intervalo válido (1-${coupon.raffle.totalNumeros})`);
        }
      }

      // RN-02: lock otimista — só atualiza se ainda estiver pendente
      const updated = await tx.coupon.updateMany({
        where: { id: coupon.id, status: "pendente" },
        data: { status: "resgatado", resgatadoEm: new Date() },
      });
      if (updated.count === 0) {
        throw HttpError.conflict("Cupom foi resgatado por outra sessão");
      }

      // RN-05: insere entries — UNIQUE(raffleId, numero) protege race condition
      await tx.entry.createMany({
        data: numerosUnicos.map((numero) => ({
          raffleId: coupon.raffleId,
          participanteId: input.participanteId,
          couponId: coupon.id,
          numero,
        })),
      });

      return { couponId: coupon.id, raffleId: coupon.raffleId, numeros: numerosUnicos };
    });

    return result;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // (raffleId, numero) já existe — outro participante pegou um dos números
      throw HttpError.conflict(
        "Um dos números selecionados foi escolhido por outra pessoa enquanto você decidia. Por favor escolha outros.",
      );
    }
    throw err;
  }
}

/**
 * Lista números já ocupados em um sorteio. Pública (sem auth).
 */
export async function getTakenNumbers(raffleId: string) {
  const entries = await prisma.entry.findMany({
    where: { raffleId },
    select: { numero: true },
  });
  return entries.map((e) => e.numero).sort((a, b) => a - b);
}

/**
 * Números confirmados do participante em um sorteio.
 */
export async function getMyNumbers(raffleId: string, participanteId: string) {
  const entries = await prisma.entry.findMany({
    where: { raffleId, participanteId },
    select: { numero: true },
  });
  return entries.map((e) => e.numero).sort((a, b) => a - b);
}

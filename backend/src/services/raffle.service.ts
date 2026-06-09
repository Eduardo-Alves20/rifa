import { prisma } from "../lib/prisma";
import { slugify } from "../utils/slug";
import { secureRandomInt } from "../lib/crypto";
import { HttpError } from "../utils/httpError";
import type { Animacao } from "@prisma/client";

interface CreateRaffleInput {
  nome: string;
  premio: string;
  premioValorCentavos?: number;
  valorNumeroCentavos?: number;
  totalNumeros: number;
  dataHoraSorteio: string; // ISO
  prazoResgate: string; // ISO
  lojaIds: string[];
  imagemUrl?: string;
  animacao: Animacao;
  criadoPorId: string;
}

export async function createRaffle(input: CreateRaffleInput) {
  const dataSorteio = new Date(input.dataHoraSorteio);
  const prazo = new Date(input.prazoResgate);

  if (Number.isNaN(dataSorteio.getTime())) throw HttpError.badRequest("Data do sorteio inválida");
  if (Number.isNaN(prazo.getTime())) throw HttpError.badRequest("Prazo de resgate inválido");
  if (dataSorteio <= new Date()) throw HttpError.badRequest("Data do sorteio deve ser futura");
  if (prazo >= dataSorteio) throw HttpError.badRequest("Prazo de resgate deve ser anterior ao sorteio");

  if (input.totalNumeros < 10 || input.totalNumeros > 10_000) {
    throw HttpError.badRequest("Total de números deve estar entre 10 e 10.000");
  }
  if (input.lojaIds.length === 0) throw HttpError.badRequest("Selecione ao menos uma loja participante");

  // slug único
  const baseSlug = slugify(input.nome);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.raffle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  return prisma.raffle.create({
    data: {
      nome: input.nome.trim(),
      slug,
      premio: input.premio.trim(),
      premioValorCentavos: input.premioValorCentavos,
      valorNumeroCentavos: input.valorNumeroCentavos,
      totalNumeros: input.totalNumeros,
      dataHoraSorteio: dataSorteio,
      prazoResgate: prazo,
      animacao: input.animacao,
      imagemUrl: input.imagemUrl,
      criadoPorId: input.criadoPorId,
      lojas: {
        create: input.lojaIds.map((lojaId) => ({ lojaId })),
      },
    },
    include: { lojas: true },
  });
}

export async function listRaffles(filter?: { status?: string; ativoColaborador?: string }) {
  const where: { status?: "ativo"; lojas?: { some: { loja: { colaboradores: { some: { id: string } } } } } } = {};
  if (filter?.status === "ativo") where.status = "ativo";

  // Se for colaborador, filtra só sorteios que incluem a loja dele
  if (filter?.ativoColaborador) {
    where.lojas = { some: { loja: { colaboradores: { some: { id: filter.ativoColaborador } } } } };
    where.status = "ativo";
  }

  return prisma.raffle.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { entries: true, coupons: true } },
      lojas: { include: { loja: { select: { id: true, nome: true } } } },
    },
  });
}

export async function getRaffleBySlug(slug: string) {
  return prisma.raffle.findUnique({
    where: { slug },
    include: {
      ganhador: { select: { id: true, nome: true, celular: true } },
      _count: { select: { entries: true } },
    },
  });
}

export async function endRedemption(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw HttpError.notFound("Sorteio não encontrado");
  if (raffle.status !== "ativo") throw HttpError.badRequest("Sorteio não está ativo");

  return prisma.raffle.update({
    where: { id: raffleId },
    data: { status: "aguardando_sorteio" },
  });
}

/**
 * Doc 5.6.3: realiza o sorteio.
 * Gera crypto.randomInt(1, totalNumeros+1). Refaz se o número não tem dono.
 * RN-07: irreversível — sem endpoint para refazer.
 */
export async function drawWinner(raffleId: string, adminIp: string) {
  return prisma.$transaction(async (tx) => {
    const raffle = await tx.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw HttpError.notFound("Sorteio não encontrado");
    if (raffle.status !== "aguardando_sorteio") {
      throw HttpError.badRequest("Sorteio precisa estar em 'aguardando_sorteio' para ser sorteado");
    }

    const entriesCount = await tx.entry.count({ where: { raffleId } });
    if (entriesCount === 0) throw HttpError.badRequest("Sorteio não tem nenhum participante");

    // Loop até encontrar um número que tenha dono (doc 5.6.3)
    const MAX_TRIES = 10_000;
    let winnerEntry = null;
    for (let i = 0; i < MAX_TRIES; i++) {
      const numero = secureRandomInt(1, raffle.totalNumeros);
      const entry = await tx.entry.findUnique({
        where: { raffleId_numero: { raffleId, numero } },
        include: { participante: { select: { id: true, nome: true, celular: true } } },
      });
      if (entry) {
        winnerEntry = { entry, numero };
        break;
      }
    }
    if (!winnerEntry) throw new Error("Falha ao encontrar número vencedor após muitas tentativas");

    const updated = await tx.raffle.update({
      where: { id: raffleId },
      data: {
        status: "sorteado",
        numeroVencedor: winnerEntry.numero,
        ganhadorId: winnerEntry.entry.participanteId,
        sorteadoEm: new Date(),
        sorteadoPorIp: adminIp,
      },
      include: { ganhador: { select: { id: true, nome: true, celular: true } } },
    });

    return updated;
  });
}

export async function cancelRaffle(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw HttpError.notFound("Sorteio não encontrado");
  if (raffle.status === "sorteado") throw HttpError.badRequest("Sorteio já foi realizado");

  return prisma.raffle.update({
    where: { id: raffleId },
    data: { status: "cancelado" },
  });
}

/**
 * Detalhe administrativo de um sorteio: dados + estatísticas + ranking de colaboradores.
 * Somente leitura — não altera escolhas de números (RN-05).
 */
export async function getRaffleAdminDetail(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    include: {
      ganhador: { select: { id: true, nome: true, celular: true } },
      lojas: { include: { loja: { select: { id: true, nome: true } } } },
    },
  });
  if (!raffle) throw HttpError.notFound("Sorteio não encontrado");

  const vendidos = await prisma.entry.count({ where: { raffleId } });

  // Funil de cupons por status
  const cuponsPorStatus = await prisma.coupon.groupBy({
    by: ["status"],
    where: { raffleId },
    _count: { _all: true },
  });
  const cupons = { total: 0, pendente: 0, resgatado: 0, expirado: 0 };
  for (const c of cuponsPorStatus) {
    cupons[c.status] = c._count._all;
    cupons.total += c._count._all;
  }

  // Participantes distintos
  const participantesGroup = await prisma.entry.groupBy({
    by: ["participanteId"],
    where: { raffleId },
  });
  const participantes = participantesGroup.length;

  // Ranking de colaboradores (números vendidos via cupom)
  const entriesComColab = await prisma.entry.findMany({
    where: { raffleId },
    select: {
      couponId: true,
      coupon: { select: { colaboradorId: true, colaborador: { select: { nome: true } } } },
    },
  });
  const rankMap = new Map<
    string,
    { colaboradorId: string; nome: string; numeros: number; cupons: Set<string> }
  >();
  for (const e of entriesComColab) {
    const id = e.coupon.colaboradorId;
    const cur =
      rankMap.get(id) ??
      { colaboradorId: id, nome: e.coupon.colaborador.nome, numeros: 0, cupons: new Set<string>() };
    cur.numeros += 1;
    cur.cupons.add(e.couponId);
    rankMap.set(id, cur);
  }
  const ranking = [...rankMap.values()]
    .map((r) => ({ colaboradorId: r.colaboradorId, nome: r.nome, numeros: r.numeros, cupons: r.cupons.size }))
    .sort((a, b) => b.numeros - a.numeros);

  const arrecadadoCentavos =
    raffle.valorNumeroCentavos != null ? vendidos * raffle.valorNumeroCentavos : null;

  return {
    raffle,
    stats: {
      totalNumeros: raffle.totalNumeros,
      vendidos,
      disponiveis: raffle.totalNumeros - vendidos,
      percentual: raffle.totalNumeros > 0 ? Math.round((vendidos / raffle.totalNumeros) * 100) : 0,
      participantes,
      cupons,
      arrecadadoCentavos,
    },
    ranking,
  };
}

/**
 * Mapa de números: para cada número vendido, quem escolheu (participante) e quem vendeu (colaborador).
 * Somente leitura.
 */
export async function getRaffleNumbersMap(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: { id: true, totalNumeros: true },
  });
  if (!raffle) throw HttpError.notFound("Sorteio não encontrado");

  const entries = await prisma.entry.findMany({
    where: { raffleId },
    select: {
      numero: true,
      criadoEm: true,
      participante: { select: { id: true, nome: true } },
      coupon: { select: { codigo: true, colaborador: { select: { nome: true } } } },
    },
    orderBy: { numero: "asc" },
  });

  return {
    totalNumeros: raffle.totalNumeros,
    numeros: entries.map((e) => ({
      numero: e.numero,
      participanteId: e.participante.id,
      participanteNome: e.participante.nome,
      colaboradorNome: e.coupon.colaborador.nome,
      couponCodigo: e.coupon.codigo,
      criadoEm: e.criadoEm,
    })),
  };
}

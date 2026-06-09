import { prisma } from "../lib/prisma";

export async function listLojas() {
  return prisma.loja.findMany({
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      endereco: true,
      ativo: true,
      _count: { select: { colaboradores: true, rafflesLojas: true } },
    },
  });
}

export async function createLoja(input: { nome: string; endereco?: string }) {
  return prisma.loja.create({
    data: { nome: input.nome.trim(), endereco: input.endereco?.trim() || null },
    select: { id: true, nome: true, endereco: true, ativo: true },
  });
}

export async function setLojaActive(id: string, ativo: boolean) {
  return prisma.loja.update({
    where: { id },
    data: { ativo },
    select: { id: true, nome: true, endereco: true, ativo: true },
  });
}

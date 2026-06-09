import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { sanitizeCpf, isValidCpf } from "../utils/cpf";
import { HttpError } from "../utils/httpError";
import type { Role } from "@prisma/client";

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function usernameFromEmail(email?: string): string | null {
  if (!email) return null;
  const local = email.split("@")[0]?.trim().toLowerCase() ?? "";
  return local.length >= 3 ? local : null;
}

async function pickAvailableUsername(preferred: string | null, cpf: string): Promise<string> {
  const candidate = preferred ?? cpf;
  const dup = await prisma.user.findFirst({
    where: { usuario: { equals: candidate, mode: "insensitive" } },
    select: { id: true },
  });
  return dup ? cpf : candidate;
}

interface QuickRegisterInput {
  nome: string;
  cpf: string;
  usuario?: string;
  celular: string;
  dataNasc: string;
  email?: string;
  criadoPorId: string;
}

/**
 * Doc 5.2.2: Colaborador cadastra cliente rapidinho.
 * Senha inicial é a senha temporária (3 dígitos CPF + dataNasc).
 * Flag primeiroAcesso = true para forçar troca.
 */
export async function quickRegisterParticipante(input: QuickRegisterInput) {
  const cpf = sanitizeCpf(input.cpf);
  if (!isValidCpf(cpf)) throw HttpError.badRequest("CPF inválido");

  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) throw HttpError.conflict("CPF já cadastrado");

  const email = input.email?.trim().toLowerCase();
  if (email) {
    const dupEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (dupEmail) throw HttpError.conflict("E-mail já cadastrado");
  }

  const preferredUsername = input.usuario
    ? normalizeUsername(input.usuario)
    : usernameFromEmail(email);
  const usuario = await pickAvailableUsername(preferredUsername, cpf);

  const dataNasc = new Date(input.dataNasc);
  if (Number.isNaN(dataNasc.getTime())) throw HttpError.badRequest("Data de nascimento inválida");

  // Senha temporária: 3 primeiros do CPF + ddmmaaaa
  const dd = String(dataNasc.getUTCDate()).padStart(2, "0");
  const mm = String(dataNasc.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(dataNasc.getUTCFullYear());
  const tempPassword = `${cpf.slice(0, 3)}${dd}${mm}${yyyy}`;

  const senhaHash = await hashPassword(tempPassword);

  return prisma.user.create({
    data: {
      nome: input.nome.trim(),
      cpf,
      usuario,
      celular: input.celular.replace(/\D/g, ""),
      dataNasc,
      email: email ?? null,
      senhaHash,
      role: "participante",
      primeiroAcesso: true,
      ativo: true,
      criadoPorId: input.criadoPorId,
    },
    select: { id: true, nome: true, cpf: true, celular: true },
  });
}

interface CreateColaboradorInput {
  nome: string;
  cpf: string;
  usuario?: string;
  email: string;
  lojaId: string;
  senhaInicial: string;
  criadoPorId: string;
  dataNasc: string;
  celular: string;
}

export async function createColaborador(input: CreateColaboradorInput) {
  const cpf = sanitizeCpf(input.cpf);
  if (!isValidCpf(cpf)) throw HttpError.badRequest("CPF inválido");

  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) throw HttpError.conflict("CPF já cadastrado");

  const email = input.email.trim().toLowerCase();
  const dupEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (dupEmail) throw HttpError.conflict("E-mail já cadastrado");

  const preferredUsername = input.usuario
    ? normalizeUsername(input.usuario)
    : usernameFromEmail(email);
  const usuario = await pickAvailableUsername(preferredUsername, cpf);

  const senhaHash = await hashPassword(input.senhaInicial);

  return prisma.user.create({
    data: {
      nome: input.nome.trim(),
      cpf,
      usuario,
      celular: input.celular.replace(/\D/g, ""),
      dataNasc: new Date(input.dataNasc),
      email,
      senhaHash,
      role: "colaborador",
      primeiroAcesso: true,
      ativo: true,
      lojaId: input.lojaId,
      criadoPorId: input.criadoPorId,
    },
    select: { id: true, nome: true, cpf: true, email: true, lojaId: true, ativo: true },
  });
}

export async function setUserActive(userId: string, ativo: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { ativo } });
}

export async function findUserByCpf(cpfInput: string) {
  const cpf = sanitizeCpf(cpfInput);
  return prisma.user.findUnique({
    where: { cpf },
    select: { id: true, nome: true, cpf: true, celular: true, role: true, ativo: true, primeiroAcesso: true },
  });
}

export async function listUsersByRole(role: Role) {
  return prisma.user.findMany({
    where: { role },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      cpf: true,
      email: true,
      ativo: true,
      lojaId: true,
      loja: { select: { id: true, nome: true } },
      criadoEm: true,
    },
  });
}

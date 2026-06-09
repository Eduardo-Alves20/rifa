import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, buildTempPassword } from "../lib/password";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { sanitizeCpf, isValidCpf } from "../utils/cpf";
import { HttpError } from "../utils/httpError";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10min
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30min
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getRecentFailedAttempts(cpf: string) {
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);
  return prisma.loginAttempt.count({
    where: { cpf, sucesso: false, criadoEm: { gte: since } },
  });
}

async function logAttempt(cpf: string, ip: string, sucesso: boolean, userId?: string) {
  await prisma.loginAttempt.create({ data: { cpf, ip, sucesso, userId } });
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function resolveDesiredUsername(usuario?: string, email?: string): string | null {
  if (usuario && usuario.trim()) return normalizeUsername(usuario);
  if (!email) return null;

  const local = email.split("@")[0]?.trim().toLowerCase() ?? "";
  return local.length >= 3 ? local : null;
}

async function findUserByLoginIdentifier(input: string) {
  const raw = input.trim();
  const cpf = sanitizeCpf(raw);

  if (isValidCpf(cpf)) {
    const user = await prisma.user.findUnique({ where: { cpf } });
    return { user, lockKey: `cpf:${cpf}` };
  }

  const email = raw.toLowerCase();
  if (EMAIL_REGEX.test(email)) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    return { user, lockKey: `email:${email}` };
  }

  const usuario = normalizeUsername(raw);
  if (usuario.length < 3) {
    throw HttpError.badRequest("Usuário inválido");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { usuario: { equals: usuario, mode: "insensitive" } },
        { email: { startsWith: `${usuario}@`, mode: "insensitive" } },
      ],
    },
    orderBy: { criadoEm: "asc" },
  });
  return { user, lockKey: `user:${usuario}` };
}

export async function login(loginInput: string, senha: string, ip: string) {
  const { user, lockKey } = await findUserByLoginIdentifier(loginInput);

  const failed = await getRecentFailedAttempts(lockKey);
  if (failed >= MAX_ATTEMPTS) {
    const minsRestantes = Math.ceil(LOCK_DURATION_MS / 60000);
    throw HttpError.tooMany(
      `Conta bloqueada por excesso de tentativas. Tente novamente em ${minsRestantes} minutos.`,
    );
  }

  if (!user) {
    await logAttempt(lockKey, ip, false);
    throw HttpError.unauthorized("Credenciais incorretas");
  }
  if (!user.ativo) {
    await logAttempt(lockKey, ip, false, user.id);
    throw HttpError.forbidden("Conta inativa. Procure o administrador.");
  }

  const ok = await verifyPassword(senha, user.senhaHash);
  if (!ok) {
    await logAttempt(lockKey, ip, false, user.id);
    throw HttpError.unauthorized("Credenciais incorretas");
  }

  await logAttempt(lockKey, ip, true, user.id);

  const payload = {
    sub: user.id,
    role: user.role,
    nome: user.nome,
    primeiroAcesso: user.primeiroAcesso,
  };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken({ sub: user.id }),
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      role: user.role,
      primeiroAcesso: user.primeiroAcesso,
    },
  };
}

/**
 * 5.1.2: Cliente digita CPF na tela "Primeiro acesso?".
 * Retorna se há cadastro e dá uma DICA da senha (não a senha em si).
 */
export async function checkFirstAccess(cpfInput: string) {
  const cpf = sanitizeCpf(cpfInput);
  if (!isValidCpf(cpf)) throw HttpError.badRequest("CPF inválido");

  const user = await prisma.user.findUnique({
    where: { cpf },
    select: { id: true, primeiroAcesso: true, cpf: true },
  });

  if (!user) {
    return { found: false as const };
  }

  return {
    found: true as const,
    primeiroAcesso: user.primeiroAcesso,
    hint: "Sua senha temporária é: 3 primeiros dígitos do seu CPF + sua data de nascimento sem barras (ex: 123 + 15031990 = 12315031990)",
  };
}

interface RegisterInput {
  nome: string;
  cpf: string;
  celular: string;
  dataNasc: string; // ISO date
  email?: string;
  usuario?: string;
  senha: string;
}

export async function registerParticipante(input: RegisterInput) {
  const cpf = sanitizeCpf(input.cpf);
  if (!isValidCpf(cpf)) throw HttpError.badRequest("CPF inválido");

  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) throw HttpError.conflict("Este CPF já possui cadastro. Tente fazer login.");

  const normalizedEmail = input.email?.trim().toLowerCase();

  if (normalizedEmail) {
    const dup = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (dup) throw HttpError.conflict("E-mail já cadastrado");
  }

  const usuario = resolveDesiredUsername(input.usuario, normalizedEmail);
  if (usuario && usuario.length < 3) {
    throw HttpError.badRequest("Usuário deve ter ao menos 3 caracteres");
  }
  if (usuario) {
    const dupUsuario = await prisma.user.findFirst({
      where: { usuario: { equals: usuario, mode: "insensitive" } },
      select: { id: true },
    });
    if (dupUsuario) throw HttpError.conflict("Usuário já cadastrado");
  }

  const dataNasc = new Date(input.dataNasc);
  if (Number.isNaN(dataNasc.getTime())) throw HttpError.badRequest("Data de nascimento inválida");

  const idade = Math.floor((Date.now() - dataNasc.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (idade < 18 || idade > 100) throw HttpError.badRequest("Idade deve ser entre 18 e 100 anos");

  const senhaHash = await hashPassword(input.senha);

  const user = await prisma.user.create({
    data: {
      nome: input.nome.trim(),
      cpf,
      usuario,
      celular: input.celular.replace(/\D/g, ""),
      dataNasc,
      email: normalizedEmail ?? null,
      senhaHash,
      role: "participante",
      primeiroAcesso: false, // criou senha própria
      ativo: true,
    },
    select: { id: true, nome: true, cpf: true, role: true, primeiroAcesso: true },
  });

  return user;
}

export async function changePassword(userId: string, novaSenha: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw HttpError.notFound("Usuário não encontrado");

  const temp = buildTempPassword(user.cpf, user.dataNasc);
  if (novaSenha === temp) {
    throw HttpError.badRequest("Nova senha não pode ser igual à senha temporária");
  }

  const senhaHash = await hashPassword(novaSenha);
  await prisma.user.update({
    where: { id: userId },
    data: { senhaHash, primeiroAcesso: false },
  });
}

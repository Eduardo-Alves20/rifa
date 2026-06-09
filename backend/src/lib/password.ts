import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Senha temporária do primeiro acesso: 3 primeiros dígitos do CPF + data de nascimento sem barras.
 * Ex: CPF 12345678900, nasc 15/03/1990 → "123" + "15031990" → "12315031990"
 */
export function buildTempPassword(cpf: string, dataNasc: Date): string {
  const cpfDigits = cpf.replace(/\D/g, "");
  const dd = String(dataNasc.getUTCDate()).padStart(2, "0");
  const mm = String(dataNasc.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(dataNasc.getUTCFullYear());
  return `${cpfDigits.slice(0, 3)}${dd}${mm}${yyyy}`;
}

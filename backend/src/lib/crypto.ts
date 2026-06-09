import { randomBytes, randomInt as nodeRandomInt, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

// Base32 sem caracteres ambíguos (sem 0, O, I, 1) — doc 5.3.2
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Gera sufixo aleatório do código de cupom usando CSPRNG.
 * 6 chars no charset de 32 = ~1 trilhão de combinações.
 */
export function generateCouponSuffix(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i] % CHARSET.length];
  }
  return out;
}

/**
 * Gera prefixo (4-5 letras) a partir do nome do sorteio.
 * Ex: "Sorteio de Natal" → "NATAL"
 */
export function generateCouponPrefix(raffleName: string): string {
  const words = raffleName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/\s+/)
    .filter((w) => !["DE", "DA", "DO", "DAS", "DOS", "E", "O", "A"].includes(w));

  const candidate = (words[words.length - 1] ?? words[0] ?? "RIFA").replace(/[^A-Z]/g, "");
  return candidate.slice(0, 5) || "RIFA";
}

/**
 * Gera código completo: PREFIXO-XXXXXX
 */
export function generateCouponCode(raffleName: string): string {
  return `${generateCouponPrefix(raffleName)}-${generateCouponSuffix(6)}`;
}

/**
 * HMAC-SHA256 do código + raffleId — usado na URL do QR Code.
 * Qualquer adulteração invalida a assinatura.
 */
export function signCoupon(codigo: string, raffleId: string): string {
  return createHmac("sha256", env.HMAC_SECRET).update(`${codigo}|${raffleId}`).digest("hex");
}

/**
 * Verifica assinatura HMAC em tempo constante (anti timing-attack).
 */
export function verifyCouponSig(codigo: string, raffleId: string, sig: string): boolean {
  const expected = signCoupon(codigo, raffleId);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}

/**
 * Número aleatório criptograficamente seguro entre [min, max] inclusivo.
 * Doc 5.6.3: usado no sorteio ao vivo.
 */
export function secureRandomInt(min: number, max: number): number {
  return nodeRandomInt(min, max + 1);
}

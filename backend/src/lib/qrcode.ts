import QRCode from "qrcode";
import { env } from "../config/env";
import { signCoupon } from "./crypto";

/**
 * Monta URL de resgate com assinatura HMAC.
 */
export function buildRedeemUrl(codigo: string, raffleId: string): string {
  const sig = signCoupon(codigo, raffleId);
  return `${env.FRONTEND_URL}/resgatar?c=${encodeURIComponent(codigo)}&sig=${sig}`;
}

/**
 * Gera o QR Code do cupom como data-URL PNG.
 */
export async function generateCouponQrDataUrl(codigo: string, raffleId: string): Promise<string> {
  const url = buildRedeemUrl(codigo, raffleId);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#111111", light: "#FFFFFF" },
  });
}

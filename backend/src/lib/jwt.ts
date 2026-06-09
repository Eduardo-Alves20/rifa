import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ISSUER = "sorteiofacil";

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  nome: string;
  primeiroAcesso: boolean;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES)
    .sign(secret);
}

export async function signRefreshToken(payload: Pick<JwtPayload, "sub">): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES)
    .sign(secret);
}

export async function verifyToken<T = JwtPayload>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
  return payload as T;
}

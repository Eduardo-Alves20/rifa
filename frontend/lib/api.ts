// Cliente HTTP simples para a API. Usa /api/* (rewrite no next.config.js)
// para evitar CORS em dev e ler NEXT_PUBLIC_API_URL em prod.

import { getAccessToken, clearAuth, setAuth } from "./auth";

const BASE = "/api";

interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export class ApiException extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, body: ApiError) {
    super(body.error);
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : {};

  if (!res.ok) {
    if (res.status === 401) clearAuth();
    throw new ApiException(res.status, body as ApiError);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: "DELETE" }),
};

// ===== Endpoints tipados =====

export interface User {
  id: string;
  nome: string;
  cpf: string;
  role: "admin" | "colaborador" | "participante";
  primeiroAcesso: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function login(identificador: string, senha: string) {
  const data = await api.post<LoginResponse>(
    "/auth/login",
    { identificador, senha },
    { auth: false },
  );
  setAuth(data.accessToken, data.refreshToken, data.user);
  return data;
}

export async function checkFirstAccess(cpf: string) {
  return api.post<{ found: boolean; primeiroAcesso?: boolean; hint?: string }>(
    "/auth/check-first-access",
    { cpf },
    { auth: false },
  );
}

export async function register(input: {
  nome: string;
  cpf: string;
  celular: string;
  dataNasc: string;
  email?: string;
  senha: string;
}) {
  return api.post<{ user: User }>("/auth/register", input, { auth: false });
}

export async function changePassword(novaSenha: string) {
  return api.post<{ ok: true }>("/auth/change-password", { novaSenha });
}

export async function me() {
  return api.get<{ user: User }>("/auth/me");
}

export interface RaffleLojaRef {
  loja: { id: string; nome: string };
}

export interface Raffle {
  id: string;
  nome: string;
  slug: string;
  premio: string;
  premioValorCentavos?: number | null;
  valorNumeroCentavos?: number | null;
  totalNumeros: number;
  dataHoraSorteio: string;
  prazoResgate: string;
  status: "ativo" | "aguardando_sorteio" | "sorteado" | "cancelado";
  animacao: "tambor" | "caca_niquel";
  imagemUrl?: string | null;
  numeroVencedor?: number;
  ganhador?: { id: string; nome: string; celular: string } | null;
  lojas?: RaffleLojaRef[];
  _count?: { entries: number; coupons: number };
}

export interface Loja {
  id: string;
  nome: string;
  endereco?: string | null;
  ativo: boolean;
  _count?: { colaboradores: number; rafflesLojas: number };
}

export interface RaffleAdminDetail {
  raffle: Raffle;
  stats: {
    totalNumeros: number;
    vendidos: number;
    disponiveis: number;
    percentual: number;
    participantes: number;
    cupons: { total: number; pendente: number; resgatado: number; expirado: number };
    arrecadadoCentavos: number | null;
  };
  ranking: { colaboradorId: string; nome: string; numeros: number; cupons: number }[];
}

export interface NumbersMap {
  totalNumeros: number;
  numeros: {
    numero: number;
    participanteId: string;
    participanteNome: string;
    colaboradorNome: string;
    couponCodigo: string;
    criadoEm: string;
  }[];
}

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  email?: string | null;
  celular?: string;
  ativo: boolean;
  loja?: { id: string; nome: string } | null;
}

export async function listRaffles(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return api.get<{ raffles: Raffle[] }>(`/raffles${qs}`);
}

export async function getPublicRaffle(slug: string) {
  return api.get<{ raffle: Raffle }>(`/raffles/public/${slug}`, { auth: false });
}

export async function generateCoupon(input: {
  raffleId: string;
  participanteCpf: string;
  qtdNumeros: number;
}) {
  return api.post<{
    coupon: { id: string; codigo: string; qtdNumeros: number; raffleId: string };
    qrDataUrl: string;
  }>("/coupons", input);
}

export async function validateCoupon(codigo: string, sig?: string) {
  return api.post<{
    coupon: {
      id: string;
      codigo: string;
      qtdNumeros: number;
      raffleId: string;
      raffle: { id: string; nome: string; slug: string; totalNumeros: number };
    };
  }>("/coupons/validate", { codigo, sig });
}

export async function confirmNumbers(codigo: string, numeros: number[]) {
  return api.post<{ couponId: string; raffleId: string; numeros: number[] }>(
    "/entries/confirm",
    { codigo, numeros },
  );
}

export async function getTakenNumbers(raffleId: string) {
  return api.get<{ taken: number[] }>(`/entries/taken/${raffleId}`, { auth: false });
}

export async function getMyNumbers(raffleId: string) {
  return api.get<{ numeros: number[] }>(`/entries/mine/${raffleId}`);
}

export async function quickRegister(input: {
  nome: string;
  cpf: string;
  celular: string;
  dataNasc: string;
  email?: string;
}) {
  return api.post<{ user: User }>("/users/quick-register", input);
}

export async function findUserByCpf(cpf: string) {
  return api.get<{ user: User & { celular: string; ativo: boolean } }>(`/users/by-cpf/${cpf}`);
}

export async function drawRaffle(id: string) {
  return api.post<{ raffle: Raffle }>(`/raffles/${id}/draw`);
}

export async function endRedemption(id: string) {
  return api.post<{ raffle: Raffle }>(`/raffles/${id}/end-redemption`);
}

export async function cancelRaffle(id: string) {
  return api.post<{ raffle: Raffle }>(`/raffles/${id}/cancel`);
}

export interface CreateRaffleInput {
  nome: string;
  premio: string;
  premioValorCentavos?: number;
  valorNumeroCentavos?: number;
  totalNumeros: number;
  dataHoraSorteio: string; // ISO
  prazoResgate: string; // ISO
  lojaIds: string[];
  imagemUrl?: string;
  animacao: "tambor" | "caca_niquel";
}

export async function createRaffle(input: CreateRaffleInput) {
  return api.post<{ raffle: Raffle }>("/raffles", input);
}

export async function getRaffleAdminDetail(id: string) {
  return api.get<RaffleAdminDetail>(`/raffles/${id}/admin-detail`);
}

export async function getRaffleNumbersMap(id: string) {
  return api.get<NumbersMap>(`/raffles/${id}/numbers-map`);
}

// ===== Lojas =====
export async function listLojas() {
  return api.get<{ lojas: Loja[] }>("/lojas");
}

export async function createLoja(input: { nome: string; endereco?: string }) {
  return api.post<{ loja: Loja }>("/lojas", input);
}

// ===== Usuários / colaboradores =====
export async function listColaboradores() {
  return api.get<{ users: Colaborador[] }>("/users/colaboradores");
}

export async function createColaborador(input: {
  nome: string;
  cpf: string;
  usuario?: string;
  celular: string;
  dataNasc: string;
  email: string;
  lojaId: string;
  senhaInicial: string;
}) {
  return api.post<{ user: Colaborador }>("/users/colaboradores", input);
}

export async function setUserActive(id: string, ativo: boolean) {
  return api.patch<{ user: Colaborador }>(`/users/${id}/active`, { ativo });
}

// Armazenamento simples em localStorage. Em prod considere cookies HttpOnly
// para refresh token (a doc menciona) — manter access em memória/localStorage.

import type { User } from "./api";

const KEY_ACCESS = "sf_access";
const KEY_REFRESH = "sf_refresh";
const KEY_USER = "sf_user";

export function setAuth(access: string, refresh: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_ACCESS, access);
  localStorage.setItem(KEY_REFRESH, refresh);
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_ACCESS);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_USER);
}

export function landingPathForRole(role: User["role"]): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "colaborador":
      return "/colaborador";
    default:
      return "/minha-area";
  }
}

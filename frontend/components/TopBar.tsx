"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { clearAuth, getStoredUser } from "@/lib/auth";
import { useEffect, useState } from "react";

export function TopBar() {
  const router = useRouter();
  const [nome, setNome] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setNome(u?.nome ?? null);
    setRole(u?.role ?? null);
  }, []);

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  const inicial = (nome?.trim()?.[0] ?? "?").toUpperCase();

  const homeHref =
    role === "admin" ? "/admin" : role === "colaborador" ? "/colaborador" : "/minha-area";

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href={homeHref} aria-label="Início">
          <Logo size="sm" />
        </Link>

        <div className="row" style={{ gap: 10 }}>
          {nome ? (
            <span className="user-chip">
              <span className="avatar">{inicial}</span>
              <span className="meta">
                <span className="nm">{nome.split(" ")[0]}</span>
                {role ? <span className="rl">{role}</span> : null}
              </span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="btn btn-ghost"
            style={{ padding: "0 14px", minHeight: 40, fontSize: 13 }}
            aria-label="Sair"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getAccessToken } from "@/lib/auth";
import type { User } from "@/lib/api";

interface AuthGuardProps {
  roles?: User["role"][];
  children: React.ReactNode;
}

/**
 * Guarda client-side. Em produção, considere middleware Next.js para SSR.
 */
export function AuthGuard({ roles, children }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (user.primeiroAcesso) {
      router.replace("/trocar-senha");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router, roles]);

  if (!ready) {
    return (
      <div className="container-narrow">
        <p className="text-text-2 text-center mt-12">Verificando sessão…</p>
      </div>
    );
  }
  return <>{children}</>;
}

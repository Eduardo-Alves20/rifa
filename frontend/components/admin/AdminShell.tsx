"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Visão geral",
    match: (p) => p === "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/sorteios/novo",
    label: "Novo sorteio",
    match: (p) => p.startsWith("/admin/sorteios/novo"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/admin/lojas",
    label: "Lojas",
    match: (p) => p.startsWith("/admin/lojas"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 9l1.5-5h15L21 9M4 9h16v11H4zM9 20v-6h6v6" />
      </svg>
    ),
  },
  {
    href: "/admin/usuarios",
    label: "Usuários",
    match: (p) => p.startsWith("/admin/usuarios"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20a5.5 5.5 0 0111 0M16 6.5a3 3 0 010 6M18 20a5 5 0 00-3-4.6" />
      </svg>
    ),
  },
];

interface AdminShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AdminShell({ title, subtitle, action, children }: AdminShellProps) {
  const path = usePathname();

  return (
    <AuthGuard roles={["admin"]}>
      <TopBar />
      <div className="admin-layout">
        <aside className="admin-nav" aria-label="Navegação do admin">
          {NAV.map((item) => {
            const active = item.match(path);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="ico">{item.icon}</span>
                <span className="lbl">{item.label}</span>
              </Link>
            );
          })}
        </aside>

        <main className="admin-main">
          <div className="page-head fade-up">
            <div style={{ minWidth: 0 }}>
              <h1 className="h1">{title}</h1>
              {subtitle ? (
                <p className="text-text-2 text-sm" style={{ marginTop: 4 }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            {action ? <div className="row" style={{ flexShrink: 0 }}>{action}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

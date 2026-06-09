"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

interface Coupon {
  id: string;
  codigo: string;
  qtdNumeros: number;
  status: "pendente" | "resgatado" | "expirado";
  criadoEm: string;
  raffle: { nome: string };
  participante: { nome: string; cpf: string };
}

export default function ColaboradorDashboard() {
  return (
    <AuthGuard roles={["colaborador", "admin"]}>
      <TopBar />
      <main className="page">
        <div className="page-head fade-up">
          <div>
            <h1 className="h1">Painel do colaborador</h1>
            <p className="text-text-2 text-sm" style={{ marginTop: 4 }}>
              Gere cupons e acompanhe seus resgates.
            </p>
          </div>
          <Link href="/colaborador/gerar" className="btn btn-primary">
            + Gerar cupom
          </Link>
        </div>
        <div className="stack">
          <Metrics />
          <RecentCoupons />
        </div>
      </main>
    </AuthGuard>
  );
}

function Metrics() {
  const [hoje, setHoje] = useState<number | null>(null);
  const [pendentes, setPendentes] = useState<number | null>(null);
  const [resgatados, setResgatados] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const today = await api.get<{ coupons: Coupon[] }>("/coupons/mine?filter=hoje");
        setHoje(today.coupons.length);
        const all = await api.get<{ coupons: Coupon[] }>("/coupons/mine?filter=todos");
        setPendentes(all.coupons.filter((c) => c.status === "pendente").length);
        setResgatados(all.coupons.filter((c) => c.status === "resgatado").length);
      } catch {
        setHoje(0);
        setPendentes(0);
        setResgatados(0);
      }
    })();
  }, []);

  const fmt = (n: number | null) => (n === null ? "—" : n);

  return (
    <div className="metrics-grid fade-up">
      <div className="metric">
        <div className="mic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 3l-4 4-4-4" />
          </svg>
        </div>
        <div className="mlabel">Cupons hoje</div>
        <div className="mvalue gold">{fmt(hoje)}</div>
      </div>
      <div className="metric">
        <div className="mic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="mlabel">Pendentes</div>
        <div className="mvalue">{fmt(pendentes)}</div>
      </div>
      <div className="metric">
        <div className="mic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </div>
        <div className="mlabel">Resgatados</div>
        <div className="mvalue">{fmt(resgatados)}</div>
      </div>
      <div className="metric">
        <div className="mic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M23 6l-9.5 9.5-5-5L1 18" />
            <path d="M17 6h6v6" />
          </svg>
        </div>
        <div className="mlabel">Total</div>
        <div className="mvalue">
          {pendentes !== null && resgatados !== null ? pendentes + resgatados : "—"}
        </div>
      </div>
    </div>
  );
}

function RecentCoupons() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [filter, setFilter] = useState<"hoje" | "7dias" | "todos">("hoje");

  useEffect(() => {
    setCoupons(null);
    (async () => {
      try {
        const r = await api.get<{ coupons: Coupon[] }>(`/coupons/mine?filter=${filter}`);
        setCoupons(r.coupons);
      } catch {
        setCoupons([]);
      }
    })();
  }, [filter]);

  return (
    <Card className="fade-up">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h2 className="h2">Meus cupons</h2>
        <div className="segmented">
          {(["hoje", "7dias", "todos"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "hoje" ? "Hoje" : f === "7dias" ? "7 dias" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {!coupons ? (
        <div className="stack-sm">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 40 }} />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-text-2 text-sm" style={{ padding: "16px 0" }}>
          Nenhum cupom no período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Sorteio</th>
                <th>Qtd</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-yellow">{c.codigo}</td>
                  <td>{c.participante.nome}</td>
                  <td>{c.raffle.nome}</td>
                  <td>{c.qtdNumeros}</td>
                  <td>
                    {c.status === "resgatado" ? (
                      <Badge variant="green">Resgatado</Badge>
                    ) : c.status === "expirado" ? (
                      <Badge variant="red">Expirado</Badge>
                    ) : (
                      <Badge variant="yellow">Pendente</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

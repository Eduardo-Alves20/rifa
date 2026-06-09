"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listRaffles, type Raffle } from "@/lib/api";
import { formatBRL, formatDateTime } from "@/lib/format";

export default function AdminDashboard() {
  return (
    <AdminShell
      title="Visão geral"
      subtitle="Acompanhe vendas e financeiro dos sorteios."
      action={
        <Link href="/admin/sorteios/novo" className="btn btn-primary">
          + Novo sorteio
        </Link>
      }
    >
      <RaffleOverview />
    </AdminShell>
  );
}

function RaffleOverview() {
  const [raffles, setRaffles] = useState<Raffle[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await listRaffles();
        setRaffles(r.raffles);
      } catch {
        setRaffles([]);
      }
    })();
  }, []);

  if (!raffles) {
    return (
      <div className="stack-sm">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 130, borderRadius: 14 }} />
        ))}
      </div>
    );
  }

  if (raffles.length === 0) {
    return (
      <Card className="fade-up" style={{ textAlign: "center", padding: "44px 24px" }}>
        <div style={{ fontSize: 42 }}>🎟️</div>
        <h2 className="h2" style={{ marginTop: 10 }}>
          Nenhum sorteio ainda
        </h2>
        <p className="text-text-2 text-sm" style={{ marginTop: 6, marginBottom: 18 }}>
          Crie seu primeiro sorteio para começar a distribuir cupons.
        </p>
        <Link href="/admin/sorteios/novo" className="btn btn-primary btn-lg">
          Criar primeiro sorteio
        </Link>
      </Card>
    );
  }

  const vendidosTotal = raffles.reduce((s, r) => s + (r._count?.entries ?? 0), 0);
  const arrecadadoTotal = raffles.reduce(
    (s, r) => s + (r.valorNumeroCentavos ? (r._count?.entries ?? 0) * r.valorNumeroCentavos : 0),
    0,
  );
  const ativos = raffles.filter((r) => r.status === "ativo").length;

  return (
    <div className="stack">
      <div className="metrics-grid fade-up">
        <Metric label="Sorteios" value={raffles.length} />
        <Metric label="Ativos" value={ativos} gold />
        <Metric label="Números vendidos" value={vendidosTotal.toLocaleString("pt-BR")} />
        <Metric label="Arrecadado" value={formatBRL(arrecadadoTotal)} />
      </div>

      <div className="stack-sm stagger">
        {raffles.map((r) => (
          <RaffleCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

function RaffleCard({ r }: { r: Raffle }) {
  const vendidos = r._count?.entries ?? 0;
  const pct = r.totalNumeros > 0 ? Math.round((vendidos / r.totalNumeros) * 100) : 0;
  const arrecadado = r.valorNumeroCentavos ? vendidos * r.valorNumeroCentavos : null;

  return (
    <Link href={`/admin/sorteios/${r.id}`} style={{ display: "block" }}>
      <Card className="card-hover">
        <div className="list-row" style={{ alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 10 }}>
              <h2 className="h2" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.nome}
              </h2>
              <StatusBadge status={r.status} />
            </div>
            <div className="text-sm text-text-2" style={{ marginTop: 4 }}>
              {r.premio}
            </div>
          </div>
          <span className="btn btn-ghost" style={{ flexShrink: 0, pointerEvents: "none" }}>
            Detalhes →
          </span>
        </div>

        <div className="progress">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="row-between" style={{ marginTop: 8, fontSize: 13 }}>
          <span className="text-text-2">
            <b style={{ color: "var(--c-text)" }}>{vendidos}</b> / {r.totalNumeros} números · {pct}%
          </span>
          <span className="text-text-2">
            Arrecadado: <b style={{ color: "var(--c-yellow)" }}>{formatBRL(arrecadado)}</b>
          </span>
        </div>
        <div className="text-xs text-text-3" style={{ marginTop: 8 }}>
          Sorteio em {formatDateTime(r.dataHoraSorteio)}
        </div>
      </Card>
    </Link>
  );
}

function Metric({ label, value, gold }: { label: string; value: string | number; gold?: boolean }) {
  return (
    <div className="metric">
      <div className="mlabel">{label}</div>
      <div className={`mvalue ${gold ? "gold" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Raffle["status"] }) {
  if (status === "ativo") return <Badge variant="green">Ativo</Badge>;
  if (status === "sorteado") return <Badge variant="yellow">Sorteado</Badge>;
  if (status === "aguardando_sorteio") return <Badge variant="yellow">Aguardando</Badge>;
  return <Badge variant="red">Cancelado</Badge>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  getRaffleAdminDetail,
  getRaffleNumbersMap,
  endRedemption,
  cancelRaffle,
  type RaffleAdminDetail,
  type NumbersMap,
} from "@/lib/api";
import { formatBRL, formatDateTime } from "@/lib/format";

interface PageProps {
  params: { id: string };
}

export default function RaffleDetailPage({ params }: PageProps) {
  const [detail, setDetail] = useState<RaffleAdminDetail | null>(null);
  const [map, setMap] = useState<NumbersMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [d, m] = await Promise.all([
        getRaffleAdminDetail(params.id),
        getRaffleNumbersMap(params.id),
      ]);
      setDetail(d);
      setMap(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar sorteio");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function onEnd() {
    if (!detail) return;
    if (!confirm("Encerrar resgates agora? Novos cupons não serão aceitos.")) return;
    setBusy(true);
    try {
      await endRedemption(detail.raffle.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!detail) return;
    if (!confirm("Cancelar este sorteio? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    try {
      await cancelRaffle(detail.raffle.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <AdminShell title="Sorteio">
        <Alert variant="error">{error}</Alert>
        <Link href="/admin" className="btn btn-ghost" style={{ marginTop: 14 }}>
          ← Voltar
        </Link>
      </AdminShell>
    );
  }

  if (!detail || !map) {
    return (
      <AdminShell title="Carregando…">
        <div className="stack">
          <div className="metrics-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 78, borderRadius: 14 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 220, borderRadius: 14 }} />
        </div>
      </AdminShell>
    );
  }

  const { raffle, stats, ranking } = detail;

  return (
    <AdminShell
      title={raffle.nome}
      subtitle={raffle.premio}
      action={
        <Link href={`/sorteio/${raffle.slug}/ao-vivo`} className="btn btn-ghost">
          Ver ao vivo →
        </Link>
      }
    >
      <div className="stack">
        <div className="row" style={{ gap: 8 }}>
          <StatusBadge status={raffle.status} />
          <span className="text-xs text-text-3">Sorteio em {formatDateTime(raffle.dataHoraSorteio)}</span>
        </div>

        {/* Stats */}
        <div className="metrics-grid fade-up">
          <div className="stat">
            <div className="sl">Vendidos</div>
            <div className="sv gold">
              {stats.vendidos}
              <span style={{ fontSize: 14, color: "var(--c-text3)", fontWeight: 600 }}>
                {" "}/ {stats.totalNumeros}
              </span>
            </div>
          </div>
          <div className="stat">
            <div className="sl">Disponíveis</div>
            <div className="sv">{stats.disponiveis}</div>
          </div>
          <div className="stat">
            <div className="sl">Participantes</div>
            <div className="sv">{stats.participantes}</div>
          </div>
          <div className="stat">
            <div className="sl">Arrecadado</div>
            <div className="sv green">{formatBRL(stats.arrecadadoCentavos)}</div>
          </div>
        </div>

        <Card className="fade-up">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="label">Progresso de vendas</span>
            <span className="text-sm" style={{ fontWeight: 700, color: "var(--c-yellow)" }}>
              {stats.percentual}%
            </span>
          </div>
          <div className="progress" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${stats.percentual}%` }} />
          </div>
        </Card>

        <div className="grid-2">
          {/* Funil de cupons */}
          <Card className="fade-up">
            <h2 className="h2" style={{ marginBottom: 14 }}>
              Cupons
            </h2>
            <div className="funnel">
              <FunnelRow label="Total" value={stats.cupons.total} max={stats.cupons.total} color="var(--grad-gold)" />
              <FunnelRow label="Resgatados" value={stats.cupons.resgatado} max={stats.cupons.total} color="var(--c-green)" />
              <FunnelRow label="Pendentes" value={stats.cupons.pendente} max={stats.cupons.total} color="var(--c-yellow)" />
              <FunnelRow label="Expirados" value={stats.cupons.expirado} max={stats.cupons.total} color="var(--c-red)" />
            </div>
          </Card>

          {/* Ranking */}
          <Card className="fade-up">
            <h2 className="h2" style={{ marginBottom: 6 }}>
              Ranking de colaboradores
            </h2>
            {ranking.length === 0 ? (
              <p className="text-text-2 text-sm" style={{ padding: "10px 0" }}>
                Nenhuma venda registrada ainda.
              </p>
            ) : (
              <div>
                {ranking.slice(0, 8).map((r, i) => (
                  <div className="rank-row" key={r.colaboradorId}>
                    <span className="rank-pos">{i + 1}</span>
                    <span className="rank-name">{r.nome}</span>
                    <span className="text-xs text-text-3">{r.cupons} cupons</span>
                    <span className="rank-val">{r.numeros} nº</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Mapa de números */}
        <NumbersMapView map={map} />

        {/* Participantes */}
        <ParticipantsView map={map} />

        {/* Ações */}
        <Card className="fade-up">
          <h2 className="h2" style={{ marginBottom: 12 }}>
            Ações
          </h2>
          <div className="row" style={{ gap: 10 }}>
            <Link href={`/sorteio/${raffle.slug}/ao-vivo`} className="btn btn-primary">
              Abrir tela de sorteio
            </Link>
            {raffle.status === "ativo" ? (
              <Button variant="ghost" onClick={onEnd} loading={busy}>
                Encerrar resgates
              </Button>
            ) : null}
            {raffle.status !== "sorteado" && raffle.status !== "cancelado" ? (
              <Button variant="danger" onClick={onCancel} loading={busy}>
                Cancelar sorteio
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-text-3" style={{ marginTop: 10 }}>
            O sorteio em si é feito na tela ao vivo. As escolhas de números são somente leitura aqui.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="funnel-row">
      <span className="fl">{label}</span>
      <span className="ftrack">
        <span className="ffill" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="fv">{value}</span>
    </div>
  );
}

function NumbersMapView({ map }: { map: NumbersMap }) {
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState<NumbersMap["numeros"][number] | null>(null);

  const filtered = useMemo(() => {
    if (!filter.trim()) return map.numeros;
    const q = filter.replace(/\D/g, "");
    return map.numeros.filter(
      (n) =>
        String(n.numero).includes(q) ||
        n.participanteNome.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [filter, map.numeros]);

  return (
    <Card className="fade-up">
      <div className="row-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="h2">Mapa de números</h2>
          <p className="text-xs text-text-3" style={{ marginTop: 2 }}>
            {map.numeros.length} vendidos · toque num número para ver quem escolheu
          </p>
        </div>
        <div style={{ width: 200, maxWidth: "100%" }}>
          <Input
            placeholder="Buscar número ou nome…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {map.numeros.length === 0 ? (
        <p className="text-text-2 text-sm">Nenhum número vendido ainda.</p>
      ) : (
        <>
          <div className="nmap">
            {filtered.map((n) => (
              <button
                key={n.numero}
                type="button"
                className={`nmap-cell ${sel?.numero === n.numero ? "sel" : ""}`}
                onClick={() => setSel(sel?.numero === n.numero ? null : n)}
                title={n.participanteNome}
              >
                {n.numero}
              </button>
            ))}
          </div>

          {sel ? (
            <div className="nmap-detail fade-up">
              <div className="row-between">
                <span className="label">Número</span>
                <span style={{ fontWeight: 800, color: "var(--c-yellow)", fontSize: 18 }}>{sel.numero}</span>
              </div>
              <div className="divider" />
              <Field label="Participante" value={sel.participanteNome} />
              <Field label="Vendido por" value={sel.colaboradorNome} />
              <Field label="Cupom" value={sel.couponCodigo} mono />
              <Field label="Escolhido em" value={formatDateTime(sel.criadoEm)} />
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="row-between" style={{ padding: "5px 0" }}>
      <span className="text-text-2 text-sm">{label}</span>
      <span className={`text-sm ${mono ? "font-mono text-yellow" : ""}`} style={{ fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function ParticipantsView({ map }: { map: NumbersMap }) {
  const participants = useMemo(() => {
    const m = new Map<string, { nome: string; numeros: number[] }>();
    for (const n of map.numeros) {
      const cur = m.get(n.participanteId) ?? { nome: n.participanteNome, numeros: [] };
      cur.numeros.push(n.numero);
      m.set(n.participanteId, cur);
    }
    return [...m.values()].sort((a, b) => b.numeros.length - a.numeros.length);
  }, [map.numeros]);

  if (participants.length === 0) return null;

  return (
    <Card className="fade-up">
      <h2 className="h2" style={{ marginBottom: 10 }}>
        Participantes ({participants.length})
      </h2>
      <div>
        {participants.slice(0, 30).map((p, i) => (
          <div className="rank-row" key={i}>
            <span className="rank-name">{p.nome}</span>
            <span className="text-xs text-text-3" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
              {p.numeros.slice(0, 12).sort((a, b) => a - b).join(", ")}
              {p.numeros.length > 12 ? "…" : ""}
            </span>
            <span className="rank-val">{p.numeros.length} nº</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: RaffleAdminDetail["raffle"]["status"] }) {
  if (status === "ativo") return <Badge variant="green">Ativo</Badge>;
  if (status === "sorteado") return <Badge variant="yellow">Sorteado</Badge>;
  if (status === "aguardando_sorteio") return <Badge variant="yellow">Aguardando sorteio</Badge>;
  return <Badge variant="red">Cancelado</Badge>;
}

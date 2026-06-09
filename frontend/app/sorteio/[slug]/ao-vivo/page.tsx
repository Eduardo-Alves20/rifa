"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getPublicRaffle, drawRaffle, endRedemption, type Raffle } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

interface PageProps {
  params: { slug: string };
}

export default function SorteioAoVivoPage({ params }: PageProps) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);

  const isAdmin = typeof window !== "undefined" && getStoredUser()?.role === "admin";

  useEffect(() => {
    async function load() {
      try {
        const r = await getPublicRaffle(params.slug);
        setRaffle(r.raffle);
        if (r.raffle.numeroVencedor) setRevealed(r.raffle.numeroVencedor);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Sorteio não encontrado");
      }
    }
    load();
    const intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, [params.slug]);

  async function onEndRedemption() {
    if (!raffle) return;
    if (!confirm("Encerrar resgates agora? Após isso, novos cupons não serão aceitos.")) return;
    try {
      const r = await endRedemption(raffle.id);
      setRaffle(r.raffle);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha");
    }
  }

  async function onDraw() {
    if (!raffle) return;
    if (!confirm("Sortear agora? Esta ação é IRREVERSÍVEL.")) return;
    setDrawing(true);
    try {
      const r = await drawRaffle(raffle.id);
      setTimeout(() => {
        setRaffle(r.raffle);
        setRevealed(r.raffle.numeroVencedor ?? null);
        setDrawing(false);
      }, 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao sortear");
      setDrawing(false);
    }
  }

  const ambiance = (
    <div className="bg-fx" aria-hidden>
      <div className="glow glow-1" />
      <div className="glow glow-2" />
      <div className="grid-lines" />
    </div>
  );

  if (loadError) {
    return (
      <>
        {ambiance}
        <div className="reveal-stage">
          <p className="text-text-2">{loadError}</p>
        </div>
      </>
    );
  }

  if (!raffle) {
    return (
      <>
        {ambiance}
        <div className="reveal-stage">
          <div className="skeleton" style={{ width: 220, height: 64, borderRadius: 14 }} />
        </div>
      </>
    );
  }

  const padLen = String(raffle.totalNumeros).length;
  const isWinner = revealed !== null && raffle.status === "sorteado";

  return (
    <>
      {ambiance}
      <div className="reveal-stage">
        <div className="stack" style={{ maxWidth: 720, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Logo size="lg" />
          </div>

          <div className="fade-up">
            <span className="badge badge-yellow">
              {raffle.status === "ativo"
                ? "Resgates abertos"
                : raffle.status === "aguardando_sorteio"
                  ? "Pronto para sortear"
                  : "Resultado"}
            </span>
            <h1 className="h1" style={{ marginTop: 12, fontSize: 30 }}>
              {raffle.nome}
            </h1>
            <p className="text-text-2" style={{ marginTop: 4 }}>
              {raffle.premio}
            </p>
          </div>

          {raffle.status === "ativo" ? (
            <Alert variant="info">
              Aguardando encerramento dos resgates. Sorteio em{" "}
              {new Date(raffle.dataHoraSorteio).toLocaleString("pt-BR")}.
            </Alert>
          ) : null}

          {raffle.status === "aguardando_sorteio" && !drawing && !revealed ? (
            <Alert variant="info">Tudo pronto! Aguardando o início do sorteio.</Alert>
          ) : null}

          {drawing ? (
            <div style={{ padding: "24px 0" }}>
              <DrawAnimation animacao={raffle.animacao} slots={padLen} />
              <p className="label" style={{ marginTop: 18 }}>
                Sorteando…
              </p>
            </div>
          ) : null}

          {isWinner ? (
            <div className="stack" style={{ padding: "12px 0" }}>
              <div className="label">Número sorteado</div>
              <div className="reveal-number">{String(revealed).padStart(padLen, "0")}</div>
              {raffle.ganhador ? (
                <div className="winner-card fade-up" style={{ margin: "8px auto 0", maxWidth: 360 }}>
                  <div className="label">🏆 Ganhador</div>
                  <p className="h2" style={{ marginTop: 6 }}>
                    {raffle.ganhador.nome}
                  </p>
                  <p className="text-text-2 text-sm">{raffle.ganhador.celular}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {isAdmin && raffle.status === "ativo" ? (
            <Button variant="ghost" onClick={onEndRedemption}>
              Encerrar resgates
            </Button>
          ) : null}

          {isAdmin && raffle.status === "aguardando_sorteio" && !revealed ? (
            <Button onClick={onDraw} loading={drawing} className="btn-lg">
              🎲 Sortear agora
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DrawAnimation({ animacao, slots }: { animacao: "tambor" | "caca_niquel"; slots: number }) {
  const count = animacao === "tambor" ? Math.min(slots, 4) : 3;
  return (
    <div className="row" style={{ justifyContent: "center", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="slot-box" style={{ animationDelay: `${i * 140}ms` }}>
          {animacao === "tambor" ? "●" : "?"}
        </span>
      ))}
    </div>
  );
}

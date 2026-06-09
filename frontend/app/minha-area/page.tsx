"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { listRaffles, type Raffle } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

export default function MinhaArea() {
  return (
    <AuthGuard roles={["participante", "colaborador", "admin"]}>
      <TopBar />
      <main className="page">
        <Welcome />
        <div className="stack" style={{ marginTop: 18 }}>
          <RedeemCard />
          <ActiveRaffles />
        </div>
      </main>
    </AuthGuard>
  );
}

function Welcome() {
  const [nome, setNome] = useState<string | null>(null);
  useEffect(() => setNome(getStoredUser()?.nome ?? null), []);
  return (
    <div className="fade-up">
      <h1 className="h1">Olá{nome ? `, ${nome.split(" ")[0]}` : ""} 👋</h1>
      <p className="text-text-2 text-sm" style={{ marginTop: 4 }}>
        Resgate cupons e acompanhe seus sorteios.
      </p>
    </div>
  );
}

function RedeemCard() {
  return (
    <Card
      className="fade-up"
      style={{
        background:
          "radial-gradient(120% 140% at 100% -20%, rgba(245,197,24,0.14), transparent 55%), linear-gradient(180deg, #1b1b1b, #141414)",
        borderColor: "var(--c-border2)",
      }}
    >
      <div className="list-row" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <span className="badge badge-yellow">Cupom em mãos?</span>
          <h2 className="h2" style={{ marginTop: 10 }}>
            Resgate e escolha seus números
          </h2>
          <p className="text-text-2 text-sm" style={{ marginTop: 6 }}>
            Digite o código ou escaneie o QR Code do seu cupom.
          </p>
        </div>
        <Link href="/resgatar" className="btn btn-primary btn-lg">
          Resgatar cupom →
        </Link>
      </div>
    </Card>
  );
}

function ActiveRaffles() {
  const [raffles, setRaffles] = useState<Raffle[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await listRaffles("ativo");
        setRaffles(r.raffles);
      } catch {
        setRaffles([]);
      }
    })();
  }, []);

  return (
    <div className="fade-up">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 className="h2">Sorteios ativos</h2>
      </div>

      {!raffles ? (
        <div className="carousel">
          {[0, 1, 2].map((i) => (
            <div key={i} className="carousel-item skeleton" style={{ width: 260, height: 180 }} />
          ))}
        </div>
      ) : raffles.length === 0 ? (
        <Card>
          <p className="text-text-2 text-sm">Nenhum sorteio ativo no momento. Volte em breve!</p>
        </Card>
      ) : (
        <div className="carousel">
          {raffles.map((r) => (
            <div className="carousel-item" key={r.id} style={{ width: 268 }}>
              <Card className="card-hover" style={{ height: "100%" }}>
                <div
                  className="prize"
                  style={{ margin: 0, marginBottom: 12, padding: "18px 14px" }}
                >
                  <div className="emoji" style={{ fontSize: 34 }}>
                    🎁
                  </div>
                  <div className="pname" style={{ fontSize: 16 }}>
                    {r.premio}
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{r.nome}</h3>
                <div className="text-xs text-text-3" style={{ marginTop: 6 }}>
                  {r.totalNumeros} números · {new Date(r.dataHoraSorteio).toLocaleDateString("pt-BR")}
                </div>
                <Link
                  href={`/sorteio/${r.slug}/ao-vivo`}
                  className="btn btn-ghost btn-block"
                  style={{ marginTop: 12 }}
                >
                  Ver ao vivo
                </Link>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

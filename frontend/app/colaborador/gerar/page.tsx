"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { listRaffles, generateCoupon, type Raffle } from "@/lib/api";
import { maskCpf, unmaskCpf, isValidCpf } from "@/lib/cpf";

export default function GerarCupomPage() {
  return (
    <AuthGuard roles={["colaborador", "admin"]}>
      <TopBar />
      <main className="container-narrow stack">
        <h1 className="h1">Gerar cupom</h1>
        <GerarForm />
      </main>
    </AuthGuard>
  );
}

function GerarForm() {
  const [raffles, setRaffles] = useState<Raffle[] | null>(null);
  const [raffleId, setRaffleId] = useState("");
  const [cpf, setCpf] = useState("");
  const [qtd, setQtd] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<{ codigo: string; qrDataUrl: string; qtdNumeros: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await listRaffles("ativo");
        setRaffles(r.raffles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar sorteios");
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!raffleId) return setError("Selecione um sorteio");
    if (!isValidCpf(cpf)) return setError("CPF inválido");
    if (qtd < 1) return setError("Quantidade deve ser >= 1");

    setLoading(true);
    try {
      const res = await generateCoupon({
        raffleId,
        participanteCpf: unmaskCpf(cpf),
        qtdNumeros: qtd,
      });
      setGenerated({ codigo: res.coupon.codigo, qrDataUrl: res.qrDataUrl, qtdNumeros: res.coupon.qtdNumeros });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar cupom");
    } finally {
      setLoading(false);
    }
  }

  if (generated) {
    return (
      <Card>
        <div className="text-center stack">
          <span className="badge badge-green">Cupom gerado</span>
          <div className="code-cupom">{generated.codigo}</div>
          <div className="text-sm text-text-2">{generated.qtdNumeros} número(s) para escolher</div>
          <div className="qr-frame mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generated.qrDataUrl} alt="QR Code do cupom" width={220} height={220} />
          </div>
          <div className="row" style={{ justifyContent: "center" }}>
            <Button onClick={() => window.print()} variant="ghost">
              Imprimir
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Seu cupom SorteioFácil: ${generated.codigo}. Escaneie o QR Code para resgatar.`,
              )}`}
              className="btn btn-ghost"
              target="_blank"
              rel="noreferrer"
            >
              Enviar WhatsApp
            </a>
            <Button onClick={() => setGenerated(null)}>Nova venda</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <form onSubmit={onSubmit} className="stack-sm">
        <div className="field">
          <label className="field-label" htmlFor="raffleId">Sorteio</label>
          <select
            id="raffleId"
            className="input"
            value={raffleId}
            onChange={(e) => setRaffleId(e.target.value)}
            required
          >
            <option value="">Selecione…</option>
            {raffles?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome} — {r.totalNumeros} números
              </option>
            ))}
          </select>
          {!raffles ? <span className="field-hint">Carregando sorteios…</span> : null}
        </div>

        <Input
          label="CPF do cliente"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          maxLength={14}
          required
        />

        <Input
          label="Quantidade de números"
          type="number"
          min={1}
          max={1000}
          value={qtd}
          onChange={(e) => setQtd(Number(e.target.value) || 1)}
          required
        />

        <Button type="submit" block loading={loading}>
          Gerar cupom
        </Button>

        <Link href="/colaborador" className="btn btn-ghost btn-block">
          Voltar
        </Link>
      </form>
    </>
  );
}

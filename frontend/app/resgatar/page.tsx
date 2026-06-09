"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { NumbersGrid } from "@/components/grid/NumbersGrid";
import { validateCoupon, confirmNumbers, getTakenNumbers } from "@/lib/api";

export default function ResgatarPage() {
  return (
    <AuthGuard roles={["participante", "colaborador", "admin"]}>
      <TopBar />
      <main className="page stack">
        <div className="fade-up">
          <h1 className="h1">Resgatar cupom</h1>
          <p className="text-text-2 text-sm" style={{ marginTop: 4 }}>
            Valide seu cupom e escolha os números da sorte.
          </p>
        </div>
        <Suspense fallback={<p className="text-text-2">Carregando…</p>}>
          <ResgateFlow />
        </Suspense>
      </main>
    </AuthGuard>
  );
}

function ResgateFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const initialCode = params.get("c") ?? "";
  const sig = params.get("sig") ?? undefined;

  const [codigo, setCodigo] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState<{
    codigo: string;
    qtdNumeros: number;
    raffleId: string;
    raffle: { id: string; nome: string; totalNumeros: number };
  } | null>(null);

  // Se veio do QR Code, valida automaticamente
  useEffect(() => {
    if (initialCode) {
      void doValidate(initialCode, sig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doValidate(code: string, signature?: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await validateCoupon(code.trim().toUpperCase(), signature);
      setCoupon(res.coupon);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao validar cupom");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    await doValidate(codigo);
  }

  if (coupon) {
    return (
      <Selector
        coupon={coupon}
        onSuccess={() => router.replace("/minha-area")}
      />
    );
  }

  return (
    <Card>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <form onSubmit={onSubmit} className="stack-sm">
        <Input
          label="Código do cupom"
          placeholder="EX: NATAL-K7P2MX"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          required
          autoFocus
        />
        <Button type="submit" block loading={loading}>
          Validar
        </Button>
      </form>
    </Card>
  );
}

interface SelectorProps {
  coupon: {
    codigo: string;
    qtdNumeros: number;
    raffle: { id: string; nome: string; totalNumeros: number };
  };
  onSuccess: () => void;
}

function Selector({ coupon, onSuccess }: SelectorProps) {
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number[] | null>(null);

  useEffect(() => {
    (async () => {
      const r = await getTakenNumbers(coupon.raffle.id);
      setTaken(new Set(r.taken));
    })();
  }, [coupon.raffle.id]);

  function toggle(n: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function confirm() {
    setError(null);
    if (selected.size !== coupon.qtdNumeros) {
      setError(`Selecione exatamente ${coupon.qtdNumeros} número(s)`);
      return;
    }
    setLoading(true);
    try {
      const res = await confirmNumbers(coupon.codigo, [...selected]);
      setSuccess(res.numeros);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar");
      // Atualiza ocupados caso alguém tenha pego um número
      const r = await getTakenNumbers(coupon.raffle.id);
      setTaken(new Set(r.taken));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <div className="text-center stack">
          <span className="badge badge-green">Resgatado!</span>
          <h2 className="h2">{coupon.raffle.nome}</h2>
          <p className="text-text-2 text-sm">Seus números:</p>
          <div className="row" style={{ justifyContent: "center" }}>
            {success.map((n) => (
              <span key={n} className="num-mine" style={{ padding: "8px 14px", borderRadius: 8 }}>
                {n}
              </span>
            ))}
          </div>
          <Button onClick={onSuccess} block>
            Ver minha área
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="stack">
      <Card>
        <div className="row-between">
          <div>
            <div className="label">Sorteio</div>
            <h2 className="h2 mt-1">{coupon.raffle.nome}</h2>
          </div>
          <span className="badge badge-yellow">
            {selected.size} de {coupon.qtdNumeros}
          </span>
        </div>
        <div className="mt-3">
          <Input
            placeholder="Buscar número…"
            inputMode="numeric"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </Card>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <NumbersGrid
        total={coupon.raffle.totalNumeros}
        taken={taken}
        mine={new Set()}
        selected={selected}
        maxSelectable={coupon.qtdNumeros}
        onToggle={toggle}
        filter={filter}
      />

      <div className="selection-bar">
        <span className="text-sm text-text-2">
          {selected.size}/{coupon.qtdNumeros} selecionado(s)
        </span>
        <Button onClick={confirm} loading={loading} disabled={selected.size !== coupon.qtdNumeros}>
          Confirmar
        </Button>
      </div>
    </div>
  );
}

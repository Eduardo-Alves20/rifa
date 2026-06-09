"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createRaffle, listLojas, type Loja } from "@/lib/api";
import { compressImage } from "@/lib/image";

export default function NovoSorteioPage() {
  return (
    <AdminShell title="Novo sorteio" subtitle="Configure o sorteio, a foto e as lojas participantes.">
      <Form />
    </AdminShell>
  );
}

const reaisToCentavos = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
};

function Form() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [lojas, setLojas] = useState<Loja[] | null>(null);
  const [form, setForm] = useState({
    nome: "",
    premio: "",
    premioValor: "",
    valorNumero: "",
    totalNumeros: 100,
    dataHoraSorteio: "",
    prazoResgate: "",
    animacao: "tambor" as "tambor" | "caca_niquel",
  });
  const [lojaIds, setLojaIds] = useState<string[]>([]);
  const [imagem, setImagem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await listLojas();
        setLojas(r.lojas);
      } catch {
        setLojas([]);
      }
    })();
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function toggleLoja(id: string) {
    setLojaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setImagem(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao processar imagem");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.nome.trim().length < 3) return setError("Nome deve ter ao menos 3 caracteres");
    if (!form.premio.trim()) return setError("Informe o prêmio");
    if (lojaIds.length === 0) return setError("Selecione ao menos uma loja participante");
    if (!form.dataHoraSorteio) return setError("Informe a data do sorteio");
    if (!form.prazoResgate) return setError("Informe o prazo de resgate");

    setLoading(true);
    try {
      const res = await createRaffle({
        nome: form.nome.trim(),
        premio: form.premio.trim(),
        premioValorCentavos: reaisToCentavos(form.premioValor),
        valorNumeroCentavos: reaisToCentavos(form.valorNumero),
        totalNumeros: Number(form.totalNumeros),
        dataHoraSorteio: new Date(form.dataHoraSorteio).toISOString(),
        prazoResgate: new Date(form.prazoResgate).toISOString(),
        animacao: form.animacao,
        lojaIds,
        imagemUrl: imagem ?? undefined,
      });
      router.replace(`/admin/sorteios/${res.raffle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar sorteio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ maxWidth: 640 }}>
      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* Foto */}
      <Card>
        <label className="field-label" style={{ marginBottom: 10, display: "block" }}>
          Foto do prêmio
        </label>
        {imagem ? (
          <div className="photo-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagem} alt="Prévia do prêmio" />
            <button type="button" className="rm" onClick={() => setImagem(null)}>
              Remover
            </button>
          </div>
        ) : (
          <div className="photo-drop" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} />
            <div style={{ fontSize: 30, marginBottom: 6 }}>📷</div>
            <div style={{ fontWeight: 600, color: "var(--c-text)" }}>Enviar foto real do prêmio</div>
            <div className="text-xs text-text-3" style={{ marginTop: 4 }}>
              JPG ou PNG · a imagem é otimizada automaticamente
            </div>
          </div>
        )}
      </Card>

      <Card className="stack-sm">
        <Input label="Nome do sorteio" value={form.nome} onChange={(e) => set("nome", e.target.value)} required maxLength={60} />
        <Input label="Prêmio" value={form.premio} onChange={(e) => set("premio", e.target.value)} required maxLength={120} placeholder="Ex: iPhone 16 Pro 256GB" />
        <div className="grid-2">
          <Input
            label="Valor do prêmio (R$)"
            inputMode="decimal"
            placeholder="5000,00"
            value={form.premioValor}
            onChange={(e) => set("premioValor", e.target.value)}
            hint="Opcional"
          />
          <Input
            label="Valor por número (R$)"
            inputMode="decimal"
            placeholder="10,00"
            value={form.valorNumero}
            onChange={(e) => set("valorNumero", e.target.value)}
            hint="Usado no financeiro"
          />
        </div>
        <Input
          label="Total de números"
          type="number"
          min={10}
          max={10000}
          value={form.totalNumeros}
          onChange={(e) => set("totalNumeros", Number(e.target.value))}
          required
        />
        <div className="grid-2">
          <Input
            label="Data e hora do sorteio"
            type="datetime-local"
            value={form.dataHoraSorteio}
            onChange={(e) => set("dataHoraSorteio", e.target.value)}
            required
          />
          <Input
            label="Prazo de resgate"
            type="datetime-local"
            value={form.prazoResgate}
            onChange={(e) => set("prazoResgate", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="animacao">
            Animação do sorteio
          </label>
          <select
            id="animacao"
            className="input"
            value={form.animacao}
            onChange={(e) => set("animacao", e.target.value as "tambor" | "caca_niquel")}
          >
            <option value="tambor">Tambor</option>
            <option value="caca_niquel">Caça-níquel</option>
          </select>
        </div>
      </Card>

      {/* Lojas */}
      <Card>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <label className="field-label">Lojas participantes</label>
          <Link href="/admin/lojas" className="link-gold text-xs" style={{ fontWeight: 600 }}>
            + Gerenciar lojas
          </Link>
        </div>
        {!lojas ? (
          <p className="text-text-2 text-sm">Carregando lojas…</p>
        ) : lojas.length === 0 ? (
          <Alert variant="info">
            Nenhuma loja cadastrada.{" "}
            <Link href="/admin/lojas" className="text-yellow underline">
              Cadastre uma loja
            </Link>{" "}
            antes de criar o sorteio.
          </Alert>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            {lojas.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`chip-pick ${lojaIds.includes(l.id) ? "on" : ""}`}
                onClick={() => toggleLoja(l.id)}
              >
                {lojaIds.includes(l.id) ? "✓ " : ""}
                {l.nome}
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="row" style={{ gap: 10 }}>
        <Button type="submit" loading={loading} className="btn-lg">
          Criar sorteio
        </Button>
        <Link href="/admin" className="btn btn-ghost btn-lg">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

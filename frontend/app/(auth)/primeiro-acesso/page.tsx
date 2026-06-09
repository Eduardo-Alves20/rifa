"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { maskCpf, unmaskCpf, isValidCpf } from "@/lib/cpf";
import { checkFirstAccess } from "@/lib/api";

export default function PrimeiroAcessoPage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | { kind: "found"; hint: string; primeiroAcesso: boolean }
    | { kind: "notFound" }
    | { kind: "error"; message: string }
    | null
  >(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidCpf(cpf)) {
      setResult({ kind: "error", message: "CPF inválido" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await checkFirstAccess(unmaskCpf(cpf));
      if (r.found && r.hint) {
        setResult({ kind: "found", hint: r.hint, primeiroAcesso: r.primeiroAcesso ?? false });
      } else {
        setResult({ kind: "notFound" });
      }
    } catch (err) {
      setResult({ kind: "error", message: err instanceof Error ? err.message : "Erro" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Primeiro acesso"
      subtitle="Digite seu CPF para verificar se você já tem cadastro feito pela loja."
      footer={
        <div className="text-center text-sm">
          <Link href="/login" className="link-gold">
            ← Voltar para login
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="stack-sm">
        <Input
          label="CPF"
          name="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          maxLength={14}
          required
        />
        <Button type="submit" block loading={loading} className="btn-lg">
          Verificar
        </Button>
      </form>

      <div className="stack-sm" style={{ marginTop: 14 }}>
      {result?.kind === "found" ? (
        <Alert variant="success">
          <strong>Cadastro encontrado!</strong>
          <div className="mt-2 text-sm">{result.hint}</div>
          <Link href="/login" className="btn btn-primary mt-3 inline-flex">
            Ir para login
          </Link>
        </Alert>
      ) : null}

      {result?.kind === "notFound" ? (
        <Alert variant="info">
          CPF não cadastrado.{" "}
          <Link href="/cadastro" className="text-yellow underline">
            Deseja se cadastrar?
          </Link>
        </Alert>
      ) : null}

      {result?.kind === "error" ? <Alert variant="error">{result.message}</Alert> : null}
      </div>
    </AuthShell>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { login } from "@/lib/api";
import { landingPathForRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (identificador.trim().length < 3) {
      setError("Informe CPF, e-mail ou usuário");
      return;
    }
    if (senha.length < 6) {
      setError("Senha deve ter ao menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { user } = await login(identificador.trim(), senha);
      if (user.primeiroAcesso) {
        router.replace("/trocar-senha");
      } else {
        router.replace(landingPathForRole(user.role));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Entrar"
      footer={
        <div className="row-between text-sm">
          <Link href="/primeiro-acesso" className="link-gold">
            Primeiro acesso?
          </Link>
          <Link href="/cadastro" className="link-gold">
            Cadastre-se
          </Link>
        </div>
      }
    >
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="stack-sm" style={{ marginTop: error ? 14 : 0 }}>
        <Input
          label="CPF, e-mail ou usuário"
          name="identificador"
          autoComplete="username"
          placeholder="000.000.000-00 ou voce@email.com"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
        />
        <Input
          label="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Button type="submit" block loading={loading} className="btn-lg">
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { changePassword } from "@/lib/api";
import { getStoredUser, landingPathForRole, setAuth, getAccessToken } from "@/lib/auth";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (senha.length < 6) return setError("Senha deve ter ao menos 6 caracteres");
    if (senha !== confirmar) return setError("As senhas não conferem");

    setLoading(true);
    try {
      await changePassword(senha);
      const user = getStoredUser();
      if (user) {
        // Atualiza flag local
        const updated = { ...user, primeiroAcesso: false };
        const access = getAccessToken() ?? "";
        setAuth(access, "", updated);
        router.replace(landingPathForRole(updated.role));
      } else {
        router.replace("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao trocar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Trocar senha">
      <div className="stack-sm">
        <Alert variant="info">
          Você precisa criar uma nova senha antes de continuar. Não pode ser igual à senha
          temporária.
        </Alert>

        {error ? <Alert variant="error">{error}</Alert> : null}
      </div>

      <form onSubmit={onSubmit} className="stack-sm" style={{ marginTop: 14 }}>
        <Input
          label="Nova senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          hint="Mínimo 6 caracteres"
          required
        />
        <Input
          label="Confirmar nova senha"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        <Button type="submit" block loading={loading} className="btn-lg">
          Salvar nova senha
        </Button>
      </form>
    </AuthShell>
  );
}

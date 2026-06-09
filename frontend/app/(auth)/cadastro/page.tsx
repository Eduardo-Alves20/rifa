"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { maskCpf, unmaskCpf, isValidCpf, maskPhone } from "@/lib/cpf";
import { register, login } from "@/lib/api";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    celular: "",
    dataNasc: "",
    email: "",
    senha: "",
    confirmar: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.nome.trim().length < 3) return setError("Nome deve ter ao menos 3 caracteres");
    if (!isValidCpf(form.cpf)) return setError("CPF inválido");
    if (form.celular.replace(/\D/g, "").length < 10) return setError("Celular incompleto");
    if (!form.dataNasc) return setError("Informe a data de nascimento");
    if (form.senha.length < 6) return setError("Senha deve ter ao menos 6 caracteres");
    if (form.senha !== form.confirmar) return setError("As senhas não conferem");

    setLoading(true);
    try {
      await register({
        nome: form.nome.trim(),
        cpf: unmaskCpf(form.cpf),
        celular: form.celular.replace(/\D/g, ""),
        dataNasc: form.dataNasc,
        email: form.email || undefined,
        senha: form.senha,
      });
      // Login automático após cadastro
      await login(unmaskCpf(form.cpf), form.senha);
      router.replace("/minha-area");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Cadastre-se"
      subtitle="Crie sua conta para participar dos sorteios."
      footer={
        <div className="text-center text-sm">
          <Link href="/login" className="link-gold">
            Já tem conta? Entrar
          </Link>
        </div>
      }
    >
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="stack-sm" style={{ marginTop: error ? 14 : 0 }}>
        <Input
          label="Nome completo"
          name="nome"
          autoComplete="name"
          value={form.nome}
          onChange={(e) => set("nome", e.target.value)}
          required
        />
        <Input
          label="CPF"
          name="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={(e) => set("cpf", maskCpf(e.target.value))}
          maxLength={14}
          required
        />
        <Input
          label="Celular"
          name="celular"
          inputMode="numeric"
          placeholder="(00) 90000-0000"
          value={form.celular}
          onChange={(e) => set("celular", maskPhone(e.target.value))}
          maxLength={15}
          required
        />
        <Input
          label="Data de nascimento"
          name="dataNasc"
          type="date"
          value={form.dataNasc}
          onChange={(e) => set("dataNasc", e.target.value)}
          required
        />
        <Input
          label="E-mail (opcional)"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Senha"
          name="senha"
          type="password"
          value={form.senha}
          onChange={(e) => set("senha", e.target.value)}
          hint="Mínimo 6 caracteres"
          required
        />
        <Input
          label="Confirmar senha"
          name="confirmar"
          type="password"
          value={form.confirmar}
          onChange={(e) => set("confirmar", e.target.value)}
          required
        />
        <Button type="submit" block loading={loading} className="btn-lg">
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}

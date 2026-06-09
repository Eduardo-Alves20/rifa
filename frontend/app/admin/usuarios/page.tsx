"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  listColaboradores,
  createColaborador,
  listLojas,
  type Colaborador,
  type Loja,
} from "@/lib/api";
import { maskCpf, unmaskCpf, isValidCpf, maskPhone } from "@/lib/cpf";

export default function UsuariosPage() {
  const [users, setUsers] = useState<Colaborador[] | null>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);

  async function load() {
    try {
      const r = await listColaboradores();
      setUsers(r.users);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    void load();
    (async () => {
      try {
        const r = await listLojas();
        setLojas(r.lojas);
      } catch {
        setLojas([]);
      }
    })();
  }, []);

  return (
    <AdminShell title="Usuários" subtitle="Gerencie os colaboradores das lojas.">
      <div className="grid-2">
        <CreateForm lojas={lojas} onCreated={load} />

        <div className="stack-sm fade-up">
          {!users ? (
            [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)
          ) : users.length === 0 ? (
            <Card>
              <p className="text-text-2 text-sm">Nenhum colaborador cadastrado ainda.</p>
            </Card>
          ) : (
            users.map((u) => (
              <Card key={u.id} className="card-tight">
                <div className="list-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <strong style={{ fontSize: 15 }}>{u.nome}</strong>
                      {u.ativo ? <Badge variant="green">Ativo</Badge> : <Badge variant="red">Inativo</Badge>}
                    </div>
                    <div className="text-xs text-text-3" style={{ marginTop: 3 }}>
                      {u.loja?.nome ? `${u.loja.nome} · ` : ""}
                      {u.email ?? "sem e-mail"}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function CreateForm({ lojas, onCreated }: { lojas: Loja[]; onCreated: () => void }) {
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    celular: "",
    dataNasc: "",
    email: "",
    lojaId: "",
    senhaInicial: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (form.nome.trim().length < 3) return setError("Nome deve ter ao menos 3 caracteres");
    if (!isValidCpf(form.cpf)) return setError("CPF inválido");
    if (form.celular.replace(/\D/g, "").length < 10) return setError("Celular incompleto");
    if (!form.dataNasc) return setError("Informe a data de nascimento");
    if (!form.email.includes("@")) return setError("Informe um e-mail válido");
    if (!form.lojaId) return setError("Selecione a loja do colaborador");
    if (form.senhaInicial.length < 6) return setError("Senha inicial deve ter ao menos 6 caracteres");

    setLoading(true);
    try {
      const res = await createColaborador({
        nome: form.nome.trim(),
        cpf: unmaskCpf(form.cpf),
        celular: form.celular.replace(/\D/g, ""),
        dataNasc: form.dataNasc,
        email: form.email.trim(),
        lojaId: form.lojaId,
        senhaInicial: form.senhaInicial,
      });
      setOk(`Colaborador ${res.user.nome} criado! Ele troca a senha no primeiro acesso.`);
      setForm({ nome: "", cpf: "", celular: "", dataNasc: "", email: "", lojaId: "", senhaInicial: "" });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar colaborador");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="fade-up" style={{ alignSelf: "start" }}>
      <h2 className="h2" style={{ marginBottom: 12 }}>
        Novo colaborador
      </h2>
      {error ? <Alert variant="error">{error}</Alert> : null}
      {ok ? <Alert variant="success">{ok}</Alert> : null}
      <form onSubmit={onSubmit} className="stack-sm" style={{ marginTop: error || ok ? 12 : 0 }}>
        <Input label="Nome completo" value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
        <div className="grid-2">
          <Input
            label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => set("cpf", maskCpf(e.target.value))}
            maxLength={14}
            required
          />
          <Input
            label="Celular"
            inputMode="numeric"
            placeholder="(00) 90000-0000"
            value={form.celular}
            onChange={(e) => set("celular", maskPhone(e.target.value))}
            maxLength={15}
            required
          />
        </div>
        <div className="grid-2">
          <Input
            label="Data de nascimento"
            type="date"
            value={form.dataNasc}
            onChange={(e) => set("dataNasc", e.target.value)}
            required
          />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="lojaId">
            Loja
          </label>
          <select id="lojaId" className="input" value={form.lojaId} onChange={(e) => set("lojaId", e.target.value)} required>
            <option value="">Selecione…</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          {lojas.length === 0 ? <span className="field-hint">Cadastre uma loja antes.</span> : null}
        </div>
        <Input
          label="Senha inicial"
          value={form.senhaInicial}
          onChange={(e) => set("senhaInicial", e.target.value)}
          hint="O colaborador troca no primeiro acesso"
          required
        />
        <Button type="submit" block loading={loading}>
          Criar colaborador
        </Button>
      </form>
    </Card>
  );
}

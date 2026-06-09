"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { listLojas, createLoja, type Loja } from "@/lib/api";

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[] | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const r = await listLojas();
      setLojas(r.lojas);
    } catch {
      setLojas([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (nome.trim().length < 2) return setError("Informe o nome da loja");
    setLoading(true);
    try {
      await createLoja({ nome: nome.trim(), endereco: endereco.trim() || undefined });
      setNome("");
      setEndereco("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar loja");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Lojas" subtitle="Cadastre as lojas que participam dos sorteios.">
      <div className="grid-2">
        <Card className="fade-up" style={{ alignSelf: "start" }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>
            Nova loja
          </h2>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <form onSubmit={onSubmit} className="stack-sm" style={{ marginTop: error ? 12 : 0 }}>
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
            <Input
              label="Endereço (opcional)"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              maxLength={200}
            />
            <Button type="submit" block loading={loading}>
              Cadastrar loja
            </Button>
          </form>
        </Card>

        <div className="stack-sm fade-up">
          {!lojas ? (
            [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)
          ) : lojas.length === 0 ? (
            <Card>
              <p className="text-text-2 text-sm">Nenhuma loja cadastrada ainda.</p>
            </Card>
          ) : (
            lojas.map((l) => (
              <Card key={l.id} className="card-tight">
                <div className="list-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <strong style={{ fontSize: 15 }}>{l.nome}</strong>
                      {l.ativo ? <Badge variant="green">Ativa</Badge> : <Badge variant="red">Inativa</Badge>}
                    </div>
                    {l.endereco ? (
                      <div className="text-xs text-text-3" style={{ marginTop: 3 }}>
                        {l.endereco}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-text-3" style={{ flexShrink: 0, textAlign: "right" }}>
                    {l._count?.colaboradores ?? 0} colab.
                    <br />
                    {l._count?.rafflesLojas ?? 0} sorteios
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

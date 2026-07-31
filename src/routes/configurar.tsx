import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFirstOwner, ownerExists } from "@/lib/oxys.functions";

export const Route = createFileRoute("/configurar")({
  head: () => ({
    meta: [
      { title: "Primeiro acesso — Oxys PDV" },
      { name: "description", content: "Configure a conta Owner da plataforma Oxys PDV." },
      { property: "og:title", content: "Primeiro acesso — Oxys PDV" },
      { property: "og:description", content: "Criação da conta administradora da plataforma." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const checkOwner = useServerFn(ownerExists);
  const createOwner = useServerFn(createFirstOwner);
  const { data, isLoading } = useQuery({ queryKey: ["owner-exists"], queryFn: () => checkOwner() });

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.fullName.trim().length < 2) return setError("Informe o nome completo.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError("Email inválido.");
    if (form.password.length < 8) return setError("A senha deve ter ao menos 8 caracteres.");
    setError(null);
    setSaving(true);
    try {
      await createOwner({
        data: { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password },
      });
      toast.success("Owner criado. Faça login para continuar.");
      navigate({ to: "/" });
    } catch {
      setError("Não foi possível criar o Owner. A plataforma pode já estar configurada.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12 grid-backdrop">
      <div className="w-full max-w-sm surface-card p-6">
        <h1 className="font-display text-2xl font-bold">Primeiro acesso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie a conta Owner que administra toda a plataforma Oxys PDV.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Verificando configuração...</p>
        ) : data?.exists ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              A plataforma já possui um Owner configurado. Acesse com suas credenciais.
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/" })}>
              Ir para o login
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Nome completo</Label>
              <Input
                id="ownerName"
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                maxLength={180}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Senha</Label>
              <Input
                id="ownerPassword"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                maxLength={72}
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Criando..." : "Criar conta Owner"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, SectionCard } from "@/components/oxys/ui-blocks";
import {
  getCompanyOverview,
  getSessionInfo,
  listCompanies,
  saveBranch,
} from "@/lib/oxys.functions";

export const Route = createFileRoute("/_authenticated/filiais")({
  head: () => ({
    meta: [
      { title: "Filiais — Oxys PDV" },
      { name: "description", content: "Cadastro e controle das filiais de cada empresa no Oxys PDV." },
      { property: "og:title", content: "Filiais — Oxys PDV" },
      { property: "og:description", content: "Unidades, endereços e operação multi-filial." },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionInfo);
  const fetchCompanies = useServerFn(listCompanies);
  const fetchOverview = useServerFn(getCompanyOverview);
  const persistBranch = useServerFn(saveBranch);

  const [companyId, setCompanyId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", state: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: session } = useQuery({ queryKey: ["session-info"], queryFn: () => fetchSession() });
  const isOwner = session?.isOwner ?? false;
  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => fetchCompanies(),
    enabled: isOwner,
  });

  const options = isOwner
    ? (companies ?? []).map((c) => ({ id: c.id, name: c.trade_name }))
    : (session?.memberships ?? [])
        .filter((m) => m.companyId)
        .map((m) => ({ id: m.companyId as string, name: m.companyName ?? "Minha empresa" }));

  useEffect(() => {
    const first = options[0];
    if (!companyId && first) setCompanyId(first.id);
  }, [companyId, options]);

  const { data, isLoading } = useQuery({
    queryKey: ["company-overview", companyId],
    queryFn: () => fetchOverview({ data: { companyId } }),
    enabled: Boolean(companyId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      persistBranch({
        data: {
          companyId,
          name: form.name.trim(),
          code: form.code.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["company-overview", companyId] });
      setOpen(false);
      setForm({ name: "", code: "", city: "", state: "" });
      toast.success("Filial cadastrada.");
    },
    onError: () => toast.error("Não foi possível cadastrar a filial."),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError("Informe o nome da filial.");
      return;
    }
    setFormError(null);
    createMutation.mutate();
  }

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule-se a uma empresa para gerenciar filiais."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Operação</p>
          <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">Filiais</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          <Plus className="mr-2 size-4" /> Nova filial
        </Button>
      </header>

      <SectionCard
        title="Unidades cadastradas"
        description="Cada filial pode ter seus próprios caixas e estoques"
        action={
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="h-9 w-56 bg-surface-2">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (data?.branches ?? []).length === 0 ? (
          <EmptyState
            title="Nenhuma filial cadastrada"
            description="Cadastre a matriz e as demais unidades para organizar a operação."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 size-4" /> Nova filial
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.branches ?? []).map((b) => (
              <li key={b.id} className="surface-card p-4">
                <p className="truncate font-semibold">{b.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[b.city, b.state].filter(Boolean).join(" / ") || "Sem endereço informado"}
                </p>
                <span
                  className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs ${b.is_active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {b.is_active ? "Ativa" : "Inativa"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova filial</DialogTitle>
            <DialogDescription>Cadastre uma unidade da empresa selecionada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="branchName">Nome</Label>
              <Input
                id="branchName"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="branchCode">Código</Label>
                <Input
                  id="branchCode"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchState">Estado</Label>
                <Input
                  id="branchState"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  maxLength={64}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchCity">Cidade</Label>
              <Input
                id="branchCity"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                maxLength={120}
              />
            </div>

            {formError ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Cadastrar filial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

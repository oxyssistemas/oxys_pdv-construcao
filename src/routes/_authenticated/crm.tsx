import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Handshake, Pencil, Plus, Search, Target, Trash2, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, KpiCard, SectionCard } from "@/components/oxys/ui-blocks";
import { deleteLead, listLeads, saveLead } from "@/lib/crm.functions";
import { CRM_STAGES, CRM_STAGE_LABELS, type CrmStage } from "@/lib/crm-schema";
import { formatCurrency } from "@/lib/oxys";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM da plataforma — Oxys PDV" },
      {
        name: "description",
        content:
          "Funil comercial do administrador master: leads, propostas e negociações de novas empresas no Oxys PDV.",
      },
      { property: "og:title", content: "CRM da plataforma — Oxys PDV" },
      { property: "og:description", content: "Pipeline de prospecção e vendas do Oxys PDV." },
    ],
  }),
  component: CrmPage,
});

type LeadForm = {
  id?: string;
  name: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  source: string;
  stage: CrmStage;
  estimated_value: string;
  next_action: string;
  next_action_at: string;
  notes: string;
};

const emptyForm: LeadForm = {
  name: "",
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  source: "",
  stage: "novo",
  estimated_value: "0",
  next_action: "",
  next_action_at: "",
  notes: "",
};

const stageTone: Record<CrmStage, string> = {
  novo: "bg-muted text-muted-foreground",
  contato: "bg-primary-soft text-foreground",
  proposta: "bg-warning-soft text-foreground",
  negociacao: "bg-warning-soft text-foreground",
  ganho: "bg-success-soft text-foreground",
  perdido: "bg-destructive/15 text-foreground",
};

function CrmPage() {
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listLeads);
  const persistLead = useServerFn(saveLead);
  const removeLead = useServerFn(deleteLead);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"todos" | CrmStage>("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LeadForm>(emptyForm);

  const leads = useQuery({ queryKey: ["crm-leads"], queryFn: () => fetchLeads() });

  const saveMutation = useMutation({
    mutationFn: () =>
      persistLead({
        data: {
          ...(form.id ? { id: form.id } : {}),
          name: form.name.trim(),
          company_name: form.company_name.trim() || null,
          contact_name: form.contact_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          source: form.source.trim() || null,
          stage: form.stage,
          estimated_value: Number(form.estimated_value.replace(",", ".")) || 0,
          next_action: form.next_action.trim() || null,
          next_action_at: form.next_action_at || null,
          notes: form.notes.trim() || null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Lead salvo.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o lead."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeLead({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead removido.");
    },
    onError: () => toast.error("Não foi possível remover o lead."),
  });

  const rows = leads.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((l) => {
      const matchStage = stageFilter === "todos" || l.stage === stageFilter;
      const matchTerm =
        !term ||
        [l.name, l.company_name, l.contact_name, l.email, l.source].some((v) =>
          (v ?? "").toLowerCase().includes(term),
        );
      return matchStage && matchTerm;
    });
  }, [rows, search, stageFilter]);

  const openPipeline = rows.filter((l) => l.stage !== "ganho" && l.stage !== "perdido");
  const pipelineValue = openPipeline.reduce((acc, l) => acc + Number(l.estimated_value ?? 0), 0);
  const wonValue = rows
    .filter((l) => l.stage === "ganho")
    .reduce((acc, l) => acc + Number(l.estimated_value ?? 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">CRM da plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Funil comercial próprio do administrador master: prospecção de novas empresas.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Novo lead
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads" value={rows.length} icon={Target} tone="primary" />
        <KpiCard label="Em aberto" value={openPipeline.length} icon={Handshake} />
        <KpiCard label="Pipeline" value={formatCurrency(pipelineValue)} icon={TrendingUp} tone="warning" />
        <KpiCard label="Ganho" value={formatCurrency(wonValue)} icon={TrendingUp} tone="success" />
      </div>

      <SectionCard
        title="Funil de oportunidades"
        description={`${filtered.length} lead(s)`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as typeof stageFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estágios</SelectItem>
                {CRM_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CRM_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar lead"
                className="pl-9"
              />
            </div>
          </div>
        }
      >
        {leads.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum lead"
            description="Cadastre oportunidades para acompanhar a prospecção de novas empresas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Lead</th>
                  <th className="py-2 pr-3 font-medium">Contato</th>
                  <th className="py-2 pr-3 font-medium">Estágio</th>
                  <th className="py-2 pr-3 font-medium">Valor</th>
                  <th className="py-2 pr-3 font-medium">Próxima ação</th>
                  <th className="py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.company_name || "—"}
                        {l.source ? ` · ${l.source}` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {l.contact_name || "—"}
                      {l.phone ? ` · ${l.phone}` : ""}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant="outline" className={stageTone[l.stage as CrmStage]}>
                        {CRM_STAGE_LABELS[l.stage as CrmStage]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3">{formatCurrency(Number(l.estimated_value ?? 0))}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {l.next_action || "—"}
                      {l.next_action_at
                        ? ` · ${new Date(`${l.next_action_at}T00:00:00`).toLocaleDateString("pt-BR")}`
                        : ""}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar lead"
                          onClick={() => {
                            setForm({
                              id: l.id,
                              name: l.name,
                              company_name: l.company_name ?? "",
                              contact_name: l.contact_name ?? "",
                              email: l.email ?? "",
                              phone: l.phone ?? "",
                              source: l.source ?? "",
                              stage: l.stage as CrmStage,
                              estimated_value: String(l.estimated_value ?? 0),
                              next_action: l.next_action ?? "",
                              next_action_at: l.next_action_at ?? "",
                              notes: l.notes ?? "",
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover lead"
                          onClick={() => deleteMutation.mutate(l.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>Oportunidade comercial da plataforma.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim().length < 2) {
                toast.error("Informe o nome do lead.");
                return;
              }
              saveMutation.mutate();
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="l-name">Lead</Label>
              <Input id="l-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="l-company">Empresa</Label>
              <Input
                id="l-company"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-contact">Contato</Label>
              <Input
                id="l-contact"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-email">E-mail</Label>
              <Input
                id="l-email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-phone">Telefone</Label>
              <Input
                id="l-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-source">Origem</Label>
              <Input
                id="l-source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-stage">Estágio</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as CrmStage })}>
                <SelectTrigger id="l-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CRM_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="l-value">Valor estimado (R$)</Label>
              <Input
                id="l-value"
                inputMode="decimal"
                value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-next-at">Data da próxima ação</Label>
              <Input
                id="l-next-at"
                type="date"
                value={form.next_action_at}
                onChange={(e) => setForm({ ...form, next_action_at: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="l-next">Próxima ação</Label>
              <Input
                id="l-next"
                value={form.next_action}
                onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="l-notes">Observações</Label>
              <Textarea
                id="l-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

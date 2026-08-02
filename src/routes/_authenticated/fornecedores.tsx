import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, KpiCard, SectionCard } from "@/components/oxys/ui-blocks";
import { CompanyPicker, useCompanyScope } from "@/components/oxys/company-scope";
import { deleteSupplier, listSuppliers, saveSupplier } from "@/lib/operacao.functions";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Oxys PDV" },
      {
        name: "description",
        content: "Cadastro de fornecedores, contatos e dados fiscais por empresa no Oxys PDV.",
      },
      { property: "og:title", content: "Fornecedores — Oxys PDV" },
      { property: "og:description", content: "Gestão de parceiros de compra da operação." },
    ],
  }),
  component: SuppliersPage,
});

type SupplierForm = {
  id?: string;
  name: string;
  document: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  is_active: boolean;
};

const emptyForm: SupplierForm = {
  name: "",
  document: "",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  is_active: true,
};

function SuppliersPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchSuppliers = useServerFn(listSuppliers);
  const persistSupplier = useServerFn(saveSupplier);
  const removeSupplier = useServerFn(deleteSupplier);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  const suppliers = useQuery({
    queryKey: ["suppliers", companyId],
    queryFn: () => fetchSuppliers({ data: { companyId } }),
    enabled: Boolean(companyId),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      persistSupplier({
        data: {
          companyId,
          ...(form.id ? { id: form.id } : {}),
          name: form.name.trim(),
          document: form.document.trim() || null,
          contact_name: form.contact_name.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          notes: null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers", companyId] });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Fornecedor salvo.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o fornecedor."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeSupplier({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers", companyId] });
      toast.success("Fornecedor removido.");
    },
    onError: () => toast.error("Não foi possível remover o fornecedor."),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = suppliers.data ?? [];
    if (!term) return rows;
    return rows.filter((s) =>
      [s.name, s.document, s.city, s.email].some((v) => (v ?? "").toLowerCase().includes(term)),
    );
  }, [search, suppliers.data]);

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule-se a uma empresa para cadastrar fornecedores."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Parceiros de compra e reposição de estoque.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
          <Button
            onClick={() => {
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Novo fornecedor
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Fornecedores" value={(suppliers.data ?? []).length} icon={Truck} tone="primary" />
        <KpiCard
          label="Ativos"
          value={(suppliers.data ?? []).filter((s) => s.is_active).length}
          icon={Truck}
          tone="success"
        />
      </div>

      <SectionCard
        title="Lista de fornecedores"
        description={`${filtered.length} registro(s)`}
        action={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar fornecedor"
              className="pl-9"
            />
          </div>
        }
      >
        {suppliers.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum fornecedor"
            description="Cadastre fornecedores para vincular aos produtos e às compras."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Fornecedor</th>
                  <th className="py-2 pr-3 font-medium">Contato</th>
                  <th className="py-2 pr-3 font-medium">Cidade</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.document || "sem documento"}</p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {s.contact_name || "—"}
                      {s.phone ? ` · ${s.phone}` : ""}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {[s.city, s.state].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={s.is_active ? "default" : "outline"}>
                        {s.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar fornecedor"
                          onClick={() => {
                            setForm({
                              id: s.id,
                              name: s.name,
                              document: s.document ?? "",
                              contact_name: s.contact_name ?? "",
                              phone: s.phone ?? "",
                              email: s.email ?? "",
                              city: s.city ?? "",
                              state: s.state ?? "",
                              is_active: s.is_active,
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover fornecedor"
                          onClick={() => deleteMutation.mutate(s.id)}
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
            <DialogTitle>{form.id ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
            <DialogDescription>Dados de contato e identificação.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim().length < 2) {
                toast.error("Informe o nome do fornecedor.");
                return;
              }
              saveMutation.mutate();
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="s-name">Nome</Label>
              <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-doc">CNPJ / CPF</Label>
              <Input
                id="s-doc"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-contact">Contato</Label>
              <Input
                id="s-contact"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-phone">Telefone</Label>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-email">E-mail</Label>
              <Input
                id="s-email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-city">Cidade</Label>
              <Input id="s-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-state">Estado</Label>
              <Input
                id="s-state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="s-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label htmlFor="s-active">Fornecedor ativo</Label>
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

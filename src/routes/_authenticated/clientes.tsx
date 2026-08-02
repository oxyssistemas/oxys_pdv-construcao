import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, UserRound, Users } from "lucide-react";

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
import { formatCurrency } from "@/lib/oxys";
import { deleteCustomer, listCustomers, saveCustomer } from "@/lib/operacao.functions";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Oxys PDV" },
      {
        name: "description",
        content: "Base de clientes com contatos, endereço e limite de crédito por empresa.",
      },
      { property: "og:title", content: "Clientes — Oxys PDV" },
      { property: "og:description", content: "Relacionamento e crédito dos clientes da operação." },
    ],
  }),
  component: CustomersPage,
});

type CustomerForm = {
  id?: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  credit_limit: string;
  is_active: boolean;
};

const emptyForm: CustomerForm = {
  name: "",
  document: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  credit_limit: "0",
  is_active: true,
};

function CustomersPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchCustomers = useServerFn(listCustomers);
  const persistCustomer = useServerFn(saveCustomer);
  const removeCustomer = useServerFn(deleteCustomer);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);

  const customers = useQuery({
    queryKey: ["customers", companyId],
    queryFn: () => fetchCustomers({ data: { companyId } }),
    enabled: Boolean(companyId),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      persistCustomer({
        data: {
          companyId,
          ...(form.id ? { id: form.id } : {}),
          name: form.name.trim(),
          document: form.document.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          credit_limit: Number(form.credit_limit) || 0,
          notes: null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers", companyId] });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Cliente salvo.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o cliente."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeCustomer({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers", companyId] });
      toast.success("Cliente removido.");
    },
    onError: () => toast.error("Não foi possível remover o cliente."),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = customers.data ?? [];
    if (!term) return rows;
    return rows.filter((c) =>
      [c.name, c.document, c.phone, c.city].some((v) => (v ?? "").toLowerCase().includes(term)),
    );
  }, [customers.data, search]);

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule-se a uma empresa para cadastrar clientes."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Base de relacionamento e limite de crédito.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
          <Button
            onClick={() => {
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Novo cliente
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Clientes" value={(customers.data ?? []).length} icon={Users} tone="primary" />
        <KpiCard
          label="Ativos"
          value={(customers.data ?? []).filter((c) => c.is_active).length}
          icon={UserRound}
          tone="success"
        />
        <KpiCard
          label="Crédito concedido"
          value={formatCurrency(
            (customers.data ?? []).reduce((sum, c) => sum + Number(c.credit_limit), 0),
          )}
          icon={UserRound}
        />
      </div>

      <SectionCard
        title="Lista de clientes"
        description={`${filtered.length} registro(s)`}
        action={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente"
              className="pl-9"
            />
          </div>
        }
      >
        {customers.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum cliente"
            description="Cadastre clientes para agilizar vendas e controlar crédito."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium">Contato</th>
                  <th className="py-2 pr-3 font-medium">Cidade</th>
                  <th className="py-2 pr-3 font-medium">Crédito</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.document || "sem documento"}</p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {c.phone || c.email || "—"}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {[c.city, c.state].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="py-3 pr-3">{formatCurrency(Number(c.credit_limit))}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={c.is_active ? "default" : "outline"}>
                        {c.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar cliente"
                          onClick={() => {
                            setForm({
                              id: c.id,
                              name: c.name,
                              document: c.document ?? "",
                              phone: c.phone ?? "",
                              email: c.email ?? "",
                              address: c.address ?? "",
                              city: c.city ?? "",
                              state: c.state ?? "",
                              credit_limit: String(c.credit_limit),
                              is_active: c.is_active,
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover cliente"
                          onClick={() => deleteMutation.mutate(c.id)}
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
            <DialogTitle>{form.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>Dados cadastrais e limite de crédito.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim().length < 2) {
                toast.error("Informe o nome do cliente.");
                return;
              }
              saveMutation.mutate();
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="c-name">Nome</Label>
              <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-doc">CPF / CNPJ</Label>
              <Input
                id="c-doc"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-phone">Telefone</Label>
              <Input
                id="c-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-email">E-mail</Label>
              <Input
                id="c-email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-credit">Limite de crédito</Label>
              <Input
                id="c-credit"
                type="number"
                step="0.01"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="c-address">Endereço</Label>
              <Input
                id="c-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-city">Cidade</Label>
              <Input id="c-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-state">Estado</Label>
              <Input
                id="c-state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="c-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label htmlFor="c-active">Cliente ativo</Label>
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

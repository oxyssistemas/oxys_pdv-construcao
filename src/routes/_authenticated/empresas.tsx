import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, SectionCard } from "@/components/oxys/ui-blocks";
import { deleteCompany, listCompanies, saveCompany } from "@/lib/oxys.functions";
import { COMPANY_STATUS, type CompanyInput, type CompanyStatus } from "@/lib/oxys-schema";
import { COMPANY_CATEGORIES, COMPANY_PLANS, STATUS_LABELS } from "@/lib/oxys";

export const Route = createFileRoute("/_authenticated/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Oxys PDV" },
      { name: "description", content: "Cadastre e administre as empresas clientes do Oxys PDV." },
      { property: "og:title", content: "Empresas — Oxys PDV" },
      { property: "og:description", content: "Gestão de empresas, planos e status de assinatura." },
    ],
  }),
  component: CompaniesPage,
});

type CompanyRow = CompanyInput & { id: string; created_at: string };

const emptyForm: CompanyInput = {
  legal_name: "",
  trade_name: "",
  document: "",
  state_registration: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  zip_code: "",
  city: "",
  state: "",
  category: "",
  plan: "trial",
  status: "trial",
  due_date: "",
};

const statusTone: Record<string, string> = {
  ativa: "bg-success-soft text-success",
  trial: "bg-warning-soft text-warning",
  bloqueada: "bg-destructive/15 text-destructive",
  suspensa: "bg-destructive/15 text-destructive",
  cancelada: "bg-muted text-muted-foreground",
};

function CompaniesPage() {
  const queryClient = useQueryClient();
  const fetchCompanies = useServerFn(listCompanies);
  const persistCompany = useServerFn(saveCompany);
  const removeCompany = useServerFn(deleteCompany);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyInput>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => fetchCompanies() as Promise<CompanyRow[]>,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; values: CompanyInput }) =>
      persistCompany({ data: payload as { id: string; values: CompanyInput } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["companies"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      setOpen(false);
      toast.success(editingId ? "Empresa atualizada." : "Empresa cadastrada.");
    },
    onError: () => toast.error("Não foi possível salvar a empresa."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeCompany({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["companies"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Empresa removida.");
    },
    onError: () => toast.error("Não foi possível remover a empresa."),
    onSettled: () => setDeleteId(null),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      const matchTerm =
        !term ||
        c.trade_name.toLowerCase().includes(term) ||
        c.legal_name.toLowerCase().includes(term) ||
        (c.document ?? "").toLowerCase().includes(term);
      const matchStatus = statusFilter === "todas" || c.status === statusFilter;
      return matchTerm && matchStatus;
    });
  }, [data, search, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(row: CompanyRow) {
    setEditingId(row.id);
    setFormError(null);
    setForm({
      legal_name: row.legal_name,
      trade_name: row.trade_name,
      document: row.document ?? "",
      state_registration: row.state_registration ?? "",
      phone: row.phone ?? "",
      whatsapp: row.whatsapp ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      zip_code: row.zip_code ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      category: row.category ?? "",
      plan: row.plan,
      status: row.status,
      due_date: row.due_date ?? "",
    });
    setOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.legal_name.trim().length < 2 || form.trade_name.trim().length < 2) {
      setFormError("Informe a razão social e o nome fantasia (mínimo 2 caracteres).");
      return;
    }
    if (form.email && form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setFormError("Informe um email válido.");
      return;
    }
    setFormError(null);
    saveMutation.mutate(editingId ? { id: editingId, values: form } : { values: form });
  }

  const set = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Portal Master</p>
          <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">Empresas</h1>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 size-4" /> Nova empresa
        </Button>
      </header>

      <SectionCard
        title="Base de clientes"
        description="Empresas cadastradas na plataforma"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar empresa"
                className="h-9 w-52 bg-surface-2 pl-9"
                maxLength={80}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 bg-surface-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos status</SelectItem>
                {COMPANY_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhuma empresa encontrada"
            description="Cadastre a primeira empresa cliente para começar a operar a plataforma."
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 size-4" /> Nova empresa
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-medium">Empresa</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium">Plano</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{row.trade_name}</p>
                      <p className="text-xs text-muted-foreground">{row.legal_name}</p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{row.category || "—"}</td>
                    <td className="py-3 pr-3 capitalize text-muted-foreground">{row.plan}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[row.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Editar empresa">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(row.id)}
                          aria-label="Excluir empresa"
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar empresa" : "Nova empresa"}</DialogTitle>
            <DialogDescription>
              Dados cadastrais, plano e situação da assinatura.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Razão social" required>
              <Input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} maxLength={160} />
            </Field>
            <Field label="Nome fantasia" required>
              <Input value={form.trade_name} onChange={(e) => set("trade_name", e.target.value)} maxLength={160} />
            </Field>
            <Field label="CNPJ / CPF">
              <Input value={form.document ?? ""} onChange={(e) => set("document", e.target.value)} maxLength={32} />
            </Field>
            <Field label="Inscrição estadual">
              <Input
                value={form.state_registration ?? ""}
                onChange={(e) => set("state_registration", e.target.value)}
                maxLength={32}
              />
            </Field>
            <Field label="Telefone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={32} />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} maxLength={32} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} maxLength={180} />
            </Field>
            <Field label="CEP">
              <Input value={form.zip_code ?? ""} onChange={(e) => set("zip_code", e.target.value)} maxLength={16} />
            </Field>
            <Field label="Endereço" className="sm:col-span-2">
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} maxLength={240} />
            </Field>
            <Field label="Cidade">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} maxLength={120} />
            </Field>
            <Field label="Estado">
              <Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} maxLength={64} />
            </Field>
            <Field label="Categoria">
              <Select value={form.category || ""} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COMPANY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Plano">
              <Select value={form.plan} onValueChange={(v) => set("plan", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_PLANS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v as CompanyStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Vencimento">
              <Input type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} />
            </Field>

            {formError ? (
              <p role="alert" className="sm:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar empresa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os vínculos de usuários e filiais desta empresa serão removidos. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">
        {label}
        {required ? <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px]">obrigatório</Badge> : null}
      </Label>
      {children}
    </div>
  );
}

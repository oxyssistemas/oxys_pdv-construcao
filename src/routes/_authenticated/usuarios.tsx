import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
import {
  createMember,
  getSessionInfo,
  listCompanies,
  listMembers,
  removeMember,
} from "@/lib/oxys.functions";
import { APP_ROLES, type AppRole } from "@/lib/oxys-schema";
import { ROLE_LABELS } from "@/lib/oxys";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e perfis — Oxys PDV" },
      {
        name: "description",
        content: "Gerencie a equipe da empresa e os perfis de acesso do Oxys PDV.",
      },
      { property: "og:title", content: "Usuários e perfis — Oxys PDV" },
      { property: "og:description", content: "Controle de acessos por perfil e por empresa." },
    ],
  }),
  component: UsersPage,
});

const ASSIGNABLE_ROLES = APP_ROLES.filter((r) => r !== "owner");

function UsersPage() {
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionInfo);
  const fetchCompanies = useServerFn(listCompanies);
  const fetchMembers = useServerFn(listMembers);
  const addMember = useServerFn(createMember);
  const dropMember = useServerFn(removeMember);

  const [companyId, setCompanyId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "caixa" as AppRole });
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

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", companyId],
    queryFn: () => fetchMembers({ data: { companyId } }),
    enabled: Boolean(companyId),
  });

  const createMutation = useMutation({
    mutationFn: () => addMember({ data: { companyId, ...form } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", companyId] });
      setOpen(false);
      setForm({ fullName: "", email: "", password: "", role: "caixa" });
      toast.success("Usuário criado e vinculado à empresa.");
    },
    onError: () => toast.error("Não foi possível criar o usuário. Verifique suas permissões."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dropMember({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", companyId] });
      toast.success("Acesso removido.");
    },
    onError: () => toast.error("Não foi possível remover o acesso."),
    onSettled: () => setDeleteId(null),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!companyId) return setFormError("Selecione a empresa do usuário.");
    if (form.fullName.trim().length < 2) return setFormError("Informe o nome completo.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      return setFormError("Informe um email válido.");
    if (form.password.length < 8) return setFormError("A senha deve ter ao menos 8 caracteres.");
    setFormError(null);
    createMutation.mutate();
  }


  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Você precisa estar vinculado a uma empresa para gerenciar usuários."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Acessos</p>
          <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">Usuários e perfis</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          <Plus className="mr-2 size-4" /> Novo usuário
        </Button>
      </header>

      <SectionCard
        title="Equipe da empresa"
        description="Cada usuário acessa apenas os dados da empresa vinculada"
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
        ) : (members ?? []).length === 0 ? (
          <EmptyState
            title="Nenhum usuário cadastrado"
            description="Crie o primeiro acesso da equipe definindo o perfil de permissões."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 size-4" /> Novo usuário
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-medium">Colaborador</th>
                  <th className="pb-3 font-medium">Nível hierárquico</th>
                  <th className="pb-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(members ?? []).map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      {m.role === "owner" ? (
                        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                          {ROLE_LABELS[m.role]}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <Select
                            value={m.role}
                            disabled={roleMutation.isPending && pendingId === m.id}
                            onValueChange={(v) => {
                              if (v === m.role) return;
                              setPendingId(m.id);
                              roleMutation.mutate({ id: m.id, role: v as AppRole });
                            }}
                          >
                            <SelectTrigger className="h-9 w-48 bg-surface-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r] ?? r} · nível {ROLE_RANK[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">{ROLE_SCOPE[m.role]}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(m.id)}
                          aria-label="Remover acesso"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Todo usuário é obrigatoriamente vinculado a uma empresa e só enxerga os dados dela,
              conforme o nível de acesso escolhido.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Empresa vinculada</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                maxLength={180}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userPassword">Senha provisória</Label>
              <Input
                id="userPassword"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                maxLength={72}
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de acesso</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as AppRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {createMutation.isPending ? "Criando..." : "Criar usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              O colaborador perderá o acesso aos dados desta empresa imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { LockOpen, Lock, Wallet } from "lucide-react";

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
import { EmptyState, KpiCard, SectionCard } from "@/components/oxys/ui-blocks";
import { CompanyPicker, useCompanyScope } from "@/components/oxys/company-scope";
import { formatCurrency } from "@/lib/oxys";
import { closeRegister, getOpenRegister, listRegisters } from "@/lib/pdv.functions";

export const Route = createFileRoute("/_authenticated/caixa")({
  head: () => ({
    meta: [
      { title: "Controle de caixa — Oxys PDV" },
      {
        name: "description",
        content: "Abertura e fechamento de caixa do Oxys PDV com valor esperado, conferência e diferença.",
      },
      { property: "og:title", content: "Controle de caixa — Oxys PDV" },
      { property: "og:description", content: "Abra, confira e feche o caixa da sua operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CashRegisterPage,
});

function CashRegisterPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchOpen = useServerFn(getOpenRegister);
  const fetchList = useServerFn(listRegisters);
  const doClose = useServerFn(closeRegister);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const enabled = Boolean(companyId);
  const scope = { data: { companyId } };

  const current = useQuery({
    queryKey: ["open-register", companyId],
    queryFn: () => fetchOpen(scope),
    enabled,
  });
  const registers = useQuery({
    queryKey: ["registers", companyId],
    queryFn: () => fetchList(scope),
    enabled,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["open-register", companyId] });
    void queryClient.invalidateQueries({ queryKey: ["registers", companyId] });
  }

  const closeMutation = useMutation({
    mutationFn: () =>
      doClose({
        data: {
          id: current.data?.id as string,
          closing_amount: Number(closingAmount) || 0,
          notes: closeNotes.trim() || null,
        },
      }),
    onSuccess: (result) => {
      invalidate();
      setCloseOpen(false);
      setClosingAmount("");
      setCloseNotes("");
      toast.success(
        `Caixa fechado. Esperado ${formatCurrency(result.expected)} · diferença ${formatCurrency(result.difference)}`,
      );
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível fechar o caixa."),
  });

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule seu usuário a uma empresa para controlar o caixa."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Operação</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Controle de caixa</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
          {current.data ? (
            <Button variant="destructive" onClick={() => setCloseOpen(true)}>
              <Lock className="mr-2 size-4" /> Fechar caixa
            </Button>
          ) : (
            <OpenRegisterButton companyId={companyId} onDone={invalidate} />
          )}
        </div>
      </header>

      {current.isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : current.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Valor de abertura"
            value={formatCurrency(Number(current.data.opening_amount))}
            icon={Wallet}
            tone="primary"
          />
          <KpiCard
            label="Aberto em"
            value={new Date(current.data.opened_at).toLocaleString("pt-BR")}
            icon={LockOpen}
            tone="success"
          />
          <KpiCard label="Situação" value="Caixa aberto" icon={LockOpen} tone="success" />
        </div>
      ) : (
        <EmptyState
          title="Nenhum caixa aberto"
          description="Abra o caixa para iniciar o turno e vincular as vendas ao fechamento."
        />
      )}

      <SectionCard title="Histórico de caixas" description="Últimos 50 turnos">
        {registers.isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (registers.data ?? []).length === 0 ? (
          <EmptyState title="Sem histórico" description="Nenhum caixa foi aberto até agora." />
        ) : (
          <ul className="space-y-2">
            {(registers.data ?? []).map((r) => {
              const diff = Number(r.closing_amount ?? 0) - Number(r.expected_amount ?? 0);
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-surface-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {new Date(r.opened_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Abertura {formatCurrency(Number(r.opening_amount))}
                      {r.closed_at
                        ? ` · Fechamento ${formatCurrency(Number(r.closing_amount ?? 0))} · Esperado ${formatCurrency(Number(r.expected_amount ?? 0))}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.status === "fechado" ? (
                      <Badge
                        variant="outline"
                        className={Math.abs(diff) < 0.01 ? "text-success" : "text-warning"}
                      >
                        {Math.abs(diff) < 0.01 ? "Conferido" : `Diferença ${formatCurrency(diff)}`}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-success">
                        Aberto
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
            <DialogDescription>
              Informe o valor conferido em dinheiro na gaveta para calcular a diferença.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="fechamento">Valor conferido (R$)</Label>
              <Input
                id="fechamento"
                inputMode="decimal"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="obs-fechamento">Observações</Label>
              <Input
                id="obs-fechamento"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              Confirmar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OpenRegisterButton({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const doOpen = useServerFn(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    openRegisterFn,
  );

  const mutation = useMutation({
    mutationFn: () =>
      doOpen({
        data: {
          companyId,
          branch_id: null,
          opening_amount: Number(amount) || 0,
          notes: notes.trim() || null,
        },
      }),
    onSuccess: () => {
      onDone();
      setOpen(false);
      setAmount("0");
      setNotes("");
      toast.success("Caixa aberto.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível abrir o caixa."),
  });

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={!companyId}>
        <LockOpen className="mr-2 size-4" /> Abrir caixa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
            <DialogDescription>Informe o fundo de troco inicial da gaveta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="abertura">Valor de abertura (R$)</Label>
              <Input
                id="abertura"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="obs-abertura">Observações</Label>
              <Input
                id="obs-abertura"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              Abrir caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

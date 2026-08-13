import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  LockOpen,
  Lock,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Printer,
  Download,
} from "lucide-react";

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
import {
  closeRegister,
  createCashMovement,
  getOpenRegister,
  getRegisterReport,
  listCashMovements,
  listRegisters,
  openRegister,
} from "@/lib/pdv.functions";
import { CASH_MOVEMENT_LABELS, PAYMENT_LABELS, type CashMovementType, type PaymentMethod } from "@/lib/pdv-schema";

export const Route = createFileRoute("/_authenticated/caixa")({
  head: () => ({
    meta: [
      { title: "Controle de caixa — Oxys PDV" },
      {
        name: "description",
        content:
          "Abertura, sangria, suprimento e fechamento de caixa do Oxys PDV com relatório de movimentações para exportar e imprimir.",
      },
      { property: "og:title", content: "Controle de caixa — Oxys PDV" },
      { property: "og:description", content: "Abra, movimente, confira e feche o caixa da sua operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CashRegisterPage,
});

type ReportData = Awaited<ReturnType<typeof getRegisterReport>>;

const dateTime = (v: string) => new Date(v).toLocaleString("pt-BR");

function CashRegisterPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchOpen = useServerFn(getOpenRegister);
  const fetchList = useServerFn(listRegisters);
  const fetchMovements = useServerFn(listCashMovements);
  const fetchReport = useServerFn(getRegisterReport);
  const doClose = useServerFn(closeRegister);
  const doMovement = useServerFn(createCashMovement);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const [movementType, setMovementType] = useState<CashMovementType | null>(null);
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const [report, setReport] = useState<ReportData | null>(null);

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
  const registerId = current.data?.id ?? null;
  const movements = useQuery({
    queryKey: ["cash-movements", registerId],
    queryFn: () => fetchMovements({ data: { id: registerId as string } }),
    enabled: Boolean(registerId),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["open-register", companyId] });
    void queryClient.invalidateQueries({ queryKey: ["registers", companyId] });
    void queryClient.invalidateQueries({ queryKey: ["cash-movements", registerId] });
  }

  const closeMutation = useMutation({
    mutationFn: () =>
      doClose({
        data: {
          id: registerId as string,
          closing_amount: Number(closingAmount.replace(",", ".")) || 0,
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

  const movementMutation = useMutation({
    mutationFn: () =>
      doMovement({
        data: {
          companyId,
          register_id: registerId as string,
          type: movementType as CashMovementType,
          amount: Number(movementAmount.replace(",", ".")) || 0,
          reason: movementReason.trim() || null,
        },
      }),
    onSuccess: () => {
      invalidate();
      toast.success(movementType === "sangria" ? "Sangria registrada." : "Suprimento registrado.");
      setMovementType(null);
      setMovementAmount("");
      setMovementReason("");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível registrar a movimentação."),
  });

  const reportMutation = useMutation({
    mutationFn: (id: string) => fetchReport({ data: { id } }),
    onSuccess: (data) => setReport(data),
    onError: (e: Error) => toast.error(e.message || "Não foi possível gerar o relatório."),
  });

  const movementList = movements.data ?? [];
  const supply = movementList
    .filter((m) => m.type === "suprimento")
    .reduce((sum, m) => sum + m.amount, 0);
  const withdrawal = movementList
    .filter((m) => m.type === "sangria")
    .reduce((sum, m) => sum + m.amount, 0);

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
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Valor de abertura"
              value={formatCurrency(Number(current.data.opening_amount))}
              icon={Wallet}
              tone="primary"
            />
            <KpiCard label="Suprimentos" value={formatCurrency(supply)} icon={ArrowUpCircle} tone="success" />
            <KpiCard label="Sangrias" value={formatCurrency(withdrawal)} icon={ArrowDownCircle} tone="warning" />
            <KpiCard
              label="Aberto em"
              value={dateTime(current.data.opened_at)}
              icon={LockOpen}
              tone="success"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              className="h-12 justify-center"
              onClick={() => setMovementType("sangria")}
            >
              <ArrowDownCircle className="mr-2 size-4" /> Sangria
            </Button>
            <Button
              variant="outline"
              className="h-12 justify-center"
              onClick={() => setMovementType("suprimento")}
            >
              <ArrowUpCircle className="mr-2 size-4" /> Suprimento
            </Button>
            <Button
              className="h-12 justify-center"
              onClick={() => reportMutation.mutate(current.data!.id)}
              disabled={reportMutation.isPending}
            >
              <FileText className="mr-2 size-4" /> Relatório do turno
            </Button>
          </div>

          <SectionCard title="Movimentações do turno" description="Sangrias e suprimentos registrados">
            {movements.isLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : movementList.length === 0 ? (
              <EmptyState
                title="Sem movimentações"
                description="Nenhuma sangria ou suprimento neste turno."
              />
            ) : (
              <ul className="space-y-2">
                {movementList.map((m) => (
                  <li
                    key={m.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-surface-2 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {CASH_MOVEMENT_LABELS[m.type as CashMovementType]}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {dateTime(m.created_at)}
                        {m.reason ? ` · ${m.reason}` : ""}
                      </p>
                    </div>
                    <span
                      className={
                        m.type === "sangria"
                          ? "shrink-0 text-sm font-semibold text-warning"
                          : "shrink-0 text-sm font-semibold text-success"
                      }
                    >
                      {m.type === "sangria" ? "-" : "+"}
                      {formatCurrency(m.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
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
                  className="grid gap-3 rounded-lg bg-surface-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{dateTime(r.opened_at)}</p>
                    <p className="text-xs text-muted-foreground">
                      Abertura {formatCurrency(Number(r.opening_amount))}
                      {r.closed_at
                        ? ` · Fechamento ${formatCurrency(Number(r.closing_amount ?? 0))} · Esperado ${formatCurrency(Number(r.expected_amount ?? 0))}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reportMutation.mutate(r.id)}
                      disabled={reportMutation.isPending}
                    >
                      <FileText className="mr-2 size-4" /> Relatório
                    </Button>
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

      <Dialog open={movementType !== null} onOpenChange={(o) => !o && setMovementType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{movementType === "sangria" ? "Registrar sangria" : "Registrar suprimento"}</DialogTitle>
            <DialogDescription>
              {movementType === "sangria"
                ? "Retirada de dinheiro da gaveta (depósito, pagamento, transferência)."
                : "Entrada de dinheiro na gaveta (reforço de troco)."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="mov-valor">Valor (R$)</Label>
              <Input
                id="mov-valor"
                inputMode="decimal"
                autoFocus
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mov-motivo">Motivo</Label>
              <Input
                id="mov-motivo"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Ex.: depósito bancário"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementType(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => movementMutation.mutate()}
              disabled={movementMutation.isPending || !(Number(movementAmount.replace(",", ".")) > 0)}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportDialog report={report} onClose={() => setReport(null)} />
    </div>
  );
}

function buildReportRows(report: ReportData) {
  const rows: string[][] = [["Tipo", "Referência", "Data/hora", "Valor"]];
  rows.push(["Abertura", "Fundo de troco", dateTime(report.register.opened_at), report.register.opening_amount.toFixed(2)]);
  for (const s of report.sales) {
    rows.push(["Venda", `#${s.number}`, dateTime(s.created_at), s.total.toFixed(2)]);
  }
  for (const m of report.movements) {
    rows.push([
      CASH_MOVEMENT_LABELS[m.type as CashMovementType],
      m.reason ?? "-",
      dateTime(m.created_at),
      (m.type === "sangria" ? -m.amount : m.amount).toFixed(2),
    ]);
  }
  if (report.register.closed_at) {
    rows.push([
      "Fechamento",
      "Valor conferido",
      dateTime(report.register.closed_at),
      (report.register.closing_amount ?? 0).toFixed(2),
    ]);
  }
  return rows;
}

function ReportDialog({ report, onClose }: { report: ReportData | null; onClose: () => void }) {
  if (!report) return null;
  const rows = buildReportRows(report);

  function exportCsv() {
    if (!report) return;
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-caixa-${report.register.opened_at.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    if (!report) return;
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) return;
    const body = rows
      .slice(1)
      .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td style="text-align:right">${r[3]}</td></tr>`)
      .join("");
    win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
      <title>Relatório de caixa</title>
      <style>body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 4px}p{margin:2px 0;font-size:12px;color:#555}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
      th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}
      .tot{margin-top:16px;font-size:13px}</style></head><body>
      <h1>Relatório de movimentações de caixa</h1>
      <p>Abertura: ${dateTime(report.register.opened_at)}</p>
      <p>${report.register.closed_at ? `Fechamento: ${dateTime(report.register.closed_at)}` : "Caixa aberto"}</p>
      <table><thead><tr><th>Tipo</th><th>Referência</th><th>Data/hora</th><th style="text-align:right">Valor (R$)</th></tr></thead>
      <tbody>${body}</tbody></table>
      <div class="tot">
        <p>Vendas finalizadas: ${report.sales.length} · Total ${formatCurrency(report.totals.revenue)}</p>
        <p>Dinheiro em vendas: ${formatCurrency(report.totals.cash)}</p>
        <p>Suprimentos: ${formatCurrency(report.totals.supply)} · Sangrias: ${formatCurrency(report.totals.withdrawal)}</p>
        <p><strong>Saldo esperado em gaveta: ${formatCurrency(report.totals.expected)}</strong></p>
      </div>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório de movimentações</DialogTitle>
          <DialogDescription>
            Turno aberto em {dateTime(report.register.opened_at)}
            {report.register.closed_at ? ` · fechado em ${dateTime(report.register.closed_at)}` : " · em andamento"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          <SummaryRow label="Abertura" value={formatCurrency(report.register.opening_amount)} />
          <SummaryRow label="Vendas finalizadas" value={`${report.sales.length} · ${formatCurrency(report.totals.revenue)}`} />
          <SummaryRow label="Dinheiro em vendas" value={formatCurrency(report.totals.cash)} />
          <SummaryRow label="Suprimentos" value={formatCurrency(report.totals.supply)} />
          <SummaryRow label="Sangrias" value={formatCurrency(report.totals.withdrawal)} />
          <SummaryRow label="Saldo esperado" value={formatCurrency(report.totals.expected)} />
        </div>

        {report.byMethod.length > 0 ? (
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Por forma de pagamento
            </p>
            <ul className="space-y-1 text-sm">
              {report.byMethod.map((m) => (
                <li key={m.method} className="flex justify-between gap-3">
                  <span className="truncate">{PAYMENT_LABELS[m.method as PaymentMethod] ?? m.method}</span>
                  <span className="font-medium">{formatCurrency(m.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Referência</th>
                <th className="px-3 py-2">Data/hora</th>
                <th className="px-3 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2">{r[0]}</td>
                  <td className="max-w-40 truncate px-3 py-2">{r[1]}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r[2]}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(Number(r[3]))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 size-4" /> Exportar CSV
          </Button>
          <Button onClick={printReport}>
            <Printer className="mr-2 size-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function OpenRegisterButton({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const doOpen = useServerFn(openRegister);

  const mutation = useMutation({
    mutationFn: () =>
      doOpen({
        data: {
          companyId,
          branch_id: null,
          opening_amount: Number(amount.replace(",", ".")) || 0,
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

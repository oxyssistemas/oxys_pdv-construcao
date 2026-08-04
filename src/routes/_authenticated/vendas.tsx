import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Ban, Receipt, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { PAYMENT_LABELS, SALE_STATUS_LABELS, type PaymentMethod, type SaleStatus } from "@/lib/pdv-schema";
import { cancelSale, getSale, getSalesStats, listSales } from "@/lib/pdv.functions";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas e histórico — Oxys PDV" },
      {
        name: "description",
        content: "Histórico de vendas do Oxys PDV com faturamento, ticket médio, detalhes e cancelamento.",
      },
      { property: "og:title", content: "Vendas e histórico — Oxys PDV" },
      { property: "og:description", content: "Acompanhe faturamento e detalhes de cada venda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesPage,
});

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
} as const;

function SalesPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchSales = useServerFn(listSales);
  const fetchStats = useServerFn(getSalesStats);
  const fetchSale = useServerFn(getSale);
  const doCancel = useServerFn(cancelSale);

  const [detailId, setDetailId] = useState<string | null>(null);

  const enabled = Boolean(companyId);
  const scope = { data: { companyId } };

  const sales = useQuery({
    queryKey: ["sales", companyId],
    queryFn: () => fetchSales(scope),
    enabled,
  });
  const stats = useQuery({
    queryKey: ["sales-stats", companyId],
    queryFn: () => fetchStats(scope),
    enabled,
  });
  const detail = useQuery({
    queryKey: ["sale", detailId],
    queryFn: () => fetchSale({ data: { id: detailId as string } }),
    enabled: Boolean(detailId),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => doCancel({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sales", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["sales-stats", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      setDetailId(null);
      toast.success("Venda cancelada e estoque devolvido.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível cancelar a venda."),
  });

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule seu usuário a uma empresa para consultar as vendas."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Operação</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Vendas</h1>
        </div>
        <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
      </header>

      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Faturamento hoje"
            value={formatCurrency(stats.data?.todayRevenue ?? 0)}
            icon={Wallet}
            tone="primary"
          />
          <KpiCard label="Vendas hoje" value={stats.data?.todayCount ?? 0} icon={Receipt} tone="success" />
          <KpiCard
            label="Faturamento acumulado"
            value={formatCurrency(stats.data?.revenue ?? 0)}
            icon={TrendingUp}
          />
          <KpiCard label="Ticket médio" value={formatCurrency(stats.data?.average ?? 0)} icon={TrendingUp} />
        </div>
      )}

      <SectionCard title="Faturamento por dia" description="Últimos 14 dias com vendas">
        {(stats.data?.daily ?? []).length === 0 ? (
          <EmptyState title="Sem vendas registradas" description="Finalize vendas no PDV para ver a evolução." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.data?.daily ?? []}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(Number(v))} />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Histórico de vendas" description="Últimas 100 vendas da empresa">
        {sales.isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (sales.data ?? []).length === 0 ? (
          <EmptyState title="Nenhuma venda" description="Registre a primeira venda no PDV." />
        ) : (
          <ul className="space-y-2">
            {(sales.data ?? []).map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Venda #{s.number}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {s.customerName ?? "Consumidor final"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      s.status === "cancelada"
                        ? "text-destructive"
                        : s.status === "finalizada"
                          ? "text-success"
                          : "text-warning"
                    }
                  >
                    {SALE_STATUS_LABELS[s.status as SaleStatus] ?? s.status}
                  </Badge>
                  <span className="text-sm font-semibold">{formatCurrency(s.total)}</span>
                  <Button variant="outline" size="sm" onClick={() => setDetailId(s.id)}>
                    Detalhes
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Venda #{detail.data?.sale.number ?? "—"}
            </DialogTitle>
            <DialogDescription>
              {detail.data?.sale.customerName ?? "Consumidor final"}
            </DialogDescription>
          </DialogHeader>

          {detail.isLoading || !detail.data ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <div className="space-y-4 text-sm">
              <ul className="space-y-2">
                {detail.data.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
                    <span className="min-w-0 truncate">
                      {Number(i.quantity)}× {i.description}
                    </span>
                    <span className="shrink-0 font-medium">{formatCurrency(Number(i.total))}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-1">
                {detail.data.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-muted-foreground">
                    <span>{PAYMENT_LABELS[p.method as PaymentMethod] ?? p.method}</span>
                    <span>{formatCurrency(Number(p.amount))}</span>
                  </div>
                ))}
                <div className="flex justify-between text-muted-foreground">
                  <span>Desconto</span>
                  <span>-{formatCurrency(Number(detail.data.sale.discount))}</span>
                </div>
                <div className="flex justify-between font-display text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(detail.data.sale.total))}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {detail.data?.sale.status === "finalizada" ? (
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={() => detailId && cancelMutation.mutate(detailId)}
              >
                <Ban className="mr-2 size-4" /> Cancelar venda
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

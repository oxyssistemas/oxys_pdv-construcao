import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Boxes, Plus } from "lucide-react";

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
import { EmptyState, KpiCard, SectionCard } from "@/components/oxys/ui-blocks";
import { CompanyPicker, useCompanyScope } from "@/components/oxys/company-scope";
import { formatCurrency } from "@/lib/oxys";
import { MOVEMENT_LABELS, STOCK_MOVEMENT_TYPES, type StockMovementType } from "@/lib/operacao-schema";
import {
  createMovement,
  getOperationStats,
  listMovements,
  listProducts,
} from "@/lib/operacao.functions";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque e movimentações — Oxys PDV" },
      {
        name: "description",
        content: "Controle de saldo, entradas, saídas, ajustes e perdas de estoque por empresa.",
      },
      { property: "og:title", content: "Estoque e movimentações — Oxys PDV" },
      { property: "og:description", content: "Saldo em tempo real e histórico de movimentações." },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchProducts = useServerFn(listProducts);
  const fetchMovements = useServerFn(listMovements);
  const fetchStats = useServerFn(getOperationStats);
  const persistMovement = useServerFn(createMovement);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    type: "entrada" as StockMovementType,
    quantity: "1",
    unit_cost: "",
    reason: "",
  });

  const enabled = Boolean(companyId);
  const scope = { data: { companyId } };

  const products = useQuery({
    queryKey: ["products", companyId],
    queryFn: () => fetchProducts(scope),
    enabled,
  });
  const movements = useQuery({
    queryKey: ["movements", companyId],
    queryFn: () => fetchMovements(scope),
    enabled,
  });
  const stats = useQuery({
    queryKey: ["operation-stats", companyId],
    queryFn: () => fetchStats(scope),
    enabled,
  });

  const mutation = useMutation({
    mutationFn: () =>
      persistMovement({
        data: {
          companyId,
          productId: form.productId,
          type: form.type,
          quantity: Number(form.quantity) || 0,
          unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
          reason: form.reason.trim() || null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["movements", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["operation-stats", companyId] });
      setOpen(false);
      setForm({ productId: "", type: "entrada", quantity: "1", unit_cost: "", reason: "" });
      toast.success("Movimentação registrada.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível registrar a movimentação."),
  });

  const lowStock = (products.data ?? []).filter(
    (p) => Number(p.stock_quantity) <= Number(p.min_stock),
  );

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule-se a uma empresa para controlar estoque."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Entradas, saídas, ajustes e perdas com saldo atualizado automaticamente.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
          <Button onClick={() => setOpen(true)} disabled={(products.data ?? []).length === 0}>
            <Plus className="mr-2 size-4" /> Nova movimentação
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Itens no catálogo" value={stats.data?.products ?? 0} icon={Boxes} tone="primary" />
        <KpiCard
          label="Valor em estoque"
          value={formatCurrency(stats.data?.stockValue ?? 0)}
          icon={ArrowUpRight}
          tone="success"
        />
        <KpiCard label="Estoque baixo" value={stats.data?.lowStock ?? 0} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Sem estoque" value={stats.data?.outOfStock ?? 0} icon={ArrowDownLeft} tone="danger" />
      </div>

      <SectionCard title="Alertas de reposição" description="Produtos no limite mínimo ou zerados">
        {products.isLoading ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto precisa de reposição agora.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{p.name}</span>
                <Badge variant="outline" className="shrink-0 text-warning">
                  {Number(p.stock_quantity).toLocaleString("pt-BR")} {p.unit}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Movimentações recentes" description="Últimos 100 lançamentos">
        {movements.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (movements.data ?? []).length === 0 ? (
          <EmptyState
            title="Sem movimentações"
            description="Registre entradas e saídas para acompanhar o histórico do estoque."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Produto</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Quantidade</th>
                  <th className="py-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {(movements.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3 text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 pr-3 font-medium">{m.productName}</td>
                    <td className="py-3 pr-3">
                      <Badge
                        variant="outline"
                        className={
                          m.type === "entrada"
                            ? "text-success"
                            : m.type === "ajuste"
                              ? "text-muted-foreground"
                              : "text-destructive"
                        }
                      >
                        {MOVEMENT_LABELS[m.type as StockMovementType]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3">
                      {m.quantity.toLocaleString("pt-BR")} {m.productUnit}
                    </td>
                    <td className="py-3 text-muted-foreground">{m.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
            <DialogDescription>
              Entradas somam, saídas e perdas subtraem, ajuste define o saldo final.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.productId) {
                toast.error("Selecione um produto.");
                return;
              }
              mutation.mutate();
            }}
          >
            <div>
              <Label>Produto</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm({ ...form, productId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {(products.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as StockMovementType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_MOVEMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {MOVEMENT_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="m-qty">Quantidade</Label>
                <Input
                  id="m-qty"
                  type="number"
                  step="0.001"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="m-cost">Custo unitário</Label>
                <Input
                  id="m-cost"
                  type="number"
                  step="0.01"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="m-reason">Motivo</Label>
                <Input
                  id="m-reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Compra, quebra, inventário..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

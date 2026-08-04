import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingCart, Search, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { CompanyPicker, useCompanyScope } from "@/components/oxys/company-scope";
import { formatCurrency } from "@/lib/oxys";
import { listCustomers, listProducts } from "@/lib/operacao.functions";
import { createSale, getOpenRegister } from "@/lib/pdv.functions";
import {
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  lineTotal,
  type CartLine,
  type PaymentMethod,
} from "@/lib/pdv-schema";

export const Route = createFileRoute("/_authenticated/pdv")({
  head: () => ({
    meta: [
      { title: "PDV — Frente de caixa | Oxys PDV" },
      {
        name: "description",
        content:
          "Frente de caixa do Oxys PDV: busca de produtos, carrinho, descontos, pagamentos e baixa automática de estoque.",
      },
      { property: "og:title", content: "PDV — Frente de caixa | Oxys PDV" },
      { property: "og:description", content: "Venda rápida com baixa automática de estoque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PdvPage,
});

function PdvPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchProducts = useServerFn(listProducts);
  const fetchCustomers = useServerFn(listCustomers);
  const fetchRegister = useServerFn(getOpenRegister);
  const persistSale = useServerFn(createSale);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [customerId, setCustomerId] = useState("none");
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [received, setReceived] = useState("");

  const enabled = Boolean(companyId);
  const scope = { data: { companyId } };

  const products = useQuery({
    queryKey: ["products", companyId],
    queryFn: () => fetchProducts(scope),
    enabled,
  });
  const customers = useQuery({
    queryKey: ["customers", companyId],
    queryFn: () => fetchCustomers(scope),
    enabled,
  });
  const register = useQuery({
    queryKey: ["open-register", companyId],
    queryFn: () => fetchRegister(scope),
    enabled,
  });

  const subtotal = cart.reduce((sum, l) => sum + lineTotal(l), 0);
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountValue);
  const receivedValue = Number(received) || 0;
  const change = method === "dinheiro" ? Math.max(0, receivedValue - total) : 0;

  const filtered = useMemo(() => {
    const list = (products.data ?? []).filter((p) => p.is_active !== false);
    const term = search.trim().toLowerCase();
    if (!term) return list.slice(0, 24);
    return list
      .filter((p) =>
        [p.name, p.sku, p.barcode].some((v) => String(v ?? "").toLowerCase().includes(term)),
      )
      .slice(0, 24);
  }, [products.data, search]);

  function addProduct(p: { id: string; name: string; sale_price: number | string }) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === p.id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key: `${p.id}-${Date.now()}`,
          product_id: p.id,
          description: p.name,
          quantity: 1,
          unit_price: Number(p.sale_price) || 0,
          discount: 0,
        },
      ];
    });
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  const mutation = useMutation({
    mutationFn: () =>
      persistSale({
        data: {
          companyId,
          register_id: register.data?.id ?? null,
          customer_id: customerId === "none" ? null : customerId,
          discount: discountValue,
          notes: null,
          items: cart.map((l) => ({
            product_id: l.product_id,
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount: l.discount,
          })),
          payments: [
            {
              method,
              amount: method === "dinheiro" ? Math.max(receivedValue, total) : total,
              change_amount: change,
            },
          ],
        },
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["sales", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["sales-stats", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      void queryClient.invalidateQueries({ queryKey: ["movements", companyId] });
      setCart([]);
      setDiscount("0");
      setReceived("");
      setCustomerId("none");
      setPayOpen(false);
      toast.success(`Venda #${result.number} finalizada — ${formatCurrency(result.total)}`);
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível finalizar a venda."),
  });

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule seu usuário a uma empresa para usar a frente de caixa."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Fase 3 — PDV</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Frente de caixa</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
          <Badge variant="outline" className={register.data ? "text-success" : "text-warning"}>
            {register.data ? "Caixa aberto" : "Caixa fechado"}
          </Badge>
        </div>
      </header>

      {!register.data ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          <span>
            Nenhum caixa aberto. As vendas ainda podem ser registradas, mas não serão vinculadas a um
            fechamento de caixa.
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard title="Produtos" description="Busque por nome, SKU ou código de barras">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Cadastre produtos no módulo Produtos para vendê-los no PDV."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="rounded-lg border border-border bg-surface-2 p-3 text-left transition-colors hover:border-primary/60"
                >
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(Number(p.sale_price))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Number(p.stock_quantity)} {p.unit}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Carrinho" description={`${cart.length} item(ns)`}>
          {cart.length === 0 ? (
            <EmptyState title="Carrinho vazio" description="Selecione produtos para iniciar a venda." />
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.key} className="rounded-lg bg-surface-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm">{l.description}</p>
                    <button
                      type="button"
                      aria-label="Remover item"
                      onClick={() => setCart((prev) => prev.filter((x) => x.key !== l.key))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="size-7" onClick={() => updateQty(l.key, -1)}>
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{l.quantity}</span>
                      <Button variant="outline" size="icon" className="size-7" onClick={() => updateQty(l.key, 1)}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(lineTotal(l))}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="pdv-desconto">Desconto (R$)</Label>
                <Input
                  id="pdv-desconto"
                  inputMode="decimal"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Consumidor final" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Consumidor final</SelectItem>
                    {(customers.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto</span>
                <span>-{formatCurrency(discountValue)}</span>
              </div>
              <div className="flex justify-between font-display text-xl font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button className="w-full" disabled={cart.length === 0} onClick={() => setPayOpen(true)}>
              <ShoppingCart className="mr-2 size-4" /> Finalizar venda
            </Button>
          </div>
        </SectionCard>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>
              Total a receber: {formatCurrency(total)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {method === "dinheiro" ? (
              <div className="space-y-1">
                <Label htmlFor="pdv-recebido">Valor recebido (R$)</Label>
                <Input
                  id="pdv-recebido"
                  inputMode="decimal"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder={String(total.toFixed(2))}
                />
                <p className="text-xs text-muted-foreground">Troco: {formatCurrency(change)}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                (method === "dinheiro" && receivedValue > 0 && receivedValue < total)
              }
            >
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

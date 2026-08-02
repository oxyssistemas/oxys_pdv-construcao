import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Boxes, Package, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { PRODUCT_UNITS } from "@/lib/operacao-schema";
import {
  deleteCategory,
  deleteProduct,
  getOperationStats,
  listCategories,
  listProducts,
  listSuppliers,
  saveCategory,
  saveProduct,
} from "@/lib/operacao.functions";
import { getCompanyOverview } from "@/lib/oxys.functions";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos e categorias — Oxys PDV" },
      {
        name: "description",
        content: "Cadastro de produtos, preços, categorias e vínculo com fornecedores e filiais.",
      },
      { property: "og:title", content: "Produtos e categorias — Oxys PDV" },
      { property: "og:description", content: "Catálogo completo da operação no Oxys PDV." },
    ],
  }),
  component: ProductsPage,
});

const NONE = "__none__";

type ProductForm = {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  unit: string;
  cost_price: string;
  sale_price: string;
  min_stock: string;
  category_id: string;
  supplier_id: string;
  branch_id: string;
  description: string;
  is_active: boolean;
};

const emptyProduct: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  unit: "UN",
  cost_price: "0",
  sale_price: "0",
  min_stock: "0",
  category_id: NONE,
  supplier_id: NONE,
  branch_id: NONE,
  description: "",
  is_active: true,
};

function ProductsPage() {
  const queryClient = useQueryClient();
  const { options, companyId, setCompanyId } = useCompanyScope();

  const fetchProducts = useServerFn(listProducts);
  const fetchCategories = useServerFn(listCategories);
  const fetchSuppliers = useServerFn(listSuppliers);
  const fetchStats = useServerFn(getOperationStats);
  const fetchOverview = useServerFn(getCompanyOverview);
  const persistProduct = useServerFn(saveProduct);
  const removeProduct = useServerFn(deleteProduct);
  const persistCategory = useServerFn(saveCategory);
  const removeCategory = useServerFn(deleteCategory);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const enabled = Boolean(companyId);
  const scope = { data: { companyId } };

  const products = useQuery({
    queryKey: ["products", companyId],
    queryFn: () => fetchProducts(scope),
    enabled,
  });
  const categories = useQuery({
    queryKey: ["categories", companyId],
    queryFn: () => fetchCategories(scope),
    enabled,
  });
  const suppliers = useQuery({
    queryKey: ["suppliers", companyId],
    queryFn: () => fetchSuppliers(scope),
    enabled,
  });
  const stats = useQuery({
    queryKey: ["operation-stats", companyId],
    queryFn: () => fetchStats(scope),
    enabled,
  });
  const overview = useQuery({
    queryKey: ["company-overview", companyId],
    queryFn: () => fetchOverview(scope),
    enabled,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["products", companyId] });
    void queryClient.invalidateQueries({ queryKey: ["operation-stats", companyId] });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      persistProduct({
        data: {
          companyId,
          ...(form.id ? { id: form.id } : {}),
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          barcode: form.barcode.trim() || null,
          unit: form.unit,
          cost_price: Number(form.cost_price) || 0,
          sale_price: Number(form.sale_price) || 0,
          min_stock: Number(form.min_stock) || 0,
          category_id: form.category_id === NONE ? null : form.category_id,
          supplier_id: form.supplier_id === NONE ? null : form.supplier_id,
          branch_id: form.branch_id === NONE ? null : form.branch_id,
          description: form.description.trim() || null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      refresh();
      setOpen(false);
      setForm(emptyProduct);
      toast.success("Produto salvo.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o produto."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeProduct({ data: { id } }),
    onSuccess: () => {
      refresh();
      toast.success("Produto removido.");
    },
    onError: () => toast.error("Não foi possível remover o produto."),
  });

  const categoryMutation = useMutation({
    mutationFn: () => persistCategory({ data: { companyId, name: categoryName.trim() } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
      setCategoryName("");
      toast.success("Categoria criada.");
    },
    onError: () => toast.error("Não foi possível criar a categoria."),
  });

  const categoryDeleteMutation = useMutation({
    mutationFn: (id: string) => removeCategory({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
      refresh();
      toast.success("Categoria removida.");
    },
    onError: () => toast.error("Não foi possível remover a categoria."),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = products.data ?? [];
    if (!term) return rows;
    return rows.filter((p) =>
      [p.name, p.sku, p.barcode, p.categoryName].some((v) => (v ?? "").toLowerCase().includes(term)),
    );
  }, [products.data, search]);

  if (options.length === 0) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Vincule-se a uma empresa para cadastrar produtos."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">Catálogo, preços e categorias da operação.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompanyPicker options={options} value={companyId} onChange={setCompanyId} />
          <Button
            onClick={() => {
              setForm(emptyProduct);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Novo produto
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Produtos" value={stats.data?.products ?? 0} icon={Package} tone="primary" />
        <KpiCard
          label="Valor em estoque"
          value={formatCurrency(stats.data?.stockValue ?? 0)}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Estoque baixo"
          value={stats.data?.lowStock ?? 0}
          hint="No limite mínimo"
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Sem estoque"
          value={stats.data?.outOfStock ?? 0}
          icon={Boxes}
          tone="danger"
        />
      </div>

      <SectionCard
        title="Catálogo"
        description={`${filtered.length} produto(s)`}
        action={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>
        }
      >
        {products.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Cadastre o primeiro produto para começar a controlar preços e estoque."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Produto</th>
                  <th className="py-2 pr-3 font-medium">Categoria</th>
                  <th className="py-2 pr-3 font-medium">Custo</th>
                  <th className="py-2 pr-3 font-medium">Venda</th>
                  <th className="py-2 pr-3 font-medium">Estoque</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const qty = Number(p.stock_quantity);
                  const low = qty <= Number(p.min_stock);
                  return (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.sku || "sem código"} · {p.supplierName ?? "sem fornecedor"}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{p.categoryName ?? "—"}</td>
                      <td className="py-3 pr-3">{formatCurrency(Number(p.cost_price))}</td>
                      <td className="py-3 pr-3">{formatCurrency(Number(p.sale_price))}</td>
                      <td className="py-3 pr-3">
                        <span className={low ? "text-warning" : undefined}>
                          {qty.toLocaleString("pt-BR")} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={p.is_active ? "default" : "outline"}>
                          {p.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar produto"
                            onClick={() => {
                              setForm({
                                id: p.id,
                                name: p.name,
                                sku: p.sku ?? "",
                                barcode: p.barcode ?? "",
                                unit: p.unit,
                                cost_price: String(p.cost_price),
                                sale_price: String(p.sale_price),
                                min_stock: String(p.min_stock),
                                category_id: p.category_id ?? NONE,
                                supplier_id: p.supplier_id ?? NONE,
                                branch_id: p.branch_id ?? NONE,
                                description: p.description ?? "",
                                is_active: p.is_active,
                              });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remover produto"
                            onClick={() => deleteMutation.mutate(p.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Categorias"
        description="Organize o catálogo por segmento"
        action={
          <Button variant="outline" size="sm" onClick={() => setCategoryOpen(true)}>
            <Plus className="mr-2 size-4" /> Gerenciar
          </Button>
        }
      >
        {(categories.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(categories.data ?? []).map((c) => (
              <Badge key={c.id} variant="outline" className="px-3 py-1">
                {c.name}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorias de produto</DialogTitle>
            <DialogDescription>Crie e remova categorias desta empresa.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Nome da categoria"
            />
            <Button
              onClick={() => categoryMutation.mutate()}
              disabled={categoryName.trim().length < 2 || categoryMutation.isPending}
            >
              Adicionar
            </Button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {(categories.data ?? []).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>{c.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${c.name}`}
                  onClick={() => categoryDeleteMutation.mutate(c.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>Dados comerciais e de controle de estoque.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim().length < 2) {
                toast.error("Informe o nome do produto.");
                return;
              }
              saveMutation.mutate();
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-sku">Código interno</Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-barcode">Código de barras</Label>
              <Input
                id="p-barcode"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-min">Estoque mínimo</Label>
              <Input
                id="p-min"
                type="number"
                step="0.001"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-cost">Preço de custo</Label>
              <Input
                id="p-cost"
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-sale">Preço de venda</Label>
              <Input
                id="p-sale"
                type="number"
                step="0.01"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem categoria</SelectItem>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(v) => setForm({ ...form, supplier_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem fornecedor</SelectItem>
                  {(suppliers.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filial</Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => setForm({ ...form, branch_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todas as filiais</SelectItem>
                  {(overview.data?.branches ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="p-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label htmlFor="p-active">Produto ativo</Label>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

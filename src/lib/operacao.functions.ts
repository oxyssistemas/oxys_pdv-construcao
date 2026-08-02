import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  categoryInput,
  customerInput,
  movementInput,
  productInput,
  supplierInput,
} from "@/lib/operacao-schema";

const companyScope = z.object({ companyId: z.string().uuid() });
const idInput = z.object({ id: z.string().uuid() });

export const listCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("product_categories")
      .select("id, name, description")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categoryInput.parse(input))
  .handler(async ({ data, context }) => {
    const values = {
      company_id: data.companyId,
      name: data.name,
      description: data.description ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("product_categories")
        .update(values)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("product_categories")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("product_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSuppliers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("suppliers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => supplierInput.parse(input))
  .handler(async ({ data, context }) => {
    const values = {
      company_id: data.companyId,
      name: data.name,
      document: data.document ?? null,
      contact_name: data.contact_name ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      notes: data.notes ?? null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase.from("suppliers").update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("suppliers")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("suppliers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("customers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerInput.parse(input))
  .handler(async ({ data, context }) => {
    const values = {
      company_id: data.companyId,
      name: data.name,
      document: data.document ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      credit_limit: data.credit_limit,
      notes: data.notes ?? null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase.from("customers").update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("customers")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, cost_price, sale_price, stock_quantity, min_stock, is_active, description, category_id, supplier_id, branch_id, product_categories(name), suppliers(name)",
      )
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      ...r,
      categoryName: (r.product_categories as { name: string } | null)?.name ?? null,
      supplierName: (r.suppliers as { name: string } | null)?.name ?? null,
    }));
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productInput.parse(input))
  .handler(async ({ data, context }) => {
    const values = {
      company_id: data.companyId,
      name: data.name,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      unit: data.unit,
      cost_price: data.cost_price,
      sale_price: data.sale_price,
      min_stock: data.min_stock,
      category_id: data.category_id ?? null,
      supplier_id: data.supplier_id ?? null,
      branch_id: data.branch_id ?? null,
      description: data.description ?? null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase.from("products").update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("products")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMovements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("stock_movements")
      .select("id, type, quantity, unit_cost, reason, created_at, product_id, products(name, unit)")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      quantity: Number(r.quantity),
      unit_cost: r.unit_cost === null ? null : Number(r.unit_cost),
      reason: r.reason,
      created_at: r.created_at,
      productName: (r.products as { name: string } | null)?.name ?? "—",
      productUnit: (r.products as { unit: string } | null)?.unit ?? "UN",
    }));
  });

export const createMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => movementInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: product, error: productError } = await context.supabase
      .from("products")
      .select("id, branch_id, company_id")
      .eq("id", data.productId)
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product) throw new Error("Produto não encontrado nesta empresa.");

    const { error } = await context.supabase.from("stock_movements").insert({
      company_id: data.companyId,
      product_id: data.productId,
      branch_id: product.branch_id,
      type: data.type,
      quantity: data.quantity,
      unit_cost: data.unit_cost ?? null,
      reason: data.reason ?? null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOperationStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const [products, customers, suppliers] = await Promise.all([
      context.supabase
        .from("products")
        .select("stock_quantity, min_stock, cost_price, sale_price, is_active")
        .eq("company_id", data.companyId),
      context.supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", data.companyId),
      context.supabase
        .from("suppliers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", data.companyId),
    ]);
    if (products.error) throw new Error(products.error.message);

    const rows = products.data ?? [];
    let stockValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of rows) {
      const qty = Number(p.stock_quantity);
      stockValue += qty * Number(p.cost_price);
      if (qty <= 0) outOfStock += 1;
      else if (qty <= Number(p.min_stock)) lowStock += 1;
    }

    return {
      products: rows.length,
      activeProducts: rows.filter((p) => p.is_active).length,
      stockValue,
      lowStock,
      outOfStock,
      customers: customers.count ?? 0,
      suppliers: suppliers.count ?? 0,
    };
  });

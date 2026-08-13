import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cashMovementInput,
  closeRegisterInput,
  createSaleInput,
  openRegisterInput,
} from "@/lib/pdv-schema";

const companyScope = z.object({ companyId: z.string().uuid() });
const idInput = z.object({ id: z.string().uuid() });

export const listRegisters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("cash_registers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("opened_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getOpenRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("cash_registers")
      .select("*")
      .eq("company_id", data.companyId)
      .eq("status", "aberto")
      .order("opened_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    return rows?.[0] ?? null;
  });

export const openRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => openRegisterInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: created, error } = await context.supabase
      .from("cash_registers")
      .insert({
        company_id: data.companyId,
        branch_id: data.branch_id ?? null,
        opened_by: context.userId,
        opening_amount: data.opening_amount,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const closeRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => closeRegisterInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: register, error: regError } = await context.supabase
      .from("cash_registers")
      .select("id, opening_amount")
      .eq("id", data.id)
      .single();
    if (regError) throw new Error(regError.message);

    const { data: sales, error: salesError } = await context.supabase
      .from("sales")
      .select("id")
      .eq("register_id", data.id)
      .eq("status", "finalizada");
    if (salesError) throw new Error(salesError.message);

    let cash = 0;
    const saleIds = (sales ?? []).map((s) => s.id);
    if (saleIds.length > 0) {
      const { data: payments, error: payError } = await context.supabase
        .from("sale_payments")
        .select("amount, change_amount, method")
        .in("sale_id", saleIds)
        .eq("method", "dinheiro");
      if (payError) throw new Error(payError.message);
      cash = (payments ?? []).reduce(
        (sum, p) => sum + Number(p.amount) - Number(p.change_amount),
        0,
      );
    }

    const { data: movements, error: movError } = await context.supabase
      .from("cash_movements")
      .select("type, amount")
      .eq("register_id", data.id);
    if (movError) throw new Error(movError.message);
    const supply = (movements ?? [])
      .filter((m) => m.type === "suprimento")
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const withdrawal = (movements ?? [])
      .filter((m) => m.type === "sangria")
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expected = Number(register.opening_amount) + cash + supply - withdrawal;
    const { error } = await context.supabase
      .from("cash_registers")
      .update({
        status: "fechado",
        closed_by: context.userId,
        closed_at: new Date().toISOString(),
        closing_amount: data.closing_amount,
        expected_amount: expected,
        notes: data.notes ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { expected, difference: data.closing_amount - expected };
  });

export const listSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("sales")
      .select("id, number, total, discount, subtotal, status, created_at, notes, customers(name)")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      number: Number(r.number),
      total: Number(r.total),
      discount: Number(r.discount),
      subtotal: Number(r.subtotal),
      status: r.status,
      created_at: r.created_at,
      notes: r.notes,
      customerName: (r.customers as { name: string } | null)?.name ?? null,
    }));
  });

export const getSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: sale, error } = await context.supabase
      .from("sales")
      .select("*, customers(name)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const [items, payments] = await Promise.all([
      context.supabase.from("sale_items").select("*").eq("sale_id", data.id).order("created_at"),
      context.supabase.from("sale_payments").select("*").eq("sale_id", data.id),
    ]);
    if (items.error) throw new Error(items.error.message);
    if (payments.error) throw new Error(payments.error.message);

    return {
      sale: { ...sale, customerName: (sale.customers as { name: string } | null)?.name ?? null },
      items: items.data ?? [],
      payments: payments.data ?? [],
    };
  });

export const createSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSaleInput.parse(input))
  .handler(async ({ data, context }) => {
    const items = data.items.map((i) => ({
      ...i,
      total: Math.max(0, i.quantity * i.unit_price - i.discount),
    }));
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const total = Math.max(0, subtotal - data.discount);
    const paid = data.payments.reduce((sum, p) => sum + p.amount - p.change_amount, 0);
    if (paid + 0.009 < total) throw new Error("Valor pago é menor que o total da venda.");

    const { data: sale, error } = await context.supabase
      .from("sales")
      .insert({
        company_id: data.companyId,
        register_id: data.register_id ?? null,
        branch_id: data.branch_id ?? null,
        customer_id: data.customer_id ?? null,
        subtotal,
        discount: data.discount,
        total,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("id, number")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await context.supabase.from("sale_items").insert(
      items.map((i) => ({
        sale_id: sale.id,
        company_id: data.companyId,
        product_id: i.product_id ?? null,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        total: i.total,
      })),
    );
    if (itemsError) {
      await context.supabase.from("sales").delete().eq("id", sale.id);
      throw new Error(itemsError.message);
    }

    const { error: payError } = await context.supabase.from("sale_payments").insert(
      data.payments.map((p) => ({
        sale_id: sale.id,
        company_id: data.companyId,
        method: p.method,
        amount: p.amount,
        change_amount: p.change_amount,
      })),
    );
    if (payError) {
      await context.supabase.from("sales").delete().eq("id", sale.id);
      throw new Error(payError.message);
    }

    const { error: finishError } = await context.supabase
      .from("sales")
      .update({ status: "finalizada", closed_at: new Date().toISOString() })
      .eq("id", sale.id);
    if (finishError) throw new Error(finishError.message);

    return { id: sale.id, number: Number(sale.number), total };
  });

export const cancelSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sales")
      .update({ status: "cancelada" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSalesStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyScope.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("sales")
      .select("id, total, status, created_at")
      .eq("company_id", data.companyId)
      .eq("status", "finalizada")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const sales = rows ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter((s) => String(s.created_at).slice(0, 10) === today);
    const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);

    const byDay = new Map<string, number>();
    for (const s of sales) {
      const day = String(s.created_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(s.total));
    }
    const daily = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([day, total]) => ({
        day: day.slice(8, 10) + "/" + day.slice(5, 7),
        total: Number(total.toFixed(2)),
      }));

    return {
      count: sales.length,
      revenue,
      todayCount: todaySales.length,
      todayRevenue,
      average: sales.length ? revenue / sales.length : 0,
      daily,
    };
  });

export const createCashMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cashMovementInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cash_movements").insert({
      company_id: data.companyId,
      register_id: data.register_id,
      type: data.type,
      amount: data.amount,
      reason: data.reason ?? null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getRegisterReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: register, error } = await context.supabase
      .from("cash_registers")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const [salesRes, movRes] = await Promise.all([
      context.supabase
        .from("sales")
        .select("id, number, total, status, created_at")
        .eq("register_id", data.id)
        .order("created_at"),
      context.supabase
        .from("cash_movements")
        .select("id, type, amount, reason, created_at")
        .eq("register_id", data.id)
        .order("created_at"),
    ]);
    if (salesRes.error) throw new Error(salesRes.error.message);
    if (movRes.error) throw new Error(movRes.error.message);

    const sales = salesRes.data ?? [];
    const finalized = sales.filter((s) => s.status === "finalizada");
    const saleIds = finalized.map((s) => s.id);

    let payments: { method: string; amount: number; change_amount: number; sale_id: string }[] = [];
    if (saleIds.length > 0) {
      const { data: pay, error: payError } = await context.supabase
        .from("sale_payments")
        .select("sale_id, method, amount, change_amount")
        .in("sale_id", saleIds);
      if (payError) throw new Error(payError.message);
      payments = (pay ?? []).map((p) => ({
        sale_id: p.sale_id,
        method: String(p.method),
        amount: Number(p.amount),
        change_amount: Number(p.change_amount),
      }));
    }

    const byMethod = new Map<string, number>();
    for (const p of payments) {
      byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount - p.change_amount);
    }

    const movements = (movRes.data ?? []).map((m) => ({
      id: m.id,
      type: String(m.type),
      amount: Number(m.amount),
      reason: m.reason,
      created_at: m.created_at,
    }));
    const supply = movements
      .filter((m) => m.type === "suprimento")
      .reduce((sum, m) => sum + m.amount, 0);
    const withdrawal = movements
      .filter((m) => m.type === "sangria")
      .reduce((sum, m) => sum + m.amount, 0);
    const cash = byMethod.get("dinheiro") ?? 0;
    const revenue = finalized.reduce((sum, s) => sum + Number(s.total), 0);
    const expected = Number(register.opening_amount) + cash + supply - withdrawal;

    return {
      register: {
        id: register.id,
        status: register.status,
        opening_amount: Number(register.opening_amount),
        closing_amount: register.closing_amount === null ? null : Number(register.closing_amount),
        opened_at: register.opened_at,
        closed_at: register.closed_at,
        notes: register.notes,
      },
      sales: finalized.map((s) => ({
        id: s.id,
        number: Number(s.number),
        total: Number(s.total),
        created_at: s.created_at,
      })),
      canceledCount: sales.length - finalized.length,
      movements,
      byMethod: Array.from(byMethod.entries()).map(([method, total]) => ({ method, total })),
      totals: { revenue, cash, supply, withdrawal, expected },
    };
  });

export const listCashMovements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("cash_movements")
      .select("id, type, amount, reason, created_at")
      .eq("register_id", data.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((m) => ({
      id: m.id,
      type: String(m.type),
      amount: Number(m.amount),
      reason: m.reason,
      created_at: m.created_at,
    }));
  });

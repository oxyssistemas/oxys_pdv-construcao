import { z } from "zod";

export const STOCK_MOVEMENT_TYPES = ["entrada", "saida", "ajuste", "perda"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
  perda: "Perda",
};

export const PRODUCT_UNITS = ["UN", "KG", "G", "L", "ML", "CX", "PCT", "M", "M2"] as const;

const nullableText = (max: number) => z.string().trim().max(max).optional().nullable();

export const categoryInput = z.object({
  companyId: z.string().uuid(),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: nullableText(240),
});

export const supplierInput = z.object({
  companyId: z.string().uuid(),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  document: nullableText(32),
  contact_name: nullableText(120),
  phone: nullableText(32),
  email: nullableText(180),
  city: nullableText(120),
  state: nullableText(64),
  notes: nullableText(400),
  is_active: z.boolean().default(true),
});

export const customerInput = z.object({
  companyId: z.string().uuid(),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  document: nullableText(32),
  phone: nullableText(32),
  email: nullableText(180),
  address: nullableText(240),
  city: nullableText(120),
  state: nullableText(64),
  credit_limit: z.number().min(0).max(9999999).default(0),
  notes: nullableText(400),
  is_active: z.boolean().default(true),
});

export const productInput = z.object({
  companyId: z.string().uuid(),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  sku: nullableText(40),
  barcode: nullableText(40),
  unit: z.string().trim().min(1).max(8),
  cost_price: z.number().min(0).max(9999999),
  sale_price: z.number().min(0).max(9999999),
  min_stock: z.number().min(0).max(9999999),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  description: nullableText(400),
  is_active: z.boolean().default(true),
});

export const movementInput = z.object({
  companyId: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.enum(STOCK_MOVEMENT_TYPES),
  quantity: z.number().min(0).max(9999999),
  unit_cost: z.number().min(0).max(9999999).optional().nullable(),
  reason: nullableText(240),
});

export type CategoryInput = z.infer<typeof categoryInput>;
export type SupplierInput = z.infer<typeof supplierInput>;
export type CustomerInput = z.infer<typeof customerInput>;
export type ProductInput = z.infer<typeof productInput>;
export type MovementInput = z.infer<typeof movementInput>;

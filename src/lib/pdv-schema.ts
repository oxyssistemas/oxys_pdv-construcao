import { z } from "zod";

export const PAYMENT_METHODS = ["dinheiro", "pix", "credito", "debito", "fiado", "outro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  fiado: "Fiado / a prazo",
  outro: "Outro",
};

export const SALE_STATUS = ["aberta", "finalizada", "cancelada"] as const;
export type SaleStatus = (typeof SALE_STATUS)[number];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  aberta: "Aberta",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const nullableText = (max: number) => z.string().trim().max(max).optional().nullable();
const money = z.number().min(0).max(99999999);

export const openRegisterInput = z.object({
  companyId: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  opening_amount: money.default(0),
  notes: nullableText(240),
});

export const closeRegisterInput = z.object({
  id: z.string().uuid(),
  closing_amount: money.default(0),
  notes: nullableText(240),
});

export const saleItemInput = z.object({
  product_id: z.string().uuid().optional().nullable(),
  description: z.string().trim().min(1).max(160),
  quantity: z.number().min(0.001).max(999999),
  unit_price: money,
  discount: money.default(0),
});

export const salePaymentInput = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: money,
  change_amount: money.default(0),
});

export const createSaleInput = z.object({
  companyId: z.string().uuid(),
  register_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  discount: money.default(0),
  notes: nullableText(240),
  items: z.array(saleItemInput).min(1),
  payments: z.array(salePaymentInput).min(1),
});

export type OpenRegisterInput = z.infer<typeof openRegisterInput>;
export type CloseRegisterInput = z.infer<typeof closeRegisterInput>;
export type SaleItemInput = z.infer<typeof saleItemInput>;
export type SalePaymentInput = z.infer<typeof salePaymentInput>;
export type CreateSaleInput = z.infer<typeof createSaleInput>;

export type CartLine = {
  key: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
};

export function lineTotal(line: { quantity: number; unit_price: number; discount: number }) {
  return Math.max(0, line.quantity * line.unit_price - line.discount);
}

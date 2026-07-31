import { z } from "zod";

export const COMPANY_STATUS = ["ativa", "bloqueada", "suspensa", "trial", "cancelada"] as const;
export const APP_ROLES = [
  "owner",
  "gerente",
  "supervisor",
  "caixa",
  "atendente",
  "estoque",
  "rh",
  "financeiro",
] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type CompanyStatus = (typeof COMPANY_STATUS)[number];

export type Membership = {
  role: AppRole;
  companyId: string | null;
  companyName: string | null;
};

export type SessionInfo = {
  userId: string;
  email: string;
  fullName: string;
  isOwner: boolean;
  memberships: Membership[];
};

export const companyInput = z.object({
  legal_name: z.string().trim().min(2).max(160),
  trade_name: z.string().trim().min(2).max(160),
  document: z.string().trim().max(32).optional().nullable(),
  state_registration: z.string().trim().max(32).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  whatsapp: z.string().trim().max(32).optional().nullable(),
  email: z.string().trim().max(180).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  zip_code: z.string().trim().max(16).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(64).optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  plan: z.string().trim().max(60),
  status: z.enum(COMPANY_STATUS),
  due_date: z.string().trim().max(10).optional().nullable(),
});

export type CompanyInput = z.infer<typeof companyInput>;

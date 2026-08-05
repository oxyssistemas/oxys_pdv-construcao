import { z } from "zod";

export const CRM_STAGES = ["novo", "contato", "proposta", "negociacao", "ganho", "perdido"] as const;
export type CrmStage = (typeof CRM_STAGES)[number];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  novo: "Novo",
  contato: "Em contato",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const leadInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  company_name: z.string().trim().max(160).optional().nullable(),
  contact_name: z.string().trim().max(160).optional().nullable(),
  email: z.string().trim().max(180).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  stage: z.enum(CRM_STAGES),
  estimated_value: z.number().min(0).max(99999999),
  next_action: z.string().trim().max(240).optional().nullable(),
  next_action_at: z.string().trim().max(10).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type LeadInput = z.infer<typeof leadInput>;

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { leadInput } from "@/lib/crm-schema";

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => leadInput.parse(input))
  .handler(async ({ data, context }) => {
    const values = {
      name: data.name,
      company_name: data.company_name ?? null,
      contact_name: data.contact_name ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      source: data.source ?? null,
      stage: data.stage,
      estimated_value: data.estimated_value,
      next_action: data.next_action ?? null,
      next_action_at: data.next_action_at ? data.next_action_at : null,
      notes: data.notes ?? null,
    };

    if (data.id) {
      const { error } = await context.supabase.from("crm_leads").update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: created, error } = await context.supabase
      .from("crm_leads")
      .insert({ ...values, owner_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("crm_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

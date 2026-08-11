import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  APP_ROLES,
  companyInput,
  type AppRole,
  type Membership,
  type SessionInfo,
} from "@/lib/oxys-schema";


export const getSessionInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionInfo> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role, company_id, companies(trade_name)").eq("user_id", userId),
    ]);

    const memberships: Membership[] = (roles ?? []).map((r) => ({
      role: r.role as AppRole,
      companyId: r.company_id,
      companyName:
        (r.companies as { trade_name: string } | null)?.trade_name ?? null,
    }));

    return {
      userId,
      email: profile?.email ?? "",
      fullName: profile?.full_name ?? "",
      isOwner: memberships.some((m) => m.role === "owner" && m.companyId === null),
      memberships,
    };
  });

export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid().optional(), values: companyInput }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const v = data.values;
    const values = {
      legal_name: v.legal_name,
      trade_name: v.trade_name,
      plan: v.plan,
      status: v.status,
      document: v.document ?? null,
      state_registration: v.state_registration ?? null,
      phone: v.phone ?? null,
      whatsapp: v.whatsapp ?? null,
      email: v.email ?? null,
      address: v.address ?? null,
      zip_code: v.zip_code ?? null,
      city: v.city ?? null,
      state: v.state ?? null,
      category: v.category ?? null,
      due_date: v.due_date ? v.due_date : null,
    };

    if (data.id) {
      const { error } = await context.supabase.from("companies").update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("companies")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("companies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPlatformStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: companies, error } = await context.supabase
      .from("companies")
      .select("id, status, plan, category, created_at");
    if (error) throw new Error(error.message);
    const { count: usersCount } = await context.supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true });
    const { count: branchesCount } = await context.supabase
      .from("branches")
      .select("id", { count: "exact", head: true });

    const rows = companies ?? [];
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const c of rows) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      const cat = c.category ?? "Sem categoria";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      const month = String(c.created_at).slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + 1;
    }

    const growth = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    return {
      total: rows.length,
      active: byStatus["ativa"] ?? 0,
      blocked: (byStatus["bloqueada"] ?? 0) + (byStatus["suspensa"] ?? 0),
      trial: byStatus["trial"] ?? 0,
      canceled: byStatus["cancelada"] ?? 0,
      users: usersCount ?? 0,
      branches: branchesCount ?? 0,
      growth,
      categories: Object.entries(byCategory).map(([name, total]) => ({ name, total })),
    };
  });

export const getCompanyOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: company, error }, members, branches] = await Promise.all([
      context.supabase.from("companies").select("*").eq("id", data.companyId).maybeSingle(),
      context.supabase
        .from("user_roles")
        .select("role", { count: "exact" })
        .eq("company_id", data.companyId),
      context.supabase
        .from("branches")
        .select("id, name, city, state, is_active")
        .eq("company_id", data.companyId)
        .order("name"),
    ]);
    if (error) throw new Error(error.message);
    if (!company) throw new Error("Empresa não encontrada ou sem acesso.");

    const roleCount: Record<string, number> = {};
    for (const m of members.data ?? []) roleCount[m.role] = (roleCount[m.role] ?? 0) + 1;

    return {
      company,
      teamSize: members.data?.length ?? 0,
      roleCount: Object.entries(roleCount).map(([role, total]) => ({ role, total })),
      branches: branches.data ?? [],
    };
  });

export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("id, role, user_id, created_at")
      .eq("company_id", data.companyId)
      .order("created_at");
    if (error) throw new Error(error.message);

    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    const profiles = ids.length
      ? (await context.supabase.from("profiles").select("id, full_name, email").in("id", ids)).data ?? []
      : [];

    return (roles ?? []).map((r) => {
      const p = profiles.find((x) => x.id === r.user_id);
      return {
        id: r.id,
        role: r.role as AppRole,
        userId: r.user_id,
        fullName: p?.full_name ?? "—",
        email: p?.email ?? "—",
      };
    });
  });

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        companyId: z.string().uuid(),
        email: z.string().trim().email().max(180),
        fullName: z.string().trim().min(2).max(120),
        password: z.string().min(8).max(72),
        role: z.enum(APP_ROLES).refine((r) => r !== "owner", "Perfil inválido"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Autorização validada no servidor: apenas dono da plataforma ou gerente da empresa.
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_company_role", {
      _user_id: context.userId,
      _company_id: data.companyId,
      _role: "gerente",
    });
    if (roleError) throw new Error(roleError.message);
    if (!allowed) throw new Error("Sem permissão para gerenciar usuários desta empresa.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar o usuário.");

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: data.fullName, email: data.email });

    const { error: linkError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, company_id: data.companyId, role: data.role });
    if (linkError) throw new Error(linkError.message);

    return { ok: true };
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        companyId: z.string().uuid(),
        role: z.enum(APP_ROLES).refine((r) => r !== "owner", "Perfil inválido"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_company_role", {
      _user_id: context.userId,
      _company_id: data.companyId,
      _role: "gerente",
    });
    if (roleError) throw new Error(roleError.message);
    if (!allowed) throw new Error("Sem permissão para alterar níveis nesta empresa.");

    if (data.id === context.userId) {
      // evita rebaixar a si mesmo por engano não é bloqueado, mas o vínculo é validado abaixo
    }

    const { error } = await context.supabase
      .from("user_roles")
      .update({ role: data.role })
      .eq("id", data.id)
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const saveBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        companyId: z.string().uuid(),
        name: z.string().trim().min(2).max(120),
        code: z.string().trim().max(20).optional().nullable(),
        city: z.string().trim().max(120).optional().nullable(),
        state: z.string().trim().max(64).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("branches").insert({
      company_id: data.companyId,
      name: data.name,
      code: data.code ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const ownerExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .is("company_id", null)
    .eq("role", "owner");
  return { exists: (count ?? 0) > 0 };
});

export const createFirstOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(180),
        fullName: z.string().trim().min(2).max(120),
        password: z.string().min(8).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .is("company_id", null)
      .eq("role", "owner");
    if ((count ?? 0) > 0) throw new Error("A plataforma já possui um Owner configurado.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar o Owner.");

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: data.fullName, email: data.email });

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, company_id: null, role: "owner" });
    if (roleError) throw new Error(roleError.message);

    return { ok: true };
  });

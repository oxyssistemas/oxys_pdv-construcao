import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, CheckCircle2, PauseCircle, Store, Timer, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState, KpiCard, SectionCard } from "@/components/oxys/ui-blocks";
import { getCompanyOverview, getPlatformStats, getSessionInfo } from "@/lib/oxys.functions";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/oxys";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Oxys PDV" },
      { name: "description", content: "Indicadores da plataforma e da sua empresa no Oxys PDV." },
      { property: "og:title", content: "Dashboard — Oxys PDV" },
      { property: "og:description", content: "Indicadores em tempo real do seu negócio." },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
} as const;

function DashboardPage() {
  const fetchSession = useServerFn(getSessionInfo);
  const { data: session, isLoading } = useQuery({
    queryKey: ["session-info"],
    queryFn: () => fetchSession(),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (session?.isOwner) return <OwnerDashboard />;

  const companyId = session?.memberships.find((m) => m.companyId)?.companyId;
  if (!companyId) {
    return (
      <EmptyState
        title="Nenhuma empresa vinculada"
        description="Sua conta ainda não está vinculada a uma empresa. Peça ao Owner da plataforma ou ao gerente para atribuir um perfil de acesso."
      />
    );
  }
  return <CompanyDashboard companyId={companyId} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

function OwnerDashboard() {
  const fetchStats = useServerFn(getPlatformStats);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => fetchStats(),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data)
    return (
      <EmptyState
        title="Não foi possível carregar os indicadores"
        description="Atualize a página para tentar novamente."
      />
    );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Portal Master</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Visão global da plataforma</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Empresas cadastradas" value={data.total} icon={Building2} tone="primary" />
        <KpiCard label="Empresas ativas" value={data.active} icon={CheckCircle2} tone="success" />
        <KpiCard label="Em trial" value={data.trial} icon={Timer} tone="warning" />
        <KpiCard label="Bloqueadas / suspensas" value={data.blocked} icon={PauseCircle} tone="danger" />
        <KpiCard label="Vínculos de usuários" value={data.users} icon={Users} />
        <KpiCard label="Filiais cadastradas" value={data.branches} icon={Store} />
        <KpiCard label="Canceladas" value={data.canceled} icon={PauseCircle} />
        <KpiCard
          label="Taxa de ativação"
          value={data.total ? `${Math.round((data.active / data.total) * 100)}%` : "—"}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Novas empresas por mês" description="Baseado na data de cadastro">
          {data.growth.length === 0 ? (
            <EmptyState title="Sem histórico" description="Cadastre a primeira empresa para ver a evolução." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--primary-soft)" }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Empresas por categoria" description="Distribuição da base">
          {data.categories.length === 0 ? (
            <EmptyState title="Sem categorias" description="As categorias aparecem conforme as empresas são cadastradas." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categories} dataKey="total" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                    {data.categories.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function CompanyDashboard({ companyId }: { companyId: string }) {
  const fetchOverview = useServerFn(getCompanyOverview);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["company-overview", companyId],
    queryFn: () => fetchOverview({ data: { companyId } }),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data)
    return (
      <EmptyState
        title="Não foi possível carregar a empresa"
        description="Verifique seu acesso ou atualize a página."
      />
    );

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Portal da empresa</p>
          <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">
            {data.company.trade_name}
          </h1>
        </div>
        <Badge variant="outline" className="shrink-0">
          {STATUS_LABELS[data.company.status] ?? data.company.status}
        </Badge>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Equipe" value={data.teamSize} icon={Users} tone="primary" />
        <KpiCard label="Filiais" value={data.branches.length} icon={Store} />
        <KpiCard label="Plano" value={data.company.plan} icon={CheckCircle2} tone="success" />
        <KpiCard
          label="Vencimento"
          value={data.company.due_date ? new Date(`${data.company.due_date}T00:00:00`).toLocaleDateString("pt-BR") : "—"}
          icon={Timer}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Equipe por perfil" description="Distribuição de acessos da empresa">
          {data.roleCount.length === 0 ? (
            <EmptyState
              title="Nenhum usuário além de você"
              description="Cadastre sua equipe em Usuários e perfis para distribuir os acessos."
            />
          ) : (
            <ul className="space-y-2">
              {data.roleCount.map((r) => (
                <li key={r.role} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span>{ROLE_LABELS[r.role] ?? r.role}</span>
                  <span className="font-semibold">{r.total}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Filiais" description="Unidades cadastradas">
          {data.branches.length === 0 ? (
            <EmptyState title="Nenhuma filial" description="Cadastre a primeira filial em Filiais." />
          ) : (
            <ul className="space-y-2">
              {data.branches.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{b.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {[b.city, b.state].filter(Boolean).join(" / ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Módulos operacionais" description="Próximas fases do Oxys PDV">
        <p className="text-sm text-muted-foreground">
          PDV, produtos, estoque, compras e financeiro entram nas próximas fases. Nenhum indicador
          fictício é exibido aqui — os números aparecem quando os módulos começarem a registrar dados
          reais.
        </p>
      </SectionCard>
    </div>
  );
}

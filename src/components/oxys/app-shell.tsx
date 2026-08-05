import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  Contact,
  Truck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getSessionInfo } from "@/lib/oxys.functions";
import type { SessionInfo } from "@/lib/oxys-schema";

import { ROLE_LABELS } from "@/lib/oxys";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to?: string; icon: typeof LayoutDashboard; soon?: boolean };
type NavGroup = { title: string; items: NavItem[] };

function buildNav(session: SessionInfo | undefined): NavGroup[] {
  const groups: NavGroup[] = [
    { title: "Geral", items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }] },
  ];

  // Owner da plataforma: acesso restrito a empresas, usuários e ao próprio CRM.
  if (session?.isOwner) {
    groups.push({
      title: "Plataforma",
      items: [
        { label: "Empresas", to: "/empresas", icon: Building2 },
        { label: "Usuários e perfis", to: "/usuarios", icon: Users },
        { label: "CRM", to: "/crm", icon: Target },
      ],
    });
    return groups;
  }


  groups.push({
    title: "Organização",
    items: [
      { label: "Filiais", to: "/filiais", icon: Store },
      { label: "Usuários e perfis", to: "/usuarios", icon: Users },
    ],
  });

  groups.push({
    title: "Operação",
    items: [
      { label: "PDV", to: "/pdv", icon: ShoppingCart },
      { label: "Vendas", to: "/vendas", icon: Receipt },
      { label: "Caixa", to: "/caixa", icon: Wallet },
      { label: "Produtos", to: "/produtos", icon: Package },
      { label: "Estoque", to: "/estoque", icon: Boxes },
      { label: "Fornecedores", to: "/fornecedores", icon: Truck },
      { label: "Clientes", to: "/clientes", icon: Contact },
      { label: "Financeiro", icon: Wallet, soon: true },
      { label: "Compras", icon: CreditCard, soon: true },
      { label: "Relatórios", icon: BarChart3, soon: true },
    ],
  });




  return groups;
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground glow-primary">
        <span className="font-display text-sm font-bold">O</span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold tracking-tight">OXYS PDV</p>
        <p className="truncate text-[11px] text-muted-foreground">Gestão comercial</p>
      </div>
    </div>
  );
}

function NavList({ session, onNavigate }: { session: SessionInfo | undefined; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {buildNav(session).map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = item.to ? pathname === item.to : false;
              const content = (
                <>
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.soon ? (
                    <Badge variant="outline" className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      em breve
                    </Badge>
                  ) : null}
                </>
              );

              return (
                <li key={item.label}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary-soft text-foreground shadow-[inset_2px_0_0_0_var(--primary)]"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
                    >
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const fetchSession = useServerFn(getSessionInfo);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: session, isLoading } = useQuery({
    queryKey: ["session-info"],
    queryFn: () => fetchSession(),
  });

  const ownerAllowed = ["/dashboard", "/empresas", "/usuarios"];
  useEffect(() => {
    if (session?.isOwner && !ownerAllowed.includes(pathname)) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [session?.isOwner, pathname]);


  const initials = (session?.fullName || session?.email || "?")
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-4 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavList session={session} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <SheetTitle className="px-4 pt-5 text-left">
                  <Brand />
                </SheetTitle>
                <NavList session={session} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="hidden lg:block">
              <p className="text-xs text-muted-foreground">
                {session?.isOwner ? "Portal Master" : "Portal da empresa"}
              </p>
            </div>
          </div>

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Pesquisar no Oxys PDV"
              className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="size-5" />
            </Button>
            {isLoading ? (
              <Skeleton className="h-9 w-24 rounded-lg" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold">
                      {initials}
                    </span>
                    <span className="hidden max-w-32 truncate text-sm sm:block">
                      {session?.fullName || session?.email}
                    </span>
                    <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="truncate text-sm">{session?.fullName || "Usuário"}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{session?.email}</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {session?.isOwner
                        ? "Owner da plataforma"
                        : session?.memberships
                            .map((m) => ROLE_LABELS[m.role] ?? m.role)
                            .join(", ") || "Sem perfil atribuído"}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/usuarios">
                      <Settings className="mr-2 size-4" /> Usuários e perfis
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 size-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

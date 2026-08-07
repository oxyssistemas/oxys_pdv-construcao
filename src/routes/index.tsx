import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Building2, Loader2, ShieldCheck, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { checkLoginAllowed, recordLoginAttempt } from "@/lib/login-guard.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Oxys PDV" },
      {
        name: "description",
        content:
          "Acesse o Oxys PDV: ERP e PDV SaaS multiempresa com controle de filiais, caixas, estoque e financeiro.",
      },
      { property: "og:title", content: "Entrar — Oxys PDV" },
      {
        property: "og:description",
        content: "Plataforma SaaS de gestão comercial, ERP e PDV. Rápida, segura e multiempresa.",
      },
    ],
  }),
  component: LoginPage,
});

const showcase = [
  { month: "Jan", total: 18 },
  { month: "Fev", total: 26 },
  { month: "Mar", total: 31 },
  { month: "Abr", total: 44 },
  { month: "Mai", total: 52 },
  { month: "Jun", total: 68 },
];

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const LOCK_KEY = "oxys.login.lock";

type LocalLock = { fails: number; until: number };

function readLock(): LocalLock {
  if (typeof window === "undefined") return { fails: 0, until: 0 };
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    if (!raw) return { fails: 0, until: 0 };
    const parsed = JSON.parse(raw) as LocalLock;
    if (parsed.until && parsed.until < Date.now()) return { fails: 0, until: 0 };
    return { fails: Number(parsed.fails) || 0, until: Number(parsed.until) || 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
}

function writeLock(value: LocalLock) {
  try {
    window.localStorage.setItem(LOCK_KEY, JSON.stringify(value));
  } catch {
    /* storage indisponível */
  }
}

function formatWait(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}min ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function LoginPage() {
  const navigate = useNavigate();
  const checkAllowed = useServerFn(checkLoginAllowed);
  const recordAttempt = useServerFn(recordLoginAttempt);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    setLockedUntil(readLock().until);
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  const waitSeconds = lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
  const isLocked = waitSeconds > 0;

  function lockFor(ms: number) {
    const until = Date.now() + ms;
    writeLock({ fails: MAX_ATTEMPTS, until });
    setLockedUntil(until);
    setNow(Date.now());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (isLocked) {
      setError(`Muitas tentativas. Tente novamente em ${formatWait(waitSeconds)}.`);
      return;
    }

    if (!email.trim() || password.length < 6) {
      setError("Informe um email válido e uma senha com pelo menos 6 caracteres.");
      return;
    }

    const normalized = email.trim().toLowerCase();
    setLoading(true);

    const guard = await checkAllowed({ data: { email: normalized } }).catch(() => null);
    if (guard && !guard.allowed) {
      setLoading(false);
      lockFor(guard.retryAfterSeconds * 1000);
      setError(
        `Conta temporariamente bloqueada por excesso de tentativas. Aguarde ${formatWait(
          guard.retryAfterSeconds,
        )}.`,
      );
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    void recordAttempt({ data: { email: normalized, success: !signInError } }).catch(() => null);
    setLoading(false);

    if (signInError) {
      const local = readLock();
      const fails = local.fails + 1;
      if (fails >= MAX_ATTEMPTS) {
        lockFor(LOCK_MS);
        setError("Muitas tentativas inválidas. Login bloqueado por 15 min.");
      } else {
        writeLock({ fails, until: 0 });
        setError(
          `Não foi possível entrar. Verifique suas credenciais. Tentativas restantes: ${
            MAX_ATTEMPTS - fails
          }.`,
        );
      }
      return;
    }

    writeLock({ fails: 0, until: 0 });
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  }


  async function handleReset() {
    if (!email.trim()) {
      setError("Informe seu email para receber o link de redefinição.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (resetError) {
      toast.error("Não foi possível enviar o email de redefinição.");
      return;
    }
    toast.success("Enviamos um link de redefinição para o seu email.");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground glow-primary">
              <span className="font-display text-lg font-bold">O</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">OXYS PDV</p>
              <p className="text-xs text-muted-foreground">ERP · PDV · Gestão comercial</p>
            </div>
          </div>

          <h1 className="mt-10 font-display text-3xl font-bold">Bem-vindo de volta!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com sua conta para acessar o painel da sua empresa.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-surface"
                maxLength={180}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-surface"
                maxLength={72}
                required
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                  aria-label="Lembrar-me"
                />
                Lembrar-me
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-primary transition-opacity hover:opacity-80"
              >
                Esqueci minha senha
              </button>
            </div>

            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Entrar
              {!loading ? <ArrowRight className="ml-2 size-4" /> : null}
            </Button>
          </form>

          <p className="mt-8 text-xs text-muted-foreground">
            Acesso restrito. As contas são criadas pelo Owner da plataforma ou pelo gerente da sua
            empresa.
          </p>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-border bg-sidebar grid-backdrop lg:block">
        <div className="flex h-full flex-col justify-center gap-6 px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Plataforma Oxys
            </p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-tight">
              Um único sistema para vender, controlar estoque e enxergar o resultado.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Building2, label: "Multiempresa", text: "Isolamento total de dados" },
              { icon: Users, label: "Multiusuário", text: "Perfis e permissões" },
              { icon: ShieldCheck, label: "Seguro", text: "Regras validadas no servidor" },
            ].map((item) => (
              <div key={item.label} className="surface-card p-4">
                <item.icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Empresas na plataforma</p>
                <p className="font-display text-2xl font-bold">Crescimento contínuo</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">
                <TrendingUp className="size-3.5" /> ilustrativo
              </span>
            </div>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={showcase}>
                  <defs>
                    <linearGradient id="oxysArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#oxysArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Painel ilustrativo. Os indicadores reais aparecem após o login.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

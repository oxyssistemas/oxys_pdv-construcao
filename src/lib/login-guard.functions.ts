import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCK_MINUTES = 15;

const emailInput = z.object({ email: z.string().trim().toLowerCase().min(3).max(180) });
const attemptInput = emailInput.extend({ success: z.boolean() });

type GuardStatus = { allowed: boolean; remaining: number; retryAfterSeconds: number };

function allowed(remaining: number): GuardStatus {
  return { allowed: true, remaining, retryAfterSeconds: 0 };
}

/** Counts failed attempts in the window and tells whether login is currently locked. */
export const checkLoginAllowed = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailInput.parse(data))
  .handler(async ({ data }): Promise<GuardStatus> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

      const { data: rows, error } = await supabaseAdmin
        .from("login_attempts")
        .select("created_at, success")
        .eq("email_key", data.email)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !rows) return allowed(MAX_ATTEMPTS);

      const fails: { created_at: string }[] = [];
      for (const row of rows) {
        if (row.success) break;
        fails.push(row);
      }

      if (fails.length < MAX_ATTEMPTS) {
        return allowed(MAX_ATTEMPTS - fails.length);
      }

      const last = new Date(fails[0]!.created_at).getTime();
      const unlockAt = last + LOCK_MINUTES * 60_000;
      const retryAfterSeconds = Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));

      if (retryAfterSeconds === 0) return allowed(MAX_ATTEMPTS);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    } catch {
      return allowed(MAX_ATTEMPTS);
    }
  });

/** Records the outcome of a sign-in attempt. Never throws to the caller. */
export const recordLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => attemptInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let ip: string | null = null;
      try {
        ip = getRequestIP({ xForwardedFor: true }) ?? null;
      } catch {
        ip = null;
      }
      await supabaseAdmin
        .from("login_attempts")
        .insert({ email_key: data.email, ip, success: data.success });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

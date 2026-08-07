CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_key text NOT NULL,
  ip text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX login_attempts_lookup ON public.login_attempts (email_key, created_at DESC);
CREATE INDEX login_attempts_ip_lookup ON public.login_attempts (ip, created_at DESC);

GRANT ALL ON public.login_attempts TO service_role;

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated on purpose: only the service role (server) may touch this table.

CREATE OR REPLACE FUNCTION public.purge_old_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '24 hours';
  RETURN NULL;
END; $$;

REVOKE ALL ON FUNCTION public.purge_old_login_attempts() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER login_attempts_purge
AFTER INSERT ON public.login_attempts
FOR EACH STATEMENT EXECUTE FUNCTION public.purge_old_login_attempts();
CREATE TYPE public.crm_stage AS ENUM ('novo','contato','proposta','negociacao','ganho','perdido');

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  company_name text,
  contact_name text,
  email text,
  phone text,
  source text,
  stage public.crm_stage NOT NULL DEFAULT 'novo',
  estimated_value numeric NOT NULL DEFAULT 0,
  next_action text,
  next_action_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform owner reads own leads" ON public.crm_leads
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND public.is_platform_owner(auth.uid()));

CREATE POLICY "Platform owner inserts own leads" ON public.crm_leads
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_platform_owner(auth.uid()));

CREATE POLICY "Platform owner updates own leads" ON public.crm_leads
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.is_platform_owner(auth.uid()))
  WITH CHECK (owner_id = auth.uid() AND public.is_platform_owner(auth.uid()));

CREATE POLICY "Platform owner deletes own leads" ON public.crm_leads
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND public.is_platform_owner(auth.uid()));

CREATE TRIGGER crm_leads_updated_at BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX crm_leads_owner_idx ON public.crm_leads (owner_id, stage);
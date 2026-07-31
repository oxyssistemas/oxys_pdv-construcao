-- ENUMS
CREATE TYPE public.app_role AS ENUM ('owner','gerente','supervisor','caixa','atendente','estoque','rh','financeiro');
CREATE TYPE public.company_status AS ENUM ('ativa','bloqueada','suspensa','trial','cancelada');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- COMPANIES
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  trade_name text NOT NULL,
  document text,
  state_registration text,
  phone text,
  whatsapp text,
  email text,
  address text,
  zip_code text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'Brasil',
  category text,
  plan text NOT NULL DEFAULT 'trial',
  due_date date,
  status public.company_status NOT NULL DEFAULT 'trial',
  logo_url text,
  primary_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- USER ROLES (membership)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX user_roles_unique_company ON public.user_roles (user_id, company_id, role) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX user_roles_unique_platform ON public.user_roles (user_id, role) WHERE company_id IS NULL;
CREATE INDEX user_roles_company_idx ON public.user_roles (company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- BRANCHES
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  phone text,
  address text,
  city text,
  state text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX branches_company_idx ON public.branches (company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND company_id IS NULL AND role = 'owner');
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND company_id = _company_id)
      OR public.is_platform_owner(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid, _company_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND company_id = _company_id AND role = _role)
      OR public.is_platform_owner(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.shares_company(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ra
    JOIN public.user_roles rb ON rb.company_id = ra.company_id
    WHERE ra.user_id = _a AND rb.user_id = _b AND ra.company_id IS NOT NULL
  );
$$;

-- POLICIES: profiles
CREATE POLICY "profiles_select_self_or_colleagues" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_platform_owner(auth.uid()) OR public.shares_company(auth.uid(), id));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- POLICIES: companies
CREATE POLICY "companies_select_members" ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id));
CREATE POLICY "companies_insert_owner" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_owner(auth.uid()));
CREATE POLICY "companies_update_owner_or_manager" ON public.companies FOR UPDATE TO authenticated
  USING (public.has_company_role(auth.uid(), id, 'gerente'))
  WITH CHECK (public.has_company_role(auth.uid(), id, 'gerente'));
CREATE POLICY "companies_delete_owner" ON public.companies FOR DELETE TO authenticated
  USING (public.is_platform_owner(auth.uid()));

-- POLICIES: user_roles
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_owner(auth.uid())
     OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'gerente')));
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_owner(auth.uid())
     OR (company_id IS NOT NULL AND role <> 'owner' AND public.has_company_role(auth.uid(), company_id, 'gerente')));
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_platform_owner(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'gerente')))
  WITH CHECK (public.is_platform_owner(auth.uid()) OR (company_id IS NOT NULL AND role <> 'owner' AND public.has_company_role(auth.uid(), company_id, 'gerente')));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_platform_owner(auth.uid()) OR (company_id IS NOT NULL AND role <> 'owner' AND public.has_company_role(auth.uid(), company_id, 'gerente')));

-- POLICIES: branches
CREATE POLICY "branches_select_members" ON public.branches FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "branches_write_manager" ON public.branches FOR ALL TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'gerente'))
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'gerente'));

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AUTO PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
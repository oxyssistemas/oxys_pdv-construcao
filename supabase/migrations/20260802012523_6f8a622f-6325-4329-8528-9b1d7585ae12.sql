CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_select_members" ON public.product_categories FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "cat_write_manager" ON public.product_categories FOR ALL TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente')) WITH CHECK (public.has_company_role(auth.uid(), company_id, 'gerente'));

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text,
  contact_name text,
  phone text,
  email text,
  city text,
  state text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sup_select_members" ON public.suppliers FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "sup_write_manager" ON public.suppliers FOR ALL TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente')) WITH CHECK (public.has_company_role(auth.uid(), company_id, 'gerente'));

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  birth_date date,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cus_select_members" ON public.customers FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "cus_write_manager" ON public.customers FOR ALL TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente')) WITH CHECK (public.has_company_role(auth.uid(), company_id, 'gerente'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text,
  barcode text,
  unit text NOT NULL DEFAULT 'UN',
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  stock_quantity numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_company_sku_key ON public.products (company_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX products_company_idx ON public.products (company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_select_members" ON public.products FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "prod_write_manager" ON public.products FOR ALL TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente')) WITH CHECK (public.has_company_role(auth.uid(), company_id, 'gerente'));

CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida', 'ajuste', 'perda');

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  type public.stock_movement_type NOT NULL,
  quantity numeric(12,3) NOT NULL,
  unit_cost numeric(12,2),
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_product_idx ON public.stock_movements (product_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mov_select_members" ON public.stock_movements FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "mov_insert_members" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id) AND created_by = auth.uid());
CREATE POLICY "mov_delete_manager" ON public.stock_movements FOR DELETE TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente'));

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'entrada' THEN
    UPDATE public.products SET stock_quantity = stock_quantity + NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  ELSIF NEW.type IN ('saida', 'perda') THEN
    UPDATE public.products SET stock_quantity = stock_quantity - NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  ELSE
    UPDATE public.products SET stock_quantity = NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER stock_movements_apply AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

CREATE TRIGGER product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM PUBLIC, anon, authenticated;
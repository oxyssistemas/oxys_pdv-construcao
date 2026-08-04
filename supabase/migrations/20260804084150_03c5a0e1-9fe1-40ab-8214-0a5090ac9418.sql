CREATE TYPE public.payment_method AS ENUM ('dinheiro','pix','credito','debito','fiado','outro');
CREATE TYPE public.sale_status AS ENUM ('aberta','finalizada','cancelada');
CREATE TYPE public.register_status AS ENUM ('aberto','fechado');

CREATE TABLE public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  opened_by uuid REFERENCES auth.users(id),
  closed_by uuid REFERENCES auth.users(id),
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  expected_amount numeric NOT NULL DEFAULT 0,
  status register_status NOT NULL DEFAULT 'aberto',
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_registers TO authenticated;
GRANT ALL ON public.cash_registers TO service_role;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY reg_select_members ON public.cash_registers FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY reg_insert_members ON public.cash_registers FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY reg_update_members ON public.cash_registers FOR UPDATE TO authenticated USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY reg_delete_manager ON public.cash_registers FOR DELETE TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente'::app_role));
CREATE TRIGGER cash_registers_updated_at BEFORE UPDATE ON public.cash_registers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  register_id uuid REFERENCES public.cash_registers(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  number bigint NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status sale_status NOT NULL DEFAULT 'aberta',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sales_company_created_idx ON public.sales (company_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_select_members ON public.sales FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sales_insert_members ON public.sales FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id) AND created_by = auth.uid());
CREATE POLICY sales_update_members ON public.sales FOR UPDATE TO authenticated USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sales_delete_manager ON public.sales FOR DELETE TO authenticated USING (public.has_company_role(auth.uid(), company_id, 'gerente'::app_role));
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sale_items_sale_idx ON public.sale_items (sale_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY sale_items_select_members ON public.sale_items FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sale_items_insert_members ON public.sale_items FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sale_items_update_members ON public.sale_items FOR UPDATE TO authenticated USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sale_items_delete_members ON public.sale_items FOR DELETE TO authenticated USING (public.is_company_member(auth.uid(), company_id));

CREATE TABLE public.sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  method payment_method NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  change_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sale_payments_sale_idx ON public.sale_payments (sale_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_payments TO authenticated;
GRANT ALL ON public.sale_payments TO service_role;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY sale_payments_select_members ON public.sale_payments FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sale_payments_insert_members ON public.sale_payments FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY sale_payments_delete_members ON public.sale_payments FOR DELETE TO authenticated USING (public.is_company_member(auth.uid(), company_id));

CREATE OR REPLACE FUNCTION public.assign_sale_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.number IS NULL OR NEW.number = 0 THEN
    SELECT COALESCE(MAX(number), 0) + 1 INTO NEW.number FROM public.sales WHERE company_id = NEW.company_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER sales_assign_number BEFORE INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION public.assign_sale_number();

CREATE OR REPLACE FUNCTION public.apply_sale_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE it RECORD;
BEGIN
  IF NEW.status = 'finalizada' AND OLD.status <> 'finalizada' THEN
    FOR it IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id AND product_id IS NOT NULL LOOP
      INSERT INTO public.stock_movements (company_id, product_id, branch_id, type, quantity, reason, created_by)
      VALUES (NEW.company_id, it.product_id, NEW.branch_id, 'saida', it.quantity, 'Venda #' || NEW.number, NEW.created_by);
    END LOOP;
  ELSIF NEW.status = 'cancelada' AND OLD.status = 'finalizada' THEN
    FOR it IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id AND product_id IS NOT NULL LOOP
      INSERT INTO public.stock_movements (company_id, product_id, branch_id, type, quantity, reason, created_by)
      VALUES (NEW.company_id, it.product_id, NEW.branch_id, 'entrada', it.quantity, 'Cancelamento venda #' || NEW.number, NEW.created_by);
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER sales_apply_status AFTER UPDATE OF status ON public.sales FOR EACH ROW EXECUTE FUNCTION public.apply_sale_status();

REVOKE EXECUTE ON FUNCTION public.assign_sale_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_sale_status() FROM anon, authenticated;
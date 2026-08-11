
-- 1) Vínculo obrigatório com empresa (exceto owner de plataforma)
DELETE FROM public.user_roles WHERE company_id IS NULL AND role <> 'owner';

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_company_required
  CHECK (company_id IS NOT NULL OR role = 'owner');

-- 2) Escala hierárquica
CREATE OR REPLACE FUNCTION public.role_rank(_role app_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'owner' THEN 100
    WHEN 'gerente' THEN 80
    WHEN 'supervisor' THEN 60
    WHEN 'financeiro' THEN 50
    WHEN 'rh' THEN 50
    WHEN 'estoque' THEN 40
    WHEN 'caixa' THEN 30
    WHEN 'atendente' THEN 20
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_min_rank(_user_id uuid, _company_id uuid, _min integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_owner(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
          AND company_id = _company_id
          AND public.role_rank(role) >= _min
      );
$$;

REVOKE ALL ON FUNCTION public.has_min_rank(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_min_rank(uuid, uuid, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.role_rank(app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.role_rank(app_role) TO authenticated;

-- 3) Fornecedores: visíveis a partir de Estoque, escrita a partir de Supervisor
DROP POLICY IF EXISTS sup_select_members ON public.suppliers;
DROP POLICY IF EXISTS sup_write_manager ON public.suppliers;
DROP POLICY IF EXISTS suppliers_select_members ON public.suppliers;
DROP POLICY IF EXISTS suppliers_write_manager ON public.suppliers;

CREATE POLICY suppliers_select_stock_up ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 40));

CREATE POLICY suppliers_write_supervisor_up ON public.suppliers
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 60))
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 60));

-- 4) Produtos / categorias / clientes: leitura para membros, escrita a partir de Estoque
DROP POLICY IF EXISTS prod_write_manager ON public.products;
CREATE POLICY products_write_stock_up ON public.products
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 40))
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 40));

DROP POLICY IF EXISTS cat_write_manager ON public.product_categories;
CREATE POLICY categories_write_stock_up ON public.product_categories
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 40))
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 40));

DROP POLICY IF EXISTS cus_write_manager ON public.customers;
CREATE POLICY customers_write_stock_up ON public.customers
  FOR ALL TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 30))
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 30));

-- 5) Estoque: movimentações a partir do nível Estoque
DROP POLICY IF EXISTS mov_select_members ON public.stock_movements;
DROP POLICY IF EXISTS mov_insert_members ON public.stock_movements;
DROP POLICY IF EXISTS mov_delete_manager ON public.stock_movements;
DROP POLICY IF EXISTS stock_select_members ON public.stock_movements;
DROP POLICY IF EXISTS stock_insert_members ON public.stock_movements;
DROP POLICY IF EXISTS stock_delete_manager ON public.stock_movements;

CREATE POLICY stock_movements_select_stock_up ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 30));

CREATE POLICY stock_movements_insert_stock_up ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 30));

CREATE POLICY stock_movements_delete_manager ON public.stock_movements
  FOR DELETE TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 80));

-- 6) Caixa: operar exige nível Caixa ou superior
DROP POLICY IF EXISTS reg_insert_members ON public.cash_registers;
DROP POLICY IF EXISTS reg_update_members ON public.cash_registers;

CREATE POLICY reg_insert_cashier_up ON public.cash_registers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 30));

CREATE POLICY reg_update_cashier_up ON public.cash_registers
  FOR UPDATE TO authenticated
  USING (public.has_min_rank(auth.uid(), company_id, 30))
  WITH CHECK (public.has_min_rank(auth.uid(), company_id, 30));

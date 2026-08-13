CREATE TYPE public.cash_movement_type AS ENUM ('sangria', 'suprimento');

CREATE TABLE public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  register_id uuid NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  type public.cash_movement_type NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cash_movements_register_idx ON public.cash_movements (register_id, created_at DESC);

GRANT SELECT, INSERT ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_movements_select" ON public.cash_movements
FOR SELECT TO authenticated
USING (public.has_min_rank(auth.uid(), company_id, 30));

CREATE POLICY "cash_movements_insert" ON public.cash_movements
FOR INSERT TO authenticated
WITH CHECK (
  public.has_min_rank(auth.uid(), company_id, 30)
  AND EXISTS (
    SELECT 1 FROM public.cash_registers r
    WHERE r.id = register_id AND r.company_id = cash_movements.company_id AND r.status = 'aberto'
  )
);
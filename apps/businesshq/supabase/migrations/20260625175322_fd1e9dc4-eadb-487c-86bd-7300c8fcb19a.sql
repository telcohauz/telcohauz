-- STAFF
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text,
  email text,
  salary numeric(12,2),
  hire_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view staff" ON public.staff
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Admins can insert staff" ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]));

CREATE POLICY "Admins can update staff" ON public.staff
  FOR UPDATE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]))
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]));

CREATE POLICY "Admins can delete staff" ON public.staff
  FOR DELETE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]));

CREATE TRIGGER staff_set_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number text,
  client_name text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MYR',
  status text NOT NULL DEFAULT 'draft',
  issue_date date,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Admins can insert invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]));

CREATE POLICY "Admins can update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]))
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]));

CREATE POLICY "Admins can delete invoices" ON public.invoices
  FOR DELETE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::company_role[]));

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
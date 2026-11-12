DROP POLICY IF EXISTS "companies owner insert" ON public.companies;
DROP POLICY IF EXISTS "Users can create their own company" ON public.companies;

CREATE POLICY "companies authenticated insert" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);